<?php

namespace App\Http\Controllers;

use App\Models\ProductionCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductionCategoryController extends Controller
{
    public function index()
    {
        return response()->json(ProductionCategory::all(), 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:production_categories',
            'batch_number' => 'required|string|unique:production_categories',
            'production_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = ProductionCategory::create($request->all());
        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = ProductionCategory::findOrFail($id);
        return response()->json($category, 200);
    }

    public function update(Request $request, $id)
    {
        $category = ProductionCategory::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:production_categories,name,' . $id,
            'batch_number' => 'required|string|unique:production_categories,batch_number,' . $id,
            'production_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category->update($request->all());
        return response()->json($category, 200);
    }

    public function destroy($id)
    {
        $category = ProductionCategory::findOrFail($id);
        $category->delete();
        return response()->json(null, 204);
    }
}