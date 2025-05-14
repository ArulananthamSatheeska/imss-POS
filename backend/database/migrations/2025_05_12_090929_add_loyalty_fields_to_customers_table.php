<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLoyaltyFieldsToCustomersTable extends Migration
{
    public function up()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('loyalty_card_number')->unique()->nullable()->after('nic_number');
            $table->string('card_name')->nullable()->after('loyalty_card_number');
            $table->string('card_type')->nullable()->after('card_name');
            $table->date('valid_date')->nullable()->after('card_type');
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['loyalty_card_number', 'card_name', 'card_type', 'valid_date']);
        });
    }
}