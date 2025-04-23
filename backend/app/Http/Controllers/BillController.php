<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

class BillController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'bill_no' => 'nullable|string|unique:bills,bill_no',
            'payment_type' => 'nullable|string|in:cash,card,online,credit,cheque',
            'received_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.product_id' => 'nullable|exists:products,product_id',
            'items.*.qty' => 'nullable|integer|min:1',
            'items.*.price' => 'nullable|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        // Create Bill
        $bill = Bill::create([
            'customer_id' => $validatedData['customer_id'] ?? null,
            'bill_no' => $validatedData['bill_no'] ?? now()->timestamp,
            'payment_type' => $validatedData['payment_type'] ?? 'cash',
            'received_amount' => $validatedData['received_amount'] ?? 0,
            'total_amount' => $validatedData['total_amount'],
        ]);

        // Store Bill Items
        if (!empty($validatedData['items'])) {
            foreach ($validatedData['items'] as $item) {
                BillItem::create([
                    'bill_id' => $bill->id,
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'] ?? 1,
                    'price' => $item['price'] ?? 0,
                    'discount' => $item['discount'] ?? 0,
                    'total' => ($item['qty'] ?? 1) * ($item['price'] ?? 0) - ($item['discount'] ?? 0),
                ]);
            }
        }

        return response()->json(['message' => 'Bill saved successfully', 'bill' => $bill], 201);
    }
}