<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->unique();
            $table->string('company_type')->nullable();
            $table->string('business_category')->nullable();
            $table->string('company_logo')->nullable();
            $table->text('business_address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('vat_gst_number')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('default_currency')->default('LKR');
            $table->date('fiscal_year_start')->nullable();
            $table->date('fiscal_year_end')->nullable();
            $table->string('chart_of_accounts')->nullable();
            $table->string('owner_name')->nullable();
            $table->string('owner_contact')->nullable();
            $table->string('admin_username')->nullable();
            $table->string('admin_password')->nullable();
            $table->string('user_role')->default('Admin');
            $table->string('invoice_prefix')->default('INV-0001');
            $table->json('default_payment_methods')->nullable();
            $table->boolean('multi_store_support')->default(false);
            $table->string('default_language')->default('English');
            $table->string('time_zone')->nullable();
            $table->boolean('enable_2fa')->default(false);
            $table->boolean('auto_generate_qr')->default(false);
            $table->boolean('enable_notifications')->default(false);
            $table->boolean('integrate_accounting')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
