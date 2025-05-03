<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_number',
        'invoice_no',
        'bill_number',
        'customer_name',
        'refund_method',
        'remarks',
        'status',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_no', 'invoice_no');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'bill_number', 'bill_number');
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    // Auto-generate sales return number to match frontend format
    public static function generateSalesReturnNumber()
    {
        $now = now();
        $dateStr = $now->format('YmdHis'); // e.g., 20250502123045
        return "SR{$dateStr}";
    }
}