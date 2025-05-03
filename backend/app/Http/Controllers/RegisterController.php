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
    $userId = $request->input('user_id') ?? $request->query('user_id') ?? $request->header('user_id');
    $terminalId = $request->input('terminal_id') ?? $request->query('terminal_id') ?? $request->header('terminal_id');

    if (empty($userId) || empty($terminalId)) {
        return response()->json([
            'status' => 'closed',
            'register' => null,
        ]);
    }

    // Add additional check for terminal_id match
    $openRegister = Register::where('user_id', $userId)
        ->where('terminal_id', $terminalId)
        ->where('status', 'open')
        ->whereNull('closed_at')
        ->latest('opened_at')
        ->first();

    return response()->json([
        'status' => $openRegister ? 'open' : 'closed',
        'register' => $openRegister,
    ]);
}

public function openRegister(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'user_id' => 'required|integer|exists:users,id',
        'terminal_id' => 'required|string',
        'opening_cash' => 'required|numeric|min:0',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
    }

    return DB::transaction(function () use ($request) {
        $userId = $request->input('user_id');
        $terminalId = $request->input('terminal_id');

        $existingOpen = Register::where('user_id', $userId)
            ->where('terminal_id', $terminalId)
            ->where('status', 'open')
            ->lockForUpdate()
            ->first();

        if ($existingOpen) {
            return response()->json([
                'message' => 'Register already open for this user/terminal',
            ], 409);
        }

        $register = Register::create([
            'user_id' => $userId,
            'terminal_id' => $terminalId,
            'status' => 'open',
            'cash_on_hand' => $request->input('opening_cash'),
            'opened_at' => now(),
        ]);

        return response()->json([
            'message' => 'Register opened successfully',
            'register' => $register,
        ], 201);
    });
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
