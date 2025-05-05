<?php

namespace App\Http\Controllers;

use App\Models\CashRegistry;
use App\Models\CashMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RegisterController extends Controller
{
    public function getStatus(Request $request): JsonResponse
    {
        try {
            $userId = $request->input('user_id') ?? $request->query('user_id') ?? $request->header('user_id');

            if (empty($userId)) {
                return response()->json([
                    'status' => 'closed',
                    'register' => null,
                ]);
            }

            $openRegister = CashRegistry::where('user_id', $userId)
                ->where('status', 'open')
                ->whereNull('closed_at')
                ->latest('opened_at')
                ->first();

            if ($openRegister) {
                $registerArray = $openRegister->toArray();
                // Add cash_on_hand field for frontend compatibility
                $registerArray['cash_on_hand'] = $openRegister->opening_balance;

                // Calculate total sales amount between opened_at and now
                $totalSales = \App\Models\Sale::where('created_at', '>=', $openRegister->opened_at)
                    ->where('created_at', '<=', now())
                    ->sum('total');

                // Calculate total sales quantity between opened_at and now
                $totalSalesQty = \App\Models\SaleItem::whereHas('sale', function ($query) use ($openRegister) {
                    $query->where('created_at', '>=', $openRegister->opened_at)
                          ->where('created_at', '<=', now());
                })->sum('quantity');

                $registerArray['total_sales'] = $totalSales;
                $registerArray['total_sales_qty'] = $totalSalesQty;
                $registerArray['opening_cash'] = $openRegister->opening_balance;
            } else {
                $registerArray = null;
            }

            return response()->json([
                'status' => $openRegister ? 'open' : 'closed',
                'register' => $registerArray,
            ]);

        } catch (\Exception $e) {
            Log::error('Register status check failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to check register status'
            ], 500);
        }
    }

    public function openShift(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'terminal_id' => 'required|string|max:50',
            'opening_cash' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            Log::error('Open shift validation failed', ['errors' => $validator->errors()->toArray(), 'input' => $request->all()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $userId = $request->input('user_id');
            $terminalId = $request->input('terminal_id');

            // Check for existing open register for this user and terminal
            $existingOpen = CashRegistry::where('user_id', $userId)
                ->where('terminal_id', $terminalId)
                ->where('status', 'open')
                ->whereNull('closed_at')
                ->first();

            if ($existingOpen) {
                DB::rollBack();
                return response()->json([
                    'message' => 'User already has an open cash registry session on this terminal',
                    'register' => $existingOpen
                ], 409);
            }

            $register = CashRegistry::create([
                'user_id' => $userId,
                'terminal_id' => $terminalId,
                'opening_balance' => $request->input('opening_cash'),
                'opened_at' => now(),
                'status' => 'open',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Cash registry opened successfully',
                'register' => $register,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Open shift failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to open cash registry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function closeShift(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'register_id' => 'required|integer|exists:cash_registries,id',
            'closing_balance' => 'required|numeric|min:0',
            'actual_cash' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $register = CashRegistry::find($request->input('register_id'));

            if (!$register || $register->status !== 'open') {
                DB::rollBack();
                return response()->json([
                    'message' => 'No open cash registry session found'
                ], 404);
            }

            // Calculate expected cash on hand
            $cashIn = $register->cashMovements()->where('type', 'in')->sum('amount');
            $cashOut = $register->cashMovements()->where('type', 'out')->sum('amount');
            $expectedCash = $register->opening_balance + $cashIn - $cashOut;

            $actualCash = $request->input('actual_cash');

            // Optional: Validate actual cash against expected cash with tolerance
            $tolerance = 5.00; // increased tolerance to allow minor discrepancies
            if (abs($expectedCash - $actualCash) > $tolerance) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Actual cash does not match expected cash on hand',
                    'expected_cash' => $expectedCash,
                    'actual_cash' => $actualCash,
                ], 422);
            }

            // Fetch total sales amount between opened_at and now
            $totalSales = \App\Models\Sale::where('created_at', '>=', $register->opened_at)
                ->where('created_at', '<=', now())
                ->sum('total');

            // Fetch total sales quantity between opened_at and now
            $totalSalesQty = \App\Models\SaleItem::whereHas('sale', function ($query) use ($register) {
                $query->where('created_at', '>=', $register->opened_at)
                      ->where('created_at', '<=', now());
            })->sum('quantity');

            $register->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closing_balance' => $request->input('closing_balance'),
                'actual_cash' => $actualCash,
                'total_sales' => $totalSales, // Assuming this column exists in cash_registries table
                'total_sales_qty' => $totalSalesQty, // Add this column to cash_registries table
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Cash registry closed successfully',
                'register' => $register,
                'total_sales' => $totalSales,
                'total_sales_qty' => $totalSalesQty,
                'opening_cash' => $register->opening_balance,
                'closing_time' => $register->closed_at,
                'notes' => $register->notes ?? '',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Close shift failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to close cash registry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addCash(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'register_id' => 'required|integer|exists:cash_registries,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $register = CashRegistry::find($request->input('register_id'));

            if (!$register || $register->status !== 'open') {
                return response()->json([
                    'message' => 'No open cash registry session found'
                ], 404);
            }

            $movement = CashMovement::create([
                'registry_id' => $register->id,
                'type' => 'in',
                'amount' => $request->input('amount'),
                'reason' => $request->input('reason'),
                'created_at' => now(),
            ]);

            // Optionally update the cash registry's closing_balance or other fields if needed

            return response()->json([
                'message' => 'Cash added successfully',
                'movement' => $movement,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Add cash failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to add cash',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function removeCash(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'register_id' => 'required|integer|exists:cash_registries,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $register = CashRegistry::find($request->input('register_id'));

            if (!$register || $register->status !== 'open') {
                return response()->json([
                    'message' => 'No open cash registry session found'
                ], 404);
            }

            $movement = CashMovement::create([
                'registry_id' => $register->id,
                'type' => 'out',
                'amount' => $request->input('amount'),
                'reason' => $request->input('reason'),
                'created_at' => now(),
            ]);

            // Optionally update the cash registry's closing_balance or other fields if needed

            return response()->json([
                'message' => 'Cash removed successfully',
                'movement' => $movement,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Remove cash failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to remove cash',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getCurrentRegistry(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;

            $openRegister = CashRegistry::where('user_id', $userId)
                ->where('status', 'open')
                ->whereNull('closed_at')
                ->latest('opened_at')
                ->first();

            if (!$openRegister) {
                return response()->json([
                    'message' => 'No open cash registry found',
                    'register' => null,
                ], 404);
            }

            return response()->json([
                'register' => $openRegister,
            ]);
        } catch (\Exception $e) {
            Log::error('Get current registry failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to get current cash registry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRegistryReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'user_id' => 'nullable|integer|exists:users,id',
            'status' => 'nullable|in:open,closed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = CashRegistry::query();

            if ($request->filled('start_date')) {
                $query->whereDate('opened_at', '>=', $request->input('start_date'));
            }

            if ($request->filled('end_date')) {
                $query->whereDate('closed_at', '<=', $request->input('end_date'));
            }

            if ($request->filled('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $registries = $query->with('cashMovements', 'user')->get();

            return response()->json([
                'registries' => $registries,
            ]);
        } catch (\Exception $e) {
            Log::error('Get registry report failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to get registry report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
