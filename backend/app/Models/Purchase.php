<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'date_of_purchase',
        'bill_number',
        'invoice_number',
        'payment_method',
        'supplier_id',
        'store_id',
        'total',
        'paid_amount',
        'status',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function store()
    {
        return $this->belongsTo(StoreLocation::class, 'store_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}