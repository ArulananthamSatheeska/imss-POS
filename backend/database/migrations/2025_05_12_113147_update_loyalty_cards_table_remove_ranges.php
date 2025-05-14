<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateLoyaltyCardsTableRemoveRanges extends Migration
{
    public function up()
    {
        Schema::table('loyalty_cards', function (Blueprint $table) {
            $table->dropColumn('ranges'); // Remove the JSON ranges column
        });
    }

    public function down()
    {
        Schema::table('loyalty_cards', function (Blueprint $table) {
            $table->json('ranges')->nullable(); // Re-add the column in case of rollback
        });
    }
}