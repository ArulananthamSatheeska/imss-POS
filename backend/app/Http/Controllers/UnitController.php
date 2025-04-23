<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    // Get all units
    public function index()
    {
        return response()->json(Unit::all(), 200);  // 200 OK
    }

    // Get a specific unit by ID
    public function show($id)
    {
        $unit = Unit::find($id);

        if ($unit) {
            return response()->json($unit, 200);  // 200 OK
        }

        return response()->json(['message' => 'Unit not found'], 404);  // 404 Not Found
    }

    // Create a new unit
    public function store(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'unit_name' => 'required|string|max:255',  // unit_name is required and should be a string
        ]);

        // Create a new unit in the database
        $unit = Unit::create($request->only('unit_name'));

        return response()->json($unit, 201);  // 201 Created
    }

    // Update an existing unit by ID
    public function update(Request $request, $id)
    {
        $unit = Unit::find($id);

        if (!$unit) {
            return response()->json(['message' => 'Unit not found'], 404);  // 404 Not Found
        }

        // Validate the incoming request data
        $request->validate([
            'unit_name' => 'required|string|max:255',  // unit_name is required and should be a string
        ]);

        // Update the unit in the database
        $unit->update($request->only('unit_name'));

        return response()->json($unit, 200);  // 200 OK
    }

    // Delete a unit by ID
    public function destroy($id)
    {
        $unit = Unit::find($id);

        if (!$unit) {
            return response()->json(['message' => 'Unit not found'], 404);  // 404 Not Found
        }

        // Delete the unit from the database
        $unit->delete();

        return response()->json(['message' => 'Unit deleted successfully'], 200);  // 200 OK
    }
}
