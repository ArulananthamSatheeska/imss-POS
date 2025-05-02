<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HeldSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'hold_id',
        'terminal_id',
        'user_id',
        'sale_data',
        'status',
        'notes',
        'expires_at'
    ];

    protected $casts = [
        'sale_data' => 'array',
        'expires_at' => 'datetime'
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->hold_id = 'HLD-' . strtoupper(uniqid());
            $expiryHours = config('pos.hold_expiry_hours');
            if (!$expiryHours) {
                $expiryHours = 72;
            }
            $model->expires_at = now()->addHours($expiryHours);
        });
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'held')
                    ->where('expires_at', '>', now());
    }

    public function scopeForTerminal($query, $terminalId)
    {
        return $query->where('terminal_id', $terminalId);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
