<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            ['name' => 'admin', 'description' => 'System Administrator'],
            ['name' => 'superadmin', 'description' => 'Super Administrator with all access'],
            ['name' => 'manager', 'description' => 'Store Manager'],
            ['name' => 'cashier', 'description' => 'Point of Sale Operator'],
            ['name' => 'storekeeper', 'description' => 'Inventory Manager']
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
