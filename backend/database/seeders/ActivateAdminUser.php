<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ActivateAdminUser extends Seeder
{
    public function run()
    {
        DB::transaction(function () {
            $admin = User::where('email', 'admin@example.com')->first();
            
            if ($admin) {
                $admin->update([
                    'is_active' => true,
                    'email_verified_at' => now()
                ]);
                echo "Admin user activated successfully!\n";
            } else {
                echo "No admin user found to activate\n";
            }
        });
    }
}
