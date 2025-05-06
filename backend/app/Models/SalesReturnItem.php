<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $fillable = ['sales_return_id', 'product_id', 'product_name', 'quantity', 'selling_cost', 'reason'];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }
}
