<?php

namespace App\Helpers;

use App\Models\Sale;

class BillNumberGenerator
{
    public static function generateNextBillNumber()
    {
        $lastSale = Sale::orderBy('id', 'desc')->first();
        $lastBillNumber = $lastSale ? $lastSale->bill_number : 'Bill-0000';

        // Extract the numeric part of the last bill number
        $lastNumber = (int) substr($lastBillNumber, 5);

        // Increment the number by 1
        $nextNumber = $lastNumber + 1;

        // Format the new bill number with leading zeros
        $nextBillNumber = 'Bill-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return $nextBillNumber;
    }
}