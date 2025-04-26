<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // Import Rule

class StoreInvoiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Set to true for now, implement proper authorization later if needed.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Invoice Details
            'invoice.no' => ['required', 'string', 'max:255', 'unique:invoices,invoice_no'],
            'invoice.date' => ['required', 'date_format:Y-m-d'],
            'invoice.time' => ['required', 'date_format:H:i'], // Assumes HH:MM 24-hour format

            // Customer Details
            'customer.name' => ['required', 'string', 'max:255'],
            'customer.address' => ['nullable', 'string', 'max:255'],
            'customer.phone' => ['nullable', 'string', 'max:50'],
            'customer.email' => ['nullable', 'email', 'max:255'],

            // Items Array
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'], // Must be greater than 0
            'items.*.unitPrice' => ['required', 'numeric', 'min:0'],
            'items.*.discountAmount' => ['required', 'numeric', 'min:0'],
            // Optional: Validate consistency between discount amount and percentage if needed
            'items.*.discountPercentage' => ['required', 'numeric', 'min:0', 'max:100'],
            // 'items.*.total' -> We will calculate this on the backend, do not validate input for it.

            // Purchase Details
            'purchaseDetails.method' => ['required', 'string', Rule::in(['cash', 'card', 'bank', 'cheque'])],
            'purchaseDetails.amount' => ['required', 'numeric', 'min:0'],

            // We don't validate calculated fields like subtotal, total, balance from input
            'status' => ['required', 'string', Rule::in(['pending', 'paid', 'cancelled'])], // Example statuses
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'invoice.no.unique' => 'This invoice number has already been used.',
            'items.*.qty.gt' => 'The quantity for :attribute must be greater than zero.',
            'items.*.description.required' => 'The description for item #:position is required.',
            // Add more specific messages if needed, :position will be replaced by item index + 1
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        // Helps make error messages more user-friendly for nested array items
        $attributes = [
            'invoice.no' => 'invoice number',
            'invoice.date' => 'invoice date',
            'invoice.time' => 'invoice time',
            'customer.name' => 'customer name',
            'customer.email' => 'customer email',
            'purchaseDetails.method' => 'payment method',
            'purchaseDetails.amount' => 'purchase amount',
        ];

        // Dynamically add attributes for items
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