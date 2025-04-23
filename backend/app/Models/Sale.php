<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_number', 'customer_id', 'customer_name', 'subtotal', 'discount', 'tax', 'total', 'payment_type', 'received_amount', 'balance_amount'
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}