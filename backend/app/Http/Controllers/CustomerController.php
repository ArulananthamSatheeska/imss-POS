<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
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

    public function store(Request $request)
    {
        try {
            // Validation removed as per request
            $validator = Validator::make($request->all(), [
                // 'customer_name' => 'required|string|max:255',
                // 'email' => 'nullable|email|unique:customers,email',
                // 'phone' => 'required|string|max:20|unique:customers,phone',
                // 'address' => 'nullable|string|max:255',
                // 'nic_number' => 'required|string|max:12|unique:customers,nic_number',
                // 'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                Log::error("Validation failed for store customer", [
                    'errors' => $validator->errors()->toArray(),
                    'request' => $request->except('photo'),
                ]);
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()->toArray(),
                ], 422);
            }

            $data = $request->only(['customer_name', 'email', 'phone', 'address', 'nic_number']);

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

        // Validation removed as per request
        $validator = Validator::make($request->all(), [
            // 'customer_name' => 'required|string|max:255',
            // 'email' => 'nullable|email|unique:customers,email,' . $id,
            // 'phone' => 'required|string|max:20|unique:customers,phone,' . $id,
            // 'address' => 'nullable|string|max:255',
            // 'nic_number' => 'required|string|max:12|unique:customers,nic_number,' . $id,
            // 'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            Log::error("Validation failed for update customer", [
                'errors' => $validator->errors()->toArray(),
                'request' => $request->except('photo'),
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->toArray(),
            ], 422);
        }

        $data = $request->only(['customer_name', 'email', 'phone', 'address', 'nic_number']);

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
