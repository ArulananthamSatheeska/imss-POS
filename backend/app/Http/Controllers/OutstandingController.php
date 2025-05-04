<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;

class OutstandingController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Fetch sales and calculate pending amount as total - received_amount
            $sales = Sale::select('id', 'customer_id', 'customer_name', 'total', 'received_amount', 'created_at', 'payment_type')
                ->get()
                ->map(function ($sale) {
                    $pendingAmount = (float) $sale->total - (float) $sale->received_amount;

                    // Fetch payment history for this sale
                    $paymentHistory = Payment::where('transaction_type', 'sale')
                        ->where('transaction_id', $sale->id)
                        ->orderBy('payment_date', 'asc')
                        ->get(['amount', 'payment_date', 'payment_method'])
                        ->map(function ($payment) {
                            return [
                                'amount' => (float) $payment->amount,
                                'payment_date' => $payment->payment_date ? $payment->payment_date->toDateString() : null,
                                'payment_method' => $payment->payment_method,
                            ];
                        });

                    return [
                        'id' => $sale->id,
                        'type' => 'sale',
                        'customer_id' => $sale->customer_id,
                        'customer_name' => $sale->customer_name ?: 'Unknown Customer',
                        'total_amount' => (float) $sale->total,
                        'final_outstanding_amount' => $pendingAmount,
                        'paid_amount' => (float) $sale->received_amount,
                        'payment_history' => $paymentHistory,
                        'previous_outstanding_balance' => 0.0,
                        'total_credits' => 0.0,
                        'date' => $sale->created_at ? $sale->created_at->toDateString() : null,
                        'payment_type' => $sale->payment_type,
                        'status' => $pendingAmount > 0 ? 'Pending' : 'Paid',
                    ];
                })->filter(function ($sale) {
                    return $sale['final_outstanding_amount'] > 0;
                });

            // Fetch invoices with balance > 0 (pending payments)
            $invoices = Invoice::where('balance', '>', 0)
                ->select('id', 'customer_name', 'total_amount', 'balance', 'invoice_date', 'payment_method')
                ->get()
                ->map(function ($invoice) {

                    // Fetch payment history for this invoice
                    $paymentHistory = Payment::where('transaction_type', 'invoice')
                        ->where('transaction_id', $invoice->id)
                        ->orderBy('payment_date', 'asc')
                        ->get(['amount', 'payment_date', 'payment_method'])
                        ->map(function ($payment) {
                            return [
                                'amount' => (float) $payment->amount,
                                'payment_date' => $payment->payment_date ? $payment->payment_date->toDateString() : null,
                                'payment_method' => $payment->payment_method,
                            ];
                        });

                    return [
                        'id' => $invoice->id,
                        'type' => 'invoice',
                        'customer_name' => $invoice->customer_name ?: 'Unknown Customer',
                        'total_amount' => (float) $invoice->total_amount,
                        'final_outstanding_amount' => (float) $invoice->balance,
                        'paid_amount' => (float) $invoice->total_amount - (float) $invoice->balance,
                        'payment_history' => $paymentHistory,
                        'previous_outstanding_balance' => 0.0,
                        'total_credits' => 0.0,
                        'date' => $invoice->invoice_date ? $invoice->invoice_date->toDateString() : null,
                        'payment_type' => $invoice->payment_method,
                        'status' => $invoice->balance > 0 ? 'Pending' : 'Paid',
                    ];
                });

            // Combine sales and invoices
            $outstanding = $sales->merge($invoices)->sortByDesc('created_at')->values();

            return response()->json($outstanding);
        } catch (\Exception $e) {
            \Log::error('Error fetching outstanding transactions: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch outstanding transactions.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $paidAmount = $request->input('paid_amount');
        $paymentDate = $request->input('payment_date');

        // Try to find the sale by id
        $sale = Sale::find($id);
        if ($sale) {
            $newPaidAmount = $paidAmount;
            $total = (float) $sale->total;
            $currentPaid = (float) $sale->received_amount;
            $updatedPaid = $currentPaid + $newPaidAmount;
            $balance = $total - $updatedPaid;

            $sale->received_amount = $updatedPaid;
            $sale->balance_amount = $balance;
            // Removed status update on Sale due to missing column in sales table
            // Removed payment_date update on Sale due to missing column in sales table
            $sale->updated_at = now();

            $sale->save();

            return response()->json(['message' => 'Sale payment updated successfully.', 'status' => $sale->status, 'balance' => $balance]);
        }

        // Try to find the invoice by id
        $invoice = Invoice::find($id);
        if ($invoice) {
            $newPaidAmount = $paidAmount;
            $total = (float) $invoice->total_amount;
            $currentPaid = $total - (float) $invoice->balance;
            $updatedPaid = $currentPaid + $newPaidAmount;
            $balance = $total - $updatedPaid;

            $invoice->balance = $balance;
            $invoice->status = $balance <= 0 ? 'Paid' : 'Pending';
            if ($paymentDate) {
                try {
                    $invoice->payment_date = $paymentDate;
                } catch (\Exception $e) {
                    \Log::error('Error setting payment_date on Invoice: ' . $e->getMessage());
                }
            }
            $invoice->updated_at = now();

            $invoice->save();

            return response()->json(['message' => 'Invoice payment updated successfully.', 'status' => $invoice->status, 'balance' => $balance]);
        }

        return response()->json(['error' => 'Record not found.'], 404);
    }

}

