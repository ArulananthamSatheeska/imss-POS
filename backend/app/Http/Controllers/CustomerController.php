<?php
namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CustomerController extends Controller
{
    // Get all customers
    public function index()
    {
        $customers = Customer::all();
        return response()->json(['data' => $customers], 200);
    }

    // Create a new customer
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
        ]);

        $data = $request->only(['customer_name', 'email', 'phone']);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('customers', 'public'); // Store in storage/app/public/customers
            $data['photo'] = $photoPath;
        }

        $customer = Customer::create($data);

        return response()->json(['message' => 'Customer created successfully!', 'data' => $customer], 201);
    }

    // Update a customer
    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
        ]);

        $customer = Customer::findOrFail($id);
        $data = $request->only(['customer_name', 'email', 'phone']);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete the old photo if it exists
            if ($customer->photo) {
                Storage::disk('public')->delete($customer->photo);
            }

            $photoPath = $request->file('photo')->store('customers', 'public'); // Store in storage/app/public/customers
            $data['photo'] = $photoPath;
        }

        $customer->update($data);

        return response()->json(['message' => 'Customer updated successfully!', 'data' => $customer], 200);
    }

    // Delete a customer
    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);

        // Delete the photo if it exists
        if ($customer->photo) {
            Storage::disk('public')->delete($customer->photo);
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully!'], 200);
    }
}