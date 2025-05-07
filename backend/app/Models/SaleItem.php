<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id', 'product_id', 'product_name', 'quantity', 'mrp', 'unit_price', 'discount', 'total','special_discount','supplier',
        'category',
        'store_location',
    ];

    public function sale()
    {
        // return $this->belongsTo(Sale::class);
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id'); // Corrected foreign key to product_id
    }
}