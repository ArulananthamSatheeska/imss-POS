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
            ['email' => 'Sharvaksha@imss.lk'],
            [
                'name' => 'Sharvaksha',
                'password' => Hash::make('sharvaksha@123'),
                'role' => 'admin',
                'status' => 'active',
                'photo' => null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        $admin->assignRole('admin');

       

    }
}
