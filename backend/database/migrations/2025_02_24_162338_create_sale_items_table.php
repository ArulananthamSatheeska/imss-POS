<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSaleItemsTable extends Migration
{
    public function up()
{
    Schema::create('sale_items', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('sale_id');
        $table->string('product_name');
        $table->integer('quantity');
        $table->decimal('mrp', 10, 2);
        $table->decimal('unit_price', 10, 2);
        $table->decimal('discount', 10, 2);
        $table->decimal('special_discount', 10, 2)->nullable();
        $table->decimal('total', 10, 2);
        $table->decimal('cost_price', 10, 2)->nullable();
        $table->timestamps();

        // Foreign key constraint
        $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
    });
}

    public function down()
    {
        Schema::dropIfExists('sale_items');
    }
}
