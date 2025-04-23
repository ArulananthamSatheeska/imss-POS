<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    protected $fillable = [
        'name',
        'guard_name',
        'module',
        'action'
    ];

    public static function syncFromFrontendConfig()
    {
        // This will be implemented in PermissionSeeder
    }
}
