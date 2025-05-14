<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class UpdateLoyaltyCardsCalculationType extends Migration
{
    public function up()
    {
        DB::table('loyalty_cards')
            ->where('calculation_type', 'Discount-wise')
            ->update(['calculation_type' => 'Percentage-wise']);
    }

    public function down()
    {
        DB::table('loyalty_cards')
            ->where('calculation_type', 'Percentage-wise')
            ->update(['calculation_type' => 'Discount-wise']);
    }
}