<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\SaleItem;
use App\Models\PurchaseItem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StockReportController extends Controller
{
    public function detailedReport(Request $request)
    {
        Log::info('Fetching detailed stock report with filters:', $request->all());

        try {
            $query = Product::query();

            // Apply filters
            if ($request->has('itemCode') && $request->itemCode !== '') {
                $query->where('item_code', 'like', '%' . $request->itemCode . '%');
            }

            if ($request->has('itemName') && $request->itemName !== '') {
                $query->where('product_name', 'like', '%' . $request->itemName . '%');
            }

            if ($request->has('category') && $request->category !== '') {
                $query->where('category', 'like', '%' . $request->category . '%');
            }

            if ($request->has('supplier') && $request->supplier !== '') {
                $query->where('supplier', 'like', '%' . $request->supplier . '%');
            }

            if ($request->has('location') && $request->location !== '') {
                $query->where('store_location', 'like', '%' . $request->location . '%');
            }

            // Fetch products
            $products = $query->get();

            Log::info('Products fetched:', $products->toArray());

            // Get the date range from the request
            $fromDate = $request->input('fromDate');
            $toDate = $request->input('toDate');

            // Prepare the detailed stock report data
            $stockReports = $products->map(function ($product) use ($fromDate, $toDate) {
                // Calculate total sold quantity for the product within the date range
                $totalSoldQuantity = 0;
                try {
                    $saleQuery = SaleItem::where('product_id', $product->product_id);
                    if ($fromDate && $toDate) {
                        $saleQuery->whereHas('sale', function ($q) use ($fromDate, $toDate) {
                            $q->whereBetween('created_at', [$fromDate, $toDate]);
                        });
                    }
                    $totalSoldQuantity = $saleQuery->sum('quantity') ?? 0;
                    Log::debug('Total sold quantity for product ID ' . $product->product_id . ': ' . $totalSoldQuantity);
                } catch (\Exception $e) {
                    Log::warning('Error calculating total sold quantity for product ID ' . $product->product_id . ': ' . $e->getMessage());
                }

                // Calculate total purchased quantity for the product within the date range
                $totalPurchasedQuantity = 0;
                try {
                    $purchaseQuery = PurchaseItem::where('product_id', $product->product_id);
                    if ($fromDate && $toDate) {
                        $purchaseQuery->whereHas('purchase', function ($q) use ($fromDate, $toDate) {
                            $q->whereBetween('date_of_purchase', [$fromDate, $toDate]);
                        });
                    }
                    Log::debug('Purchase query for product ID ' . $product->product_id . ': ' . $purchaseQuery->toSql());
                    Log::debug('Purchase query bindings: ' . json_encode($purchaseQuery->getBindings()));
                    $totalPurchasedQuantity = $purchaseQuery->sum('quantity') ?? 0; // Removed free_items for now
                    Log::debug('Total purchased quantity for product ID ' . $product->product_id . ': ' . $totalPurchasedQuantity);
                } catch (\Exception $e) {
                    Log::warning('Error calculating total purchased quantity for product ID ' . $product->product_id . ': ' . $e->getMessage());
                }

                // Calculate closing stock with null checks
                $openingStock = $product->opening_stock_quantity ?? 0;
                $closingStock = $openingStock + $totalPurchasedQuantity - $totalSoldQuantity;

                // Calculate total purchase value (cost) with null checks
                $buyingCost = $product->buying_cost ?? 0;
                $totalPurchaseValue = ($openingStock + $totalPurchasedQuantity) * $buyingCost;

                // Calculate total sales value (selling price) with null checks
                $sellingPrice = $product->sales_price ?? 0;
                $totalSalesValue = $closingStock * $sellingPrice;

                // Parse location into type and identifier
                $locationParts = explode(' ', $product->store_location ?? 'Unknown N/A', 2);
                $locationType = $locationParts[0] ?? 'Unknown';
                $locationIdentifier = $locationParts[1] ?? 'N/A';

                // Return detailed stock report data with null checks
                return [
                    'itemCode' => $product->item_code ?? 'N/A',
                    'itemName' => $product->product_name ?? 'N/A',
                    'category' => $product->category ?? 'N/A',
                    'unit' => $product->unit_type ?? 'N/A',
                    'openingStock' => $openingStock,
                    'purchased' => $totalPurchasedQuantity,
                    'sold' => $totalSoldQuantity,
                    'adjusted' => 0,
                    'closingStock' => $closingStock,
                    'costPrice' => $buyingCost,
                    'sellingPrice' => $sellingPrice,
                    'totalPurchaseValue' => $totalPurchaseValue,
                    'totalSalesValue' => $totalSalesValue,
                    'location' => [
                        'type' => $locationType,
                        'identifier' => $locationIdentifier,
                    ],
                ];
            });

            Log::info('Detailed stock reports prepared:', $stockReports->toArray());

            return response()->json($stockReports, 200);

        } catch (\Exception $e) {
            Log::error('Error fetching detailed stock report: ' . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch detailed stock report: ' . $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        Log::info('Fetching item-wise stock report with filters:', $request->all());

        try {
            $query = Product::query();

            if ($request->has('itemCode') && $request->itemCode !== '') {
                $query->where('item_code', 'like', '%' . $request->itemCode . '%');
            }

            if ($request->has('itemName') && $request->itemName !== '') {
                $query->where('product_name', 'like', '%' . $request->itemName . '%');
            }

            if ($request->has('category') && $request->category !== '') {
                $query->where('category', 'like', '%' . $request->category . '%');
            }

            if ($request->has('supplier') && $request->supplier !== '') {
                $query->where('supplier', 'like', '%' . $request->supplier . '%');
            }

            if ($request->has('location') && $request->location !== '') {
                $query->where('store_location', 'like', '%' . $request->location . '%');
            }

            if ($request->has('lowStockAlert') && $request->lowStockAlert) {
                $query->whereColumn('minimum_stock_quantity', '>', 'opening_stock_quantity');
            }

            $products = $query->get();

            Log::info('Products fetched:', $products->toArray());

            $stockReports = $products->map(function ($product) {
                $totalSoldQuantity = SaleItem::where('product_id', $product->product_id)->sum('quantity') ?? 0;
                $actualStockQuantity = ($product->opening_stock_quantity ?? 0) - $totalSoldQuantity;
                $stockValue = $actualStockQuantity * ($product->buying_cost ?? 0);

                return [
                    'itemCode' => $product->item_code ?? 'N/A',
                    'itemName' => $product->product_name ?? 'N/A',
                    'category' => $product->category ?? 'N/A',
                    'supplier' => $product->supplier ?? 'N/A',
                    'location' => $product->store_location ?? 'N/A',
                    'stockQuantity' => $actualStockQuantity,
                    'stockValue' => $stockValue,
                ];
            });

            Log::info('Stock reports prepared:', $stockReports->toArray());

            return response()->json($stockReports, 200);

        } catch (\Exception $e) {
            Log::error('Error fetching stock report: ' . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch stock report: ' . $e->getMessage()], 500);
        }
    }
}