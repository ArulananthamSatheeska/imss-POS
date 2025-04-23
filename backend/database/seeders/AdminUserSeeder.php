<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'photo' => null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        $admin->assignRole('admin');

        $superadmin = User::firstOrCreate(
            ['email' => 'rusaith@gmail.com'],
            [
                'name' => 'Rusaith',
                'password' => Hash::make('Rusaith72Mim'),
                'role' => 'superadmin',
                'status' => 'active',
                'photo' => null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        $superadmin->assignRole('superadmin');
        $superadmin->syncPermissions(\App\Models\Permission::all());
    }
}
