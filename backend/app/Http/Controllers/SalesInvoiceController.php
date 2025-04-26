<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest; // Import the Form Request
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB; // Import DB Facade for transactions
use Throwable; // Import Throwable for catching exceptions

class SalesInvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     * You might implement this later to view invoices.
     */
    public function index(): JsonResponse
    {
        // Example: Return paginated invoices
        return response()->json(Invoice::with('items')->latest()->paginate(15));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        // --- Server-side Calculations ---
        $taxRate = 0.10; // 10% Tax Rate - Move to config or settings table if dynamic
        $calculatedSubtotal = 0;
        $itemsData = [];

        foreach ($validatedData['items'] as $itemInput) {
            $itemTotal = ($itemInput['qty'] * $itemInput['unitPrice']) - $itemInput['discountAmount'];
            $calculatedSubtotal += $itemTotal;

            // Prepare item data for saving, ensuring correct total
            $itemsData[] = [
                'description' => $itemInput['description'],
                'quantity' => $itemInput['qty'],
                'unit_price' => $itemInput['unitPrice'],
                'discount_amount' => $itemInput['discountAmount'],
                'discount_percentage' => $itemInput['discountPercentage'],
                'total' => $itemTotal, // Use server-calculated total
            ];
        }

        $calculatedTaxAmount = $calculatedSubtotal * $taxRate;
        $calculatedTotalAmount = $calculatedSubtotal + $calculatedTaxAmount;
        $calculatedBalance = $validatedData['purchaseDetails']['amount'] - $calculatedTotalAmount;
        // --- End Server-side Calculations ---


        DB::beginTransaction(); // Start Transaction

        try {
            // Create the Invoice record
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

            // Create Invoice Items associated with the Invoice
            // Use createMany for efficiency if itemsData has correct structure
            $invoice->items()->createMany($itemsData);

            DB::commit(); // Commit Transaction

            // Eager load items for the response
            $invoice->load('items');

            return response()->json([
                'message' => 'Invoice created successfully!',
                'invoice' => $invoice // Return the created invoice data
            ], 201); // 201 Created status

        } catch (Throwable $e) { // Catch any error during DB operations
            DB::rollBack(); // Rollback Transaction on error

            // Log the error for debugging
            report($e); // Or use Log::error($e->getMessage());

            return response()->json([
                'message' => 'Failed to create invoice. Please try again.',
                'error' => $e->getMessage() // Optionally include error in dev environment
            ], 500); // Internal Server Error
        }
    }

    /**
     * Display the specified resource.
     * You might implement this later.
     */
    public function show(Invoice $invoice): JsonResponse
    {
         // Load items when showing a single invoice
        $invoice->load('items');
        return response()->json($invoice);
    }

    /**
     * Update the specified resource in storage.
     * You might implement this later.
     */
    public function update(StoreInvoiceRequest $request, Invoice $invoice): JsonResponse // Reuse validation maybe? Or create UpdateInvoiceRequest
    {
        // Similar logic to store, but find existing invoice and items
        // Be careful with updating items (delete old/add new? update existing?)
        // Recalculate totals
         return response()->json(['message' => 'Update not implemented yet.'], 501);
    }

    /**
     * Remove the specified resource from storage.
     * You might implement this later.
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Items will be deleted automatically due to cascade on delete
            $invoice->delete();
            DB::commit();
             return response()->json(['message' => 'Invoice deleted successfully.'], 200);
        } catch(Throwable $e) {
             DB::rollBack();
             report($e);
             return response()->json(['message' => 'Failed to delete invoice.'], 500);
        }
    }
}