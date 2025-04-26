<?php

namespace App\Http\Controllers;

use App\Models\ProductionItem;
use App\Models\ProductionItemFormula;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProductionItemController extends Controller
{
    public function index()
    {
        return response()->json(ProductionItem::with(['category', 'formulas.rawMaterial'])->get(), 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'category_id' => 'required|exists:production_categories,id',
            'sales_price' => 'required|numeric|min:0',
            'wholesale_price' => 'required|numeric|min:0',
            'mrp_price' => 'required|numeric|min:0',
            'raw_materials' => 'required|array',
            'raw_materials.*.raw_material_id' => 'required|exists:raw_materials,id',
            'raw_materials.*.quantity' => 'required|numeric|min:0',
            'raw_materials.*.price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $productionItem = ProductionItem::create([
                'name' => $request->name,
                'category_id' => $request->category_id,
                'sales_price' => $request->sales_price,
                'wholesale_price' => $request->wholesale_price,
                'mrp_price' => $request->mrp_price,
            ]);

            foreach ($request->raw_materials as $material) {
                ProductionItemFormula::create([
                    'production_item_id' => $productionItem->id,
                    'raw_material_id' => $material['raw_material_id'],
                    'quantity' => $material['quantity'],
                    'price' => $material['price'],
                ]);
            }

            return response()->json($productionItem->load(['category', 'formulas.rawMaterial']), 201);
        });
    }

    public function show($id)
    {
        $productionItem = ProductionItem::with(['category', 'formulas.rawMaterial'])->findOrFail($id);
        return response()->json($productionItem, 200);
    }

    public function update(Request $request, $id)
    {
        $productionItem = ProductionItem::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'category_id' => 'required|exists:production_categories,id',
            'sales_price' => 'required|numeric|min:0',
            'wholesale_price' => 'required|numeric|min:0',
            'mrp_price' => 'required|numeric|min:0',
            'raw_materials' => 'required|array',
            'raw_materials.*.raw_material_id' => 'required|exists:raw_materials,id',
            'raw_materials.*.quantity' => 'required|numeric|min:0',
            'raw_materials.*.price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request, $productionItem) {
            $productionItem->update([
                'name' => $request->name,
                'category_id' => $request->category_id,
                'sales_price' => $request->sales_price,
                'wholesale_price' => $request->wholesale_price,
                'mrp_price' => $request->mrp_price,
            ]);

            $productionItem->formulas()->delete();
            foreach ($request->raw_materials as $material) {
                ProductionItemFormula::create([
                    'production_item_id' => $productionItem->id,
                    'raw_material_id' => $material['raw_material_id'],
                    'quantity' => $material['quantity'],
                    'price' => $material['price'],
                ]);
            }

            return response()->json($productionItem->load(['category', 'formulas.rawMaterial']), 200);
        });
    }

    public function destroy($id)
    {
        $productionItem = ProductionItem::findOrFail($id);
        $productionItem->delete();
        return response()->json(null, 204);
    }
}