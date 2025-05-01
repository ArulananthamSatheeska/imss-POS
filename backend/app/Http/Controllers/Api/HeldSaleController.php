<?php

namespace App\Http\Controllers\Api;

use App\Models\HeldSale;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HeldSaleController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'terminal_id' => 'sometimes|string',
            'status' => 'sometimes|in:held,completed,expired'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }

        $query = HeldSale::query();

        if ($request->has('terminal_id')) {
            $query = $query->forTerminal($request->terminal_id);
        }

        if ($request->has('status')) {
            $query = $query->where('status', $request->status);
        } else {
            $query = $query->active();
        }

        $heldSales = $query->orderBy('created_at', 'desc')->get();

        // Map held sales to include total_items and total_amount for clarity
        $mappedSales = $heldSales->map(function ($sale) {
            $totalItems = 0;
            $totalAmount = 0.0;

            if (isset($sale->sale_data['products']) && is_array($sale->sale_data['products'])) {
                $totalItems = count($sale->sale_data['products']);
            }

            if (isset($sale->sale_data['totals']['finalTotal'])) {
                $totalAmount = $sale->sale_data['totals']['finalTotal'];
            }

            return array_merge($sale->toArray(), [
                'total_items' => $totalItems,
                'total_amount' => $totalAmount,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'data' => $mappedSales
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'terminal_id' => 'required|string',
            'user_id' => 'required|exists:users,id',
            'sale_data' => 'required|array',
            'notes' => 'sometimes|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }

        try {
            $heldSale = HeldSale::create([
                'terminal_id' => $request->terminal_id,
                'user_id' => $request->user_id,
                'sale_data' => $request->sale_data,
                'notes' => $request->notes ?? null
            ]);

            return response()->json([
                'status' => 'success',
                'data' => $heldSale,
                'message' => 'Sale held successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to hold sale: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $heldSale = HeldSale::where('hold_id', $id)->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $heldSale
        ]);
    }

    public function destroy($id)
    {
        $heldSale = HeldSale::where('hold_id', $id)->firstOrFail();
        $heldSale->update(['status' => 'expired']);
        $heldSale->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Held sale deleted successfully'
        ]);
    }

    public function recall($id)
    {
        $heldSale = HeldSale::where('hold_id', $id)->active()->firstOrFail();

        // Update status to 'completed' or 'recalled' so it no longer appears in active holds
        $heldSale->update(['status' => 'completed']);

        return response()->json([
            'status' => 'success',
            'data' => $heldSale->sale_data,
            'message' => 'Sale recalled successfully'
        ]);
    }

    public function cleanupExpired()
    {
        $expired = HeldSale::where('expires_at', '<=', now())
                          ->where('status', 'held')
                          ->get();

        foreach ($expired as $sale) {
            $sale->update(['status' => 'expired']);
            // Optional: Log to audit table before deleting
            $sale->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Expired holds cleaned up',
            'count' => $expired->count()
        ]);
    }
}
