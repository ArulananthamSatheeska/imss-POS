<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class CompanyController extends Controller
{
    /**
     * Get all companies.
     */
    public function index()
    {
        $companies = Company::all();
        return response()->json($companies, 200);
    }

    /**
     * Get a specific company by name.
     */
    public function show($company_name)
    {
        $company = Company::where('company_name', $company_name)->first();

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        return response()->json($company, 200);
    }

    /**
     * Create a new company.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|unique:companies',
            'company_type' => 'nullable|string',
            'business_category' => 'nullable|string',
            'company_logo' => 'nullable|file|image|max:2048',
            'business_address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'email' => 'nullable|email',
            'website' => 'nullable|url',
            'vat_gst_number' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'default_currency' => 'nullable|string',
            'fiscal_year_start' => 'nullable|date',
            'fiscal_year_end' => 'nullable|date',
            'chart_of_accounts' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'owner_contact' => 'nullable|string',
            'admin_username' => 'nullable|string',
            'admin_password' => 'nullable|string',
            'user_role' => 'nullable|string',
            'invoice_prefix' => 'nullable|string',
            'default_payment_methods' => 'nullable|json',
            'multi_store_support' => 'nullable|boolean',
            'default_language' => 'nullable|string',
            'time_zone' => 'nullable|string',
            'enable_2fa' => 'nullable|boolean',
            'auto_generate_qr' => 'nullable|boolean',
            'enable_notifications' => 'nullable|boolean',
            'integrate_accounting' => 'nullable|boolean',
        ]);

        // Handle file upload for company logo
        if ($request->hasFile('company_logo')) {
            $path = $request->file('company_logo')->store('logos', 'public');
            $validated['company_logo'] = $path;
        }

        // Hash admin password if provided
        if (!empty($validated['admin_password'])) {
            $validated['admin_password'] = Hash::make($validated['admin_password']);
        }

        $company = Company::create($validated);

        return response()->json($company, 201);
    }

    /**
     * Update an existing company.
     */
    public function update(Request $request, $company_name)
    {
        $company = Company::where('company_name', $company_name)->first();

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|unique:companies,company_name,' . $company->id,
            'company_type' => 'nullable|string',
            'business_category' => 'nullable|string',
            'company_logo' => 'nullable|file|image|max:2048',
            'business_address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'email' => 'nullable|email',
            'website' => 'nullable|url',
            'vat_gst_number' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'default_currency' => 'nullable|string',
            'fiscal_year_start' => 'nullable|date',
            'fiscal_year_end' => 'nullable|date',
            'chart_of_accounts' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'owner_contact' => 'nullable|string',
            'admin_username' => 'nullable|string',
            'admin_password' => 'nullable|string',
            'user_role' => 'nullable|string',
            'invoice_prefix' => 'nullable|string',
            'default_payment_methods' => 'nullable|json',
            'multi_store_support' => 'nullable|boolean',
            'default_language' => 'nullable|string',
            'time_zone' => 'nullable|string',
            'enable_2fa' => 'nullable|boolean',
            'auto_generate_qr' => 'nullable|boolean',
            'enable_notifications' => 'nullable|boolean',
            'integrate_accounting' => 'nullable|boolean',
        ]);

        // Handle file upload for company logo
        if ($request->hasFile('company_logo')) {
            // Delete old logo if exists
            if ($company->company_logo) {
                Storage::disk('public')->delete($company->company_logo);
            }
            $path = $request->file('company_logo')->store('logos', 'public');
            $validated['company_logo'] = $path;
        }

        // Hash admin password if provided
        if (!empty($validated['admin_password'])) {
            $validated['admin_password'] = Hash::make($validated['admin_password']);
        } else {
            unset($validated['admin_password']); // Do not update password if not provided
        }

        $company->update($validated);

        return response()->json($company, 200);
    }
}