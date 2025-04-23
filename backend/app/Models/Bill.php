<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = ['customer_id', 'bill_no', 'payment_type', 'received_amount', 'total_amount'];

    public function items()
    {
        return $this->hasMany(BillItem::class);
    }
}
