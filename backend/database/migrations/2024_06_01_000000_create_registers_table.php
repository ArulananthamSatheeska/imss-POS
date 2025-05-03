<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRegistersTable extends Migration
{

    public function up()
    {
       // Update your registers migration to match the model
Schema::create('registers', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id');
    $table->string('terminal_id');
    $table->string('status'); // 'open' or 'closed'
    $table->decimal('cash_on_hand', 15, 2);
    $table->decimal('closing_cash', 15, 2)->nullable();
    $table->json('closing_details')->nullable();
    $table->timestamp('opened_at');
    $table->timestamp('closed_at')->nullable();
    $table->timestamps();

    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
});
    }

    public function down()
    {
        Schema::dropIfExists('registers');
    }
}
