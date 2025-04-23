<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Product permissions
            'products.view',
            'products.create', 
            'products.edit',
            'products.delete',

            // Sale permissions
            'sales.view',
            'sales.create',
            'sales.edit',
            'sales.delete',

            // User permissions
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Report permissions
            'reports.view',
            'reports.generate'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'api'
            ]);
        }

        // Create roles and assign permissions
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin->syncPermissions(Permission::all());

        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'api']);
        $superadmin->syncPermissions(Permission::all());

        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'api']);
        $manager->givePermissionTo([
            'products.view',
            'products.create',
            'products.edit',
            'sales.view',
            'sales.create',
            'sales.edit',
            'users.view',
            'reports.view',
            'reports.generate'
        ]);

        $cashier = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'api']);
        $cashier->givePermissionTo([
            'products.view',
            'sales.view',
            'sales.create'
        ]);

        $storekeeper = Role::firstOrCreate(['name' => 'storekeeper', 'guard_name' => 'api']);
        $storekeeper->givePermissionTo([
            'products.view',
            'products.create',
            'products.edit'
        ]);

        // Assign admin role to first user
        $user = User::first();
        if ($user) {
            $user->assignRole('admin');
        }
    }
}
