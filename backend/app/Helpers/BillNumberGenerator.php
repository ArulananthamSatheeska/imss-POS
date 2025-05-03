<?php

namespace App\Helpers;

use App\Models\Sale;

class BillNumberGenerator
{
    public static function generateNextBillNumber($userId, $username)
    {
        // Ensure userId is string and prefix with 'U' if numeric
        if (is_numeric($userId)) {
            $userId = 'U' . $userId;
        } elseif (!$userId) {
            $userId = 'U';
        }

        // Ensure username is at least 3 characters, uppercase
        $username = strtoupper($username ?: 'NON');
        if (strlen($username) < 3) {
            $username = str_pad($username, 3, 'X');
        }
        $usernamePrefix = substr($username, 0, 3);

        $prefix = "{$userId}/{$usernamePrefix}/";

        \Log::info("Generating bill number with prefix: {$prefix}");

        // Find the last bill number with this prefix
        $lastSale = Sale::where('bill_number', 'like', $prefix . '%')
            ->orderBy('bill_number', 'desc')
            ->first();

        $lastNumber = 0;
        if ($lastSale) {
            $lastBillNumber = $lastSale->bill_number;
            \Log::info("Last bill number found: {$lastBillNumber}");
            $lastNumber = (int) substr($lastBillNumber, strlen($prefix));
        }

        $nextNumber = $lastNumber + 1;

        // Format the new bill number with leading zeros
        $nextBillNumber = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return $nextBillNumber;
    }
}
