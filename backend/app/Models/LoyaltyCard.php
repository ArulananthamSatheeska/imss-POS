<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyCard extends Model
{
    protected $fillable = [
        'card_name',
        'calculation_type',
        'point_calculation_mode',
        'points_per_threshold',
        'points_per_threshold_value',
    ];

    public function ranges()
    {
        return $this->hasMany(LoyaltyCardRange::class);
    }
}