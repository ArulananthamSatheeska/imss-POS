<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\OrderItem;
use App\Http\Resources\PurchaseOrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PurchaseOrderController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $purchaseOrders = PurchaseOrder::with(['orderItems.product', 'supplier'])->get();
            return PurchaseOrderResource::collection($purchaseOrders);
        } catch (\Exception $e) {
            Log::error('Error fetching purchase orders: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch purchase orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'supplierId' => 'required|exists:suppliers,id',
                'contactName' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:255',
                'items' => 'required|array|min:1',
                'items.*.productId' => 'required|exists:products,id',
                'items.*.description' => 'required|string|max:255',
                'items.*.qty' => 'required|integer|min:1',
                'items.*.unitPrice' => 'required|numeric|min:0',
                'items.*.total' => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => (int) $validated['supplierId'], // Cast to integer
                'contact_name' => $validated['contactName'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'total' => collect($validated['items'])->sum('total'),
            ]);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['productId'],
                    'description' => $item['description'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unitPrice'],
                    'total' => $item['total'],
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order created successfully',
                'purchaseOrder' => $purchaseOrder->load(['orderItems', 'supplier']),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating purchase order: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to create purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $purchaseOrder = PurchaseOrder::with(['orderItems.product', 'supplier'])->findOrFail($id);
            return new PurchaseOrderResource($purchaseOrder);
        } catch (\Exception $e) {
            Log::error('Error fetching purchase order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'supplierId' => 'required|exists:suppliers,id',
                'contactName' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:255',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string|max:255',
                'items.*.qty' => 'required|integer|min:1',
                'items.*.unitPrice' => 'required|numeric|min:0',
                'items.*.total' => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            $purchaseOrder = PurchaseOrder::findOrFail($id);
            $purchaseOrder->update([
                'supplier_id' => (int) $validated['supplierId'], // Cast to integer
                'contact_name' => $validated['contactName'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'total' => collect($validated['items'])->sum('total'),
            ]);

            $purchaseOrder->orderItems()->delete();

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['productId'],
                    'description' => $item['description'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unitPrice'],
                    'total' => $item['total'],
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order updated successfully',
                'purchaseOrder' => $purchaseOrder->load(['orderItems', 'supplier']),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating purchase order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $purchaseOrder = PurchaseOrder::findOrFail($id);
            $purchaseOrder->orderItems()->delete();
            $purchaseOrder->delete();

            return response()->json([
                'message' => 'Purchase order deleted successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting purchase order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}