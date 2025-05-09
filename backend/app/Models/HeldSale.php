<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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
            // Get the highest current hold ID number
            $lastHold = static::orderBy('id', 'desc')->first();
            $lastNumber = 0;
        
            
            // Generate the next sequential hold ID
            $model->hold_id = 'HLD-' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            
            // Set expiry time
            $expiryHours = config('pos.hold_expiry_hours', 72);
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

    // Method to recall a held sale
    public function recall()
    {
        // Update status to recalled
        $this->update(['status' => 'recalled']);
        
        // If you want to reset the counter when recalling, you would need to:
        // 1. Track the sequence separately (maybe in a config table)
        // 2. Or implement a more complex logic to find gaps in the sequence
        // This is more complex and might not be necessary
        
        return $this;
    }
}