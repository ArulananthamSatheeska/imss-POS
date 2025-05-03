<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRegisterSessionsTable extends Migration
{
    public function up()
    {
        Schema::create('register_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('terminal_id');
            $table->string('status'); // 'open' or 'closed'
            $table->decimal('opening_cash', 15, 2);
            $table->timestamp('opened_at');
            $table->decimal('closing_cash', 15, 2)->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->json('closing_details')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'terminal_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('register_sessions');
    }
}
