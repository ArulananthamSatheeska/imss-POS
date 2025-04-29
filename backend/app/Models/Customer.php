<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['customer_name', 'email', 'phone', 'address', 'nic_number', 'photo'];

    /**
     * Get the photo URL.
     */
    public function getPhotoAttribute($value)
    {
        return $value ? asset('storage/' . $value) : null;
    }
}