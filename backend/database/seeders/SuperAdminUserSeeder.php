<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminUserSeeder extends Seeder
{
    public function run()
    {
        $superadmin = User::firstOrCreate(
            ['email' => 'info@imss.lk'],
            [
                'name' => 'IMSS',
                'password' => Hash::make('imss@2025'),
                'role' => 'superadmin',
                'status' => 'active',
                'photo' => null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        $superadmin->assignRole('superadmin');
    }
}
