<?php

use Illuminate\Support\Facades\DB;
use App\Models\Product; // Add this line to import the Product model


$items = DB::table('sale_items')->get(); // Fetch all sale items


foreach ($items as $item) {
    $product = DB::table('products')->where('product_name', $item->product_name)->first();
    
    if ($product) {
        DB::table('sale_items')
            ->where('id', $item->id)
            ->update(['product_id' => $product->product_id]);
    }
}

echo "Sale items updated successfully.";
