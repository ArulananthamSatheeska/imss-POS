<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Purchase::with(['supplier', 'store', 'items']);
            if ($request->has('fromDate') && $request->has('toDate')) {
                $query->whereBetween('date_of_purchase', [$request->fromDate, $request->toDate]);
            }
            $purchases = $query->get();
            return response()->json(['success' => true, 'data' => $purchases], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching purchases: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error fetching purchases'], 500);
        }
    }

    public function store(Request $request)
    {
        Log::info('Creating new purchase:', $request->all());

        try {
            $validatedData = $request->validate($this->validationRules());

            DB::beginTransaction();

            $purchase = Purchase::create([
                'bill_number' => $validatedData['bill_number'],
                'invoice_number' => $validatedData['invoice_number'],
                'date_of_purchase' => $validatedData['date_of_purchase'],
                'payment_method' => $validatedData['payment_method'],
                'supplier_id' => $validatedData['supplier_id'],
                'store_id' => $validatedData['store_id'],
                'paid_amount' => $validatedData['paid_amount'],
                'discount_percentage' => $validatedData['discount_percentage'],
                'discount_amount' => $validatedData['discount_amount'],
                'tax' => $validatedData['tax'],
                'status' => $validatedData['status'],
                'total' => $validatedData['total'],
            ]);

            foreach ($validatedData['items'] as $item) {
                $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'free_items' => $item['free_items'] ?? 0,
                    'buying_cost' => $item['buying_cost'],
                    'discount_percentage' => $item['discount_percentage'] ?? 0,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Purchase created successfully',
                'data' => $purchase->load(['supplier', 'store', 'items']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::warning('Validation error creating purchase:', ['errors' => $e->errors()]);
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating purchase: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error creating purchase', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        Log::info("Updating purchase ID: $id", $request->all());

        try {
            $validatedData = $request->validate($this->validationRules());

            DB::beginTransaction();

            $purchase = Purchase::findOrFail($id);

            $purchase->update([
                'bill_number' => $validatedData['bill_number'],
                'invoice_number' => $validatedData['invoice_number'],
                'date_of_purchase' => $validatedData['date_of_purchase'],
                'payment_method' => $validatedData['payment_method'],
                'supplier_id' => $validatedData['supplier_id'],
                'store_id' => $validatedData['store_id'],
                'paid_amount' => $validatedData['paid_amount'],
                'discount_percentage' => $validatedData['discount_percentage'],
                'discount_amount' => $validatedData['discount_amount'],
                'tax' => $validatedData['tax'],
                'status' => $validatedData['status'],
                'total' => $validatedData['total'],
            ]);

            $purchase->items()->delete();

            foreach ($validatedData['items'] as $item) {
                $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'free_items' => $item['free_items'] ?? 0,
                    'buying_cost' => $item['buying_cost'],
                    'discount_percentage' => $item['discount_percentage'] ?? 0,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Purchase updated successfully',
                'data' => $purchase->load(['supplier', 'store', 'items']),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::warning('Validation error updating purchase:', ['errors' => $e->errors()]);
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating purchase: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error updating purchase', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $purchase = Purchase::with(['supplier', 'store', 'items'])->findOrFail($id);
            return response()->json(['success' => true, 'data' => $purchase], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching purchase: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Purchase not found'], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $purchase = Purchase::findOrFail($id);

            DB::beginTransaction();

            $purchase->items()->delete();
            $purchase->delete();

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Purchase deleted successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting purchase: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error deleting purchase', 'error' => $e->getMessage()], 500);
        }
    }

    private function validationRules()
    {
        return [
            'bill_number' => 'required|string|max:255',
            'invoice_number' => 'required|string|max:255',
            'date_of_purchase' => 'required|date',
            'payment_method' => 'required|string|in:Cash,Credit,Other',
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'required|exists:store_locations,id',
            'paid_amount' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,paid,cancelled',
            'total' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.free_items' => 'nullable|integer|min:0',
            'items.*.buying_cost' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ];
    }
}