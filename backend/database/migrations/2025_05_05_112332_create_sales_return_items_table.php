<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->renameColumn('buying_cost', 'selling_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->renameColumn('selling_cost', 'buying_cost');
        });
    }
};
