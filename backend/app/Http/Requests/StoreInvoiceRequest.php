<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Get the invoice ID for update requests (null for store)
        $invoiceId = $this->route('invoice') ? $this->route('invoice')->id : null;

        return [
            // Invoice Details
            'invoice.no' => [
                'required',
                'string',
                'max:255',
                // Unique rule: ignore the current invoice's ID for updates
                Rule::unique('invoices', 'invoice_no')->ignore($invoiceId),
            ],
            'invoice.date' => ['required', 'date_format:Y-m-d'],
            'invoice.time' => ['required', 'date_format:H:i'],

            // Customer Details
            'customer.name' => ['required', 'string', 'max:255'],
            'customer.address' => ['nullable', 'string', 'max:255'],
            'customer.phone' => ['nullable', 'string', 'max:50'],
            'customer.email' => ['nullable', 'email', 'max:255'],

            // Items Array
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'],
            'items.*.unitPrice' => ['required', 'numeric', 'min:0'],
            'items.*.discountAmount' => ['required', 'numeric', 'min:0'],
            'items.*.discountPercentage' => ['required', 'numeric', 'min:0', 'max:100'],

            // Purchase Details
            'purchaseDetails.method' => ['required', 'string', Rule::in(['cash', 'card', 'bank', 'cheque'])],
            'purchaseDetails.amount' => ['required', 'numeric', 'min:0'],

            // Status
            'status' => ['required', 'string', Rule::in(['pending', 'paid', 'cancelled'])],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice.no.unique' => 'This invoice number has already been used.',
            'items.*.qty.gt' => 'The quantity for :attribute must be greater than zero.',
            'items.*.description.required' => 'The description for item #:position is required.',
        ];
    }

    public function attributes(): array
    {
        $attributes = [
            'invoice.no' => 'invoice number',
            'invoice.date' => 'invoice date',
            'invoice.time' => 'invoice time',
            'customer.name' => 'customer name',
            'customer.email' => 'customer email',
            'purchaseDetails.method' => 'payment method',
            'purchaseDetails.amount' => 'purchase amount',
        ];

        foreach ($this->input('items', []) as $index => $item) {
            $itemNumber = $index + 1;
            $attributes["items.{$index}.description"] = "item #{$itemNumber} description";
            $attributes["items.{$index}.qty"] = "item #{$itemNumber} quantity";
            $attributes["items.{$index}.unitPrice"] = "item #{$itemNumber} unit price";
            $attributes["items.{$index}.discountAmount"] = "item #{$itemNumber} discount amount";
            $attributes["items.{$index}.discountPercentage"] = "item #{$itemNumber} discount percentage";
        }

        return $attributes;
    }
}