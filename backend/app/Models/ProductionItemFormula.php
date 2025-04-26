<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionItemFormula extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_item_id',
        'raw_material_id',
        'quantity',
        'price',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price' => 'decimal:2',
    ];

    public function productionItem()
    {
        return $this->belongsTo(ProductionItem::class, 'production_item_id');
    }

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}