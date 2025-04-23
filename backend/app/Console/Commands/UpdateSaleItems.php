<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateSaleItems extends Command
{
    protected $signature = 'update:sale-items';
    protected $description = 'Update sale items with product associations';

    public function handle()
    {
        $items = DB::table('sale_items')->get();

        foreach ($items as $item) {
            $product = DB::table('products')->where('product_name', $item->product_name)->first();
            
            if ($product) {
                DB::table('sale_items')
                    ->where('id', $item->id)
                    ->update(['product_id' => $product->product_id]);
            }
        }

        $this->info("Sale items updated successfully.");
    }
}
