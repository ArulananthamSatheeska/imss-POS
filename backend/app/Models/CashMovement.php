<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    use HasFactory;

    protected $table = 'cash_movements';

    public $timestamps = false;

    protected $fillable = [
        'registry_id',
        'type',
        'amount',
        'reason',
        'created_at',
    ];

    protected $dates = [
        'created_at',
    ];

    public function cashRegistry()
    {
        return $this->belongsTo(CashRegistry::class, 'registry_id');
    }
}
