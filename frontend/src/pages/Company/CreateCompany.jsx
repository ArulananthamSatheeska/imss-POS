import React, { useState, useRef, useEffect } from 'react';
import {
    InformationCircleIcon,
    MapPinIcon,
    CreditCardIcon,
    UserCircleIcon,
    CogIcon,
    GlobeAltIcon,
    LockClosedIcon,
    BuildingOfficeIcon
} from '@heroicons/react/20/solid';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';

// Helper to convert camelCase to snake_case (optional, if needed later)
// const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Helper to format date string (YYYY-MM-DD) or return empty string
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        // Handles cases like "2023-10-26T00:00:00.000000Z" or just "2023-10-26"
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return '';
    }
};

function CreateCompany() {
    // const { isNavVisible } = useOutletContext(); // Removed if not used directly here

    const initialCompanyInfo = {
        company_name: '',
        company_type: 'Retail', // Default value
        business_category: '',
        company_logo: null, // Represents the file object for upload
        business_address: '',
        city: '',
        country: '',
        contact_number: '',
        email: '',
        website: '',
        vat_gst_number: '',
        tax_id: '',
        default_currency: 'LKR',
        fiscal_year_start: '',
        fiscal_year_end: '',
        chart_of_accounts: '',
        owner_name: '',
        owner_contact: '',
        admin_username: '',
        admin_password: '', // Keep password empty when fetching/resetting
        user_role: 'Admin',
        invoice_prefix: 'INV-0001',
        default_payment_methods: ['Cash'], // Array for multi-select
        multi_store_support: false,
        default_language: 'English',
        time_zone: '',
        enable_2fa: false, // Changed from enable2FA
        auto_generate_qr: false,
        enable_notifications: false,
        integrate_accounting: false,
    };

    const [companyInfo, setCompanyInfo] = useState(initialCompanyInfo);
    const [existingLogoUrl, setExistingLogoUrl] = useState(null); // To display current logo URL
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null); // To preview newly selected logo

    const refs = {
        company_type: useRef(null),
        business_category: useRef(null),
        company_logo: useRef(null),
        business_address: useRef(null),
        city: useRef(null),
        country: useRef(null),
        contact_number: useRef(null),
        email: useRef(null),
        website: useRef(null),
        vat_gst_number: useRef(null),
        tax_id: useRef(null),
        default_currency: useRef(null),
        fiscal_year_start: useRef(null),
        chart_of_accounts: useRef(null),
        owner_name: useRef(null),
        owner_contact: useRef(null),
        admin_username: useRef(null),
        admin_password: useRef(null),
        user_role: useRef(null),
        invoice_prefix: useRef(null),
        default_payment_methods: useRef(null),
        multi_store_support: useRef(null),
        default_language: useRef(null),
        time_zone: useRef(null),
        enable_2fa: useRef(null),
    };

    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/companies');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            alert('Failed to fetch companies.');
        }
    };

    const fetchCompanyDetails = async (companyName) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/companies/${companyName}`);
            const data = response.data;

            // Prepare data for state update (handle types)
            const preparedData = {
                ...initialCompanyInfo, // Start with defaults
                ...data, // Override with fetched data
                // Ensure correct types
                company_logo: null, // Reset file input, use existingLogoUrl for display
                admin_password: '', // Don't populate password field
                default_payment_methods: Array.isArray(data.default_payment_methods)
                    ? data.default_payment_methods
                    : (data.default_payment_methods ? JSON.parse(data.default_payment_methods) : []), // Ensure array
                multi_store_support: !!data.multi_store_support, // Ensure boolean
                enable_2fa: !!data.enable_2fa,                 // Ensure boolean
                auto_generate_qr: !!data.auto_generate_qr,         // Ensure boolean
                enable_notifications: !!data.enable_notifications,   // Ensure boolean
                integrate_accounting: !!data.integrate_accounting,   // Ensure boolean
                // Format dates for input fields
                fiscal_year_start: formatDateForInput(data.fiscal_year_start),
                fiscal_year_end: formatDateForInput(data.fiscal_year_end),
            };

            setCompanyInfo(preparedData);

            // Set URL for existing logo display (adjust path if needed)
            if (data.company_logo) {
                // Assuming '/storage/' is the public link prefix for your storage
                setExistingLogoUrl(`/storage/${data.company_logo}`);
            } else {
                setExistingLogoUrl(null);
            }
            setLogoPreviewUrl(null); // Clear any previous new logo preview
            setIsEditing(true);
        } catch (error) {
            console.error('Error fetching company details:', error);
            alert('Failed to fetch company details.');
            resetForm(); // Reset if fetch fails
        }
    };

    const handleCompanySelect = (e) => {
        const companyName = e.target.value;
        setSelectedCompany(companyName);
        if (companyName) {
            fetchCompanyDetails(companyName);
        } else {
            resetForm();
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files, options } = e.target;

        if (type === 'file') {
            const file = files[0];
            setCompanyInfo({ ...companyInfo, [name]: file });
            // Create a preview URL for the newly selected file
            if (file) {
                setLogoPreviewUrl(URL.createObjectURL(file));
            } else {
                setLogoPreviewUrl(null);
            }
        } else if (type === 'checkbox') {
            setCompanyInfo({ ...companyInfo, [name]: checked });
        } else if (type === 'select-multiple') {
            // Handle multiple select
            const selectedValues = Array.from(options)
                .filter(option => option.selected)
                .map(option => option.value);
            setCompanyInfo({ ...companyInfo, [name]: selectedValues });
        }
         else {
            setCompanyInfo({ ...companyInfo, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        // Append all fields from companyInfo state
        Object.keys(companyInfo).forEach((key) => {
             // Skip password if it's empty during an update unless it was intentionally changed
             if (isEditing && key === 'admin_password' && !companyInfo[key]) {
                 return;
             }

            if (key === 'company_logo') {
                if (companyInfo[key] instanceof File) {
                    formData.append(key, companyInfo[key]);
                }
                // Don't append if null or not a file (backend handles keeping old logo)
            } else if (key === 'default_payment_methods' && Array.isArray(companyInfo[key])) {
                 // Send array as JSON string for backend compatibility if needed,
                 // or let backend handle array if configured. Laravel often expects JSON string for JSON DB columns via FormData.
                 formData.append(key, JSON.stringify(companyInfo[key]));
            } else if (typeof companyInfo[key] === 'boolean') {
                formData.append(key, companyInfo[key] ? '1' : '0'); // Send booleans as 1 or 0
            }
             else if (companyInfo[key] !== null && companyInfo[key] !== undefined) {
                // Append other non-null/undefined fields
                formData.append(key, companyInfo[key]);
            }
        });

        // --- Crucial for Update ---
        if (isEditing) {
            formData.append('_method', 'PUT'); // Simulate PUT request using POST
        }
        // -------------------------

        const url = isEditing
            ? `http://localhost:8000/api/companies/${selectedCompany}` // Use selectedCompany (original name) for URL
            : 'http://localhost:8000/api/companies';

        const method = isEditing ? 'post' : 'post'; // Always use POST, but add _method for PUT

        try {
            console.log("Submitting FormData:");
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            console.log("URL:", url);
            console.log("Method:", method);
            console.log("Is Editing:", isEditing);


            const response = await axios({
                method: method,
                url: url,
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json' // Important for Laravel validation errors
                },
            });

            alert(`Company ${isEditing ? 'updated' : 'created'} successfully!`);
            console.log('Company saved successfully:', response.data);
            resetForm();
            fetchCompanies(); // Refresh dropdown list

        } catch (error) {
            console.error('Error saving company:', error.response?.data || error.message);
            let errorMsg = `Failed to ${isEditing ? 'update' : 'create'} company. `;
            if (error.response?.data?.errors) {
                 errorMsg += Object.values(error.response.data.errors).flat().join(' '); // Display validation errors
            } else if (error.response?.data?.message) {
                errorMsg += error.response.data.message;
            } else {
                errorMsg += 'Please check the console and try again.';
            }
            alert(errorMsg);
        }
    };


    const resetForm = () => {
        setCompanyInfo(initialCompanyInfo);
        setSelectedCompany('');
        setIsEditing(false);
        setExistingLogoUrl(null);
        setLogoPreviewUrl(null);
        // Clear file input visually if needed (though state reset handles its value)
        if(refs.company_logo.current) {
            refs.company_logo.current.value = "";
        }
    };

    const handleFiscalYearStartChange = (e) => {
        const startDateString = e.target.value;
        if (!startDateString) {
             setCompanyInfo((prev) => ({
                ...prev,
                fiscal_year_start: '',
                fiscal_year_end: '',
            }));
            return;
        }

        try{
            const startDate = new Date(startDateString);
             // Check if startDate is a valid date
            if (isNaN(startDate.getTime())) {
                 setCompanyInfo((prev) => ({ ...prev, fiscal_year_start: startDateString, fiscal_year_end: '' }));
                 return; // Exit if date is invalid
            }

            let endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1); // Go to previous day

            const formattedEndDate = endDate.toISOString().split('T')[0];

            setCompanyInfo((prev) => ({
                ...prev,
                fiscal_year_start: startDateString,
                fiscal_year_end: formattedEndDate,
            }));
        } catch (error) {
            console.error("Error calculating fiscal end date:", error);
             setCompanyInfo((prev) => ({ ...prev, fiscal_year_start: startDateString, fiscal_year_end: '' }));
        }
    };

    // Simplified handleKeyDown - ensure 'refs' keys match state keys
    const handleKeyDown = (e, nextField) => {
        if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault();
            refs[nextField]?.current?.focus();
        }
        // Add ArrowUp logic if needed, requires mapping current field name to previous field name
    };


    return (
        <div className="min-h-screen px-4 py-8 bg-gray-100 dark:bg-gray-900 sm:px-6 lg:px-8">
            <div className="max-w-6xl p-6 mx-auto bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <h1 className="flex items-center justify-center mb-8 text-3xl font-bold text-center text-gray-800 dark:text-white">
                    <BuildingOfficeIcon className="w-8 h-8 mr-3 text-indigo-500" />
                    {isEditing ? 'Update Company' : 'Create Company'}
                </h1>

                {/* Company Selection Dropdown */}
                <div className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Select Company to Edit</label>
                        <select
                            value={selectedCompany}
                            onChange={handleCompanySelect}
                            className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">-- Create New Company --</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.company_name}> {/* Use unique ID if available, value must be name */}
                                    {company.company_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* --- FORM START --- */}
                <form className="max-w-full mx-auto bg-transparent" onSubmit={handleSubmit}>
                    {/* Company Information */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                            <InformationCircleIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Company Information
                        </legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Company Name */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={companyInfo.company_name}
                                    onChange={handleChange}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    required
                                    onKeyDown={(e) => handleKeyDown(e, 'company_type')} // Example nav
                                />
                            </div>
                            {/* Company Type */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Company Type</label>
                                <select
                                    name="company_type"
                                    value={companyInfo.company_type}
                                    onChange={handleChange}
                                    ref={refs.company_type}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'business_category')}
                                >
                                    <option value="">Select Type</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Restaurant">Restaurant</option>
                                    <option value="Service">Service</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                </select>
                            </div>
                             {/* Business Category */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Business Category</label>
                                <input
                                    type="text"
                                    name="business_category"
                                    value={companyInfo.business_category}
                                    onChange={handleChange}
                                    ref={refs.business_category}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'company_logo')}
                                />
                            </div>
                             {/* Company Logo */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
                                <input
                                    type="file"
                                    name="company_logo"
                                    accept="image/*" // Specify acceptable file types
                                    onChange={handleChange}
                                    ref={refs.company_logo}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                    onKeyDown={(e) => handleKeyDown(e, 'business_address')}
                                />
                                {/* Logo Preview Area */}
                                <div className="mt-4">
                                    {logoPreviewUrl ? (
                                        <img src={logoPreviewUrl} alt="New Logo Preview" className="object-cover w-20 h-20 rounded-lg shadow-md" />
                                    ) : isEditing && existingLogoUrl ? (
                                        <img src={existingLogoUrl} alt="Current Company Logo" className="object-cover w-20 h-20 rounded-lg shadow-md" />
                                    ) : (
                                         <div className="flex items-center justify-center w-20 h-20 text-gray-500 bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-400">
                                            No Logo
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {/* Address & Contact Details */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                             <MapPinIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Address & Contact Details
                        </legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                             {/* Business Address */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Business Address</label>
                                <input
                                    type="text"
                                    name="business_address"
                                    value={companyInfo.business_address}
                                    onChange={handleChange}
                                    ref={refs.business_address}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'city')}
                                />
                            </div>
                             {/* City */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={companyInfo.city}
                                    onChange={handleChange}
                                    ref={refs.city}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                     onKeyDown={(e) => handleKeyDown(e, 'country')}
                                />
                            </div>
                            {/* Country */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={companyInfo.country}
                                    onChange={handleChange}
                                    ref={refs.country}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'contact_number')}
                                />
                            </div>
                             {/* Contact Number */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                                <input
                                    type="tel" // Use type 'tel' for phone numbers
                                    name="contact_number"
                                    value={companyInfo.contact_number}
                                    onChange={handleChange}
                                    ref={refs.contact_number}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                     onKeyDown={(e) => handleKeyDown(e, 'email')}
                                />
                            </div>
                            {/* Email Address */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={companyInfo.email}
                                    onChange={handleChange}
                                    ref={refs.email}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                     onKeyDown={(e) => handleKeyDown(e, 'website')}
                                />
                            </div>
                            {/* Website */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Website (Optional)</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={companyInfo.website}
                                    onChange={handleChange}
                                    ref={refs.website}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="https://example.com"
                                     onKeyDown={(e) => handleKeyDown(e, 'vat_gst_number')}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Tax & Financial Details */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                             <CreditCardIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Tax & Financial Details
                        </legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                             {/* VAT/GST */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">VAT / GST Number</label>
                                <input
                                    type="text"
                                    name="vat_gst_number"
                                    value={companyInfo.vat_gst_number}
                                    onChange={handleChange}
                                    ref={refs.vat_gst_number}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                     onKeyDown={(e) => handleKeyDown(e, 'tax_id')}
                                />
                            </div>
                             {/* Tax ID */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
                                <input
                                    type="text"
                                    name="tax_id"
                                    value={companyInfo.tax_id}
                                    onChange={handleChange}
                                    ref={refs.tax_id}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'default_currency')}
                                />
                            </div>
                             {/* Default Currency */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                                <select
                                    name="default_currency"
                                    value={companyInfo.default_currency}
                                    onChange={handleChange}
                                    ref={refs.default_currency}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'fiscal_year_start')}
                                >
                                    <option value="LKR">LKR (Sri Lankan Rupee)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                    <option value="EUR">EUR (Euro)</option>
                                    <option value="GBP">GBP (British Pound)</option>
                                    <option value="INR">INR (Indian Rupee)</option>
                                </select>
                            </div>
                             {/* Fiscal Year Start */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Fiscal Year Start</label>
                                <input
                                    type="date"
                                    name="fiscal_year_start"
                                    value={companyInfo.fiscal_year_start}
                                    onChange={handleFiscalYearStartChange} // Use combined handler
                                    ref={refs.fiscal_year_start}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'chart_of_accounts')} // Navigate from here
                                />
                            </div>
                            {/* Fiscal Year End (Read Only) */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Fiscal Year End</label>
                                <input
                                    type="date"
                                    name="fiscal_year_end"
                                    value={companyInfo.fiscal_year_end}
                                    readOnly
                                    className="p-3 mt-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400"
                                    tabIndex={-1} // Prevent tabbing into read-only field
                                />
                            </div>
                            {/* Chart of Accounts */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Chart of Accounts (Optional)</label>
                                <input
                                    type="text"
                                    name="chart_of_accounts"
                                    value={companyInfo.chart_of_accounts}
                                    onChange={handleChange}
                                    ref={refs.chart_of_accounts}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'owner_name')}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Owner & User Setup */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                             <UserCircleIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Owner & User Setup
                        </legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Owner Name */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Owner Name</label>
                                <input
                                    type="text"
                                    name="owner_name"
                                    value={companyInfo.owner_name}
                                    onChange={handleChange}
                                    ref={refs.owner_name}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'owner_contact')}
                                />
                            </div>
                             {/* Owner Contact */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Owner Contact</label>
                                <input
                                    type="text"
                                    name="owner_contact"
                                    value={companyInfo.owner_contact}
                                    onChange={handleChange}
                                    ref={refs.owner_contact}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'admin_username')}
                                />
                            </div>
                            {/* Admin Username */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Admin Username</label>
                                <input
                                    type="text"
                                    name="admin_username"
                                    value={companyInfo.admin_username}
                                    onChange={handleChange}
                                    ref={refs.admin_username}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'admin_password')}
                                />
                            </div>
                             {/* Admin Password */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">
                                    Admin Password {isEditing ? '(Leave blank to keep current)' : ''}
                                </label>
                                <input
                                    type="password"
                                    name="admin_password"
                                    value={companyInfo.admin_password}
                                    onChange={handleChange}
                                    ref={refs.admin_password}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder={isEditing ? 'Enter new password to change' : 'Required'}
                                    onKeyDown={(e) => handleKeyDown(e, 'user_role')}
                                />
                            </div>
                            {/* User Role */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Admin User Role</label>
                                <select
                                    name="user_role"
                                    value={companyInfo.user_role}
                                    onChange={handleChange}
                                    ref={refs.user_role}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'invoice_prefix')}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    {/* Add other relevant roles if needed */}
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    {/* POS Settings */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                         <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                            <CogIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            POS & System Settings
                        </legend>
                         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                             {/* Invoice Prefix */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Invoice Prefix</label>
                                <input
                                    type="text"
                                    name="invoice_prefix"
                                    value={companyInfo.invoice_prefix}
                                    onChange={handleChange}
                                    ref={refs.invoice_prefix}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'default_payment_methods')}
                                />
                            </div>
                             {/* Default Payment Methods */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Payment Methods</label>
                                <select
                                    multiple // Enable multiple selections
                                    name="default_payment_methods"
                                    value={companyInfo.default_payment_methods} // Bind to the array state
                                    onChange={handleChange} // Use updated handleChange
                                    ref={refs.default_payment_methods}
                                    className="h-32 p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white" // Adjust height for multiple
                                    onKeyDown={(e) => handleKeyDown(e, 'multi_store_support')}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Mobile Payment">Mobile Payment</option>
                                </select>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Hold Ctrl/Cmd to select multiple.</p>
                            </div>
                            {/* Multi-store Support */}
                            <div className="flex flex-col justify-center pt-6"> {/* Adjust alignment */}
                                <label className="flex items-center font-medium text-gray-700 cursor-pointer dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        name="multi_store_support"
                                        checked={companyInfo.multi_store_support}
                                        onChange={handleChange}
                                        ref={refs.multi_store_support}
                                        className="w-5 h-5 mr-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
                                        onKeyDown={(e) => handleKeyDown(e, 'default_language')}
                                    />
                                    Enable Multi-store Support
                                </label>
                            </div>
                        </div>
                    </fieldset>

                    {/* Localization & Security */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                             <GlobeAltIcon className="w-6 h-6 mr-2 text-indigo-500" />
                             <span className='mr-6'>Localization & Security</span>
                             <LockClosedIcon className="w-6 h-6 mr-2 text-indigo-500" />
                        </legend>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                             {/* Default Language */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Language</label>
                                <select
                                    name="default_language"
                                    value={companyInfo.default_language}
                                    onChange={handleChange}
                                    ref={refs.default_language}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'time_zone')}
                                >
                                    <option value="English">English</option>
                                    <option value="Sinhala">Sinhala</option>
                                    <option value="Tamil">Tamil</option>
                                </select>
                            </div>
                             {/* Time Zone */}
                             <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Time Zone</label>
                                {/* Consider using a dropdown for timezones */}
                                <input
                                    type="text"
                                    name="time_zone"
                                    value={companyInfo.time_zone}
                                    onChange={handleChange}
                                    ref={refs.time_zone}
                                    placeholder="e.g., Asia/Colombo"
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    onKeyDown={(e) => handleKeyDown(e, 'enable_2fa')}
                                />
                            </div>
                            {/* Enable 2FA */}
                             <div className="flex flex-col justify-center pt-6"> {/* Adjust alignment */}
                                <label className="flex items-center font-medium text-gray-700 cursor-pointer dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        name="enable_2fa" // Changed from enable2FA
                                        checked={companyInfo.enable_2fa}
                                        onChange={handleChange}
                                        ref={refs.enable_2fa}
                                         className="w-5 h-5 mr-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
                                        // Add onKeyDown if needed for next field
                                    />
                                    Enable Two-Factor Auth (2FA)
                                </label>
                             </div>

                             {/* Optional: Add other checkboxes here if needed (auto_generate_qr, etc.) */}

                        </div>
                    </fieldset>


                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                         <button
                            type="button" // Important: type="button" to prevent form submission
                            onClick={resetForm}
                            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancel / Reset
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            disabled={!companyInfo.company_name} // Basic validation example
                        >
                            {isEditing ? 'Update Company' : 'Create Company'}
                        </button>
                    </div>
                </form>
                 {/* --- FORM END --- */}
            </div>
        </div>
    );
}

export default CreateCompany;