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
        Log::info('Store Invoice Request Data:', request()->all());

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
            $taxRate = isset($validatedData['purchaseDetails']['tax_percentage'])
                ? $validatedData['purchaseDetails']['tax_percentage'] / 100
                : 0;
            $calculatedSubtotal = 0;
            $itemsData = [];

            foreach ($validatedData['items'] as $itemInput) {
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
}