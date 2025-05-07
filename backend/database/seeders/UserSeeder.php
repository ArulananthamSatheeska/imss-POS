<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        $users = [
            [
                'email' => 'ilango@imss.lk',
                'name' => 'Ilanggo',
                'password' => 'ilango@123',
                'role' => 'cashier',
            ],
  
            [
                'email' => 'dinojini@imss.lk',
                'name' => 'Dinojini',
                'password' => 'dinojini@123',
                'role' => 'cashier',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'status' => 'active',
                    'photo' => null,
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            $user->assignRole($userData['role']);
        }
    }
}
