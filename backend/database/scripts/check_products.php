<?php

use Illuminate\Support\Facades\DB;

$product = DB::table('products')->where('product_name')->first();

if ($product) {
    echo "Product ID: {$product->product_id}, Product Name: {$product->product_name}, Buying Cost: {$product->buying_cost}\n";
} else {
    echo "Product not found.\n";
}
