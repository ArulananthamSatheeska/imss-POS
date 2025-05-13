<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyCard;
use App\Models\LoyaltyCardRange;
use Illuminate\Http\Request;

class LoyaltyCardController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'card_name' => 'required|string|max:255',
            'calculation_type' => 'required|in:Point-wise,Percentage-wise', // Updated validation
            'point_calculation_mode' => 'nullable|in:Range-wise,Threshold-wise',
            'points_per_threshold' => 'nullable|integer|min:1',
            'points_per_threshold_value' => 'nullable|integer|min:1',
            'ranges' => 'nullable|array',
            'ranges.*.minRange' => 'nullable|numeric|min:0',
            'ranges.*.maxRange' => 'nullable|numeric|min:0',
            'ranges.*.points' => 'nullable|numeric|min:0',
            'ranges.*.discountPercentage' => 'nullable|numeric|between:0,100',
        ]);

        // Create the loyalty card
        $loyaltyCard = LoyaltyCard::create([
            'card_name' => $validatedData['card_name'],
            'calculation_type' => $validatedData['calculation_type'],
            'point_calculation_mode' => $validatedData['point_calculation_mode'],
            'points_per_threshold' => $validatedData['points_per_threshold'],
            'points_per_threshold_value' => $validatedData['points_per_threshold_value'],
        ]);

        // Create the ranges if provided
        if (!empty($validatedData['ranges'])) {
            $ranges = array_filter($validatedData['ranges'], function ($range) {
                return $range['minRange'] !== "" || $range['maxRange'] !== "" || $range['points'] !== "" || $range['discountPercentage'] !== "";
            });

            foreach ($ranges as $range) {
                LoyaltyCardRange::create([
                    'loyalty_card_id' => $loyaltyCard->id,
                    'min_range' => $range['minRange'] ?? null,
                    'max_range' => $range['maxRange'] ?? null,
                    'points' => $range['points'] ?? null,
                    'discount_percentage' => $range['discountPercentage'] ?? null,
                ]);
            }
        }

        // Load the ranges relationship for the response
        $loyaltyCard->load('ranges');

        return response()->json(['message' => 'Loyalty card saved successfully', 'data' => $loyaltyCard], 201);
    }

    public function index()
    {
        $loyaltyCards = LoyaltyCard::with('ranges')->get();
        return response()->json($loyaltyCards);
    }
}