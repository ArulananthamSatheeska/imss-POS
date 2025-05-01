<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Product;
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
        // Log the incoming request for debugging
        Log::info('Store Invoice Request Data:', request()->all());

        // Validate the incoming request
        $validator = Validator::make(request()->all(), [
            'invoice.no' => 'nullable|string|max:255|unique:invoices,invoice_no',
            'invoice.date' => 'required|date',
            'invoice.time' => 'required|date_format:H:i',
            'customer.name' => 'required|string|max:255',
            'customer.address' => 'nullable|string|max:255',
            'customer.phone' => 'nullable|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'purchaseDetails.method' => 'required|string|in:cash,card,bank_transfer,cheque,online',
            'purchaseDetails.amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,product_id',
            'items.*.description' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'items.*.discountAmount' => 'required|numeric|min:0',
            'items.*.discountPercentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|in:pending,paid,cancelled',
            'items.*.totalBuyingCost' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();
        Log::info('Validated Store Invoice Data:', $validatedData);

        $taxRate = isset($validatedData['purchaseDetails']['tax_percentage'])
            ? $validatedData['purchaseDetails']['tax_percentage'] / 100
            : 0;
        $calculatedSubtotal = 0;
        $itemsData = [];

        // Validate stock availability
        foreach ($validatedData['items'] as $itemInput) {
            if ($itemInput['product_id']) {
                $product = Product::find($itemInput['product_id']);
                if (!$product) {
                    return response()->json([
                        'message' => "Product ID {$itemInput['product_id']} not found.",
                    ], 404);
                }
                if ($product->opening_stock_quantity < $itemInput['qty']) {
                    return response()->json([
                        'message' => "Insufficient stock for product: {$product->product_name}. Available: {$product->opening_stock_quantity}, Requested: {$itemInput['qty']}.",
                    ], 422);
                }
            }
        }

        foreach ($validatedData['items'] as $itemInput) {
            $itemTotal = ($itemInput['qty'] * $itemInput['unitPrice']) - $itemInput['discountAmount'];
            $calculatedSubtotal += $itemTotal;

            $itemsData[] = [
                'product_id' => $itemInput['product_id'] ?? null,
                'description' => $itemInput['description'],
                'quantity' => $itemInput['qty'],
                'unit_price' => $itemInput['unitPrice'],
                'discount_amount' => $itemInput['discountAmount'],
                'discount_percentage' => $itemInput['discountPercentage'] ?? 0,
                'total' => $itemTotal,
                'total_buying_cost' => $itemInput['totalBuyingCost'] ?? 0, 
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

            // Create invoice items and update product stock
            foreach ($itemsData as $itemData) {
                $invoice->items()->create($itemData);
                if ($itemData['product_id']) {
                    $product = Product::lockForUpdate()->find($itemData['product_id']);
                    if ($product) {
                        $product->opening_stock_quantity -= $itemData['quantity'];
                        $product->save();
                    }
                }
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
            'purchaseDetails.method' => 'required|string|in:cash,card,bank_transfer,cheque,online',
            'purchaseDetails.amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:invoice_items,id,invoice_id,' . $invoice->id,
            'items.*.product_id' => 'nullable|exists:products,product_id',
            'items.*.description' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'items.*.discountAmount' => 'required|numeric|min:0',
            'items.*.discountPercentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|in:pending,paid,cancelled',
            'purchaseDetails.taxPercentage' => 'nullable|numeric|min:0|max:100',
            'items.*.totalBuyingCost' => 'required|numeric|min:0',
            
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
            // Restore stock for existing items
            foreach ($invoice->items as $existingItem) {
                if ($existingItem->product_id) {
                    $product = Product::lockForUpdate()->find($existingItem->product_id);
                    if (!$product) {
                        DB::rollBack();
                        Log::error("Product ID {$existingItem->product_id} not found during stock restoration.");
                        return response()->json([
                            'message' => "Cannot restore stock: Product ID {$existingItem->product_id} not found.",
                        ], 404);
                    }
                    $product->opening_stock_quantity += $existingItem->quantity;
                    $product->save();
                }
            }

            $taxRate = isset($validatedData['purchaseDetails']['tax_percentage'])
                ? $validatedData['purchaseDetails']['tax_percentage'] / 100
                : 0;
            $calculatedSubtotal = 0;
            $itemsData = [];

            // Validate stock availability for new items
            foreach ($validatedData['items'] as $itemInput) {
                if ($itemInput['product_id']) {
                    $product = Product::find($itemInput['product_id']);
                    if (!$product) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Product ID {$itemInput['product_id']} not found.",
                        ], 404);
                    }
                    if ($product->opening_stock_quantity < $itemInput['qty']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Insufficient stock for product: {$product->product_name}. Available: {$product->opening_stock_quantity}, Requested: {$itemInput['qty']}.",
                        ], 422);
                    }
                }
                $itemTotal = ($itemInput['qty'] * $itemInput['unitPrice']) - $itemInput['discountAmount'];
                $calculatedSubtotal += $itemTotal;

                $itemsData[] = [
                    'id' => $itemInput['id'] ?? null,
                    'product_id' => $itemInput['product_id'] ?? null,
                    'description' => $itemInput['description'],
                    'quantity' => $itemInput['qty'],
                    'unit_price' => $itemInput['unitPrice'],
                    'discount_amount' => $itemInput['discountAmount'],
                    'discount_percentage' => $itemInput['discountPercentage'] ?? 0,
                    'total' => $itemTotal,
                    'total_buying_cost' => $itemInput['totalBuyingCost'] ?? 0,
                ];
            }

            $calculatedTaxAmount = $calculatedSubtotal * $taxRate;
            $calculatedTotalAmount = $calculatedSubtotal + $calculatedTaxAmount;
            $calculatedBalance = $validatedData['purchaseDetails']['amount'] - $calculatedTotalAmount;

            // Update invoice
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

            // Update or create items
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

                // Update product stock
                if ($itemData['product_id']) {
                    $product = Product::lockForUpdate()->find($itemData['product_id']);
                    if ($product) {
                        $product->opening_stock_quantity -= $itemData['quantity'];
                        $product->save();
                    }
                }
            }

            // Delete items that are no longer in the request
            $existingItemIds = $invoice->items->pluck('id')->toArray();
            $itemsToDelete = array_diff($existingItemIds, $newItemIds);
            if ($itemsToDelete) {
                foreach ($itemsToDelete as $itemId) {
                    $item = $invoice->items()->find($itemId);
                    if ($item && $item->product_id) {
                        $product = Product::lockForUpdate()->find($item->product_id);
                        if ($product) {
                            $product->opening_stock_quantity += $item->quantity;
                            $product->save();
                        }
                    }
                }
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
            // Restore stock for all items
            foreach ($invoice->items as $item) {
                if ($item->product_id) {
                    $product = Product::lockForUpdate()->find($item->product_id);
                    if ($product) {
                        $product->opening_stock_quantity += $item->quantity;
                        $product->save();
                    }
                }
            }
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

}