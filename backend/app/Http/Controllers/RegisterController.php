<?php

namespace App\Http\Controllers;

use App\Models\Register;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Throwable;

class RegisterController extends Controller
{
    public function getStatus(Request $request): JsonResponse
    {
        // Log full request input for debugging
        \Log::info('Register status full request input', $request->all());
        \Log::info('Register status full request query', $request->query());

        // Accept user_id and terminal_id from any request input (query, body, headers)
        $userId = $request->input('user_id') ?? $request->query('user_id') ?? $request->header('user_id');
        $terminalId = $request->input('terminal_id') ?? $request->query('terminal_id') ?? $request->header('terminal_id');

        // Log received parameters for debugging
        \Log::info('Register status request received', ['user_id' => $userId, 'terminal_id' => $terminalId]);

        if (empty($userId) || empty($terminalId)) {
            // Instead of returning error, treat as no open register and return closed status
            return response()->json([
                'status' => 'closed',
                'register' => null,
            ]);
        }

        $openRegister = Register::where('user_id', $userId)
            ->where('terminal_id', $terminalId)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if ($openRegister) {
            return response()->json([
                'status' => 'open',
                'register' => $openRegister,
            ]);
        } else {
            return response()->json([
                'status' => 'closed',
                'register' => null,
            ]);
        }
    }

    public function openRegister(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'terminal_id' => 'required|string',
            'opening_cash' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->input('user_id');
        $terminalId = $request->input('terminal_id');

        $existingOpen = Register::where('user_id', $userId)
            ->where('terminal_id', $terminalId)
            ->where('status', 'open')
            ->first();

        if ($existingOpen) {
            return response()->json([
                'message' => 'A register session is already open for this user and terminal.',
            ], 409);
        }

        try {
            $register = Register::create([
                'user_id' => $userId,
                'terminal_id' => $terminalId,
                'status' => 'open',
                'cash_on_hand' => $request->input('opening_cash'),
                'opened_at' => now(),
            ]);

            return response()->json([
                'message' => 'Register opened successfully.',
                'register' => $register,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Failed to open register: ' . $e->getMessage(),
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
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $register = Register::find($request->input('register_id'));

        if (!$register || $register->status !== 'open') {
            return response()->json([
                'message' => 'No open register session found with the given ID.',
            ], 404);
        }

        try {
            $register->status = 'closed';
            $register->closed_at = now();
            $register->closing_details = $request->input('closing_details', []);
            $register->closing_cash = $request->input('closing_cash');
            $register->save();

            return response()->json([
                'message' => 'Register closed successfully.',
                'register' => $register,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Failed to close register: ' . $e->getMessage(),
            ], 500);
        }
    }
}
