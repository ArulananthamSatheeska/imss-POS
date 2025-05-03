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
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->string('sales_return_number')->unique();
            $table->string('invoice_no')->nullable();
            $table->string('bill_number')->nullable();
            $table->foreign('invoice_no')->references('invoice_no')->on('invoices')->onDelete('cascade');
            $table->foreign('bill_number')->references('bill_number')->on('sales')->onDelete('cascade');
            $table->string('customer_name');
            $table->enum('refund_method', ['cash', 'card', 'store-credit'])->default('cash');
            $table->text('remarks')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};