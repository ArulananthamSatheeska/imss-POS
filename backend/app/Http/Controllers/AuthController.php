<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        // Assign default 'cashier' role to new users
        $user->assignRole('cashier');

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user' => [
                'token' => $token,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role
            ]
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $credentials = $request->only('email', 'password');
        
        try {
            if (!$token = auth('api')->attempt($credentials)) {
                return response()->json(['error' => 'Invalid credentials'], 401);
            }

            $user = auth('api')->user();
            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()->name ?? null,
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'is_active' => $user->is_active,
                ]
            ]);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Could not create token'], 500);
        }
    }

    public function me()
    {
        $user = Auth::user();
       
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->roles->first()->name
        ]);
    }

    public function verifyToken()
    {
        try {
            JWTAuth::parseToken()->authenticate();
            return response()->json(['valid' => true]);
        } catch (JWTException $e) {
            return response()->json(['valid' => false], 401);
        }
    }

    public function refreshToken()
    {
        try {
            $token = JWTAuth::parseToken()->refresh();
            return response()->json(['token' => $token]);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Token refresh failed'], 401);
        }
    }

    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Logged out successfully']);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Failed to log out'], 500);
        }
    }
}
