<?php
namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::all()->map(function ($customer) {
            if ($customer->photo) {
                $customer->photo_url = url(Storage::url($customer->photo));
                Log::debug("Customer photo URL", ['id' => $customer->id, 'photo_url' => $customer->photo_url]);
            }
            return $customer;
        });
        return response()->json(['data' => $customers], 200);
    }

    // public function store(Request $request)
    // {
    //     try {
    //         $data = $request->only([
    //             'customer_name',
    //             'email',
    //             'phone',
    //             'address',
    //             'nic_number',
    //             'card_name',
    //             'card_types',
    //             'valid_date',
    //         ]);

    //         // Auto-generate a unique 6-digit loyalty_card_number
    //         do {
    //             $loyaltyCardNumber = str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    //         } while (Customer::where('loyalty_card_number', $loyaltyCardNumber)->exists());

    //         $data['loyalty_card_number'] = $loyaltyCardNumber;

    //         $photoPath = null;
    //         if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
    //             $photoPath = $request->file('photo')->storeAs(
    //                 'public/customers',
    //                 time() . '_' . $request->file('photo')->getClientOriginalName()
    //             );
    //             $data['photo'] = str_replace('public/', '', $photoPath);
    //             Log::info("Photo stored", [
    //                 'path' => $data['photo'],
    //                 'url' => url(Storage::url($data['photo'])),
    //                 'file_exists' => Storage::exists($photoPath),
    //             ]);
    //         }

    //         $data['card_types'] = $request->input('card_types', []); // Ensure it's an array

    //         $customer = Customer::create($data);
    //         if ($customer->photo) {
    //             $customer->photo_url = url(Storage::url($customer->photo));
    //         }

    //         return response()->json(['data' => $customer], 201);
    //     } catch (\Exception $e) {
    //         Log::error("Exception in store customer", [
    //             'message' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //             'request' => $request->except('photo'),
    //         ]);
    //         return response()->json([
    //             'message' => 'Server error, please try again later',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }

    // public function update(Request $request, $id)
    // {
    //     $customer = Customer::findOrFail($id);

    //     $data = $request->only([
    //         'customer_name',
    //         'email',
    //         'phone',
    //         'address',
    //         'nic_number',
    //         'card_name',
    //         'card_types',
    //         'valid_date',
    //     ]);
    //     // Preserve the existing loyalty_card_number
    //     $data['loyalty_card_number'] = $customer->loyalty_card_number;

    //     if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
    //         if ($customer->photo) {
    //             Storage::delete('public/' . $customer->photo);
    //         }
    //         $photoPath = $request->file('photo')->storeAs(
    //             'public/customers',
    //             time() . '_' . $request->file('photo')->getClientOriginalName()
    //         );
    //         $data['photo'] = str_replace('public/', '', $photoPath);
    //         Log::info("Photo updated", [
    //             'path' => $data['photo'],
    //             'url' => url(Storage::url($data['photo'])),
    //             'file_exists' => Storage::exists($photoPath),
    //         ]);
    //     } else {
    //         $data['photo'] = $customer->photo;
    //     }

    //     $data['card_types'] = $request->input('card_types', []); // Ensure it's an array

    //     $customer->update($data);
    //     if ($customer->photo) {
    //         $customer->photo_url = url(Storage::url($customer->photo));
    //     }

    //     return response()->json(['data' => $customer], 200);
    // }

    public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'nic_number' => 'nullable|string|max:20',
            'card_name' => 'nullable|string|max:100',
            'card_types' => 'nullable|array',
            'card_types.*' => 'string|max:100', // Validate each card type
            'valid_date' => 'nullable|date',
            'photo' => 'nullable|image|max:2048', // Max 2MB
        ]);

        $data = $request->only([
            'customer_name',
            'email',
            'phone',
            'address',
            'nic_number',
            'card_name',
            'card_types',
            'valid_date',
        ]);

        do {
            $loyaltyCardNumber = str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        } while (Customer::where('loyalty_card_number', $loyaltyCardNumber)->exists());

        $data['loyalty_card_number'] = $loyaltyCardNumber;

        $photoPath = null;
        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $photoPath = $request->file('photo')->storeAs(
                'public/customers',
                time() . '_' . $request->file('photo')->getClientOriginalName()
            );
            $data['photo'] = str_replace('public/', '', $photoPath);
            Log::info("Photo stored", [
                'path' => $data['photo'],
                'url' => url(Storage::url($data['photo'])),
                'file_exists' => Storage::exists($photoPath),
            ]);
        }

        $data['card_types'] = $request->input('card_types', []);

        $customer = Customer::create($data);
        if ($customer->photo) {
            $customer->photo_url = url(Storage::url($customer->photo));
        }

        return response()->json(['data' => $customer], 201);
    } catch (\Exception $e) {
        Log::error("Exception in store customer", [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'request' => $request->except('photo'),
        ]);
        return response()->json([
            'message' => 'Server error, please try again later',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function update(Request $request, $id)
{
    $customer = Customer::findOrFail($id);

    $validated = $request->validate([
        'customer_name' => 'required|string|max:255',
        'email' => 'nullable|email|max:255',
        'phone' => 'required|string|max:20',
        'address' => 'nullable|string|max:500',
        'nic_number' => 'nullable|string|max:20',
        'card_name' => 'nullable|string|max:100',
        'card_types' => 'nullable|array',
        'card_types.*' => 'string|max:100',
        'valid_date' => 'nullable|date',
        'photo' => 'nullable|image|max:2048',
    ]);

    $data = $request->only([
        'customer_name',
        'email',
        'phone',
        'address',
        'nic_number',
        'card_name',
        'card_types',
        'valid_date',
    ]);
    $data['loyalty_card_number'] = $customer->loyalty_card_number;

    if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
        if ($customer->photo) {
            Storage::delete('public/' . $customer->photo);
        }
        $photoPath = $request->file('photo')->storeAs(
            'public/customers',
            time() . '_' . $request->file('photo')->getClientOriginalName()
        );
        $data['photo'] = str_replace('public/', '', $photoPath);
        Log::info("Photo updated", [
            'path' => $data['photo'],
            'url' => url(Storage::url($data['photo'])),
            'file_exists' => Storage::exists($photoPath),
        ]);
    } else {
        $data['photo'] = $customer->photo;
    }

    $data['card_types'] = $request->input('card_types', []);

    $customer->update($data);
    if ($customer->photo) {
        $customer->photo_url = url(Storage::url($customer->photo));
    }

    return response()->json(['data' => $customer], 200);
}

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);

        if ($customer->photo) {
            Storage::delete('public/' . $customer->photo);
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully'], 200);
    }
}