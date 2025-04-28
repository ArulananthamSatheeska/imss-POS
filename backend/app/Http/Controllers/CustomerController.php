<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $customers = Customer::all();
        return response()->json(['data' => $customers], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email',
            'phone' => 'required|string|max:20|unique:customers,phone',
            'address' => 'nullable|string|max:255',
            'nic_number' => 'required|string|max:50|unique:customers,nic_number',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['customer_name', 'email', 'phone', 'address', 'nic_number']);
        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('public/customers');
        }

        $data['photo'] = $photoPath ? str_replace('public/', '', $photoPath) : null;

        $customer = Customer::create($data);

        return response()->json(['data' => $customer], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email,' . $id,
            'phone' => 'required|string|max:20|unique:customers,phone,' . $id,
            'address' => 'nullable|string|max:255',
            'nic_number' => 'required|string|max:50|unique:customers,nic_number,' . $id,
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['customer_name', 'email', 'phone', 'address', 'nic_number']);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($customer->photo) {
                Storage::delete('public/' . $customer->photo);
            }
            $photoPath = $request->file('photo')->store('public/customers');
            $data['photo'] = str_replace('public/', '', $photoPath);
        }

        $customer->update($data);

        return response()->json(['data' => $customer], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
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