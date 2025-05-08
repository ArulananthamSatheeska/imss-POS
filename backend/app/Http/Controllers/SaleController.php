<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\BillNumberGenerator;
use App\Models\Supplier;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        Log::info('Fetching all sales');
        $sales = Sale::with('items')->get();
        
        if ($request->has('from') && $request->has('to')) {
            $sales = Sale::with('items')
                ->whereBetween('created_at', [
                    $request->input('from') . ' 00:00:00',
                    $request->input('to') . ' 23:59:59'
                ])
                ->get();
        }
        
        return response()->json($sales);
    }

    public function show($id)
    {
        Log::info('Fetching sale with ID: ' . $id);
        $sale = Sale::with('items')->find($id);
        if ($sale) {
            return response()->json($sale);
        } else {
            return response()->json(['message' => 'Sale not found'], 404);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string',
            'subtotal' => 'required|numeric',
            'discount' => 'required|numeric',
            'tax' => 'nullable|numeric',
            'total' => 'required|numeric',
            'payment_type' => 'required|string',
            'received_amount' => 'required|numeric',
            'balance_amount' => 'required|numeric',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.mrp' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'required|numeric|min:0',
            'items.*.special_discount' => 'nullable|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'items.*.supplier' => 'nullable|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.store_location' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $user = $request->user();
            if (!$user) {
                Log::error('User not authenticated in SaleController@store');
                return response()->json(['message' => 'Unauthorized: User not authenticated'], 401);
            }
            $userId = $user->id;
            $userName = $user->username ?? $user->name;
            Log::info("Generating bill number for userId: {$userId}, userName: {$userName}");

            $billNumber = BillNumberGenerator::generateNextBillNumber($userId, $userName);

            $activeSchemes = \App\Models\DiscountScheme::where('active', true)
                ->where(function ($query) {
                    $today = date('Y-m-d');
                    $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
                })
                ->where(function ($query) {
                    $today = date('Y-m-d');
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
                })
                ->get();

            $sale = Sale::create([
                'bill_number' => $billNumber,
                'customer_id' => $request->customer_id,
                'customer_name' => $request->customer_name,
                'subtotal' => $request->subtotal,
                'discount' => $request->discount,
                'tax' => $request->tax ?? 0,
                'total' => $request->total,
                'payment_type' => $request->payment_type,
                'received_amount' => $request->received_amount,
                'balance_amount' => $request->balance_amount,
            ]);

            $calculateDiscount = function ($product, $schemes) {
                $basePrice = $product->sales_price ?? 0;
                $categoryName = $product->category_name ?? null;
                $maxDiscountValue = 0;

                foreach ($schemes as $scheme) {
                    if (!$scheme->active) continue;

                    $appliesTo = $scheme->applies_to;
                    $target = $scheme->target;

                    if ($appliesTo === 'product' && $target === $product->product_name) {
                        $discountValue = 0;
                        if ($scheme->type === 'percentage') {
                            $discountValue = ($basePrice * $scheme->value) / 100;
                        } elseif ($scheme->type === 'amount') {
                            $discountValue = $scheme->value;
                        }
                        if ($discountValue > $maxDiscountValue) {
                            $maxDiscountValue = $discountValue;
                        }
                    } elseif ($appliesTo === 'category' && $target === $categoryName) {
                        $discountValue = 0;
                        if ($scheme->type === 'percentage') {
                            $discountValue = ($basePrice * $scheme->value) / 100;
                        } elseif ($scheme->type === 'amount') {
                            $discountValue = $scheme->value;
                        }
                        if ($discountValue > $maxDiscountValue) {
                            $maxDiscountValue = $discountValue;
                        }
                    }
                }
                return min($maxDiscountValue, $basePrice);
            };

            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    $unitPrice = floatval($item['unit_price']);
                    $specialDiscount = floatval($item['special_discount'] ?? 0);
                    $discountAmount = floatval($item['discount'] ?? 0);
                    $totalPrice = ($unitPrice * $item['quantity']) - ($discountAmount + $specialDiscount);

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->product_id,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'special_discount' => $specialDiscount,
                        'total' => max(0, $totalPrice),
                        'supplier' => $item['supplier'] ?? ($product ? $product->supplier : null),
                        'category' => $item['category'] ?? ($product ? $product->category_name : null),
                        'store_location' => $item['store_location'] ?? ($product ? $product->store_location : null),
                    ]);
                } else {
                    $unitPrice = floatval($item['unit_price']);
                    $specialDiscount = floatval($item['special_discount'] ?? 0);
                    $discountAmount = floatval($item['discount'] ?? 0);
                    $totalPrice = ($unitPrice * $item['quantity']) - ($discountAmount + $specialDiscount);

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => null,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'special_discount' => $specialDiscount,
                        'total' => max(0, $totalPrice),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Sale saved successfully!', 'data' => $sale], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save sale.', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        Log::info('Update method called for sale ID: ' . $id);
        $sale = Sale::find($id);
        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }

        $request->validate([
            'customer_name' => 'required|string',
            'subtotal' => 'required|numeric',
            'discount' => 'required|numeric',
            'tax' => 'nullable|numeric',
            'total' => 'required|numeric',
            'payment_type' => 'required|string',
            'received_amount' => 'required|numeric',
            'balance_amount' => 'required|numeric',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.mrp' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'required|numeric|min:0',
            'items.*.special_discount' => 'nullable|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'items.*.supplier' => 'nullable|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.store_location' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $activeSchemes = \App\Models\DiscountScheme::where('active', true)
                ->where(function ($query) {
                    $today = date('Y-m-d');
                    $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
                })
                ->where(function ($query) {
                    $today = date('Y-m-d');
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
                })
                ->get();

            $sale->update([
                'customer_name' => $request->customer_name,
                'subtotal' => $request->subtotal,
                'discount' => $request->discount,
                'tax' => $request->tax ?? 0,
                'total' => $request->total,
                'payment_type' => $request->payment_type,
                'received_amount' => $request->received_amount,
                'balance_amount' => $request->balance_amount,
            ]);

            $sale->items()->delete();

            $calculateDiscount = function ($product, $schemes) {
                $basePrice = $product->sales_price ?? 0;
                $categoryName = $product->category_name ?? null;
                $maxDiscountValue = 0;

                foreach ($schemes as $scheme) {
                    if (!$scheme->active) continue;

                    $appliesTo = $scheme->applies_to;
                    $target = $scheme->target;

                    if ($appliesTo === 'product' && $target === $product->product_name) {
                        $discountValue = 0;
                        if ($scheme->type === 'percentage') {
                            $discountValue = ($basePrice * $scheme->value) / 100;
                        } elseif ($scheme->type === 'amount') {
                            $discountValue = $scheme->value;
                        }
                        if ($discountValue > $maxDiscountValue) {
                            $maxDiscountValue = $discountValue;
                        }
                    } elseif ($appliesTo === 'category' && $target === $categoryName) {
                        $discountValue = 0;
                        if ($scheme->type === 'percentage') {
                            $discountValue = ($basePrice * $scheme->value) / 100;
                        } elseif ($scheme->type === 'amount') {
                            $discountValue = $scheme->value;
                        }
                        if ($discountValue > $maxDiscountValue) {
                            $maxDiscountValue = $discountValue;
                        }
                    }
                }
                return min($maxDiscountValue, $basePrice);
            };

            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    $unitPrice = floatval($item['unit_price']);
                    $specialDiscount = floatval($item['special_discount'] ?? 0);
                    $discountAmount = floatval($item['discount'] ?? 0);
                    $totalPrice = ($unitPrice * $item['quantity']) - ($discountAmount + $specialDiscount);

                    if ($item['quantity'] <= 0) {
                        Log::warning('Invalid quantity for product ' . $item['product_name'] . ': ' . $item['quantity']);
                        continue;
                    }

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->product_id,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'special_discount' => $specialDiscount,
                        'total' => max(0, $totalPrice),
                        'supplier' => $item['supplier'] ?? ($product ? $product->supplier : null),
                        'category' => $item['category'] ?? ($product ? $product->category_name : null),
                        'store_location' => $item['store_location'] ?? ($product ? $product->store_location : null),
                    ]);
                } else {
                    $unitPrice = floatval($item['unit_price']);
                    $specialDiscount = floatval($item['special_discount'] ?? 0);
                    $discountAmount = floatval($item['discount'] ?? 0);
                    $totalPrice = ($unitPrice * $item['quantity']) - ($discountAmount + $specialDiscount);

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => null,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'special_discount' => $specialDiscount,
                        'total' => max(0, $totalPrice),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Sale updated successfully!', 'data' => $sale], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update sale: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update sale.', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        Log::info('Deleting sale with ID: ' . $id);
        $sale = Sale::find($id);
        if ($sale) {
            $sale->delete();
            return response()->json(['message' => 'Sale deleted successfully!'], 200);
        } else {
            return response()->json(['message' => 'Sale not found'], 404);
        }
    }

    public function getLastBillNumber(Request $request)
    {
        $user = $request->user();
        $userId = $user ? $user->id : ($request->input('user_id', 'U0'));
        $userName = $user ? ($user->username ?: $user->name) : ($request->input('user_name', 'NON'));

        $nextBillNumber = BillNumberGenerator::generateNextBillNumber($userId, $userName);
        return response()->json(['next_bill_number' => $nextBillNumber]);
    }

    public function getCombinedBillWiseProfitReport(Request $request)
    {
        try {
            $salesQuery = Sale::with(['items.product'])
                ->select('id', 'bill_number', 'created_at', 'customer_name', 'payment_type');

            $invoicesQuery = \App\Models\Invoice::with('items')
                ->select('id', 'invoice_no', 'invoice_date', 'customer_name', 'payment_method');

            if ($request->has('fromDate') && $request->has('toDate')) {
                $salesQuery->whereBetween('created_at', [
                    $request->input('fromDate') . ' 00:00:00',
                    $request->input('toDate') . ' 23:59:59'
                ]);
                $invoicesQuery->whereBetween('invoice_date', [
                    $request->input('fromDate') . ' 00:00:00',
                    $request->input('toDate') . ' 23:59:59'
                ]);
            }

            if ($request->has('paymentMethod')) {
                $paymentMethod = trim(strtolower($request->input('paymentMethod')));
                if ($paymentMethod !== '' && $paymentMethod !== 'all') {
                    $salesQuery->whereRaw('LOWER(payment_type) = ?', [$paymentMethod]);
                    $invoicesQuery->whereRaw('LOWER(payment_method) = ?', [$paymentMethod]);
                }
            }

            $sales = $salesQuery->get();
            $invoices = $invoicesQuery->get();

            $combinedReportData = [];
            $totalCostPriceAll = 0;
            $totalSellingPriceAll = 0;
            $totalProfitAll = 0;

            foreach ($sales as $sale) {
                $totalCostPrice = 0;
                $totalSellingPrice = 0;
                $items = [];

                foreach ($sale->items as $item) {
                    $product = $item->product;
                    $buyingCost = $product ? $product->buying_cost : 0;

                    $itemCostPrice = $buyingCost * $item->quantity;
                    $itemSellingPrice = $item->unit_price * $item->quantity;
                    $itemProfit = $itemSellingPrice - $itemCostPrice;
                    $itemProfitPercentage = ($itemCostPrice > 0) ? ($itemProfit / $itemCostPrice) * 100 : 0;

                    $items[] = [
                        'product_name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'costPrice' => number_format($itemCostPrice, 2),
                        'sellingPrice' => number_format($itemSellingPrice, 2),
                        'profit' => number_format($itemProfit, 2),
                        'profitPercentage' => number_format($itemProfitPercentage, 2) . '%',
                    ];

                    $totalCostPrice += $itemCostPrice;
                    $totalSellingPrice += $itemSellingPrice;
                }

                $totalProfit = $totalSellingPrice - $totalCostPrice;
                $profitPercentage = ($totalCostPrice > 0) ? ($totalProfit / $totalCostPrice) * 100 : 0;

                $combinedReportData[] = [
                    'bill_number' => $sale->bill_number,
                    'date' => $sale->created_at->format('d-m-Y'),
                    'customer_name' => $sale->customer_name ?: 'Walk-in Customer',
                    'payment_type' => $sale->payment_type,
                    'items' => $items,
                    'totalCostPrice' => number_format($totalCostPrice, 2),
                    'totalSellingPrice' => number_format($totalSellingPrice, 2),
                    'totalProfit' => number_format($totalProfit, 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                ];

                $totalCostPriceAll += $totalCostPrice;
                $totalSellingPriceAll += $totalSellingPrice;
                $totalProfitAll += $totalProfit;
            }

            foreach ($invoices as $invoice) {
                $totalCostPrice = 0;
                $totalSellingPrice = 0;
                $items = [];

                foreach ($invoice->items as $item) {
                    $costPrice = $item->total_buying_cost ?? 0;
                    $sellingPrice = $item->sales_price * $item->quantity;
                    $profit = $sellingPrice - $costPrice;
                    $profitPercentage = ($costPrice > 0) ? ($profit / $costPrice) * 100 : 0;

                    $items[] = [
                        'product_name' => $item->description,
                        'quantity' => $item->quantity,
                        'costPrice' => number_format($costPrice, 2),
                        'sellingPrice' => number_format($sellingPrice, 2),
                        'profit' => number_format($profit, 2),
                        'profitPercentage' => number_format($profitPercentage, 2) . '%',
                    ];

                    $totalCostPrice += $costPrice;
                    $totalSellingPrice += $sellingPrice;
                }

                $totalProfit = $totalSellingPrice - $totalCostPrice;
                $profitPercentage = ($totalCostPrice > 0) ? ($totalProfit / $totalCostPrice) * 100 : 0;

                $combinedReportData[] = [
                    'bill_number' => $invoice->invoice_no,
                    'date' => $invoice->invoice_date->format('d-m-Y'),
                    'customer_name' => $invoice->customer_name ?: 'Walk-in Customer',
                    'payment_type' => $invoice->payment_method,
                    'items' => $items,
                    'totalCostPrice' => number_format($totalCostPrice, 2),
                    'totalSellingPrice' => number_format($totalSellingPrice, 2),
                    'totalProfit' => number_format($totalProfit, 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                ];

                $totalCostPriceAll += $totalCostPrice;
                $totalSellingPriceAll += $totalSellingPrice;
                $totalProfitAll += $totalProfit;
            }

            usort($combinedReportData, function ($a, $b) {
                $dateA = \DateTime::createFromFormat('d-m-Y', $a['date']);
                $dateB = \DateTime::createFromFormat('d-m-Y', $b['date']);
                return $dateB <=> $dateA;
            });

            $summary = [
                'totalCostPriceAll' => number_format($totalCostPriceAll, 2),
                'totalSellingPriceAll' => number_format($totalSellingPriceAll, 2),
                'totalProfitAll' => number_format($totalProfitAll, 2),
                'averageProfitPercentageAll' => ($totalCostPriceAll > 0) ? number_format(($totalProfitAll / $totalCostPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $combinedReportData,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getCombinedBillWiseProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch combined report.'], 500);
        }
    }

    public function getDailyProfitReport(Request $request)
    {
        try {
            $date = $request->input('date', now()->format('Y-m-d'));
            $sales = Sale::with('items.product')
                ->whereDate('created_at', $date)
                ->get();

            $reportData = [];
            $totalCost = 0;
            $totalSales = 0;
            $totalProfit = 0;

            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    $productName = $product ? $product->product_name : 'Unknown Product';
                    $costPrice = $product ? $product->buying_cost * $item->quantity : 0;
                    $sellingPrice = $item->unit_price * $item->quantity;
                    $profit = $sellingPrice - $costPrice;

                    if (!isset($reportData[$productName])) {
                        $reportData[$productName] = [
                            'product_name' => $productName,
                            'total_quantity_sold' => 0,
                            'total_sales_amount' => 0,
                            'total_cost' => 0,
                            'total_profit' => 0,
                        ];
                    }

                    $reportData[$productName]['total_quantity_sold'] += $item->quantity;
                    $reportData[$productName]['total_sales_amount'] += $sellingPrice;
                    $reportData[$productName]['total_cost'] += $costPrice;
                    $reportData[$productName]['total_profit'] += $profit;

                    $totalCost += $costPrice;
                    $totalSales += $sellingPrice;
                    $totalProfit += $profit;
                }
            }

            $reportData = array_map(function ($item) {
                $profitPercentage = ($item['total_cost'] > 0) ? ($item['total_profit'] / $item['total_cost']) * 100 : 0;
                return [
                    'product_name' => $item['product_name'],
                    'total_quantity_sold' => number_format($item['total_quantity_sold'], 2),
                    'total_sales_amount' => number_format($item['total_sales_amount'], 2),
                    'total_cost' => number_format($item['total_cost'], 2),
                    'total_profit' => number_format($item['total_profit'], 2),
                    'profit_percentage' => number_format($profitPercentage, 2) . '%',
                ];
            }, array_values($reportData));

            $summary = [
                'totalCostPriceAll' => number_format($totalCost, 2),
                'totalSellingPriceAll' => number_format($totalSales, 2),
                'totalProfitAll' => number_format($totalProfit, 2),
                'averageProfitPercentageAll' => ($totalCost > 0) ? number_format(($totalProfit / $totalCost) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $reportData,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getDailyProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
        }
    }

    public function getCombinedDailyProfitReport(Request $request)
    {
       try {
           $date = $request->input('date', now()->format('Y-m-d'));

            $sales = Sale::with(['items.product'])
              ->whereDate('created_at', $date)
               ->get();
          $invoices = \App\Models\Invoice::with('items.product')
               ->whereDate('invoice_date', $date)
               ->get();

           $combinedReportData = [];
            $totalCostPriceAll = 0;
            $totalSellingPriceAll = 0;
            $totalProfitAll = 0;

            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    $productName = $product ? $product->product_name : 'Unknown Product';
                    $costPrice = $product ? $product->buying_cost * $item->quantity : 0;
                    $sellingPrice = $item->unit_price * $item->quantity;
                    $profit = $sellingPrice - $costPrice;

                    if (!isset($combinedReportData[$productName])) {
                        $combinedReportData[$productName] = [
                            'product_name' => $productName,
                           'total_quantity_sold' => 0,
                           'total_sales_amount' => 0,
                           'total_cost' => 0,
                            'total_profit' => 0,
                        ];
                   }

                    $combinedReportData[$productName]['total_quantity_sold'] += $item->quantity;
                    $combinedReportData[$productName]['total_sales_amount'] += $sellingPrice;
                    $combinedReportData[$productName]['total_cost'] += $costPrice;
                    $combinedReportData[$productName]['total_profit'] += $profit;
                    $totalCostPriceAll += $costPrice;
                    $totalSellingPriceAll += $sellingPrice;
                    $totalProfitAll += $profit;
               }
          }

            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $product = $item->product;
                    $productName = $product ? $product->product_name : ($item->description ?? 'Unknown Product');
                    $costPrice = $product ? $product->buying_cost * $item->quantity : 0;                    $sellingPrice = $item->sales_price * $item->quantity;
                    $profit = $sellingPrice - $costPrice;

                    if (!isset($combinedReportData[$productName])) {
                        $combinedReportData[$productName] = [
                            'product_name' => $productName,
                            'total_quantity_sold' => 0,
                            'total_sales_amount' => 0,                            'total_cost' => 0,
                            'total_profit' => 0,
                        ];
                    }

                    $combinedReportData[$productName]['total_quantity_sold'] += $item->quantity;
                    $combinedReportData[$productName]['total_sales_amount'] += $sellingPrice;
                    $combinedReportData[$productName]['total_cost'] += $costPrice;
                    $combinedReportData[$productName]['total_profit'] += $profit;

                    $totalCostPriceAll += $costPrice;
                    $totalSellingPriceAll += $sellingPrice;
                    $totalProfitAll += $profit;
                }
            }

            $combinedReportData = array_map(function ($item) {
                $profitPercentage = ($item['total_cost'] > 0) ? ($item['total_profit'] / $item['total_cost']) * 100 : 0;
                return [
                    'product_name' => $item['product_name'],
                    'total_quantity_sold' => number_format($item['total_quantity_sold'], 2),
                    'total_sales_amount' => number_format($item['total_sales_amount'], 2),
                    'total_cost' => number_format($item['total_cost'], 2),
                    'total_profit' => number_format($item['total_profit'], 2),
                   'profit_percentage' => number_format($profitPercentage, 2) . '%',
                ];     
       }, array_values($combinedReportData));

            $summary = [
                'totalCostPriceAll' => number_format($totalCostPriceAll, 2),
                'totalSellingPriceAll' => number_format($totalSellingPriceAll, 2),
                'totalProfitAll' => number_format($totalProfitAll, 2),
                'averageProfitPercentageAll' => ($totalCostPriceAll > 0) ? number_format(($totalProfitAll / $totalCostPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $combinedReportData,
                'summary' => $summary,
            ]);
      } catch (\Exception $e) {
            Log::error('Error in getCombinedDailyProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch combined daily profit report.'], 500);
        }
    }

    public function getCompanyWiseProfitReport(Request $request)
    {
        try {
            $query = Sale::with(['items.product'])
                ->select('id', 'created_at', 'customer_name', 'payment_type');

            if ($request->has('fromDate') && $request->has('toDate')) {
                $query->whereBetween('created_at', [
                    $request->input('fromDate') . ' 00:00:00',
                    $request->input('toDate') . ' 23:59:59'
                ]);
            }

            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '') {
                $query->where('payment_type', $request->input('paymentMethod'));
            }

            $sales = $query->get();

            $reportData = [];
            $totalCostPriceAll = 0;
            $totalSellingPriceAll = 0;
            $totalProfitAll = 0;

            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    $companyName = $product ? $product->company_name : 'Unknown Company';

                    $buyingCost = $product ? $product->buying_cost : 0;
                    $itemCostPrice = $buyingCost * $item->quantity;
                    $itemSellingPrice = $item->unit_price * $item->quantity;
                    $itemProfit = $itemSellingPrice - $itemCostPrice;

                    if (!isset($reportData[$companyName])) {
                        $reportData[$companyName] = [
                            'companyName' => $companyName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                        ];
                    }

                    $reportData[$companyName]['totalCostPrice'] += $itemCostPrice;
                    $reportData[$companyName]['totalSellingPrice'] += $itemSellingPrice;
                    $reportData[$companyName]['totalProfit'] += $itemProfit;

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                }
            }

            $reportData = array_map(function ($item) {
                $profitPercentage = ($item['totalCostPrice'] > 0) ? ($item['totalProfit'] / $item['totalCostPrice']) * 100 : 0;
                return [
                    'companyName' => $item['companyName'],
                    'totalCostPrice' => number_format($item['totalCostPrice'], 2),
                    'totalSellingPrice' => number_format($item['totalSellingPrice'], 2),
                    'totalProfit' => number_format($item['totalProfit'], 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                ];
            }, array_values($reportData));

            $summary = [
                'totalCostPriceAll' => number_format($totalCostPriceAll, 2),
                'totalSellingPriceAll' => number_format($totalSellingPriceAll, 2),
                'totalProfitAll' => number_format($totalProfitAll, 2),
                'averageProfitPercentageAll' => ($totalCostPriceAll > 0) ? number_format(($totalProfitAll / $totalCostPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $reportData,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getCompanyWiseProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
        }
    }

    public function getSupplierWiseProfitReport(Request $request)
    {
        try {
            $supplierName = trim($request->input('supplierName'));
            if (empty($supplierName)) {
                Log::warning('No supplier name provided in getSupplierWiseProfitReport');
                return response()->json([
                    'reportData' => [],
                    'summary' => [
                        'totalCostPriceAll' => '0.00',
                        'totalSellingPriceAll' => '0.00',
                        'totalProfitAll' => '0.00',
                        'totalQuantityAll' => '0.00',
                        'averageProfitPercentageAll' => '0.00%',
                    ],
                ], 200);
            }

            // Sanitize supplier name for query (case-insensitive)
            $supplier = Supplier::whereRaw('LOWER(supplier_name) = ?', [strtolower($supplierName)])->first();
            if (!$supplier) {
                Log::info("Supplier not found: {$supplierName}");
                return response()->json([
                    'reportData' => [],
                    'summary' => [
                        'totalCostPriceAll' => '0.00',
                        'totalSellingPriceAll' => '0.00',
                        'totalProfitAll' => '0.00',
                        'totalQuantityAll' => '0.00',
                        'averageProfitPercentageAll' => '0.00%',
                    ],
                ], 200);
            }

            $salesQuery = Sale::with(['items.product'])
                ->select('id', 'created_at', 'customer_name', 'payment_type')
                ->whereHas('items', function ($q) use ($supplierName) {
                    $q->whereRaw('LOWER(supplier) = ?', [strtolower($supplierName)]);
                });

            $invoicesQuery = Invoice::with('items')
                ->select('id', 'invoice_date', 'customer_name', 'payment_method')
                ->whereHas('items', function ($q) use ($supplierName) {
                    $q->whereRaw('LOWER(supplier) = ?', [strtolower($supplierName)]);
                });

            if ($request->has('fromDate') && $request->has('toDate')) {
                $fromDate = $request->input('fromDate');
                $toDate = $request->input('toDate');
                if ($fromDate && $toDate) {
                    $salesQuery->whereBetween('created_at', [
                        $fromDate . ' 00:00:00',
                        $toDate . ' 23:59:59'
                    ]);
                    $invoicesQuery->whereBetween('invoice_date', [
                        $fromDate . ' 00:00:00',
                        $toDate . ' 23:59:59'
                    ]);
                }
            }

            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '' && $request->input('paymentMethod') !== 'all') {
                $paymentMethod = trim(strtolower($request->input('paymentMethod')));
                $salesQuery->whereRaw('LOWER(payment_type) = ?', [$paymentMethod]);
                $invoicesQuery->whereRaw('LOWER(payment_method) = ?', [$paymentMethod]);
            }

            $sales = $salesQuery->get();
            $invoices = $invoicesQuery->get();

            $reportData = [];
            $totalCostPriceAll = 0;
            $totalSellingPriceAll = 0;
            $totalProfitAll = 0;
            $totalQuantityAll = 0;

            // Process sales
            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $currentSupplierName = $item->supplier ? trim($item->supplier) : 'Unknown Supplier';
                    if (strtolower($currentSupplierName) !== strtolower($supplierName)) {
                        continue;
                    }

                    $product = $item->product;
                    $buyingCost = $product ? floatval($product->buying_cost ?? 0) : 0;
                    $quantity = floatval($item->quantity ?? 0);
                    $unitPrice = floatval($item->unit_price ?? 0);

                    $itemCostPrice = $buyingCost * $quantity;
                    $itemSellingPrice = $unitPrice * $quantity;
                    $itemProfit = $itemSellingPrice - $itemCostPrice;

                    if (!isset($reportData[$currentSupplierName])) {
                        $reportData[$currentSupplierName] = [
                            'supplierName' => $currentSupplierName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                            'totalQuantity' => 0,
                            'items' => [],
                        ];
                    }

                    $reportData[$currentSupplierName]['totalCostPrice'] += $itemCostPrice;
                    $reportData[$currentSupplierName]['totalSellingPrice'] += $itemSellingPrice;
                    $reportData[$currentSupplierName]['totalProfit'] += $itemProfit;
                    $reportData[$currentSupplierName]['totalQuantity'] += $quantity;

                    $reportData[$currentSupplierName]['items'][] = [
                        'product_name' => $item->product_name ?? 'Unknown Product',
                        'quantity' => number_format($quantity, 2),
                        'unit_price' => number_format($unitPrice, 2),
                        'total_cost' => number_format($itemCostPrice, 2),
                        'total_sales' => number_format($itemSellingPrice, 2),
                        'profit' => number_format($itemProfit, 2),
                    ];

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                    $totalQuantityAll += $quantity;
                }
            }

            // Process invoices
            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $currentSupplierName = $item->supplier ? trim($item->supplier) : 'Unknown Supplier';
                    if (strtolower($currentSupplierName) !== strtolower($supplierName)) {
                        continue;
                    }

                    $costPrice = floatval($item->total_buying_cost ?? 0);
                    $quantity = floatval($item->quantity ?? 0);
                    $unitPrice = floatval($item->sales_price ?? $item->unit_price ?? 0);
                    $discount = floatval($item->discount_amount ?? 0);
                    $specialDiscount = floatval($item->special_discount ?? 0);

                    $itemCostPrice = $costPrice;
                    $itemSellingPrice = ($unitPrice * $quantity) - ($discount + $specialDiscount);
                    $itemProfit = $itemSellingPrice - $itemCostPrice;

                    if (!isset($reportData[$currentSupplierName])) {
                        $reportData[$currentSupplierName] = [
                            'supplierName' => $currentSupplierName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                            'totalQuantity' => 0,
                            'items' => [],
                        ];
                    }

                    $reportData[$currentSupplierName]['totalCostPrice'] += $itemCostPrice;
                    $reportData[$currentSupplierName]['totalSellingPrice'] += $itemSellingPrice;
                    $reportData[$currentSupplierName]['totalProfit'] += $itemProfit;
                    $reportData[$currentSupplierName]['totalQuantity'] += $quantity;

                    $reportData[$currentSupplierName]['items'][] = [
                        'product_name' => $item->description ?? 'Unknown Product',
                        'quantity' => number_format($quantity, 2),
                        'unit_price' => number_format($unitPrice, 2),
                        'total_cost' => number_format($itemCostPrice, 2),
                        'total_sales' => number_format($itemSellingPrice, 2),
                        'profit' => number_format($itemProfit, 2),
                    ];

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                    $totalQuantityAll += $quantity;
                }
            }

            $reportData = array_map(function ($item) {
                $profitPercentage = ($item['totalCostPrice'] > 0) ? ($item['totalProfit'] / $item['totalCostPrice']) * 100 : 0;
                return [
                    'supplierName' => $item['supplierName'],
                    'totalCostPrice' => number_format($item['totalCostPrice'], 2),
                    'totalSellingPrice' => number_format($item['totalSellingPrice'], 2),
                    'totalProfit' => number_format($item['totalProfit'], 2),
                    'totalQuantity' => number_format($item['totalQuantity'], 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                    'items' => $item['items'],
                ];
            }, array_values($reportData));

            $summary = [
                'totalCostPriceAll' => number_format($totalCostPriceAll, 2),
                'totalSellingPriceAll' => number_format($totalSellingPriceAll, 2),
                'totalProfitAll' => number_format($totalProfitAll, 2),
                'totalQuantityAll' => number_format($totalQuantityAll, 2),
                'averageProfitPercentageAll' => ($totalCostPriceAll > 0) ? number_format(($totalProfitAll / $totalCostPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $reportData,
                'summary' => $summary,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in getSupplierWiseProfitReport: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'error' => 'Failed to fetch supplier report. Please try again later.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getCategoryWiseProfitReport(Request $request)
    {
        try {
            $categoryName = trim($request->input('categoryName'));
            if (empty($categoryName)) {
                Log::warning('No category name provided in getCategoryWiseProfitReport');
                return response()->json([
                    'reportData' => [],
                    'summary' => [
                        'totalCostPriceAll' => '0.00',
                        'totalSellingPriceAll' => '0.00',
                        'totalProfitAll' => '0.00',
                        'totalQuantityAll' => '0.00',
                        'averageProfitPercentageAll' => '0.00%',
                    ],
                ], 200);
            }

            $salesQuery = Sale::with(['items.product'])
                ->select('id', 'created_at', 'customer_name', 'payment_type')
                ->whereHas('items', function ($q) use ($categoryName) {
                    $q->whereRaw('LOWER(category) = ?', [strtolower($categoryName)]);
                });

            $invoicesQuery = Invoice::with('items')
                ->select('id', 'invoice_date', 'customer_name', 'payment_method')
                ->whereHas('items', function ($q) use ($categoryName) {
                    $q->whereRaw('LOWER(category) = ?', [strtolower($categoryName)]);
                });

            if ($request->has('fromDate') && $request->has('toDate')) {
                $fromDate = $request->input('fromDate');
                $toDate = $request->input('toDate');
                if ($fromDate && $toDate) {
                    $salesQuery->whereBetween('created_at', [
                        $fromDate . ' 00:00:00',
                        $toDate . ' 23:59:59'
                    ]);
                    $invoicesQuery->whereBetween('invoice_date', [
                        $fromDate . ' 00:00:00',
                        $toDate . ' 23:59:59'
                    ]);
                }
            }

            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '' && $request->input('paymentMethod') !== 'all') {
                $paymentMethod = trim(strtolower($request->input('paymentMethod')));
                $salesQuery->whereRaw('LOWER(payment_type) = ?', [$paymentMethod]);
                $invoicesQuery->whereRaw('LOWER(payment_method) = ?', [$paymentMethod]);
            }

            $sales = $salesQuery->get();
            $invoices = $invoicesQuery->get();

            $reportData = [];
            $totalCostPriceAll = 0;
            $totalSellingPriceAll = 0;
            $totalProfitAll = 0;
            $totalQuantityAll = 0;

            // Process sales
            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $currentCategoryName = $item->category ? trim($item->category) : 'Unknown Category';
                    if (strtolower($currentCategoryName) !== strtolower($categoryName)) {
                        continue;
                    }

                    $product = $item->product;
                    $buyingCost = $product ? floatval($product->buying_cost ?? 0) : 0;
                    $quantity = floatval($item->quantity ?? 0);
                    $unitPrice = floatval($item->unit_price ?? 0);
                    $discount = floatval($item->discount ?? 0);
                    $specialDiscount = floatval($item->special_discount ?? 0);

                    $itemCostPrice = $buyingCost * $quantity;
                    $itemSellingPrice = ($unitPrice * $quantity) - ($discount + $specialDiscount);
                    $itemProfit = $itemSellingPrice - $itemCostPrice;

                    if (!isset($reportData[$currentCategoryName])) {
                        $reportData[$currentCategoryName] = [
                            'categoryName' => $currentCategoryName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                            'totalQuantity' => 0,
                            'items' => [],
                        ];
                    }

                    $reportData[$currentCategoryName]['totalCostPrice'] += $itemCostPrice;
                    $reportData[$currentCategoryName]['totalSellingPrice'] += $itemSellingPrice;
                    $reportData[$currentCategoryName]['totalProfit'] += $itemProfit;
                    $reportData[$currentCategoryName]['totalQuantity'] += $quantity;

                    $reportData[$currentCategoryName]['items'][] = [
                        'product_name' => $item->product_name ?? 'Unknown Product',
                        'quantity' => number_format($quantity, 2),
                        'unit_price' => number_format($unitPrice, 2),
                        'total_cost' => number_format($itemCostPrice, 2),
                        'total_sales' => number_format($itemSellingPrice, 2),
                        'profit' => number_format($itemProfit, 2),
                    ];

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                    $totalQuantityAll += $quantity;
                }
            }

            // Process invoices
            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $currentCategoryName = $item->category ? trim($item->category) : 'Unknown Category';
                    if (strtolower($currentCategoryName) !== strtolower($categoryName)) {
                        continue;
                    }

                    $costPrice = floatval($item->total_buying_cost ?? 0);
                    $quantity = floatval($item->quantity ?? 0);
                    $unitPrice = floatval($item->sales_price ?? $item->unit_price ?? 0);
                    $discount = floatval($item->discount_amount ?? 0);
                    $specialDiscount = floatval($item->special_discount ?? 0);

                    $itemCostPrice = $costPrice;
                    $itemSellingPrice = ($unitPrice * $quantity) - ($discount + $specialDiscount);
                    $itemProfit = $itemSellingPrice - $itemCostPrice;

                    if (!isset($reportData[$currentCategoryName])) {
                        $reportData[$currentCategoryName] = [
                            'categoryName' => $currentCategoryName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                            'totalQuantity' => 0,
                            'items' => [],
                        ];
                    }

                    $reportData[$currentCategoryName]['totalCostPrice'] += $itemCostPrice;
                    $reportData[$currentCategoryName]['totalSellingPrice'] += $itemSellingPrice;
                    $reportData[$currentCategoryName]['totalProfit'] += $itemProfit;
                    $reportData[$currentCategoryName]['totalQuantity'] += $quantity;

                    $reportData[$currentCategoryName]['items'][] = [
                        'product_name' => $item->description ?? 'Unknown Product',
                        'quantity' => number_format($quantity, 2),
                        'unit_price' => number_format($unitPrice, 2),
                        'total_cost' => number_format($itemCostPrice, 2),
                        'total_sales' => number_format($itemSellingPrice, 2),
                        'profit' => number_format($itemProfit, 2),
                    ];

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                    $totalQuantityAll += $quantity;
                }
            }

            $reportData = array_map(function ($item) {
                $profitPercentage = ($item['totalCostPrice'] > 0) ? ($item['totalProfit'] / $item['totalCostPrice']) * 100 : 0;
                return [
                    'categoryName' => $item['categoryName'],
                    'totalCostPrice' => number_format($item['totalCostPrice'], 2),
                    'totalSellingPrice' => number_format($item['totalSellingPrice'], 2),
                    'totalProfit' => number_format($item['totalProfit'], 2),
                    'totalQuantity' => number_format($item['totalQuantity'], 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                    'items' => $item['items'],
                ];
            }, array_values($reportData));

            $summary = [
                'totalCostPriceAll' => number_format($totalCostPriceAll, 2),
                'totalSellingPriceAll' => number_format($totalSellingPriceAll, 2),
                'totalProfitAll' => number_format($totalProfitAll, 2),
                'totalQuantityAll' => number_format($totalQuantityAll, 2),
                'averageProfitPercentageAll' => ($totalCostPriceAll > 0) ? number_format(($totalProfitAll / $totalCostPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $reportData,
                'summary' => $summary,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in getCategoryWiseProfitReport: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'error' => 'Failed to fetch category report. Please try again later.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}