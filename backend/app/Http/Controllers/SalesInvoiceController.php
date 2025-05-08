<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Throwable;

class SalesInvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Invoice::with('items')->latest()->paginate(15));
    }

    public function store(): JsonResponse
    {
        Log::info('Store Invoice Request Data:', request()->all());

        $validator = Validator::make(request()->all(), [
            'invoice.no' => 'nullable|string|max:255|unique:invoices,invoice_no',
            'invoice.date' => 'nullable|date',
            'invoice.time' => 'nullable|date_format:H:i',
            'customer.name' => 'nullable|string|max:255',
            'customer.address' => 'nullable|string|max:255',
            'customer.phone' => 'nullable|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'purchaseDetails.method' => 'nullable|string|in:cash,card,bank_transfer,cheque,online,credit',
            'purchaseDetails.amount' => 'nullable|numeric|min:0',
            'purchaseDetails.taxPercentage' => 'nullable|numeric|min:0|max:100',
            'items' => 'nullable|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,product_id',
            'items.*.description' => 'nullable|string|max:255',
            'items.*.qty' => 'nullable|numeric|min:0.01',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.sales_price' => 'nullable|numeric|min:0', // Added sales_price validation
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.special_discount' => 'nullable|numeric|min:0',
            'items.*.total_buying_cost' => 'nullable|numeric|min:0',
            'items.*.profit' => 'nullable|numeric|min:0', // Added profit validation
            'status' => 'nullable|string|in:pending,paid,cancelled',
            'items.*.supplier' => 'nullable|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.store_location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for invoice store:', [
                'errors' => $validator->errors(),
                'request_data' => request()->all(),
            ]);
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        Log::info('Validated Store Invoice Data:', $validatedData);

        $taxRate = isset($validatedData['purchaseDetails']['taxPercentage'])
            ? $validatedData['purchaseDetails']['taxPercentage'] / 100
            : 0;
        $calculatedSubtotal = 0;
        $itemsData = [];

        foreach ($validatedData['items'] as $itemInput) {
            // Use sales_price for calculations
            $salesPrice = isset($itemInput['sales_price']) ? $itemInput['sales_price'] : $itemInput['unit_price'];
            $itemTotal = ($itemInput['qty'] * $salesPrice) - ($itemInput['special_discount'] ?? 0);
            $calculatedSubtotal += $itemTotal;

            $buyingCost = $itemInput['total_buying_cost'] ?? 0;
            $profit = ($salesPrice - $buyingCost / ($itemInput['qty'] ?: 1)) * $itemInput['qty'];

            $itemsData[] = [
                'product_id' => $itemInput['product_id'] ?? null,
                'description' => $itemInput['description'],
                'quantity' => $itemInput['qty'],
                'unit_price' => $itemInput['unit_price'],
                'sales_price' => $salesPrice, // Store sales_price
                'discount_amount' => $itemInput['discount_amount'],
                'discount_percentage' => $itemInput['discount_percentage'] ?? 0,
                'special_discount' => $itemInput['special_discount'] ?? 0,
                'total' => $itemTotal,
                'total_buying_cost' => $itemInput['total_buying_cost'] ?? 0,
                'profit' => $profit >= 0 ? $profit : 0,
                'supplier' => $itemInput['supplier'] ?? null,
                'category' => $itemInput['category'] ?? null,
                'store_location' => $itemInput['store_location'] ?? null,
            ];
        }

        $calculatedTaxAmount = $calculatedSubtotal * $taxRate;
        $calculatedTotalAmount = $calculatedSubtotal + $calculatedTaxAmount;
        $calculatedBalance = $validatedData['purchaseDetails']['amount'] - $calculatedTotalAmount;

        DB::beginTransaction();

        try {
            $invoice = Invoice::create([
                'invoice_no' => $validatedData['invoice']['no'] ?? Invoice::generateInvoiceNumber(),
                'invoice_date' => $validatedData['invoice']['date'],
                'invoice_time' => $validatedData['invoice']['time'],
                'customer_name' => $validatedData['customer']['name'],
                'customer_address' => $validatedData['customer']['address'] ?? null,
                'customer_phone' => $validatedData['customer']['phone'] ?? null,
                'customer_email' => $validatedData['customer']['email'] ?? null,
                'payment_method' => $validatedData['purchaseDetails']['method'],
                'purchase_amount' => $validatedData['purchaseDetails']['amount'],
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $calculatedTaxAmount,
                'total_amount' => $calculatedTotalAmount,
                'balance' => $calculatedBalance,
                'status' => $validatedData['status'] ?? 'pending',
            ]);

            foreach ($itemsData as $itemData) {
                $invoice->items()->create($itemData);
            }

            DB::commit();

            $invoice->load('items');

            return response()->json([
                'message' => 'Invoice created successfully!',
                'invoice' => $invoice,
            ], 201);

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Failed to create invoice:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to create invoice: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load('items');
        return response()->json($invoice);
    }

    public function update(Invoice $invoice): JsonResponse
    {
        Log::info('Update Invoice Request Data:', request()->all());

        $validator = Validator::make(request()->all(), [
            'invoice.no' => 'nullable|string|max:255|unique:invoices,invoice_no,' . $invoice->id,
            'invoice.date' => 'required|date',
            'invoice.time' => 'required|date_format:H:i',
            'customer.name' => 'required|string|max:255',
            'customer.address' => 'nullable|string|max:255',
            'customer.phone' => 'nullable|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'purchaseDetails.method' => 'required|string|in:cash,card,bank_transfer,cheque,online,credit',
            'purchaseDetails.amount' => 'required|numeric|min:0',
            'purchaseDetails.taxPercentage' => 'nullable|numeric|min:0|max:100',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:invoice_items,id,invoice_id,' . $invoice->id,
            'items.*.product_id' => 'nullable|exists:products,product_id',
            'items.*.description' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'items.*.salesPrice' => 'required|numeric|min:0', // Added salesPrice validation
            'items.*.discountAmount' => 'required|numeric|min:0',
            'items.*.discountPercentage' => 'nullable|numeric|min:0|max:100',
            'items.*.specialDiscount' => 'required|numeric|min:0',
            'items.*.totalBuyingCost' => 'required|numeric|min:0',
            'items.*.profit' => 'nullable|numeric|min:0', // Added profit validation
            'status' => 'nullable|string|in:pending,paid,cancelled',
            'items.*.supplier' => 'nullable|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.store_location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for invoice update:', [
                'errors' => $validator->errors(),
                'request_data' => request()->all(),
                'invoice_id' => $invoice->id,
            ]);
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        Log::info('Validated Update Invoice Data:', $validatedData);

        DB::beginTransaction();
        try {
            $taxRate = isset($validatedData['purchaseDetails']['taxPercentage'])
                ? $validatedData['purchaseDetails']['taxPercentage'] / 100
                : 0;
            $calculatedSubtotal = 0;
            $itemsData = [];

            foreach ($validatedData['items'] as $itemInput) {
                // Use sales_price for calculations
                $salesPrice = isset($itemInput['sales_price']) ? $itemInput['sales_price'] : $itemInput['unit_price'];
                $itemTotal = ($itemInput['qty'] * $salesPrice) - ($itemInput['special_discount'] ?? 0);
                $calculatedSubtotal += $itemTotal;

                $buyingCost = $itemInput['total_buying_cost'] ?? 0;
                $profit = ($salesPrice - $buyingCost / ($itemInput['qty'] ?: 1)) * $itemInput['qty'];

                $itemsData[] = [
                    'id' => $itemInput['id'] ?? null,
                    'product_id' => $itemInput['product_id'] ?? null,
                    'description' => $itemInput['description'],
                    'quantity' => $itemInput['qty'],
                    'unit_price' => $itemInput['unit_price'],
                    'sales_price' => $salesPrice, // Store sales_price
                    'discount_amount' => $itemInput['discount_amount'],
                    'discount_percentage' => $itemInput['discount_percentage'] ?? 0,
                    'special_discount' => $itemInput['special_discount'] ?? 0,
                    'total' => $itemTotal,
                    'total_buying_cost' => $itemInput['total_buying_cost'] ?? 0,
                    'profit' => $profit >= 0 ? $profit : 0,
                ];
            }

            $calculatedTaxAmount = $calculatedSubtotal * $taxRate;
            $calculatedTotalAmount = $calculatedSubtotal + $calculatedTaxAmount;
            $calculatedBalance = $validatedData['purchaseDetails']['amount'] - $calculatedTotalAmount;

            $invoice->update([
                'invoice_no' => $validatedData['invoice']['no'] ?? $invoice->invoice_no,
                'invoice_date' => $validatedData['invoice']['date'],
                'invoice_time' => $validatedData['invoice']['time'],
                'customer_name' => $validatedData['customer']['name'],
                'customer_address' => $validatedData['customer']['address'] ?? null,
                'customer_phone' => $validatedData['customer']['phone'] ?? null,
                'customer_email' => $validatedData['customer']['email'] ?? null,
                'payment_method' => $validatedData['purchaseDetails']['method'],
                'purchase_amount' => $validatedData['purchaseDetails']['amount'],
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $calculatedTaxAmount,
                'total_amount' => $calculatedTotalAmount,
                'balance' => $calculatedBalance,
                'status' => $validatedData['status'] ?? $invoice->status,
            ]);

            $newItemIds = [];
            foreach ($itemsData as $itemData) {
                $itemId = $itemData['id'] ?? null;
                if ($itemId && $existingItem = $invoice->items()->find($itemId)) {
                    $existingItem->update($itemData);
                    $newItemIds[] = $itemId;
                } else {
                    $newItem = $invoice->items()->create($itemData);
                    $newItemIds[] = $newItem->id;
                }
            }

            $existingItemIds = $invoice->items->pluck('id')->toArray();
            $itemsToDelete = array_diff($existingItemIds, $newItemIds);
            if ($itemsToDelete) {
                $invoice->items()->whereIn('id', $itemsToDelete)->delete();
            }

            DB::commit();
            $invoice->load('items');

            return response()->json([
                'message' => 'Invoice updated successfully!',
                'invoice' => $invoice,
            ], 200);

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Failed to update invoice:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => request()->all(),
                'invoice_id' => $invoice->id,
            ]);
            return response()->json([
                'message' => 'Failed to update invoice.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        DB::beginTransaction();
        try {
            $invoice->delete();
            DB::commit();
            return response()->json(['message' => 'Invoice deleted successfully.'], 200);
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Failed to delete invoice:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'message' => 'Failed to delete invoice: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getBillWiseProfitReport(Request $request)
    {
        try {
            \Log::info('getBillWiseProfitReport called with paymentMethod: ' . $request->input('paymentMethod'));
            $query = Invoice::with('items')
                ->select('id', 'invoice_no', 'invoice_date', 'customer_name', 'payment_method');

            // Apply date filter
            if ($request->has('fromDate') && $request->has('toDate')) {
                $query->whereBetween('invoice_date', [
                    $request->input('fromDate') . ' 00:00:00',
                    $request->input('toDate') . ' 23:59:59'
                ]);
            }

            // Apply payment method filter
            if ($request->has('paymentMethod') && $request->input('paymentMethod') !== '' && $request->input('paymentMethod') !== 'all') {
                $query->where('payment_method', $request->input('paymentMethod'));
            }

            \Log::info('Generated SQL query: ' . $query->toSql());

            $invoices = $query->get();

            $reportData = [];
            $totalCostPriceAll = 0;
            $totalSellingPriceAll = 0;
            $totalProfitAll = 0;

            foreach ($invoices as $invoice) {
                $totalCostPrice = 0;
                $totalSellingPrice = 0;
                $items = [];

                foreach ($invoice->items as $item) {
                    $costPrice = $item->total_buying_cost ?? 0;
                    $sellingPrice = $item->sales_price * $item->quantity;
                    $profit = $sellingPrice - $costPrice;
                    $profitPercentage = ($sellingPrice > 0) ? ($profit / $sellingPrice) * 100 : 0;

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
                $profitPercentage = ($totalSellingPrice > 0) ? ($totalProfit / $totalSellingPrice) * 100 : 0;

                $reportData[] = [
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
            \Log::error('Error in getBillWiseProfitReport (Invoice): ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch invoice report.'], 500);
        }
    }

    public function getDailyProfitReport(Request $request)
    {
        try {
            $date = $request->input('date', now()->format('Y-m-d'));
            $invoices = Invoice::with('items.product')
                ->whereDate('invoice_date', $date)
                ->get();

            $reportData = [];
            $totalCost = 0;
            $totalSales = 0;
            $totalProfit = 0;

            foreach ($invoices as $invoice) {
                foreach ($invoice->items as $item) {
                    $product = $item->product;
                    $productName = $product ? $product->product_name : ($item->description ?? 'Unknown Product');
                    $costPrice = $product ? $product->buying_cost * $item->quantity : 0;
                    $sellingPrice = $item->sales_price * $item->quantity;
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
            Log::error('Error in getDailyProfitReport (Invoice): ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch report.'], 500);
        }
    }
}
