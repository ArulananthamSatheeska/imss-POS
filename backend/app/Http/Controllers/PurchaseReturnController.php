<?php

namespace App\Http\Controllers;

use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PurchaseReturnController extends Controller
{
    /**
     * Get all suppliers.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuppliers()
    {
        $suppliers = Supplier::select('id', 'supplier_name')->get();
        return response()->json(['data' => $suppliers], 200);
    }

    /**
     * Get all products with relevant fields.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProducts()
    {
        $products = Product::select('product_id', 'product_name', 'buying_cost', 'item_code', 'barcode')->get();
        return response()->json(['data' => $products], 200);
    }

    /**
     * Get all purchase returns with related data.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPurchaseReturns()
    {
        $purchaseReturns = PurchaseReturn::with(['supplier', 'items.product'])->get();
        $purchaseReturns->each(function ($return) {
            $return->items->each(function ($item) {
                $item->buying_cost = (float) $item->buying_cost;
            });
        });
        return response()->json(['data' => $purchaseReturns], 200);
    }

    /**
     * Get a single purchase return by ID.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $purchaseReturn = PurchaseReturn::with(['supplier', 'items.product'])->findOrFail($id);
            $purchaseReturn->items->each(function ($item) {
                $item->buying_cost = (float) $item->buying_cost;
            });
            return response()->json(['data' => $purchaseReturn], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Purchase return not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create a new purchase return.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createPurchaseReturn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.buying_cost' => 'required|numeric|min:0',
            'items.*.reason' => 'required|string|max:255',
            'refund_method' => 'required|in:cash,bank,credit',
            'remarks' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $purchaseReturn = PurchaseReturn::create([
                'invoice_number' => PurchaseReturn::generateInvoiceNumber(),
                'supplier_id' => $request->supplier_id,
                'refund_method' => $request->refund_method,
                'remarks' => $request->remarks,
                'status' => 'pending',
            ]);

            foreach ($request->items as $item) {
                $product = Product::where('product_id', $item['product_id'])->first();
                if (!$product) {
                    throw new \Exception("Product with ID {$item['product_id']} not found.");
                }
                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->product_name,
                    'quantity' => $item['quantity'],
                    'buying_cost' => $item['buying_cost'],
                    'reason' => $item['reason'],
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Purchase return created successfully',
                'data' => $purchaseReturn->load('items', 'supplier')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error creating purchase return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing purchase return.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.buying_cost' => 'required|numeric|min:0',
            'items.*.reason' => 'required|string|max:255',
            'refund_method' => 'required|in:cash,bank,credit',
            'remarks' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $purchaseReturn = PurchaseReturn::findOrFail($id);
            $purchaseReturn->update([
                'supplier_id' => $request->supplier_id,
                'refund_method' => $request->refund_method,
                'remarks' => $request->remarks,
                'status' => $request->status,
            ]);

            // Delete existing items and create new ones
            PurchaseReturnItem::where('purchase_return_id', $purchaseReturn->id)->delete();
            foreach ($request->items as $item) {
                $product = Product::where('product_id', $item['product_id'])->first();
                if (!$product) {
                    throw new \Exception("Product with ID {$item['product_id']} not found.");
                }
                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->product_name,
                    'quantity' => $item['quantity'],
                    'buying_cost' => $item['buying_cost'],
                    'reason' => $item['reason'],
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Purchase return updated successfully',
                'data' => $purchaseReturn->load('items', 'supplier')
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error updating purchase return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a purchase return.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $purchaseReturn = PurchaseReturn::findOrFail($id);
            $purchaseReturn->delete();
            return response()->json([
                'message' => 'Purchase return deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting purchase return',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}