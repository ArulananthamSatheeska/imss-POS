<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id');
            $table->string('product_name');
            $table->string('item_code')->unique()->nullable();
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('buying_cost', 10, 2);
            $table->decimal('sales_price', 10, 2);
            $table->decimal('wholesale_price', 10, 2)->nullable();
            $table->decimal('minimum_price', 10, 2)->nullable();
            $table->string('barcode')->unique()->nullable();
            $table->decimal('mrp', 10, 2);
            $table->integer('minimum_stock_quantity')->nullable();
            $table->integer('opening_stock_quantity')->nullable();
            $table->decimal('opening_stock_value', 10, 2)->nullable();
            $table->string('category')->nullable();
            $table->string('supplier')->nullable();
            $table->string('unit_type')->nullable();
            $table->string('store_location')->nullable();
            $table->string('cabinet')->nullable();
            $table->string('row')->nullable();
            $table->json('extra_fields')->nullable(); // Store extra_fields as JSON
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};