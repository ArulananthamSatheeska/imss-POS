<?php

namespace App\Http\Controllers;

use App\Http\Requests\DiscountSchemeRequest;
use App\Models\DiscountScheme;
use Illuminate\Http\JsonResponse;

class DiscountSchemeController extends Controller
{
    public function index(): JsonResponse
    {
        $schemes = DiscountScheme::all();
        return response()->json(['data' => $schemes], 200);
    }

    public function store(DiscountSchemeRequest $request): JsonResponse
    {
        $scheme = DiscountScheme::create($request->validated());
        return response()->json(['data' => $scheme, 'message' => 'Discount scheme created successfully'], 201);
    }

    public function show(DiscountScheme $scheme): JsonResponse
    {
        return response()->json(['data' => $scheme], 200);
    }

    public function update(DiscountSchemeRequest $request, DiscountScheme $scheme): JsonResponse
    {
        $scheme->update($request->validated());
        return response()->json(['data' => $scheme, 'message' => 'Discount scheme updated successfully'], 200);
    }

    public function destroy(DiscountScheme $scheme): JsonResponse
    {
        $scheme->delete();
        return response()->json(['message' => 'Discount scheme deleted successfully'], 200);
    }
}