<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MultipleUsersSeeder extends Seeder
{
    public function run()
    {
        // Creating multiple users
        $users = [
            [
                'email' => 'admin@example.com',
                'name' => 'Admin',
                'password' => 'password123',
                'role' => 'admin',
            ],
            [
                'email' => 'storekeeper@example.com',
                'name' => 'Storekeeper',
                'password' => 'password123',
                'role' => 'storekeeper',
            ],
            [
                'email' => 'manager@example.com',
                'name' => 'Manager',
                'password' => 'password123',
                'role' => 'manager',
            ],
            [
                'email' => 'superadmin@example.com',
                'name' => 'Super Admin',
                'password' => 'password123',
                'role' => 'superadmin',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'status' => 'active',
                    'photo' => null,
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );

            $user->assignRole($userData['role']); // Assign the role to the new user
        }
    }
}
