<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCashMovementsTable extends Migration
{
    public function up()
    {
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('registry_id');
            $table->enum('type', ['in', 'out']);
            $table->decimal('amount', 15, 2);
            $table->string('reason');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('registry_id')->references('id')->on('cash_registries')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('cash_movements');
    }
}
