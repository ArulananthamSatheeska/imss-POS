<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'company_type',
        'business_category',
        'company_logo',
        'business_address',
        'city',
        'country',
        'contact_number',
        'email',
        'website',
        'vat_gst_number',
        'tax_id',
        'default_currency',
        'fiscal_year_start',
        'fiscal_year_end',
        'chart_of_accounts',
        'owner_name',
        'owner_contact',
        'admin_username',
        'admin_password',
        'user_role',
        'invoice_prefix',
        'default_payment_methods',
        'multi_store_support',
        'default_language',
        'time_zone',
        'enable_2fa',
        'auto_generate_qr',
        'enable_notifications',
        'integrate_accounting',
    ];

    protected $casts = [
        'default_payment_methods' => 'array',
        'multi_store_support' => 'boolean',
        'enable_2fa' => 'boolean',
        'auto_generate_qr' => 'boolean',
        'enable_notifications' => 'boolean',
        'integrate_accounting' => 'boolean',
        'fiscal_year_start' => 'date',
        'fiscal_year_end' => 'date',
    ];
}
