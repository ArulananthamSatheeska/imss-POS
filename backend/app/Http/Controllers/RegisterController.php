<?php

namespace App\Http\Controllers;

use App\Models\Register;
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

            $openRegister = Register::where('user_id', $userId)
                ->where('status', 'open')
                ->whereNull('closed_at')
                ->latest('opened_at')
                ->first();

            return response()->json([
                'status' => $openRegister ? 'open' : 'closed',
                'register' => $openRegister,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Register status check failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to check register status'
            ], 500);
        }
    }

    public function openRegister(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'terminal_id' => 'required|string|max:255',
            'opening_cash' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            \Log::error('Register open validation failed', ['errors' => $validator->errors()->toArray(), 'input' => $request->all()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $userId = $request->input('user_id');
            $terminalId = $request->input('terminal_id');

            // Check for existing open register
            $existingOpen = Register::where('user_id', $userId)
                ->where('status', 'open')
                ->whereNull('closed_at')
                ->first();

            if ($existingOpen) {
                DB::rollBack();
                return response()->json([
                    'message' => 'User already has an open register session',
                    'register' => $existingOpen
                ], 409);
            }

            $register = Register::create([
                'user_id' => $userId,
                'terminal_id' => $terminalId,
                'status' => 'open',
                'cash_on_hand' => $request->input('opening_cash'),
                'opened_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Register opened successfully',
                'register' => $register,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Register open failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to open register',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function closeRegister(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'register_id' => 'required|integer|exists:registers,id',
            'closing_cash' => 'required|numeric|min:0',
            'closing_details' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $register = Register::find($request->input('register_id'));

            if (!$register || $register->status !== 'open') {
                DB::rollBack();
                return response()->json([
                    'message' => 'No open register session found'
                ], 404);
            }

            $register->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closing_cash' => $request->input('closing_cash'),
                'closing_details' => $request->input('closing_details', []),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Register closed successfully',
                'register' => $register
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Register close failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to close register',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}