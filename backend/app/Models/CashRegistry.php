<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashRegistry extends Model
{
    use HasFactory;

    protected $table = 'cash_registries';

    protected $fillable = [
        'user_id',
        'opening_balance',
        'opened_at',
        'closing_balance',
        'actual_cash',
        'closed_at',
        'status',
        'total_sales',
        'total_sales_qty',
    ];

    protected $dates = [
        'opened_at',
        'closed_at',
    ];

    public function cashMovements()
    {
        return $this->hasMany(CashMovement::class, 'registry_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
