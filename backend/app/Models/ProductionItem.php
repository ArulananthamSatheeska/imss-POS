<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category_id',
        'sales_price',
        'wholesale_price',
        'mrp_price',
    ];

    protected $casts = [
        'sales_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'mrp_price' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(ProductionCategory::class, 'category_id');
    }

    public function formulas()
    {
        return $this->hasMany(ProductionItemFormula::class, 'production_item_id');
    }
}