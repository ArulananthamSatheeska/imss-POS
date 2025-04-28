<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PurchaseController extends Controller
{
    public function index()
    {
        try {
            $purchases = Purchase::with(['supplier', 'store', 'items.product'])->get();
            $data = $purchases->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'date_of_purchase' => $purchase->date_of_purchase,
                    'bill_number' => $purchase->bill_number,
                    'invoice_number' => $purchase->invoice_number,
                    'payment_method' => $purchase->payment_method,
                    'supplier_id' => $purchase->supplier_id,
                    'supplier' => [
                        'id' => $purchase->supplier->id,
                        'supplier_name' => $purchase->supplier->supplier_name,
                    ],
                    'store_id' => $purchase->store_id,
                    'store' => [
                        'id' => $purchase->store->id,
                        'store_name' => $purchase->store->store_name,
                    ],
                    'total' => $purchase->total,
                    'paid_amount' => $purchase->paid_amount,
                    'discount_percentage' => $purchase->discount_percentage,
                    'discount_amount' => $purchase->discount_amount,
                    'tax' => $purchase->tax,
                    'status' => $purchase->status,
                    'items' => $purchase->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'purchase_id' => $item->purchase_id,
                            'product_id' => $item->product_id,
                            'product' => [
                                'product_id' => $item->product->product_id,
                                'product_name' => $item->product->product_name,
                            ],
                            'quantity' => $item->quantity,
                            'free_items' => $item->free_items,
                            'buying_cost' => $item->buying_cost,
                            'created_at' => $item->created_at,
                            'updated_at' => $item->updated_at,
                        ];
                    }),
                    'created_at' => $purchase->created_at,
                    'updated_at' => $purchase->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching purchases: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date_of_purchase' => 'required|date',
            'bill_number' => 'required|string|unique:purchases,bill_number',
            'invoice_number' => 'required|string|unique:purchases,invoice_number',
            'payment_method' => 'required|string|in:Cash,Credit,Other',
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'required|exists:store_locations,id',
            'total' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,paid,cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.free_items' => 'nullable|integer|min:0',
            'items.*.buying_cost' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $purchase = Purchase::create([
                'date_of_purchase' => $request->date_of_purchase,
                'bill_number' => $request->bill_number,
                'invoice_number' => $request->invoice_number,
                'payment_method' => $request->payment_method,
                'supplier_id' => $request->supplier_id,
                'store_id' => $request->store_id,
                'total' => $request->total,
                'paid_amount' => $request->paid_amount,
                'discount_percentage' => $request->discount_percentage ?? 0,
                'discount_amount' => $request->discount_amount ?? 0,
                'tax' => $request->tax ?? 0,
                'status' => $request->status,
            ]);

            foreach ($request->items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'free_items' => $item['free_items'] ?? 0,
                    'buying_cost' => $item['buying_cost'],
                ]);
            }

            DB::commit();

            $purchase->load(['supplier', 'store', 'items.product']);
            $data = [
                'id' => $purchase->id,
                'date_of_purchase' => $purchase->date_of_purchase,
                'bill_number' => $purchase->bill_number,
                'invoice_number' => $purchase->invoice_number,
                'payment_method' => $purchase->payment_method,
                'supplier_id' => $purchase->supplier_id,
                'supplier' => [
                    'id' => $purchase->supplier->id,
                    'supplier_name' => $purchase->supplier->supplier_name,
                ],
                'store_id' => $purchase->store_id,
                'store' => [
                    'id' => $purchase->store->id,
                    'store_name' => $purchase->store->store_name,
                ],
                'total' => $purchase->total,
                'paid_amount' => $purchase->paid_amount,
                'discount_percentage' => $purchase->discount_percentage,
                'discount_amount' => $purchase->discount_amount,
                'tax' => $purchase->tax,
                'status' => $purchase->status,
                'items' => $purchase->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'purchase_id' => $item->purchase_id,
                        'product_id' => $item->product_id,
                        'product' => [
                            'product_id' => $item->product->product_id,
                            'product_name' => $item->product->product_name,
                        ],
                        'quantity' => $item->quantity,
                        'free_items' => $item->free_items,
                        'buying_cost' => $item->buying_cost,
                        'created_at' => $item->created_at,
                        'updated_at' => $item->updated_at,
                    ];
                }),
                'created_at' => $purchase->created_at,
                'updated_at' => $purchase->updated_at,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Purchase invoice created successfully',
                'data' => $data,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating purchase: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $purchase = Purchase::with(['supplier', 'store', 'items.product'])->findOrFail($id);
            $data = [
                'id' => $purchase->id,
                'date_of_purchase' => $purchase->date_of_purchase,
                'bill_number' => $purchase->bill_number,
                'invoice_number' => $purchase->invoice_number,
                'payment_method' => $purchase->payment_method,
                'supplier_id' => $purchase->supplier_id,
                'supplier' => [
                    'id' => $purchase->supplier->id,
                    'supplier_name' => $purchase->supplier->supplier_name,
                ],
                'store_id' => $purchase->store_id,
                'store' => [
                    'id' => $purchase->store->id,
                    'store_name' => $purchase->store->store_name,
                ],
                'total' => $purchase->total,
                'paid_amount' => $purchase->paid_amount,
                'discount_percentage' => $purchase->discount_percentage,
                'discount_amount' => $purchase->discount_amount,
                'tax' => $purchase->tax,
                'status' => $purchase->status,
                'items' => $purchase->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'purchase_id' => $item->purchase_id,
                        'product_id' => $item->product_id,
                        'product' => [
                            'product_id' => $item->product->product_id,
                            'product_name' => $item->product->product_name,
                        ],
                        'quantity' => $item->quantity,
                        'free_items' => $item->free_items,
                        'buying_cost' => $item->buying_cost,
                        'created_at' => $item->created_at,
                        'updated_at' => $item->updated_at,
                    ];
                }),
                'created_at' => $purchase->created_at,
                'updated_at' => $purchase->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase not found or error: ' . $e->getMessage(),
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'date_of_purchase' => 'required|date',
            'bill_number' => 'required|string|unique:purchases,bill_number,' . $id,
            'invoice_number' => 'required|string|unique:purchases,invoice_number,' . $id,
            'payment_method' => 'required|string|in:Cash,Credit,Other',
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'required|exists:store_locations,id',
            'total' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,paid,cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.free_items' => 'nullable|integer|min:0',
            'items.*.buying_cost' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $purchase = Purchase::findOrFail($id);
            $purchase->update([
                'date_of_purchase' => $request->date_of_purchase,
                'bill_number' => $request->bill_number,
                'invoice_number' => $request->invoice_number,
                'payment_method' => $request->payment_method,
                'supplier_id' => $request->supplier_id,
                'store_id' => $request->store_id,
                'total' => $request->total,
                'paid_amount' => $request->paid_amount,
                'discount_percentage' => $request->discount_percentage ?? 0,
                'discount_amount' => $request->discount_amount ?? 0,
                'tax' => $request->tax ?? 0,
                'status' => $request->status,
            ]);

            // Delete existing items and create new ones
            $purchase->items()->delete();
            foreach ($request->items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'free_items' => $item['free_items'] ?? 0,
                    'buying_cost' => $item['buying_cost'],
                ]);
            }

            DB::commit();

            $purchase->load(['supplier', 'store', 'items.product']);
            $data = [
                'id' => $purchase->id,
                'date_of_purchase' => $purchase->date_of_purchase,
                'bill_number' => $purchase->bill_number,
                'invoice_number' => $purchase->invoice_number,
                'payment_method' => $purchase->payment_method,
                'supplier_id' => $purchase->supplier_id,
                'supplier' => [
                    'id' => $purchase->supplier->id,
                    'supplier_name' => $purchase->supplier->supplier_name,
                ],
                'store_id' => $purchase->store_id,
                'store' => [
                    'id' => $purchase->store->id,
                    'store_name' => $purchase->store->store_name,
                ],
                'total' => $purchase->total,
                'paid_amount' => $purchase->paid_amount,
                'discount_percentage' => $purchase->discount_percentage,
                'discount_amount' => $purchase->discount_amount,
                'tax' => $purchase->tax,
                'status' => $purchase->status,
                'items' => $purchase->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'purchase_id' => $item->purchase_id,
                        'product_id' => $item->product_id,
                        'product' => [
                            'product_id' => $item->product->product_id,
                            'product_name' => $item->product->product_name,
                        ],
                        'quantity' => $item->quantity,
                        'free_items' => $item->free_items,
                        'buying_cost' => $item->buying_cost,
                        'created_at' => $item->created_at,
                        'updated_at' => $item->updated_at,
                    ];
                }),
                'created_at' => $purchase->created_at,
                'updated_at' => $purchase->updated_at,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Purchase invoice updated successfully',
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating purchase: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $purchase = Purchase::findOrFail($id);
            $purchase->delete();
            return response()->json([
                'success' => true,
                'message' => 'Purchase invoice deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting purchase: ' . $e->getMessage(),
            ], 500);
        }
    }
}