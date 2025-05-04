<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Invoice;
use Illuminate\Http\Request;

class OutstandingController extends Controller
{
    public function index(Request $request)
    {
        // Fetch sales with balance_amount > 0 (pending payments)
        $sales = Sale::where('balance_amount', '>', 0)
            ->select('id', 'customer_id', 'customer_name', 'total', 'balance_amount', 'created_at', 'payment_type')
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'type' => 'sale',
                    'customer_id' => $sale->customer_id,
                    'customer_name' => $sale->customer_name,
                    'total_amount' => (float) $sale->total,
                    'pending_amount' => (float) $sale->balance_amount,
                    'paid_amount' => (float) $sale->total - (float) $sale->balance_amount,
                    'previous_outstanding_balance' => 0.0,
                    'total_credits' => 0.0,
                    'final_outstanding_amount' => (float) $sale->balance_amount,
                    'date' => $sale->created_at->toDateString(),
                    'payment_type' => $sale->payment_type,
                    'status' => $sale->balance_amount > 0 ? 'Pending' : 'Paid',
                ];
            });

        // Fetch invoices with balance > 0 (pending payments)
        $invoices = Invoice::where('balance', '>', 0)
            ->select('id', 'customer_name', 'total_amount', 'balance', 'invoice_date', 'payment_method')
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'type' => 'invoice',
                    'customer_id' => null,
                    'customer_name' => $invoice->customer_name,
                    'total_amount' => (float) $invoice->total_amount,
                    'pending_amount' => (float) $invoice->balance,
                    'paid_amount' => (float) $invoice->total_amount - (float) $invoice->balance,
                    'previous_outstanding_balance' => 0.0,
                    'total_credits' => 0.0,
                    'final_outstanding_amount' => (float) $invoice->balance,
                    'date' => $invoice->invoice_date->toDateString(),
                    'payment_type' => $invoice->payment_method,
                    'status' => $invoice->balance > 0 ? 'Pending' : 'Paid',
                ];
            });

        // Combine sales and invoices
        $outstanding = $sales->merge($invoices)->sortByDesc('date')->values();

        return response()->json($outstanding);
    }
    public function update(Request $request, $id)
{
    $status = $request->input('status');
    $paidAmount = $request->input('paid_amount');

    // Try to find the sale by id
    $sale = Sale::find($id);
    if ($sale) {
        if ($status === 'Paid') {
            $sale->balance_amount = 0;
            $sale->status = 'Paid';
            // Assuming there is a paid_amount field, update it
            if (property_exists($sale, 'paid_amount')) {
                $sale->paid_amount = $sale->total;
            }
            $sale->save();
            return response()->json(['message' => 'Sale marked as paid successfully.']);
        }
        // Handle other status updates if needed
        return response()->json(['message' => 'No changes made to sale.']);
    }

    // Try to find the invoice by id
    $invoice = Invoice::find($id);
    if ($invoice) {
        if ($status === 'Paid') {
            $invoice->balance = 0;
            $invoice->status = 'Paid';
            // Assuming there is a paid_amount field, update it
            if (property_exists($invoice, 'paid_amount')) {
                $invoice->paid_amount = $invoice->total_amount;
            }
            $invoice->save();
            return response()->json(['message' => 'Invoice marked as paid successfully.']);
        }
        // Handle other status updates if needed
        return response()->json(['message' => 'No changes made to invoice.']);
    }

    return response()->json(['error' => 'Record not found.'], 404);
}

}

