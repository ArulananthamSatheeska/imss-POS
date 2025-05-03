<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\BillNumberGenerator;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        Log::info('Fetching all sales');
        $sales = Sale::with('items')->get();
        
        // Apply date filter if provided
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
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.mrp' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Generate the next bill number
            $user = $request->user();
            \Log::info('Authenticated user object:', ['user' => $user]);
            if (!$user) {
                \Log::error('User not authenticated in SaleController@store');
                return response()->json(['message' => 'Unauthorized: User not authenticated'], 401);
            }
            $userId = $user->id;
            $userName = $user->username ?? $user->name;
            \Log::info("Generating bill number for userId: {$userId}, userName: {$userName}");

            $billNumber = BillNumberGenerator::generateNextBillNumber($userId, $userName);

            // Fetch active discount schemes
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

            // Create the sale
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

            // Helper function to calculate discount for a product
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

            // Create the sale items (no stock update)
            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    // Calculate discount and adjust unit price and total
                    $discountAmount = $calculateDiscount($product, $activeSchemes);
                    $unitPrice = $product->sales_price - $discountAmount;
                    $unitPrice = max(0, $unitPrice);
                    $totalPrice = $unitPrice * $item['quantity'];

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->product_id,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'total' => $totalPrice,
                    ]);
                } else {
                    // If product not found, save as is
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => null,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $item['unit_price'],
                        'discount' => $item['discount'],
                        'total' => $item['total'],
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
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.mrp' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Fetch active discount schemes
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

            // Update the sale
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

            // Delete existing sale items
            $sale->items()->delete();

            // Helper function to calculate discount for a product
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

            // Create new sale items (no stock update)
            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    // Calculate discount and adjust unit price and total
                    $discountAmount = $calculateDiscount($product, $activeSchemes);
                    $unitPrice = $product->sales_price - $discountAmount;
                    $unitPrice = max(0, $unitPrice);
                    $totalPrice = $unitPrice * $item['quantity'];

                    if ($item['quantity'] <= 0) {
                        Log::warning('Invalid quantity for product ' . $item['product_name'] . ': ' . $item['quantity']);
                        continue; // Skip invalid quantity
                    }

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->product_id,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'total' => $totalPrice,
                    ]);
                } else {
                    Log::warning('Product not found: ' . $item['product_name']);
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => null,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $item['unit_price'],
                        'discount' => $item['discount'],
                        'total' => $item['total'],
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

    public function getBillWiseProfitReport(Request $request)
    {
        try {
            $query = Sale::with(['items.product'])
                ->select('id', 'bill_number', 'created_at', 'customer_name', 'payment_type');

            // Apply date filter
            if ($request->has('fromDate') && $request->has('toDate')) {
                $query->whereBetween('created_at', [
                    $request->input('fromDate') . ' 00:00:00',
                    $request->input('toDate') . ' 23:59:59'
                ]);
            }

            // Apply payment method filter
            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '') {
                $query->where('payment_type', $request->input('paymentMethod'));
            }

            $sales = $query->get();

            // Prepare the report data
            $reportData = [];
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
                    $itemProfitPercentage = ($itemSellingPrice > 0) ? ($itemProfit / $itemSellingPrice) * 100 : 0;

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
                $profitPercentage = ($totalSellingPrice > 0) ? ($totalProfit / $totalSellingPrice) * 100 : 0;

                $reportData[] = [
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

            $summary = [
                'totalCostPriceAll' => number_format($totalCostPriceAll, 2),
                'totalSellingPriceAll' => number_format($totalSellingPriceAll, 2),
                'totalProfitAll' => number_format($totalProfitAll, 2),
                'averageProfitPercentageAll' => ($totalSellingPriceAll > 0) ? number_format(($totalProfitAll / $totalSellingPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $reportData,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getBillWiseProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
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
                return [
                    'product_name' => $item['product_name'],
                    'total_quantity_sold' => number_format($item['total_quantity_sold'], 2),
                    'total_sales_amount' => number_format($item['total_sales_amount'], 2),
                    'total_cost' => number_format($item['total_cost'], 2),
                    'total_profit' => number_format($item['total_profit'], 2),
                ];
            }, array_values($reportData));

            return response()->json([
                'reportData' => $reportData,
                'summary' => [
                    'totalCostPriceAll' => number_format($totalCost, 2),
                    'totalSellingPriceAll' => number_format($totalSales, 2),
                    'totalProfitAll' => number_format($totalProfit, 2),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getDailyProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
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
                $profitPercentage = ($item['totalSellingPrice'] > 0) ? ($item['totalProfit'] / $item['totalSellingPrice']) * 100 : 0;
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
                'averageProfitPercentageAll' => ($totalSellingPriceAll > 0) ? number_format(($totalProfitAll / $totalSellingPriceAll) * 100, 2) . '%' : '0.00%',
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
            $query = Sale::with(['items.product.supplier'])
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
                    $supplierName = ($product && $product->supplier) ? $product->supplier->supplier_name : 'Unknown Supplier';

                    $buyingCost = $product ? $product->buying_cost : 0;
                    $itemCostPrice = $buyingCost * $item->quantity;
                    $itemSellingPrice = $item->unit_price * $item->quantity;
                    $itemProfit = $itemSellingPrice - $itemCostPrice;

                    if (!isset($reportData[$supplierName])) {
                        $reportData[$supplierName] = [
                            'supplierName' => $supplierName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                        ];
                    }

                    $reportData[$supplierName]['totalCostPrice'] += $itemCostPrice;
                    $reportData[$supplierName]['totalSellingPrice'] += $itemSellingPrice;
                    $reportData[$supplierName]['totalProfit'] = $itemProfit;

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                }
            }

            $reportData = array_map(function ($item) {
                $profitPercentage = ($item['totalSellingPrice'] > 0) ? ($item['totalProfit'] / $item['totalSellingPrice']) * 100 : 0;
                return [
                    'supplierName' => $item['supplierName'],
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
                'averageProfitPercentageAll' => ($totalSellingPriceAll > 0) ? number_format(($totalProfitAll / $totalSellingPriceAll) * 100, 2) . '%' : '0.00%',
            ];

            return response()->json([
                'reportData' => $reportData,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getSupplierWiseProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
        }
    }
}
