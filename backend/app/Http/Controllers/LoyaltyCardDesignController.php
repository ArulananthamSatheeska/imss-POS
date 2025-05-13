<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyCardDesign;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class LoyaltyCardDesignController extends Controller
{
    public function index()
    {
        try {
            $designs = LoyaltyCardDesign::with('customer')->get();
            Log::info('Fetched loyalty card designs', ['count' => $designs->count()]);
            return response()->json(['data' => $designs], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching loyalty card designs', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Server error, please try again later',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'card_name' => 'nullable|string|max:100',
                'card_type' => 'nullable|string|max:255',
                'shop_name' => 'required|string|max:255',
                'customer_id' => 'nullable|exists:customers,id',
                'loyalty_card_number' => 'nullable|string|max:20',
                'valid_date' => 'nullable|date',
                'shop_logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // Max 2MB
            ]);

            $data = $request->only([
                'card_name',
                'card_type',
                'shop_name',
                'customer_id',
                'loyalty_card_number',
                'valid_date',
            ]);

            if ($request->hasFile('shop_logo') && $request->file('shop_logo')->isValid()) {
                $photoPath = $request->file('shop_logo')->storeAs(
                    'loyalty_cards',
                    time() . '_' . $request->file('shop_logo')->getClientOriginalName(),
                    'public'
                );
                $data['shop_logo'] = $photoPath;
                Log::info('Shop logo stored', [
                    'path' => $data['shop_logo'],
                    'url' => url(Storage::url($data['shop_logo'])),
                    'file_exists' => Storage::disk('public')->exists($photoPath),
                ]);
            } else {
                $data['shop_logo'] = null;
                Log::info('No shop logo uploaded');
            }

            $design = LoyaltyCardDesign::create($data);
            return response()->json(['data' => $design], 201);
        } catch (\Exception $e) {
            Log::error('Exception in store loyalty card design', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->except('shop_logo'),
            ]);
            return response()->json([
                'message' => 'Server error, please try again later',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $design = LoyaltyCardDesign::findOrFail($id);

            $validated = $request->validate([
                'card_name' => 'nullable|string|max:100',
                'card_type' => 'nullable|string|max:255',
                'shop_name' => 'required|string|max:255',
                'customer_id' => 'nullable|exists:customers,id',
                'loyalty_card_number' => 'nullable|string|max:20',
                'valid_date' => 'nullable|date',
                'shop_logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $data = $request->only([
                'card_name',
                'card_type',
                'shop_name',
                'customer_id',
                'loyalty_card_number',
                'valid_date',
            ]);

            if ($request->hasFile('shop_logo') && $request->file('shop_logo')->isValid()) {
                if ($design->shop_logo) {
                    Storage::disk('public')->delete($design->shop_logo);
                    Log::info('Deleted old shop logo', ['path' => $design->shop_logo]);
                }
                $photoPath = $request->file('shop_logo')->storeAs(
                    'loyalty_cards',
                    time() . '_' . $request->file('shop_logo')->getClientOriginalName(),
                    'public'
                );
                $data['shop_logo'] = $photoPath;
                Log::info('Shop logo updated', [
                    'path' => $data['shop_logo'],
                    'url' => url(Storage::url($data['shop_logo'])),
                    'file_exists' => Storage::disk('public')->exists($photoPath),
                ]);
            } else {
                $data['shop_logo'] = $design->shop_logo;
                Log::info('No new shop logo uploaded', ['existing_path' => $data['shop_logo']]);
            }

            $design->update($data);
            return response()->json(['data' => $design], 200);
        } catch (\Exception $e) {
            Log::error('Exception in update loyalty card design', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->except('shop_logo'),
            ]);
            return response()->json([
                'message' => 'Server error, please try again later',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $design = LoyaltyCardDesign::findOrFail($id);

            if ($design->shop_logo) {
                Storage::disk('public')->delete($design->shop_logo);
                Log::info('Deleted shop logo', ['path' => $design->shop_logo]);
            }

            $design->delete();
            Log::info('Loyalty card design deleted', ['id' => $id]);

            return response()->json(['message' => 'Loyalty card design deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Exception in destroy loyalty card design', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'id' => $id,
            ]);
            return response()->json([
                'message' => 'Server error, please try again later',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}