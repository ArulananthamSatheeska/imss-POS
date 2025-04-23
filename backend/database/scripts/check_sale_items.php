<?php

use Illuminate\Support\Facades\DB;
use App\Models\Product; // Add this line to import the Product model


$items = DB::table('sale_items')->get(); // Fetch all sale items


foreach ($items as $item) {
    echo "ID: {$item->id}, Product ID: {$item->product_id}, Product Name: {$item->product_name}\n";
}
