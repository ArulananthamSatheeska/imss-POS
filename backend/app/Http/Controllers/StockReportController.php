<?php

namespace App\Http\Controllers;

use App\Models\InvoiceItem;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\SaleItem;
use Illuminate\Http\Request;
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

            // Determine the shop's first day (earliest purchase date)
            $firstPurchaseDate = DB::table('purchases')
                ->select(DB::raw('MIN(date_of_purchase) as first_date'))
                ->value('first_date');

            $firstPurchaseDate = $firstPurchaseDate ? substr($firstPurchaseDate, 0, 10) : null;

            // Prepare the detailed stock report data
            $stockReports = $products->map(function ($product) use ($fromDate, $toDate, $firstPurchaseDate) {
                // Calculate total sold quantity within the date range (InvoiceItem + SaleItem)
                $invoiceSaleQuery = InvoiceItem::where('product_id', $product->product_id)
                    ->whereHas('invoice', function ($q) use ($fromDate, $toDate) {
                        if ($fromDate && $toDate) {
                            $q->whereBetween('invoice_date', [$fromDate, $toDate]);
                        }
                    });
                $invoiceSoldQuantity = $invoiceSaleQuery->sum('quantity') ?? 0;

                $posSaleQuery = SaleItem::where('product_id', $product->product_id)
                    ->whereHas('sale', function ($q) use ($fromDate, $toDate) {
                        if ($fromDate && $toDate) {
                            $q->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);
                        }
                    });
                $posSoldQuantity = $posSaleQuery->sum('quantity') ?? 0;

                $totalSoldQuantity = $invoiceSoldQuantity + $posSoldQuantity;
                Log::debug('Total sold quantity for product ID ' . $product->product_id . ': ' . $totalSoldQuantity . ' (Invoice: ' . $invoiceSoldQuantity . ', POS: ' . $posSoldQuantity . ')');

                // Calculate total purchased quantity within the date range
                $purchaseQuery = PurchaseItem::where('product_id', $product->product_id)
                    ->whereHas('purchase', function ($q) use ($fromDate, $toDate) {
                        if ($fromDate && $toDate) {
                            $q->whereBetween('date_of_purchase', [$fromDate, $toDate]);
                        }
                    });
                $totalPurchasedQuantity = $purchaseQuery->sum('quantity') ?? 0;
                Log::debug('Total purchased quantity for product ID ' . $product->product_id . ': ' . $totalPurchasedQuantity);

                // Determine opening stock
                $openingStock = $product->opening_stock_quantity ?? 0;

                if ($fromDate && $firstPurchaseDate && $fromDate !== $firstPurchaseDate) {
                    // For subsequent days, calculate opening stock as previous day's closing stock
                    $previousDay = date('Y-m-d', strtotime($fromDate . ' -1 day'));

                    // Calculate total sold quantity up to the previous day (InvoiceItem + SaleItem)
                    $prevInvoiceSaleQuery = InvoiceItem::where('product_id', $product->product_id)
                        ->whereHas('invoice', function ($q) use ($previousDay) {
                            $q->where('invoice_date', '<=', $previousDay);
                        });
                    $totalInvoiceSoldPrev = $prevInvoiceSaleQuery->sum('quantity') ?? 0;

                    $prevPosSaleQuery = SaleItem::where('product_id', $product->product_id)
                        ->whereHas('sale', function ($q) use ($previousDay) {
                            $q->where('created_at', '<=', $previousDay . ' 23:59:59');
                        });
                    $totalPosSoldPrev = $prevPosSaleQuery->sum('quantity') ?? 0;

                    $totalSoldPrev = $totalInvoiceSoldPrev + $totalPosSoldPrev;

                    // Calculate total purchased quantity up to the previous day
                    $prevPurchaseQuery = PurchaseItem::where('product_id', $product->product_id)
                        ->whereHas('purchase', function ($q) use ($previousDay) {
                            $q->where('date_of_purchase', '<=', $previousDay);
                        });
                    $totalPurchasedPrev = $prevPurchaseQuery->sum('quantity') ?? 0;

                    // Previous day's closing stock = initial opening stock + total purchased - total sold
                    $openingStock = ($product->opening_stock_quantity ?? 0) + $totalPurchasedPrev - $totalSoldPrev;
                }

                // Calculate closing stock
                $closingStock = $openingStock + $totalPurchasedQuantity - $totalSoldQuantity;

                // Calculate total purchase value (cost)
                $buyingCost = $product->buying_cost ?? 0;
                $totalPurchaseValue = $closingStock * $buyingCost;

                // Calculate total sales value (selling price)
                $sellingPrice = $product->sales_price ?? 0;
                $totalSalesValue = $closingStock * $sellingPrice;

                // Parse location
                $locationParts = explode(' ', $product->store_location ?? 'Unknown N/A', 2);
                $locationType = $locationParts[0] ?? 'Unknown';
                $locationIdentifier = $locationParts[1] ?? 'N/A';

                return [
                    'itemCode' => $product->item_code ?? 'N/A',
                    'itemName' => $product->product_name ?? 'N/A',
                    'category' => $product->category ?? 'N/A',
                    'unit' => $product->unit_type ?? 'N/A',
                    'initialOpeningStock' => $product->opening_stock_quantity ?? 0,
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

            $stockReports = $products->map(function ($product) use ($request) {
                // Calculate total sold quantity (InvoiceItem + SaleItem) with optional date filter
                $invoiceSaleQuery = InvoiceItem::where('product_id', $product->product_id);
                $posSaleQuery = SaleItem::where('product_id', $product->product_id);

                if ($request->has('fromDate') && $request->has('toDate')) {
                    $fromDate = $request->input('fromDate');
                    $toDate = $request->input('toDate');
                    $invoiceSaleQuery->whereHas('invoice', function ($q) use ($fromDate, $toDate) {
                        $q->whereBetween('invoice_date', [$fromDate, $toDate]);
                    });
                    $posSaleQuery->whereHas('sale', function ($q) use ($fromDate, $toDate) {
                        $q->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);
                    });
                }

                $totalInvoiceSold = $invoiceSaleQuery->sum('quantity') ?? 0;
                $totalPosSold = $posSaleQuery->sum('quantity') ?? 0;
                $totalSoldQuantity = $totalInvoiceSold + $totalPosSold;

                // Calculate total purchased quantity with optional date filter
                $purchaseQuery = PurchaseItem::where('product_id', $product->product_id);
                if ($request->has('fromDate') && $request->has('toDate')) {
                    $purchaseQuery->whereHas('purchase', function ($q) use ($fromDate, $toDate) {
                        $q->whereBetween('date_of_purchase', [$fromDate, $toDate]);
                    });
                }
                $totalPurchasedQuantity = $purchaseQuery->sum('quantity') ?? 0;

                // Calculate stock quantity
                $actualStockQuantity = ($product->opening_stock_quantity ?? 0) + $totalPurchasedQuantity - $totalSoldQuantity;
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