<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

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
    protected $fillable = [
        'invoice_no', 'invoice_date', 'invoice_time', 'customer_name',
        'customer_address', 'customer_phone', 'customer_email', 'payment_method',
        'purchase_amount', 'subtotal', 'tax_amount', 'total_amount', 'balance', 'status'
    ];

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

    public static function generateInvoiceNumber(): string
    {
        $year = now()->format('Y'); // Current year, e.g., 2025
        $prefix = "INV-{$year}-";

        // Find the last invoice number for the current year
        $lastInvoice = DB::table('invoices')
            ->where('invoice_no', 'like', $prefix . '%')
            ->orderBy('invoice_no', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_no, strlen($prefix));
            $nextNumber = $lastNumber + 1;
        }

        // Format with leading zeros (e.g., 0001)
        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            if (empty($invoice->invoice_no)) {
                $invoice->invoice_no = static::generateInvoiceNumber();
            }
        });
    }
}