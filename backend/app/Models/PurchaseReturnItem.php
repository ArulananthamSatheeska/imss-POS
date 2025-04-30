<?php

// app/Models/PurchaseReturnItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReturnItem extends Model
{
    use HasFactory;

    protected $fillable = ['purchase_return_id', 'product_id', 'product_name', 'quantity', 'buying_cost', 'reason'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

}