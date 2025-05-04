<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureRegisterIsOpen
{
    /**
     * Handle an incoming request.
     *
     * Check if the authenticated user has an open cash registry.
     * If not, block access or redirect.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $openRegister = $user->cashRegistries()
            ->where('status', 'open')
            ->whereNull('closed_at')
            ->latest('opened_at')
            ->first();

        if (!$openRegister) {
            return response()->json(['message' => 'Cash register is not open. Please open your cash registry before proceeding.'], 403);
        }

        // Optionally, you can attach the open register to the request for downstream use
        $request->attributes->set('openRegister', $openRegister);

        return $next($request);
    }
}
