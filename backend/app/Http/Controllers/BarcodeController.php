<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class BarcodeController extends Controller
{
    public function barcode($id)
    {
        $product = Product::findOrFail($id);
        $barcode = $product->generateBarcode();

        return response($barcode)->header('Content-Type', 'image/png');
    }
}