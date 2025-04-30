<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->nullable()->unique(); // From invoice.no
            $table->date('invoice_date');         // From invoice.date
            $table->time('invoice_time');         // From invoice.time

            // Customer Details (denormalized for simplicity, adjust if you have a separate customers table)
            $table->string('customer_name');      // From customer.name
            $table->string('customer_address')->nullable(); // From customer.address
            $table->string('customer_phone')->nullable();   // From customer.phone
            $table->string('customer_email')->nullable();   // From customer.email

            // Purchase Details
            $table->string('payment_method');     // From purchaseDetails.method
            $table->decimal('purchase_amount', 15, 2)->default(0); // From purchaseDetails.amount

            // Calculated Totals (calculated server-side)
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('total_amount', 15, 2);
            $table->decimal('balance', 15, 2);

            $table->string('status')->default('pending'); // From frontend status
            $table->timestamps(); // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};