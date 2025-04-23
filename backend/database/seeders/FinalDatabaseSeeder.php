<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FinalDatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            PermissionSeeder::class,
            AdminUserSeeder::class,
            MultipleUsersSeeder::class, // Add the multiple users seeder
            AddDeletedUsersPermission::class
        ]);
    }
}
