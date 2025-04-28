<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * Recommendation: Use $guarded = [] for simplicity during development
     * if you trust your input source (like a validated Form Request),
     * or list all fields explicitly in $fillable for production.
     */
    // protected $fillable = [
    //     'invoice_no',
    //     'invoice_date',
    //     'invoice_time',
    //     'customer_name',
    //     'customer_address',
    //     'customer_phone',
    //     'customer_email',
    //     'payment_method',
    //     'purchase_amount',
    //     'subtotal',
    //     'tax_amount',
    //     'total_amount',
    //     'balance',
    //     'status',
    // ];
    protected $guarded = []; // Allow mass assignment for all fields

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'invoice_date' => 'date',
        'invoice_time' => 'datetime:H:i', // Adjust format if needed
        'purchase_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    /**
     * Get the items for the invoice.
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}