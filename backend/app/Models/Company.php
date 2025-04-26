<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    // Ensure all fields submitted by the form are here
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
        'admin_password', // Allow mass assignment for creation/update
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

    // Hidden fields (like password) if you don't want them returned by default
    protected $hidden = [
       // 'admin_password', // Uncomment if you want to hide password in API responses
    ];


    // Casts help Eloquent handle data types automatically
    protected $casts = [
        'default_payment_methods' => 'array', // Handles JSON<->array conversion
        'multi_store_support' => 'boolean',
        'enable_2fa' => 'boolean',
        'auto_generate_qr' => 'boolean',
        'enable_notifications' => 'boolean',
        'integrate_accounting' => 'boolean',
        'fiscal_year_start' => 'date:Y-m-d', // Specify format if needed
        'fiscal_year_end' => 'date:Y-m-d',   // Specify format if needed
    ];
}