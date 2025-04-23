<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\SaleItem;
use Illuminate\Support\Facades\Log;

class StockReportController extends Controller
{
    // Method to get item-wise stock report
    public function index(Request $request)
    {
        Log::info('Fetching item-wise stock report with filters:', $request->all());

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

            if ($request->has('lowStockAlert') && $request->lowStockAlert) {
                $query->whereColumn('minimum_stock_quantity', '>', 'opening_stock_quantity');
            }

            // Fetch products
            $products = $query->get();

            Log::info('Products fetched:', $products->toArray());

            // Prepare the stock report data
            $stockReports = $products->map(function ($product) {
                // Calculate total sold quantity for the product
                $totalSoldQuantity = SaleItem::where('product_id', $product->product_id)->sum('quantity');

                // Calculate actual stock quantity
                $actualStockQuantity = $product->opening_stock_quantity - $totalSoldQuantity;

                // Calculate stock value
                $stockValue = $actualStockQuantity * $product->buying_cost;

                // Return stock report data with fallback values for null fields
                return [
                    'itemCode' => $product->item_code ?? 'N/A', // Handle null item_code
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
            Log::error('Error fetching stock report: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch stock report.'], 500);
        }
    }

    // Method to get detailed stock report
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

        // Prepare the detailed stock report data
        $stockReports = $products->map(function ($product) {
            // Calculate total sold quantity for the product
            $totalSoldQuantity = SaleItem::where('product_id', $product->product_id)->sum('quantity');

            // Calculate actual stock quantity (closing stock)
            $closingStock = $product->opening_stock_quantity - $totalSoldQuantity;

            // Calculate total purchase value (cost)
            $totalPurchaseValue = $product->opening_stock_quantity * $product->buying_cost;

            // Calculate total sales value (selling price)
            $totalSalesValue = $product->opening_stock_quantity * $product->sales_price;

            // Return detailed stock report data with fallback values for null fields
            return [
                'itemCode' => $product->item_code ?? 'N/A', // Handle null item_code
                'itemName' => $product->product_name ?? 'N/A',
                'category' => $product->category ?? 'N/A',
                'unit' => $product->unit_type ?? 'N/A', // Handle null unit_type
                'openingStock' => $product->opening_stock_quantity ?? 0,
                'purchased' => 0, // Assuming no purchased quantity for now
                'sold' => $totalSoldQuantity,
                'adjusted' => 0, // Assuming no adjustments for now
                'closingStock' => $closingStock,
                'costPrice' => $product->buying_cost ?? 0,
                'sellingPrice' => $product->sales_price ?? 0,
                'totalPurchaseValue' => $totalPurchaseValue,
                'totalSalesValue' => $totalSalesValue,
            ];
        });

        Log::info('Detailed stock reports prepared:', $stockReports->toArray());

        return response()->json($stockReports, 200);

    } catch (\Exception $e) {
        Log::error('Error fetching detailed stock report: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch detailed stock report.'], 500);
    }
}
}