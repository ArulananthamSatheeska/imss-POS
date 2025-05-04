<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'transaction_id',
        'transaction_type',
        'amount',
        'payment_date',
        'payment_method',
    ];

    // Define polymorphic relation if needed
    public function transaction()
    {
        return $this->morphTo(null, 'transaction_type', 'transaction_id');
    }
}
