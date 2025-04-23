<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckSaleItems extends Command
{
    protected $signature = 'check:sale-items';
    protected $description = 'Check sale items and their product associations';

    public function handle()
    {
        $items = DB::table('sale_items')->get();

        foreach ($items as $item) {
            $this->info("ID: {$item->id}, Product ID: {$item->product_id}, Product Name: {$item->product_name}");
        }
    }
}
