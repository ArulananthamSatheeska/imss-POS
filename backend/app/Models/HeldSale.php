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
            // Get the latest numeric hold_id
            $latest = self::whereRaw("hold_id REGEXP '^HLD-[0-9]+$'")
                ->orderByRaw("CAST(SUBSTRING(hold_id, 5) AS UNSIGNED) DESC")
                ->first();
    
            // Determine the next number
            if ($latest && preg_match('/HLD-(\d+)/', $latest->hold_id, $matches)) {
                $nextNumber = (int) $matches[1] + 1;
            } else {
                $nextNumber = 1;
            }
    
            // Assign the new hold_id with leading zeros
            $model->hold_id = 'HLD-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    
            
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
