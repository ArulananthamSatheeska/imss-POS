<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AddDeletedUsersPermission extends Seeder
{
    public function run()
    {
        $permission = Permission::firstOrCreate([
            'name' => 'UserManagement.ViewDeleted',
            'guard_name' => 'api'
        ]);

        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permission);
        }
    }
}
