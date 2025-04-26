<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'batch_number',
        'production_date',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'production_date' => 'date',
    ];

    public function productionItems()
    {
        return $this->hasMany(ProductionItem::class, 'category_id');
    }
}