<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Picqer\Barcode\BarcodeGeneratorPNG;

class Product extends Model
{
    use HasFactory;

    protected $primaryKey = 'product_id'; // Specify the primary key

    protected $fillable = [
        'product_name', 'item_code', 'batch_number', 'expiry_date', 'buying_cost', 
        'sales_price', 'minimum_price', 'wholesale_price', 'barcode', 'mrp', 
        'minimum_stock_quantity', 'opening_stock_quantity', 'opening_stock_value', 
        'category', 'supplier', 'unit_type', 'store_location', 'cabinet', 'row', 
        'extra_fields'
    ];

    // Method to update stock quantity
    public function updateStock($quantity, $action = 'subtract')
    {
        if ($action === 'subtract') {
            $this->opening_stock_quantity -= $quantity;
        } elseif ($action === 'add') {
            $this->opening_stock_quantity += $quantity;
        }

        $this->save();
    }

    // Method to check if stock is below the minimum threshold
    public function isLowStock()
    {
        return $this->opening_stock_quantity < $this->minimum_stock_quantity;
    }

      public function generateBarcode()
    {
        $generator = new BarcodeGeneratorPNG();
        return $generator->getBarcode($this->barcode, $generator::TYPE_CODE_128);
    }

    protected static function boot()
{
    parent::boot();
    static::creating(function ($model) {
        if (isset($model->product_id)) {
            unset($model->product_id); // Ignore product_id on create
        }
    });
}
}