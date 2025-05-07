<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['customer_name', 'email', 'phone', 'address', 'nic_number', 'photo'];

    protected $appends = ['photo_url'];

    /**
     * Get the photo URL.
     */
    public function getPhotoUrlAttribute()
    {
        return $this->photo ? asset('storage/' . $this->photo) : null;
    }

    /**
     * Get the photo attribute.
     */
    public function getPhotoAttribute($value)
    {
        return $value;
    }
}
