<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyCardDesign extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_name',
        'card_type',
        'shop_name',
        'customer_id',
        'loyalty_card_number',
        'valid_date',
        'shop_logo',
    ];

    protected $appends = ['shop_logo_url'];

    public function getShopLogoUrlAttribute()
    {
        return $this->shop_logo ? asset('storage/' . $this->shop_logo) : null;
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}