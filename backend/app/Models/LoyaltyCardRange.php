<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyCardRange extends Model
{
    protected $fillable = [
        'loyalty_card_id',
        'min_range',
        'max_range',
        'points',
        'discount_percentage',
    ];

    public function loyaltyCard()
    {
        return $this->belongsTo(LoyaltyCard::class);
    }
}