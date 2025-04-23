<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckProduct extends Command
{
    protected $signature = 'check:product {name}';
    protected $description = 'Check product details by name';

    public function handle()
    {
        $productName = $this->argument('name');
        $product = DB::table('products')->where('product_name', $productName)->first();

        if ($product) {
            $this->info("Product ID: {$product->product_id}, Product Name: {$product->product_name}, Buying Cost: {$product->buying_cost}");
        } else {
            $this->info("Product not found.");
        }
    }
}
