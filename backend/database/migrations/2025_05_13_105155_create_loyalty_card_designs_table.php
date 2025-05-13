<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLoyaltyCardDesignsTable extends Migration
{
    public function up()
    {
        Schema::create('loyalty_card_designs', function (Blueprint $table) {
            $table->id();
            $table->string('card_name')->nullable();
            $table->string('card_type')->nullable();
            $table->string('shop_name');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('loyalty_card_number')->nullable();
            $table->date('valid_date')->nullable();
            $table->string('shop_logo')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('loyalty_card_designs');
    }
}