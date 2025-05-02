<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('held_sales', function (Blueprint $table) {
            $table->id();
            $table->string('hold_id')->unique();
            $table->string('terminal_id');
            $table->foreignId('user_id')->constrained();
            $table->json('sale_data'); // Stores all POS transaction data
            $table->string('status')->default('held'); // held, completed, expired
            $table->text('notes')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['terminal_id', 'status']);
            $table->index('expires_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('held_sales');
    }
};
