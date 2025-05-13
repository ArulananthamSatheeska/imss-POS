<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLoyaltyCardsTable extends Migration
{
    public function up()
    {
        Schema::create('loyalty_cards', function (Blueprint $table) {
            $table->id();
            $table->string('card_name');
            $table->string('calculation_type'); // Point-wise or Discount-wise
            $table->string('point_calculation_mode')->nullable(); // Range-wise or Threshold-wise
            $table->integer('points_per_threshold')->nullable(); // Threshold amount (e.g., 1000)
            $table->integer('points_per_threshold_value')->nullable(); // Points per threshold (e.g., 1)
            $table->json('ranges')->nullable(); // Store ranges as JSON
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('loyalty_cards');
    }
}