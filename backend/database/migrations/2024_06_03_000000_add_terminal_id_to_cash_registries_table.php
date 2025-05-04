<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTerminalIdToCashRegistriesTable extends Migration
{
    public function up()
    {
        Schema::table('cash_registries', function (Blueprint $table) {
            $table->string('terminal_id', 50)->after('user_id')->nullable(false)->default('default_terminal');
        });
    }

    public function down()
    {
        Schema::table('cash_registries', function (Blueprint $table) {
            $table->dropColumn('terminal_id');
        });
    }
}
