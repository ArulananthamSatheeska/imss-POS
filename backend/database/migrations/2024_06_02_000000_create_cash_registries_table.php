<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCashRegistriesTable extends Migration
{
    public function up()
    {
        Schema::create('cash_registries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('opening_balance', 15, 2);
            $table->timestamp('opened_at');
            $table->decimal('closing_balance', 15, 2)->nullable();
            $table->decimal('actual_cash', 15, 2)->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('cash_registries');
    }
}
