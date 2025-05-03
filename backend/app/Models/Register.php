<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Register extends Model
{
    protected $fillable = [
        'user_id',
        'terminal_id',
        'status',
        'cash_on_hand',
        'closing_cash',
        'opened_at',
        'closed_at',
        'closing_details',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'closing_cash' => 'float',
        'closing_details' => 'array',
    ];
}
