<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transaction_id');
            $table->string('transaction_type'); // 'sale' or 'invoice'
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->string('payment_method')->nullable();
            $table->timestamps();

            // Index for faster queries
            $table->index(['transaction_id', 'transaction_type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
}
