<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTotalSalesToCashRegistriesTable extends Migration
{
    public function up()
    {
        Schema::table('cash_registries', function (Blueprint $table) {
            $table->decimal('total_sales', 15, 2)->nullable()->after('actual_cash');
            $table->integer('total_sales_qty')->nullable()->after('total_sales');
        });
    }

    public function down()
    {
        Schema::table('cash_registries', function (Blueprint $table) {
            $table->dropColumn('total_sales');
            $table->dropColumn('total_sales_qty');
        });
    }
}
