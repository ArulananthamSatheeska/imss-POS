<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\LoyaltyCard;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LoyaltyPointsController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::with('loyaltyCard')->get()->map(function ($customer) {
            $card = $customer->loyaltyCard;
            $sales = Sale::where('customer_id', $customer->id)->get();
            $totalSale = $sales->sum('total_amount');
            $pointsEarned = $this->calculatePointsEarned($card, $totalSale);
            $pointsRedeemed = 0; // Placeholder for redemption logic
            $pointsBalance = $pointsEarned - $pointsRedeemed;
            $lastVisit = $sales->max('created_at');
            $days = $lastVisit ? Carbon::now()->diffInDays($lastVisit) : null;

            $cardType = $card
                ? ($card->calculation_type === 'Point-wise'
                    ? "{$card->calculation_type} ({$card->point_calculation_mode})"
                    : $card->calculation_type)
                : null;

            return [
                'id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'phone' => $customer->phone,
                'nic_number' => $customer->nic_number,
                'loyalty_card_number' => $customer->loyalty_card_number,
                'card_name' => $card ? $card->card_name : null,
                'card_type' => $cardType,
                'visits' => $sales->count(),
                'total_quantity' => 0, // Placeholder, requires sales line items
                'total_sale' => $totalSale,
                'points_earned' => $pointsEarned,
                'points_redeemed' => $pointsRedeemed,
                'points_balance' => $pointsBalance,
                'last_visit' => $lastVisit ? $lastVisit->format('d-m-Y') : null,
                'days' => $days,
            ];
        });

        return response()->json(['data' => $customers], 200);
    }

    private function calculatePointsEarned($card, $totalSale)
    {
        if (!$card) return 0;

        if ($card->calculation_type === 'Point-wise' && $card->point_calculation_mode === 'Threshold-wise') {
            $threshold = $card->points_per_threshold ?? 1;
            $pointsPerThreshold = $card->points_per_threshold_value ?? 1;
            return floor($totalSale / $threshold) * $pointsPerThreshold;
        } elseif ($card->calculation_type === 'Point-wise' && $card->point_calculation_mode === 'Range-wise') {
            $ranges = $card->ranges->sortBy('min_range');
            foreach ($ranges as $range) {
                if ($totalSale >= ($range->min_range ?? 0) && $totalSale <= ($range->max_range ?? PHP_INT_MAX)) {
                    return $range->points ?? 0;
                }
            }
        }
        return 0;
    }

    public function recordSale(Request $request, $phone)
    {
        $request->validate([
            'total_amount' => 'required|numeric|min:0',
        ]);

        $customer = Customer::where('phone', $phone)->firstOrFail();
        $card = $customer->loyaltyCard;
        $totalAmount = $request->input('total_amount', 0);

        // Record the sale
        $sale = Sale::create([
            'customer_id' => $customer->id,
            'total_amount' => $totalAmount,
            'created_at' => Carbon::now(),
        ]);

        // Calculate total sales for the customer
        $totalSale = Sale::where('customer_id', $customer->id)->sum('total_amount');
        $pointsEarned = $this->calculatePointsEarned($card, $totalSale);
        $pointsRedeemed = 0; // Placeholder
        $pointsBalance = $pointsEarned - $pointsRedeemed;

        // Update customer points balance
        $customer->update(['points_balance' => $pointsBalance]);

        $cardType = $card
            ? ($card->calculation_type === 'Point-wise'
                ? "{$card->calculation_type} ({$card->point_calculation_mode})"
                : $card->calculation_type)
            : null;

        $lastVisit = Sale::where('customer_id', $customer->id)->max('created_at');
        $days = $lastVisit ? Carbon::now()->diffInDays($lastVisit) : null;

        return response()->json([
            'data' => [
                'id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'phone' => $customer->phone,
                'nic_number' => $customer->nic_number,
                'loyalty_card_number' => $customer->loyalty_card_number,
                'card_name' => $card ? $card->card_name : null,
                'card_type' => $cardType,
                'visits' => Sale::where('customer_id', $customer->id)->count(),
                'total_quantity' => 0,
                'total_sale' => $totalSale,
                'points_earned' => $pointsEarned,
                'points_redeemed' => $pointsRedeemed,
                'points_balance' => $pointsBalance,
                'last_visit' => $lastVisit ? $lastVisit->format('d-m-Y') : null,
                'days' => $days,
            ],
            'message' => 'Sale recorded and points updated successfully'
        ], 200);
    }
}