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
    public function index()
    {
        Log::info('Fetching all sales');
        $sales = Sale::all();
        return response()->json($sales);
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
            $billNumber = BillNumberGenerator::generateNextBillNumber();

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

            // Create the sale items and update product stock
            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    // Update the stock quantity
                    $product->updateStock($item['quantity'], 'subtract');
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product ? $product->product_id : null,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'mrp' => $item['mrp'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'],
                    'total' => $item['total'],
                ]);
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
            // Revert stock quantities for existing sale items
            foreach ($sale->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->updateStock($item->quantity, 'add');
                }
            }

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

            // Create new sale items and update product stock
            foreach ($request->items as $item) {
                $product = Product::where('product_name', $item['product_name'])->first();
                if ($product) {
                    $product->updateStock($item['quantity'], 'subtract');
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product ? $product->product_id : null,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'mrp' => $item['mrp'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'],
                    'total' => $item['total'],
                ]);
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
            // Revert stock quantities for existing sale items
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

        $sales = $query->get(); // Fetch sales data for the report

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
                // Fetch the product details to get the buying cost
                $product = $item->product; // Ensure this relationship exists
                $buyingCost = $product ? $product->buying_cost : 0;

                // Calculate cost price and selling price for each item
                $itemCostPrice = $buyingCost * $item->quantity;
                $itemSellingPrice = $item->unit_price * $item->quantity;
                $itemProfit = $itemSellingPrice - $itemCostPrice;
                $itemProfitPercentage = ($itemSellingPrice > 0) ? ($itemProfit / $itemSellingPrice) * 100 : 0;

                // Add item details
                $items[] = [
                    'product_name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'costPrice' => number_format($itemCostPrice, 2),
                    'sellingPrice' => number_format($itemSellingPrice, 2),
                    'profit' => number_format($itemProfit, 2),
                    'profitPercentage' => number_format($itemProfitPercentage, 2) . '%',
                ];

                // Accumulate totals for the bill
                $totalCostPrice += $itemCostPrice;
                $totalSellingPrice += $itemSellingPrice;
            }

            $totalProfit = $totalSellingPrice - $totalCostPrice;
            $profitPercentage = ($totalSellingPrice > 0) ? ($totalProfit / $totalSellingPrice) * 100 : 0;

            // Add bill details
            $reportData[] = [
                'bill_number' => $sale->bill_number,
                'date' => $sale->created_at->format('d-m-Y'),
                'customer_name' => $sale->customer_name ?: 'Walk-in Customer', // Fallback to 'Walk-in Customer'
                'payment_type' => $sale->payment_type,
                'items' => $items, // Include item-level details
                'totalCostPrice' => number_format($totalCostPrice, 2),
                'totalSellingPrice' => number_format($totalSellingPrice, 2),
                'totalProfit' => number_format($totalProfit, 2),
                'profitPercentage' => number_format($profitPercentage, 2) . '%',
            ];

            // Accumulate totals for the entire report
            $totalCostPriceAll += $totalCostPrice;
            $totalSellingPriceAll += $totalSellingPrice;
            $totalProfitAll += $totalProfit;
        }

        // Add summary totals for the entire report
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

                    // Update totals
                    $totalCost += $costPrice;
                    $totalSales += $sellingPrice;
                    $totalProfit += $profit;
                }
            }

            // Format numbers
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

            // Calculate profit percentage and format numbers
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
                    $reportData[$supplierName]['totalProfit'] += $itemProfit;

                    $totalCostPriceAll += $itemCostPrice;
                    $totalSellingPriceAll += $itemSellingPrice;
                    $totalProfitAll += $itemProfit;
                }
            }

            // Calculate profit percentage and format numbers
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