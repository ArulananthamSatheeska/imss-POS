<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class NewUserSeeder extends Seeder
{
    public function run()
    {
        // Adding a new user
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Rusaith',
                'password' => Hash::make('7253@Mim'),
                'role' => 'user', // Specify the role for the new user
                'status' => 'active',
                'photo' => null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        $user->assignRole('user'); // Assign the role to the new user
    }
}
