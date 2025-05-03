<?php

namespace App\Http\Controllers;

use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Invoice;
use App\Models\Sale;
use App\Models\Product;
use App\Models\SaleItem;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SalesReturnController extends Controller
{
    /**
     * Get all sales returns with related data.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $salesReturns = SalesReturn::with(['invoice', 'sale', 'items.product'])->get();
        $salesReturns->each(function ($return) {
            $return->items->each(function ($item) {
                $item->buying_cost = (float) $item->buying_cost;
            });
        });
        return response()->json(['data' => $salesReturns], 200);
    }

    /**
     * Get a single sales return by ID.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $salesReturn = SalesReturn::with(['invoice', 'sale', 'items.product'])->findOrFail($id);
            $salesReturn->items->each(function ($item) {
                $item->buying_cost = (float) $item->buying_cost;
            });
            return response()->json(['data' => $salesReturn], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Sales return not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create a new sales return.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sales_return_number' => 'required|string|unique:sales_returns,sales_return_number',
            'invoice_no' => 'nullable|string|exists:invoices,invoice_no',
            'bill_number' => 'nullable|string|exists:sales,bill_number',
            'customer_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.buying_cost' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string|max:255',
            'refund_method' => 'required|in:cash,card,store-credit',
            'remarks' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,approved,rejected',
        ], [
            'invoice_no.exists' => 'The selected invoice number is invalid.',
            'bill_number.exists' => 'The selected bill number is invalid.',
        ]);

        // Custom validation: exactly one of invoice_no or bill_number must be provided
        if (!$request->filled('invoice_no') && !$request->filled('bill_number')) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['reference' => ['Either invoice_no or bill_number must be provided.']]
            ], 422);
        }
        if ($request->filled('invoice_no') && $request->filled('bill_number')) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['reference' => ['Only one of invoice_no or bill_number can be provided.']]
            ], 422);
        }

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $salesReturnData = [
                'sales_return_number' => $request->sales_return_number,
                'invoice_no' => $request->invoice_no,
                'bill_number' => $request->bill_number,
                'customer_name' => $request->customer_name,
                'refund_method' => $request->refund_method,
                'remarks' => $request->remarks,
                'status' => $request->status,
            ];

            $salesReturn = SalesReturn::create($salesReturnData);

            foreach ($request->items as $item) {
                $product = Product::where('product_id', $item['product_id'])->first();
                if (!$product) {
                    throw new \Exception("Product with ID {$item['product_id']} not found.");
                }
                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->product_name,
                    'quantity' => $item['quantity'],
                    'buying_cost' => $item['buying_cost'],
                    'reason' => $item['reason'],
                ]);

                // If status is approved, update sale and stock quantities
                if ($request->status === 'approved') {
                    $this->updateSaleOnApproval($item['product_id'], $item['quantity'], $request->invoice_no);
                }
            }

            DB::commit();
            return response()->json([
                'message' => 'Sales return created successfully',
                'data' => $salesReturn->load('items', 'invoice', 'sale')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error creating sales return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing sales return.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'sales_return_number' => 'required|string|unique:sales_returns,sales_return_number,' . $id,
            'invoice_no' => 'nullable|string|exists:invoices,invoice_no',
            'bill_number' => 'nullable|string|exists:sales,bill_number',
            'customer_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.buying_cost' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string|max:255',
            'refund_method' => 'required|in:cash,card,store-credit',
            'remarks' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,approved,rejected',
        ], [
            'invoice_no.exists' => 'The selected invoice number is invalid.',
            'bill_number.exists' => 'The selected bill number is invalid.',
        ]);

        // Custom validation: exactly one of invoice_no or bill_number must be provided
        if (!$request->filled('invoice_no') && !$request->filled('bill_number')) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['reference' => ['Either invoice_no or bill_number must be provided.']]
            ], 422);
        }
        if ($request->filled('invoice_no') && $request->filled('bill_number')) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['reference' => ['Only one of invoice_no or bill_number can be provided.']]
            ], 422);
        }

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $salesReturn = SalesReturn::findOrFail($id);
            $oldStatus = $salesReturn->status;

            // If status is changing from approved to something else, revert sale and stock changes
            if ($oldStatus === 'approved' && $request->status !== 'approved') {
                $oldItems = SalesReturnItem::where('sales_return_id', $id)->get();
                foreach ($oldItems as $item) {
                    $this->revertSaleOnApproval($item->product_id, $item->quantity, $salesReturn->invoice_no);
                }
            }

            $salesReturn->update([
                'sales_return_number' => $request->sales_return_number,
                'invoice_no' => $request->invoice_no,
                'bill_number' => $request->bill_number,
                'customer_name' => $request->customer_name,
                'refund_method' => $request->refund_method,
                'remarks' => $request->remarks,
                'status' => $request->status,
            ]);

            // Delete existing items and create new ones
            SalesReturnItem::where('sales_return_id', $salesReturn->id)->delete();
            foreach ($request->items as $item) {
                $product = Product::where('product_id', $item['product_id'])->first();
                if (!$product) {
                    throw new \Exception("Product with ID {$item['product_id']} not found.");
                }
                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->product_name,
                    'quantity' => $item['quantity'],
                    'buying_cost' => $item['buying_cost'],
                    'reason' => $item['reason'],
                ]);

                // If new status is approved, update sale and stock quantities
                if ($request->status === 'approved' && $oldStatus !== 'approved') {
                    $this->updateSaleOnApproval($item['product_id'], $item['quantity'], $request->invoice_no);
                }
            }

            DB::commit();
            return response()->json([
                'message' => 'Sales return updated successfully',
                'data' => $salesReturn->load('items', 'invoice', 'sale')
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error updating sales return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a sales return.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $salesReturn = SalesReturn::findOrFail($id);
            if ($salesReturn->status === 'approved') {
                $items = SalesReturnItem::where('sales_return_id', $id)->get();
                foreach ($items as $item) {
                    $this->revertSaleOnApproval($item->product_id, $item->quantity, $salesReturn->invoice_no);
                }
            }

            $salesReturn->delete();
            DB::commit();
            return response()->json([
                'message' => 'Sales return deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error deleting sales return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update sale, invoice, and stock quantities when a sales return is approved.
     *
     * @param int $productId
     * @param int $quantity
     * @param string|null $invoiceNo
     * @return void
     */
    private function updateSaleOnApproval($productId, $quantity, $invoiceNo = null)
    {
        try {
            // Find the product
            $product = Product::where('product_id', $productId)->first();
            if (!$product) {
                throw new \Exception("Product with ID {$productId} not found.");
            }

            // Update SaleItem quantity
            $saleItem = SaleItem::where('product_id', $productId)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($saleItem) {
                $newSaleQuantity = max(0, $saleItem->quantity - $quantity);
                $saleItem->update(['quantity' => $newSaleQuantity]);
                Log::info("Updated SaleItem ID {$saleItem->id} quantity to {$newSaleQuantity} for product ID {$productId}");
            } else {
                Log::warning("No SaleItem found for product ID {$productId}");
            }

            // Update InvoiceItem quantity if invoice_no is provided
            if ($invoiceNo) {
                $invoice = Invoice::where('invoice_no', $invoiceNo)->first();
                if ($invoice) {
                    $invoiceItem = InvoiceItem::where('invoice_id', $invoice->id)
                        ->where('product_id', $productId)
                        ->first();
                    if ($invoiceItem) {
                        $newInvoiceQuantity = max(0, $invoiceItem->quantity - $quantity);
                        $invoiceItem->update(['quantity' => $newInvoiceQuantity]);
                        Log::info("Updated InvoiceItem ID {$invoiceItem->id} quantity to {$newInvoiceQuantity} for product ID {$productId}");
                    } else {
                        Log::warning("No InvoiceItem found for product ID {$productId} and invoice_no {$invoiceNo}");
                    }
                }
            }

            // Update Product stock quantity
            $newStockQuantity = ($product->stock_quantity ?? $product->opening_stock_quantity ?? 0) + $quantity;
            $product->update(['stock_quantity' => $newStockQuantity]);
            Log::info("Updated Product ID {$productId} stock_quantity to {$newStockQuantity}");
        } catch (\Exception $e) {
            Log::error("Error updating sale and stock quantities for product ID {$productId}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Revert sale, invoice, and stock quantity changes when a sales return is unapproved or deleted.
     *
     * @param int $productId
     * @param int $quantity
     * @param string|null $invoiceNo
     * @return void
     */
    private function revertSaleOnApproval($productId, $quantity, $invoiceNo = null)
    {
        try {
            // Find the product
            $product = Product::where('product_id', $productId)->first();
            if (!$product) {
                throw new \Exception("Product with ID {$productId} not found.");
            }

            // Update SaleItem quantity
            $saleItem = SaleItem::where('product_id', $productId)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($saleItem) {
                $newSaleQuantity = $saleItem->quantity + $quantity;
                $saleItem->update(['quantity' => $newSaleQuantity]);
                Log::info("Reverted SaleItem ID {$saleItem->id} quantity to {$newSaleQuantity} for product ID {$productId}");
            } else {
                Log::warning("No SaleItem found for product ID {$productId}");
            }

            // Update InvoiceItem quantity if invoice_no is provided
            if ($invoiceNo) {
                $invoice = Invoice::where('invoice_no', $invoiceNo)->first();
                if ($invoice) {
                    $invoiceItem = InvoiceItem::where('invoice_id', $invoice->id)
                        ->where('product_id', $productId)
                        ->first();
                    if ($invoiceItem) {
                        $newInvoiceQuantity = $invoiceItem->quantity + $quantity;
                        $invoiceItem->update(['quantity' => $newInvoiceQuantity]);
                        Log::info("Reverted InvoiceItem ID {$invoiceItem->id} quantity to {$newInvoiceQuantity} for product ID {$productId}");
                    } else {
                        Log::warning("No InvoiceItem found for product ID {$productId} and invoice_no {$invoiceNo}");
                    }
                }
            }

            // Update Product stock quantity
            $currentStock = $product->stock_quantity ?? $product->opening_stock_quantity ?? 0;
            $newStockQuantity = max(0, $currentStock - $quantity);
            $product->update(['stock_quantity' => $newStockQuantity]);
            Log::info("Reverted Product ID {$productId} stock_quantity to {$newStockQuantity}");
        } catch (\Exception $e) {
            Log::error("Error reverting sale and stock quantities for product ID {$productId}: " . $e->getMessage());
            throw $e;
        }
    }
}