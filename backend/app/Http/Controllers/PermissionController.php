<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        return Permission::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name',
            'description' => 'nullable|string'
        ]);

        $permission = Permission::create([
            'name' => $request->name,
            'description' => $request->description,
            'guard_name' => 'api'
        ]);

        return response()->json($permission, 201);
    }

    public function show(Permission $permission)
    {
        return $permission;
    }

    public function update(Request $request, Permission $permission)
    {
        $request->validate([
            'name' => 'sometimes|string|unique:permissions,name,'.$permission->id,
            'description' => 'nullable|string'
        ]);

        $permission->update($request->only(['name', 'description']));
        return response()->json($permission);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return response()->noContent();
    }
}
