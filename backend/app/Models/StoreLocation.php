<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoreLocation extends Model
{
    //
    use HasFactory;
    protected $fillable = ['store_name', 'phone_number', 'address'];
}
