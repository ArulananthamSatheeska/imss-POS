<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class SalesInvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Invoice::with('items')->latest()->paginate(15));
    }

    public function store(): JsonResponse
    {
        // Validate the incoming request
        $validator = Validator::make(request()->all(), [
            'invoice.no' => 'required|string|max:255',
            'invoice.date' => 'required|date',
            'invoice.time' => 'required|date_format:H:i',
            'customer.name' => 'required|string|max:255',
            'customer.address' => 'nullable|string|max:255',
            'customer.phone' => 'nullable|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'purchaseDetails.method' => 'required|string|in:cash,card,bank_transfer', // Adjust payment methods as needed
            'purchaseDetails.amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'items.*.discountAmount' => 'required|numeric|min:0',
            'items.*.discountPercentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|in:pending,paid,cancelled', // Adjust status options as needed
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();

        $taxRate = 0.10;
        $calculatedSubtotal = 0;
        $itemsData = [];

        foreach ($validatedData['items'] as $itemInput) {
            $itemTotal = ($itemInput['qty'] * $itemInput['unitPrice']) - $itemInput['discountAmount'];
            $calculatedSubtotal += $itemTotal;

            $itemsData[] = [
                'description' => $itemInput['description'],
                'quantity' => $itemInput['qty'],
                'unit_price' => $itemInput['unitPrice'],
                'discount_amount' => $itemInput['discountAmount'],
                'discount_percentage' => $itemInput['discountPercentage'] ?? 0,
                'total' => $itemTotal,
            ];
        }

        $calculatedTaxAmount = $calculatedSubtotal * $taxRate;
        $calculatedTotalAmount = $calculatedSubtotal + $calculatedTaxAmount;
        $calculatedBalance = $validatedData['purchaseDetails']['amount'] - $calculatedTotalAmount;

        DB::beginTransaction();

        try {
            $invoice = Invoice::create([
                'invoice_no' => $validatedData['invoice']['no'],
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

            $invoice->items()->createMany($itemsData);

            DB::commit();

            $invoice->load('items');

            return response()->json([
                'message' => 'Invoice created successfully!',
                'invoice' => $invoice,
            ], 201);

        } catch (Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'Failed to create invoice. Please try again.',
                'error' => $e->getMessage(),
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
        // Validate the incoming request
        $validator = Validator::make(request()->all(), [
            'invoice.no' => 'required|string|max:255',
            'invoice.date' => 'required|date',
            'invoice.time' => 'required|date_format:H:i',
            'customer.name' => 'required|string|max:255',
            'customer.address' => 'nullable|string|max:255',
            'customer.phone' => 'nullable|string|max:20',
            'customer.email' => 'nullable|email|max:255',
            'purchaseDetails.method' => 'required|string|in:cash,card,bank_transfer', // Adjust payment methods as needed
            'purchaseDetails.amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'items.*.discountAmount' => 'required|numeric|min:0',
            'items.*.discountPercentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|string|in:pending,paid,cancelled', // Adjust status options as needed
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validatedData = $validator->validated();

        $taxRate = 0.10;
        $calculatedSubtotal = 0;
        $itemsData = [];

        foreach ($validatedData['items'] as $itemInput) {
            $qty = $itemInput['qty'] ?? 0;
            $unitPrice = $itemInput['unitPrice'] ?? 0;
            $discountAmount = $itemInput['discountAmount'] ?? 0;

            $itemTotal = ($qty * $unitPrice) - $discountAmount;
            $calculatedSubtotal += $itemTotal;

            $itemsData[] = [
                'description' => $itemInput['description'],
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'discount_amount' => $discountAmount,
                'discount_percentage' => $itemInput['discountPercentage'] ?? 0,
                'total' => $itemTotal,
            ];
        }

        $calculatedTaxAmount = $calculatedSubtotal * $taxRate;
        $calculatedTotalAmount = $calculatedSubtotal + $calculatedTaxAmount;
        $purchaseAmount = $validatedData['purchaseDetails']['amount'] ?? 0;
        $calculatedBalance = $purchaseAmount - $calculatedTotalAmount;

        DB::beginTransaction();

        try {
            $invoice->update([
                'invoice_no' => $validatedData['invoice']['no'],
                'invoice_date' => $validatedData['invoice']['date'],
                'invoice_time' => $validatedData['invoice']['time'],
                'customer_name' => $validatedData['customer']['name'],
                'customer_address' => $validatedData['customer']['address'] ?? null,
                'customer_phone' => $validatedData['customer']['phone'] ?? null,
                'customer_email' => $validatedData['customer']['email'] ?? null,
                'payment_method' => $validatedData['purchaseDetails']['method'] ?? 'unknown',
                'purchase_amount' => $purchaseAmount,
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $calculatedTaxAmount,
                'total_amount' => $calculatedTotalAmount,
                'balance' => $calculatedBalance,
                'status' => $validatedData['status'] ?? $invoice->status,
            ]);

            // Delete existing items and recreate
            $invoice->items()->delete();
            $invoice->items()->createMany($itemsData);

            DB::commit();

            $invoice->load('items');

            return response()->json([
                'message' => 'Invoice updated successfully!',
                'invoice' => $invoice,
            ], 200);

        } catch (Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'Failed to update invoice. Please try again.',
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
            report($e);
            return response()->json([
                'message' => 'Failed to delete invoice.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}