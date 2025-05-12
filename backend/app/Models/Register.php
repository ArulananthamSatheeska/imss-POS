<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Register extends Model
{
    protected $table = 'cash_registries';

    protected $fillable = [
        'user_id',
        'terminal_id',
        'status',
        'opening_balance',
        'closing_balance',
        'actual_cash',
        'total_sales',
        'total_sales_qty',
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_balance' => 'float',
        'closing_balance' => 'float',
        'actual_cash' => 'float',
        'total_sales' => 'float',
        'total_sales_qty' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cashMovements(): HasMany
    {
        return $this->hasMany(CashMovement::class, 'registry_id');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open' && $this->closed_at === null;
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed' && $this->closed_at !== null;
    }
}