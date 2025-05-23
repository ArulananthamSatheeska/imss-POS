<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $table = 'invoice_items';
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    // protected $fillable = [
    //     'invoice_id',
    //     'description',
    //     'quantity',
    //     'unit_price',
    //     'discount_amount',
    //     'discount_percentage',
    //     'total',
    // ];


    protected $fillable = [
        'invoice_id',
        'product_id',
        'description',
        'quantity',
        'free',
        'unit_price',
        'sales_price',
        'discount_amount',
        'discount_percentage',
        'total',
        'special_discount',
        'total_buying_cost',
        'supplier',
        'category',
        'store_location',
    ];


    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'decimal:2',
        'free' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'sales_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'special_discount' => 'decimal:2',
        'total' => 'decimal:2',
        'total_buying_cost' => 'decimal:2',
    ];

    /**
     * Get the invoice that owns the item.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}