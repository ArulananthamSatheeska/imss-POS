<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RolePermissionMiddleware
{
    public function handle(Request $request, Closure $next, $permission = null): Response
    {
        \Log::info('RolePermissionMiddleware - Checking permissions for: '.$request->route()->uri());
        $user = Auth::user();
        
        if (!$user) {
            \Log::error('No authenticated user in RolePermissionMiddleware');
            abort(401, 'Unauthenticated');
        }

        // Allow superadmin and admin to bypass all checks
        if ($user->hasRole('superadmin') || $user->hasRole('admin')) {
            return $next($request);
        }

        // Check if route requires specific permission
        if ($permission && !$user->can($permission)) {
            abort(403, 'Unauthorized action.');
        }

        // Check module access based on route prefix
        $module = $this->getModuleFromRequest($request);
        if ($module && !$user->can("{$module}.View")) {
            abort(403, 'Unauthorized access to this module.');
        }

        return $next($request);
    }

    protected function getModuleFromRequest(Request $request): ?string
    {
        $routePrefix = explode('/', $request->route()->getPrefix())[0] ?? null;
        
        return match($routePrefix) {
            'users' => 'UserManagement',
            'items' => 'Item',
            'categories' => 'Categories',
            'store-locations' => 'StoreLocations',
            'sales' => 'Sales',
            'purchasing' => 'Purchasing',
            default => null
        };
    }
}
