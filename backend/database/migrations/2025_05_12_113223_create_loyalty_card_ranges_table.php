<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLoyaltyCardRangesTable extends Migration
{
    public function up()
    {
        Schema::create('loyalty_card_ranges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loyalty_card_id')->constrained()->onDelete('cascade');
            $table->decimal('min_range', 10, 2)->nullable();
            $table->decimal('max_range', 10, 2)->nullable();
            $table->integer('points')->nullable();
            $table->decimal('discount_percentage', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('loyalty_card_ranges');
    }
}