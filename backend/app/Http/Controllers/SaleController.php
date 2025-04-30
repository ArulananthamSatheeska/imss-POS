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

class SaleController extends Controller
{
    public function index()
    {
        Log::info('Fetching all sales');
        $sales = Sale::all();
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
            $billNumber = BillNumberGenerator::generateNextBillNumber();

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

            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    $discountAmount = $this->calculateDiscount($product, $activeSchemes);
                    $unitPrice = max(0, $product->sales_price - $discountAmount);
                    $totalPrice = $unitPrice * $item['quantity'];

                    $product->updateStock($item['quantity'], 'subtract');

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->product_id,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'total' => $totalPrice,
                        'cost_price' => $product->buying_cost * $item['quantity'],
                    ]);
                } else {
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
            foreach ($sale->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->updateStock($item->quantity, 'add');
                }
            }

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

            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    $discountAmount = $this->calculateDiscount($product, $activeSchemes);
                    $unitPrice = max(0, $product->sales_price - $discountAmount);
                    $totalPrice = $unitPrice * $item['quantity'];

                    if ($item['quantity'] <= 0) {
                        continue;
                    }

                    $product->updateStock($item['quantity'], 'subtract');

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->product_id,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'mrp' => $item['mrp'],
                        'unit_price' => $unitPrice,
                        'discount' => $discountAmount,
                        'total' => $totalPrice,
                        'cost_price' => $product->buying_cost * $item['quantity'],
                    ]);
                } else {
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
            foreach ($sale->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->updateStock($item->quantity, 'add');
                }
            }
            $sale->delete();
            return response()->json(['message' => 'Sale deleted successfully!'], 200);
        } else {
            return response()->json(['message' => 'Sale not found'], 404);
        }
    }

    public function getLastBillNumber()
    {
        $nextBillNumber = BillNumberGenerator::generateNextBillNumber();
        return response()->json(['next_bill_number' => $nextBillNumber]);
    }

    public function getBillWiseProfitReport(Request $request)
    {
        try {
            // Get sales data
            $salesQuery = Sale::with(['items.product'])
                ->select('id', 'bill_number', 'created_at', 'customer_name', 'payment_type');

            // Get invoices data
            $invoicesQuery = Invoice::with(['items'])
                ->select('id', 'invoice_no as bill_number', 'created_at', 'customer_name', 'payment_method as payment_type');

            // Apply filters
            if ($request->has('fromDate') && $request->has('toDate')) {
                $fromDate = $request->input('fromDate') . ' 00:00:00';
                $toDate = $request->input('toDate') . ' 23:59:59';
                
                $salesQuery->whereBetween('created_at', [$fromDate, $toDate]);
                $invoicesQuery->whereBetween('created_at', [$fromDate, $toDate]);
            }

            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '') {
                $paymentMethod = $request->input('paymentMethod');
                $salesQuery->where('payment_type', $paymentMethod);
                $invoicesQuery->where('payment_method', $paymentMethod);
            }

            $sales = $salesQuery->get();
            $invoices = $invoicesQuery->get();

            $reportData = [];
            $totals = ['cost' => 0, 'sales' => 0, 'profit' => 0];

            // Process sales
            foreach ($sales as $sale) {
                $saleData = $this->processSaleForReport($sale);
                $reportData[] = $saleData;
                $this->accumulateTotals($totals, $saleData);
            }

            // Process invoices
            foreach ($invoices as $invoice) {
                $invoiceData = $this->processInvoiceForReport($invoice);
                $reportData[] = $invoiceData;
                $this->accumulateTotals($totals, $invoiceData);
            }

            // Sort by date
            usort($reportData, fn($a, $b) => strtotime($a['date']) - strtotime($b['date']));

            return response()->json([
                'reportData' => $reportData,
                'summary' => $this->generateSummary($totals),
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

            $invoices = Invoice::with('items')
                ->whereDate('created_at', $date)
                ->get();

            $reportData = [];
            $totals = ['cost' => 0, 'sales' => 0, 'profit' => 0];

            // Process sales
            foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $product = $item->product;
                $productName = $product ? $product->product_name : 'Unknown Product';
                $costPrice = $item->cost_price ?? ($product ? $product->buying_cost * $item->quantity : 0);
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

                $totals['cost'] += $costPrice;
                $totals['sales'] += $sellingPrice;
                $totals['profit'] += $profit;
            }
            }

            // Process invoices
            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $productName = $item->description;
                    $costPrice = $item->cost_price ?? 0; // Use cost_price from invoice items
                    $sellingPrice = $item->total;
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

                    $totals['cost'] += $costPrice;
                    $totals['sales'] += $sellingPrice;
                    $totals['profit'] += $profit;
                }
            }

            // Format report data
            $formattedReport = array_map(function($item) {
                return [
                    'product_name' => $item['product_name'],
                    'total_quantity_sold' => number_format($item['total_quantity_sold'], 2),
                    'total_sales_amount' => number_format($item['total_sales_amount'], 2),
                    'total_cost' => number_format($item['total_cost'], 2),
                    'total_profit' => number_format($item['total_profit'], 2),
                ];
            }, array_values($reportData));

            return response()->json([
                'reportData' => $formattedReport,
                'summary' => [
                    'totalCostPriceAll' => number_format($totals['cost'], 2),
                    'totalSellingPriceAll' => number_format($totals['sales'], 2),
                    'totalProfitAll' => number_format($totals['profit'], 2),
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
            // Get sales data
            $salesQuery = Sale::with(['items.product'])
                ->select('id', 'created_at', 'customer_name', 'payment_type');

            // Get invoices data
            $invoicesQuery = Invoice::with(['items'])
                ->select('id', 'created_at', 'customer_name', 'payment_method as payment_type');

            // Apply filters
            if ($request->has('fromDate') && $request->has('toDate')) {
                $fromDate = $request->input('fromDate') . ' 00:00:00';
                $toDate = $request->input('toDate') . ' 23:59:59';
                
                $salesQuery->whereBetween('created_at', [$fromDate, $toDate]);
                $invoicesQuery->whereBetween('created_at', [$fromDate, $toDate]);
            }

            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '') {
                $paymentMethod = $request->input('paymentMethod');
                $salesQuery->where('payment_type', $paymentMethod);
                $invoicesQuery->where('payment_method', $paymentMethod);
            }

            $sales = $salesQuery->get();
            $invoices = $invoicesQuery->get();

            $reportData = [];
            $totals = ['cost' => 0, 'sales' => 0, 'profit' => 0];

            // Process sales
            foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $product = $item->product;
                $companyName = $product ? $product->company_name : 'Unknown Company';

                $costPrice = $item->cost_price ?? ($product ? $product->buying_cost * $item->quantity : 0);
                $sellingPrice = $item->unit_price * $item->quantity;
                $profit = $sellingPrice - $costPrice;

                if (!isset($reportData[$companyName])) {
                    $reportData[$companyName] = [
                        'companyName' => $companyName,
                        'totalCostPrice' => 0,
                        'totalSellingPrice' => 0,
                        'totalProfit' => 0,
                    ];
                }

                $reportData[$companyName]['totalCostPrice'] += $costPrice;
                $reportData[$companyName]['totalSellingPrice'] += $sellingPrice;
                $reportData[$companyName]['totalProfit'] += $profit;

                $totals['cost'] += $costPrice;
                $totals['sales'] += $sellingPrice;
                $totals['profit'] += $profit;
            }
            }

            // Process invoices (assuming no company data for invoices)
            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $companyName = 'Invoices'; // Group all invoices together
                    $costPrice = $item->cost_price ?? 0; // Use cost_price from invoice items
                    $sellingPrice = $item->total;
                    $profit = $sellingPrice - $costPrice;

                    if (!isset($reportData[$companyName])) {
                        $reportData[$companyName] = [
                            'companyName' => $companyName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                        ];
                    }

                    $reportData[$companyName]['totalCostPrice'] += $costPrice;
                    $reportData[$companyName]['totalSellingPrice'] += $sellingPrice;
                    $reportData[$companyName]['totalProfit'] += $profit;

                    $totals['cost'] += $costPrice;
                    $totals['sales'] += $sellingPrice;
                    $totals['profit'] += $profit;
                }
            }

            // Format report data
            $formattedReport = array_map(function($item) {
                $profitPercentage = ($item['totalSellingPrice'] > 0) 
                    ? ($item['totalProfit'] / $item['totalSellingPrice']) * 100 
                    : 0;
                
                return [
                    'companyName' => $item['companyName'],
                    'totalCostPrice' => number_format($item['totalCostPrice'], 2),
                    'totalSellingPrice' => number_format($item['totalSellingPrice'], 2),
                    'totalProfit' => number_format($item['totalProfit'], 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                ];
            }, array_values($reportData));

            return response()->json([
                'reportData' => $formattedReport,
                'summary' => $this->generateSummary($totals),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getCompanyWiseProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
        }
    }

    public function getSupplierWiseProfitReport(Request $request)
    {
        try {
            // Get sales data
            $salesQuery = Sale::with(['items.product.supplier'])
                ->select('id', 'created_at', 'customer_name', 'payment_type');

            // Get invoices data
            $invoicesQuery = Invoice::with(['items'])
                ->select('id', 'created_at', 'customer_name', 'payment_method as payment_type');

            // Apply filters
            if ($request->has('fromDate') && $request->has('toDate')) {
                $fromDate = $request->input('fromDate') . ' 00:00:00';
                $toDate = $request->input('toDate') . ' 23:59:59';
                
                $salesQuery->whereBetween('created_at', [$fromDate, $toDate]);
                $invoicesQuery->whereBetween('created_at', [$fromDate, $toDate]);
            }

            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '') {
                $paymentMethod = $request->input('paymentMethod');
                $salesQuery->where('payment_type', $paymentMethod);
                $invoicesQuery->where('payment_method', $paymentMethod);
            }

            $sales = $salesQuery->get();
            $invoices = $invoicesQuery->get();

            $reportData = [];
            $totals = ['cost' => 0, 'sales' => 0, 'profit' => 0];

            // Process sales
            foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $product = $item->product;
                $supplierName = ($product && $product->supplier) 
                    ? $product->supplier->supplier_name 
                    : 'Unknown Supplier';

                $costPrice = $item->cost_price ?? ($product ? $product->buying_cost * $item->quantity : 0);
                $sellingPrice = $item->unit_price * $item->quantity;
                $profit = $sellingPrice - $costPrice;

                if (!isset($reportData[$supplierName])) {
                    $reportData[$supplierName] = [
                        'supplierName' => $supplierName,
                        'totalCostPrice' => 0,
                        'totalSellingPrice' => 0,
                        'totalProfit' => 0,
                    ];
                }

                $reportData[$supplierName]['totalCostPrice'] += $costPrice;
                $reportData[$supplierName]['totalSellingPrice'] += $sellingPrice;
                $reportData[$supplierName]['totalProfit'] += $profit;

                $totals['cost'] += $costPrice;
                $totals['sales'] += $sellingPrice;
                $totals['profit'] += $profit;
            }
            }

            // Process invoices (assuming no supplier data for invoices)
            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $supplierName = 'Invoices'; // Group all invoices together
                    $costPrice = $item->cost_price ?? 0; // Use cost_price from invoice items
                    $sellingPrice = $item->total;
                    $profit = $sellingPrice - $costPrice;

                    if (!isset($reportData[$supplierName])) {
                        $reportData[$supplierName] = [
                            'supplierName' => $supplierName,
                            'totalCostPrice' => 0,
                            'totalSellingPrice' => 0,
                            'totalProfit' => 0,
                        ];
                    }

                    $reportData[$supplierName]['totalCostPrice'] += $costPrice;
                    $reportData[$supplierName]['totalSellingPrice'] += $sellingPrice;
                    $reportData[$supplierName]['totalProfit'] += $profit;

                    $totals['cost'] += $costPrice;
                    $totals['sales'] += $sellingPrice;
                    $totals['profit'] += $profit;
                }
            }

            // Format report data
            $formattedReport = array_map(function($item) {
                $profitPercentage = ($item['totalSellingPrice'] > 0) 
                    ? ($item['totalProfit'] / $item['totalSellingPrice']) * 100 
                    : 0;
                
                return [
                    'supplierName' => $item['supplierName'],
                    'totalCostPrice' => number_format($item['totalCostPrice'], 2),
                    'totalSellingPrice' => number_format($item['totalSellingPrice'], 2),
                    'totalProfit' => number_format($item['totalProfit'], 2),
                    'profitPercentage' => number_format($profitPercentage, 2) . '%',
                ];
            }, array_values($reportData));

            return response()->json([
                'reportData' => $formattedReport,
                'summary' => $this->generateSummary($totals),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getSupplierWiseProfitReport: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
        }
    }

    // Helper methods
    private function calculateDiscount($product, $schemes)
    {
        $basePrice = $product->sales_price ?? 0;
        $categoryName = $product->category_name ?? null;
        $maxDiscountValue = 0;

        foreach ($schemes as $scheme) {
            if (!$scheme->active) continue;

            $appliesTo = $scheme->applies_to;
            $target = $scheme->target;

            if ($appliesTo === 'product' && $target === $product->product_name) {
                $discountValue = $scheme->type === 'percentage' 
                    ? ($basePrice * $scheme->value) / 100 
                    : $scheme->value;
                $maxDiscountValue = max($maxDiscountValue, $discountValue);
            } elseif ($appliesTo === 'category' && $target === $categoryName) {
                $discountValue = $scheme->type === 'percentage' 
                    ? ($basePrice * $scheme->value) / 100 
                    : $scheme->value;
                $maxDiscountValue = max($maxDiscountValue, $discountValue);
            }
        }
        return min($maxDiscountValue, $basePrice);
    }

    private function processSaleForReport($sale)
    {
        $costPrice = 0;
        $sellingPrice = 0;
        $items = [];

        foreach ($sale->items as $item) {
            $product = $item->product;
            $itemCost = $product ? $product->buying_cost * $item->quantity : 0;
            $itemSales = $item->unit_price * $item->quantity;
            $itemProfit = $itemSales - $itemCost;
            $itemProfitPercentage = ($itemSales > 0) ? ($itemProfit / $itemSales) * 100 : 0;

            $items[] = [
                'product_name' => $item->product_name,
                'quantity' => $item->quantity,
                'costPrice' => number_format($itemCost, 2),
                'sellingPrice' => number_format($itemSales, 2),
                'profit' => number_format($itemProfit, 2),
                'profitPercentage' => number_format($itemProfitPercentage, 2) . '%',
            ];

            $costPrice += $itemCost;
            $sellingPrice += $itemSales;
        }

        $profit = $sellingPrice - $costPrice;
        $profitPercentage = ($sellingPrice > 0) ? ($profit / $sellingPrice) * 100 : 0;

        return [
            'type' => 'sale',
            'bill_number' => $sale->bill_number,
            'date' => $sale->created_at->format('d-m-Y'),
            'customer_name' => $sale->customer_name ?: 'Walk-in Customer',
            'payment_type' => $sale->payment_type,
            'items' => $items,
            'totalCostPrice' => number_format($costPrice, 2),
            'totalSellingPrice' => number_format($sellingPrice, 2),
            'totalProfit' => number_format($profit, 2),
            'profitPercentage' => number_format($profitPercentage, 2) . '%',
        ];
    }

    private function processInvoiceForReport($invoice)
    {
        $costPrice = 0;
        $sellingPrice = 0;
        $items = [];

        foreach ($invoice->items as $item) {
            $itemCost = 0; // Assuming no cost data for invoices
            $itemSales = $item->total;
            $itemProfit = $itemSales - $itemCost;
            $itemProfitPercentage = ($itemSales > 0) ? ($itemProfit / $itemSales) * 100 : 0;

            $items[] = [
                'product_name' => $item->description,
                'quantity' => $item->quantity,
                'costPrice' => number_format($itemCost, 2),
                'sellingPrice' => number_format($itemSales, 2),
                'profit' => number_format($itemProfit, 2),
                'profitPercentage' => number_format($itemProfitPercentage, 2) . '%',
            ];

            $costPrice += $itemCost;
            $sellingPrice += $itemSales;
        }

        $profit = $sellingPrice - $costPrice;
        $profitPercentage = ($sellingPrice > 0) ? ($profit / $sellingPrice) * 100 : 0;

        return [
            'type' => 'invoice',
            'bill_number' => $invoice->bill_number,
            'date' => $invoice->created_at->format('d-m-Y'),
            'customer_name' => $invoice->customer_name ?: 'Unknown Customer',
            'payment_type' => $invoice->payment_type,
            'items' => $items,
            'totalCostPrice' => number_format($costPrice, 2),
            'totalSellingPrice' => number_format($sellingPrice, 2),
            'totalProfit' => number_format($profit, 2),
            'profitPercentage' => number_format($profitPercentage, 2) . '%',
        ];
    }

    private function accumulateTotals(&$totals, $data)
    {
        $totals['cost'] += (float) str_replace(',', '', $data['totalCostPrice']);
        $totals['sales'] += (float) str_replace(',', '', $data['totalSellingPrice']);
        $totals['profit'] += (float) str_replace(',', '', $data['totalProfit']);
    }

    private function generateSummary($totals)
    {
        $profitPercentage = ($totals['sales'] > 0) 
            ? ($totals['profit'] / $totals['sales']) * 100 
            : 0;

        return [
            'totalCostPriceAll' => number_format($totals['cost'], 2),
            'totalSellingPriceAll' => number_format($totals['sales'], 2),
            'totalProfitAll' => number_format($totals['profit'], 2),
            'averageProfitPercentageAll' => number_format($profitPercentage, 2) . '%',
        ];
    }
}