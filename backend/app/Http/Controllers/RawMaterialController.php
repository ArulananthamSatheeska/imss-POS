<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\Supplier;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RawMaterialController extends Controller
{
    public function index()
    {
        return response()->json(RawMaterial::with(['category', 'unit', 'supplier'])->get(), 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'category_id' => 'required|exists:production_categories,id',
            'stock' => 'required|numeric|min:0',
            'unit_id' => 'required|exists:units,id',
            'barcode' => 'nullable|string|unique:raw_materials',
            'supplier_id' => 'required|exists:suppliers,id',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $rawMaterial = RawMaterial::create($request->all());
        return response()->json($rawMaterial->load(['category', 'unit', 'supplier']), 201);
    }

    public function show($id)
    {
        $rawMaterial = RawMaterial::with(['category', 'unit', 'supplier'])->findOrFail($id);
        return response()->json($rawMaterial, 200);
    }

    public function update(Request $request, $id)
    {
        $rawMaterial = RawMaterial::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'category_id' => 'required|exists:production_categories,id',
            'stock' => 'required|numeric|min:0',
            'unit_id' => 'required|exists:units,id',
            'barcode' => 'nullable|string|unique:raw_materials,barcode,' . $id,
            'supplier_id' => 'required|exists:suppliers,id',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $rawMaterial->update($request->all());
        return response()->json($rawMaterial->load(['category', 'unit', 'supplier']), 200);
    }

    public function destroy($id)
    {
        $rawMaterial = RawMaterial::findOrFail($id);
        $rawMaterial->delete();
        return response()->json(null, 204);
    }

    public function getSuppliers()
    {
        return response()->json(Supplier::all(), 200);
    }

    public function getUnits()
    {
        return response()->json(Unit::all(), 200);
    }
}