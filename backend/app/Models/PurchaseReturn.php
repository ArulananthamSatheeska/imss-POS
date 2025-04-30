<?php

// app/Models/PurchaseReturn.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PurchaseReturn extends Model
{
    use HasFactory;

    protected $fillable = ['invoice_number', 'supplier_id', 'refund_method', 'remarks', 'status'];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }

    // Auto-generate invoice number
    public static function generateInvoiceNumber()
    {
        $year = now()->year;
        $count = self::whereYear('created_at', $year)->count() + 1;
        return "PR-{$year}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
