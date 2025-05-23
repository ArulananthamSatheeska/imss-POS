<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; // Import Log facade for debugging
use Illuminate\Validation\Rule; // Import Rule for unique validation on update


class CompanyController extends Controller
{
    /**
     * Get all companies.
     */
    public function index()
    {
        // Optionally select fewer fields for the list view
        $companies = Company::select('id', 'company_name')->get();
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
        // Note: Model casts handle boolean/date/json conversion for the response
        return response()->json($company, 200);
    }

    /**
     * Prepare validation rules.
     * $companyId is null for store, and the ID for update.
     */
    private function validationRules($companyId = null) {
        $rules = [
            // Use Rule::unique for update scenarios
            'company_name' => [
                'required',
                'string',
                'max:255',
                $companyId
                    ? Rule::unique('companies')->ignore($companyId)
                    : 'unique:companies,company_name'
            ],
            'company_type' => 'nullable|string|max:255',
            'business_category' => 'nullable|string|max:255',
            'company_logo' => 'nullable|file|image|max:2048', // Max 2MB
            'business_address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'vat_gst_number' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'default_currency' => 'nullable|string|max:10',
            'fiscal_year_start' => 'nullable|date_format:Y-m-d',
            'fiscal_year_end' => 'nullable|date_format:Y-m-d|after_or_equal:fiscal_year_start',
            'chart_of_accounts' => 'nullable|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'owner_contact' => 'nullable|string|max:50',
            'admin_username' => 'nullable|string|max:255',
            // Password validation: required on create, optional on update
            'admin_password' => [$companyId ? 'nullable' : 'required', 'string', 'min:8'], // Example: min 8 chars
            'user_role' => 'nullable|string|max:50',
            'invoice_prefix' => 'nullable|string|max:50',
            'default_payment_methods' => 'nullable|json', // Expect JSON string from FormData
            'multi_store_support' => 'nullable|boolean',
            'default_language' => 'nullable|string|max:50',
            'time_zone' => 'nullable|string|max:100',
            'enable_2fa' => 'nullable|boolean',
            'auto_generate_qr' => 'nullable|boolean',
            'enable_notifications' => 'nullable|boolean',
            'integrate_accounting' => 'nullable|boolean',
        ];

         // If updating and password is not provided or empty, remove password validation
         if ($companyId && request()->missing('admin_password')) {
            unset($rules['admin_password']);
        }

        return $rules;
    }

    /**
     * Prepare data for saving (handle boolean/json conversions from FormData).
     */
     private function prepareSaveData(array $validatedData, Request $request, ?Company $company = null) {
        // Handle file upload
        if ($request->hasFile('company_logo')) {
            // Delete old logo if updating and it exists
            if ($company && $company->company_logo) {
                Storage::disk('public')->delete($company->company_logo);
            }
            // Store new logo (e.g., in 'public/storage/logos')
            $path = $request->file('company_logo')->store('logos', 'public');
            $validatedData['company_logo'] = $path;
        } else {
             // If not updating logo, remove it from data to avoid overwriting with null
             unset($validatedData['company_logo']);
        }


        // Hash admin password if provided and not empty
        if (!empty($validatedData['admin_password'])) {
            $validatedData['admin_password'] = Hash::make($validatedData['admin_password']);
        } else {
            // Don't update password if field is empty/missing during update
            unset($validatedData['admin_password']);
        }

        // Convert checkbox ('1'/'0'/null) values to boolean
        $booleanFields = ['multi_store_support', 'enable_2fa', 'auto_generate_qr', 'enable_notifications', 'integrate_accounting'];
        foreach ($booleanFields as $field) {
            if (isset($validatedData[$field])) {
                // Check explicitly for '1' as true, otherwise false
                 $validatedData[$field] = ($validatedData[$field] == '1');
            } else if ($company) {
                 // If field is missing in update request, keep existing value
                 unset($validatedData[$field]);
            }
            else {
                // Default to false on create if missing
                $validatedData[$field] = false;
            }
        }

         // Decode JSON string for default_payment_methods if present
        if (isset($validatedData['default_payment_methods'])) {
             $decoded = json_decode($validatedData['default_payment_methods'], true);
             // Ensure it's an array after decoding, or default to empty array
             $validatedData['default_payment_methods'] = is_array($decoded) ? $decoded : [];
        }


        return $validatedData;
     }


    /**
     * Create a new company.
     */
    public function store(Request $request)
    {
        Log::info('Store Request Data:', $request->all()); // Log incoming data

        // Use helper function for validation rules
        $validated = $request->validate($this->validationRules());

        // Use helper function to prepare data (hashing, booleans, file)
        $saveData = $this->prepareSaveData($validated, $request);

        try {
            $company = Company::create($saveData);
            return response()->json($company, 201);
        } catch (\Exception $e) {
            Log::error('Error creating company:', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Error creating company.'], 500);
        }
    }

    /**
     * Update an existing company.
     */
    public function update(Request $request, $company_name)
    {
         Log::info('Update Request Data for ' . $company_name . ':', $request->all()); // Log incoming data

        $company = Company::where('company_name', $company_name)->first();

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        // Use helper function for validation, passing company ID
        $validated = $request->validate($this->validationRules($company->id));

        // Use helper function to prepare data (hashing, booleans, file)
        $saveData = $this->prepareSaveData($validated, $request, $company);


        try {
            $company->update($saveData);
            // Return the updated company data (model casts handle output format)
            return response()->json($company->fresh(), 200);
        } catch (\Exception $e) {
            Log::error('Error updating company:', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Error updating company.'], 500);
        }
    }

    public function destroy($company_name)
    {
        // Decode the name just in case of URL encoding issues
        $decoded_company_name = urldecode($company_name);
        Log::info('Attempting to delete company:', ['original_name' => $company_name, 'decoded_name' => $decoded_company_name]);

        $company = Company::where('company_name', $decoded_company_name)->first(); // Use decoded name

        if (!$company) {
            Log::warning('Company not found for deletion:', ['decoded_name' => $decoded_company_name]);
            return response()->json(['message' => 'Company not found'], 404);
        }

        Log::info('Found company to delete:', ['id' => $company->id, 'name' => $company->company_name, 'logo_path' => $company->company_logo]); // Log details

        try {
            // 1. Delete associated logo file from storage if it exists
            if ($company->company_logo) {
                $logoPath = $company->company_logo;
                Log::info('Checking if logo exists:', ['path' => $logoPath, 'disk' => 'public']);

                if (Storage::disk('public')->exists($logoPath)) {
                    Log::info('Attempting to delete logo file:', ['path' => $logoPath]);
                    $deleted = Storage::disk('public')->delete($logoPath); // Check return value
                    if ($deleted) {
                    Log::info('Successfully deleted company logo file.');
                    } else {
                    Log::warning('Storage::delete returned false for logo.', ['path' => $logoPath]);
                    }
                } else {
                    Log::warning('Company logo file not found in storage using Storage::exists.', ['path' => $logoPath]);
                }
            } else {
                Log::info('Company record has no associated logo path.');
            }

            // 2. Delete the company record from the database
            Log::info('Attempting to delete company record from DB:', ['id' => $company->id]);
            $company->delete();
            Log::info('Successfully deleted company record from DB.');

            // 3. Return success response
            return response()->json(['message' => 'Company deleted successfully'], 200);

        } catch (\Illuminate\Database\QueryException $qe) { // Catch specific DB errors
            Log::error('Database error deleting company:', [
                'company_name' => $decoded_company_name, 'id' => $company->id,
                'message' => $qe->getMessage(),
                'sql_error_code' => $qe->getCode(), // Log SQL error code
                'trace' => $qe->getTraceAsString()
            ]);
            // Check for foreign key constraint error (MySQL code 1451)
            if ($qe->getCode() == '23000' || $qe->errorInfo[1] == 1451) {
                return response()->json(['message' => 'Cannot delete company. It might be referenced by other records (e.g., users, invoices).'], 409); // 409 Conflict
            }
            return response()->json(['message' => 'Database error during deletion. Please check server logs.'], 500);

        } catch (\Exception $e) { // Catch general errors
            Log::error('General error deleting company:', [
                'company_name' => $decoded_company_name, 'id' => $company->id,
                'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error deleting company. Please check server logs.'], 500);
        }
    }
}