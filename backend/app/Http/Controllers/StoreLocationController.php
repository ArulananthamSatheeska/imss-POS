<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StoreLocation;

class StoreLocationController extends Controller
{
    // 1️⃣ Get All Store Locations
    public function index()
    {
        return response()->json(StoreLocation::all(), 200);
    }

    // 2️⃣ Create New Store Location
    public function store(Request $request)
    {
        $request->validate([
            'store_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string|max:255',
        ]);

        $storeLocation = StoreLocation::create($request->all());

        return response()->json($storeLocation, 201);
    }

    // 3️⃣ Get Single Store Location
    public function show($id)
    {
        $storeLocation = StoreLocation::find($id);
        if (!$storeLocation) {
            return response()->json(['message' => 'Store Location not found'], 404);
        }
        return response()->json($storeLocation, 200);
    }

    // 4️⃣ Update Store Location
    public function update(Request $request, $id)
    {
        $storeLocation = StoreLocation::find($id);
        if (!$storeLocation) {
            return response()->json(['message' => 'Store Location not found'], 404);
        }

        $request->validate([
            'store_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string|max:255',
        ]);

        $storeLocation->update($request->all());

        return response()->json($storeLocation, 200);
    }

    // 5️⃣ Delete Store Location
    public function destroy($id)
    {
        $storeLocation = StoreLocation::find($id);
        if (!$storeLocation) {
            return response()->json(['message' => 'Store Location not found'], 404);
        }

        $storeLocation->delete();

        return response()->json(['message' => 'Store Location deleted successfully'], 200);
    }
}
