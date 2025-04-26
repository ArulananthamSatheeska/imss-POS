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

function CreateCompany() {
    const { isNavVisible } = useOutletContext();

    const [companyInfo, setCompanyInfo] = useState({
        company_name: '',
        companyType: '',
        businessCategory: '',
        companyLogo: null,
        businessAddress: '',
        city: '',
        country: '',
        contactNumber: '',
        email: '',
        website: '',
        vatGstNumber: '',
        taxId: '',
        defaultCurrency: 'LKR',
        fiscalYearStart: '',
        fiscalYearEnd: '',
        chartOfAccounts: '',
        ownerName: '',
        ownerContact: '',
        adminUsername: '',
        adminPassword: '',
        userRole: 'Admin',
        invoicePrefix: 'INV-0001',
        defaultPaymentMethods: ['Cash'],
        multiStoreSupport: false,
        defaultLanguage: 'English',
        timeZone: '',
        enable2FA: false,
        autoGenerateQR: false,
        enableNotifications: false,
        integrateAccounting: false,
    });

    const refs = {
        companyType: useRef(null),
        businessCategory: useRef(null),
        companyLogo: useRef(null),
        businessAddress: useRef(null),
        city: useRef(null),
        country: useRef(null),
        contactNumber: useRef(null),
        email: useRef(null),
        website: useRef(null),
        vatGstNumber: useRef(null),
        taxId: useRef(null),
        defaultCurrency: useRef(null),
        fiscalYearStart: useRef(null),
        chartOfAccounts: useRef(null),
        ownerName: useRef(null),
        ownerContact: useRef(null),
        adminUsername: useRef(null),
        adminPassword: useRef(null),
        userRole: useRef(null),
        invoicePrefix: useRef(null),
        defaultPaymentMethods: useRef(null),
        multiStoreSupport: useRef(null),
        defaultLanguage: useRef(null),
        timeZone: useRef(null),
        enable2FA: useRef(null),
    };

    const [companies, setCompanies] = useState([]); // List of companies for dropdown
    const [selectedCompany, setSelectedCompany] = useState(''); // Selected company for update
    const [isEditing, setIsEditing] = useState(false); // Flag to check if updating

    // Fetch all companies on component mount
    useEffect(() => {
        fetchCompanies();
    }, []);

    // Fetch list of companies
    const fetchCompanies = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/companies');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            alert('Failed to fetch companies.');
        }
    };

    // Fetch company details when a company is selected
    const fetchCompanyDetails = async (companyName) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/companies/${companyName}`);
            const data = response.data;
            setCompanyInfo(data); // Populate form with fetched data
            setIsEditing(true); // Set editing mode to true
        } catch (error) {
            console.error('Error fetching company details:', error);
            alert('Failed to fetch company details.');
        }
    };

    // Handle company selection
    const handleCompanySelect = (e) => {
        const companyName = e.target.value;
        setSelectedCompany(companyName);
        if (companyName) {
            fetchCompanyDetails(companyName); // Fetch details if a company is selected
        } else {
            // Reset form if no company is selected
            setCompanyInfo({
                company_name: '',
                companyType: '',
                businessCategory: '',
                companyLogo: null,
                businessAddress: '',
                city: '',
                country: '',
                contactNumber: '',
                email: '',
                website: '',
                vatGstNumber: '',
                taxId: '',
                defaultCurrency: 'LKR',
                fiscalYearStart: '',
                fiscalYearEnd: '',
                chartOfAccounts: '',
                ownerName: '',
                ownerContact: '',
                adminUsername: '',
                adminPassword: '',
                userRole: 'Admin',
                defaultLanguage: 'English',
                timeZone: '',
                enable2FA: false,
                autoGenerateQR: false,
                enableNotifications: false,
                integrateAccounting: false,
            });
            setIsEditing(false); // Set editing mode to false
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setCompanyInfo({ ...companyInfo, [name]: files[0] });
        } else if (type === 'checkbox') {
            setCompanyInfo({ ...companyInfo, [name]: checked });
        } else {
            setCompanyInfo({ ...companyInfo, [name]: value });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare form data for submission
        const formData = new FormData();
        Object.keys(companyInfo).forEach((key) => {
            if (key === 'companyLogo' && companyInfo[key]) {
                formData.append(key, companyInfo[key]); // Append file
            } else if (Array.isArray(companyInfo[key])) {
                formData.append(key, JSON.stringify(companyInfo[key])); // Convert arrays to JSON strings
            } else {
                formData.append(key, companyInfo[key]); // Append other fields
            }
        });

        try {
            let response;
            if (isEditing) {
                // Update existing company
                response = await axios.put(`http://localhost:8000/api/companies/${selectedCompany}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                alert('Company updated successfully!');
            } else {
                // Create new company
                response = await axios.post('http://localhost:8000/api/companies', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                alert('Company created successfully!');
            }

            console.log('Company saved successfully:', response.data);
            resetForm(); // Reset form after submission
            fetchCompanies(); // Refresh the list of companies
        } catch (error) {
            console.error('Error saving company:', error.response?.data || error.message);
            alert('Failed to save company. Please try again.');
        }
    };

    // Reset form to initial state
    const resetForm = () => {
        setCompanyInfo({
            company_name: '',
            companyType: '',
            businessCategory: '',
            companyLogo: null,
            businessAddress: '',
            city: '',
            country: '',
            contactNumber: '',
            email: '',
            website: '',
            vatGstNumber: '',
            taxId: '',
            defaultCurrency: 'LKR',
            fiscalYearStart: '',
            fiscalYearEnd: '',
            chartOfAccounts: '',
            ownerName: '',
            ownerContact: '',
            adminUsername: '',
            adminPassword: '',
            userRole: 'Admin',
            invoicePrefix: 'INV-0001',
            defaultPaymentMethods: ['Cash'],
            multiStoreSupport: false,
            defaultLanguage: 'English',
            timeZone: '',
            enable2FA: false,
            autoGenerateQR: false,
            enableNotifications: false,
            integrateAccounting: false,
        });
        setSelectedCompany('');
        setIsEditing(false);
    };

    const handleFiscalYearStartChange = (e) => {
        const startDate = new Date(e.target.value);
        let endDate = new Date(startDate);

        // Move to the same month in the next year
        endDate.setFullYear(endDate.getFullYear() + 1);

        // Set to the last day of the same month next year
        endDate.setDate(0);

        // Format to YYYY-MM-DD for date input
        const formattedEndDate = endDate.toISOString().split('T')[0];

        setCompanyInfo((prev) => ({
            ...prev,
            fiscalYearStart: e.target.value,
            fiscalYearEnd: formattedEndDate, // Correct format
        }));
    };
    const handleKeyDown = (e, nextField) => {
        if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault(); // Prevent form submission on Enter
            refs[nextField]?.current?.focus(); // Move focus to the next field
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            refs[e.target.name]?.current?.focus(); // Move focus to previous field
        }
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
                        <label className="font-medium text-gray-700 dark:text-gray-300">Select Company</label>
                        <select
                            value={selectedCompany}
                            onChange={handleCompanySelect}
                            className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Select a company</option>
                            {companies.map((company) => (
                                <option key={company.company_name} value={company.company_name}>
                                    {company.company_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Form Fields (Same as before) */}
                <form className="max-w-full mx-auto bg-transparent" onSubmit={handleSubmit}>
                    {/* Company Information */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                            <InformationCircleIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Company Information
                        </legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={companyInfo.company_name}
                                    onChange={handleChange}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Business Category</label>
                                <input
                                    type="text"
                                    name="businessCategory"
                                    value={companyInfo.businessCategory}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'companyLogo')}
                                    ref={refs.businessCategory}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Company Type</label>
                                <select
                                    name="companyType"
                                    value={companyInfo.companyType}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'businessCategory')}
                                    ref={refs.companyType}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="Retail">Retail</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Restaurant">Restaurant</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
                                <input
                                    type="file"
                                    name="companyLogo"
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'businessAddress')}
                                    ref={refs.companyLogo}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                />
                                {companyInfo.companyLogo && (
                                    <img src={URL.createObjectURL(companyInfo.companyLogo)} alt="Company Logo" className="object-cover w-20 h-20 mt-4 rounded-lg shadow-md" />
                                )}
                            </div>                        </div>
                    </fieldset>

                    {/* Address & Contact Details */}
                    <fieldset className="p-6 mb-8 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
                            <MapPinIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Address & Contact Details
                        </legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Business Address</label>
                                <input
                                    type="text"
                                    name="businessAddress"
                                    value={companyInfo.businessAddress}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'city')}
                                    ref={refs.businessAddress}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={companyInfo.city}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'country')}
                                    ref={refs.city}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={companyInfo.country}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'contactNumber')}
                                    ref={refs.country}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    value={companyInfo.contactNumber}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'email')}
                                    ref={refs.contactNumber}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={companyInfo.email}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'website')}
                                    ref={refs.email}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Website (Optional)</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={companyInfo.website}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'vatGstNumber')}
                                    ref={refs.website}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">VAT / GST Number</label>
                                <input
                                    type="text"
                                    name="vatGstNumber"
                                    value={companyInfo.vatGstNumber}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'taxId')}
                                    ref={refs.vatGstNumber}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={companyInfo.taxId}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'defaultCurrency')}
                                    ref={refs.taxId}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                                <select
                                    name="defaultCurrency"
                                    value={companyInfo.defaultCurrency}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'fiscalYearStart')}
                                    ref={refs.defaultCurrency}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="LKR">LKR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Fiscal Year Start</label>
                                <input
                                    type="date"
                                    name="fiscalYearStart"
                                    value={companyInfo.fiscalYearStart}
                                    onChange={(e) => {
                                        handleChange(e);
                                        handleFiscalYearStartChange(e); // Ensure Fiscal Year End updates dynamically
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, 'fiscalYearEnd')}
                                    ref={refs.fiscalYearStart}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Fiscal Year End</label>
                                <input
                                    type="date"
                                    name="fiscalYearEnd"
                                    value={companyInfo.fiscalYearEnd}
                                    readOnly // Prevent manual editing
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Chart of Accounts</label>
                                <input
                                    type="text"
                                    name="chartOfAccounts"
                                    value={companyInfo.chartOfAccounts}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'ownerName')}
                                    ref={refs.chartOfAccounts}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Owner Name</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={companyInfo.ownerName}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'ownerContact')}
                                    ref={refs.ownerName}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Owner Contact</label>
                                <input
                                    type="text"
                                    name="ownerContact"
                                    value={companyInfo.ownerContact}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'adminUsername')}
                                    ref={refs.ownerContact}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Admin Username</label>
                                <input
                                    type="text"
                                    name="adminUsername"
                                    value={companyInfo.adminUsername}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'adminPassword')}
                                    ref={refs.adminUsername}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Admin Password</label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    value={companyInfo.adminPassword}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'userRole')}
                                    ref={refs.adminPassword}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">User Role</label>
                                <select
                                    name="userRole"
                                    value={companyInfo.userRole}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'invoicePrefix')}
                                    ref={refs.userRole}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Cashier">Cashier</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    {/* POS Settings */}
                    <fieldset className="p-6 mb-8 text-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <legend className="flex items-center mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
                            <CogIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            POS Settings
                        </legend>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Default Invoice Prefix */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Invoice Prefix:</label>
                                <input
                                    type="text"
                                    name="invoicePrefix"
                                    value={companyInfo.invoicePrefix}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'defaultPaymentMethods')}
                                    ref={refs.invoicePrefix}
                                    className="p-3 mt-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 dark:bg-amber-600 dark:text-white"
                                />
                            </div>

                            {/* Default Payment Methods */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Default Payment Methods:</label>
                                <select
                                    multiple
                                    name="defaultPaymentMethods"
                                    value={companyInfo.defaultPaymentMethods}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'multiStoreSupport')}
                                    ref={refs.defaultPaymentMethods}
                                    className="p-3 mt-2 text-black border border-gray-600 rounded-lg bg-slate-100 dark:bg-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>

                            {/* Multi-store Support */}
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Multi-store Support:</label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="multiStoreSupport"
                                        checked={companyInfo.multiStoreSupport}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'defaultLanguage')}
                                        ref={refs.multiStoreSupport}
                                        className="p-3 mt-2 text-black border border-gray-600 rounded-lg bg:gray-200 dark:bg-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <span className="ml-2 text-black dark:text-white">Multi-Store functionality</span>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {/* Multi-Language & Localization */}
                    <fieldset className="p-6 mb-8 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
                            <GlobeAltIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Multi-Language & Localization
                        </legend>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="block text-gray-700 dark:text-gray-300">
                                <span className="text-gray-700 dark:text-gray-300">Default Language:</span>
                                <select
                                    name="defaultLanguage"
                                    value={companyInfo.defaultLanguage}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'timeZone')}
                                    ref={refs.defaultLanguage}
                                    className="p-3 mt-2 text-black border border-gray-600 rounded-lg bg:gray-200 dark:bg-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="English">English</option>
                                    <option value="Sinhala">Sinhala</option>
                                    <option value="Tamil">Tamil</option>
                                </select>
                            </label>
                            <label className="block text-gray-700 dark:text-gray-300">
                                <span className="text-gray-700 dark:text-gray-300">Time Zone:</span>
                                <input
                                    type="text"
                                    name="timeZone"
                                    value={companyInfo.timeZone}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'enable2FA')}
                                    ref={refs.timeZone}
                                    className="p-3 mt-2 text-black border border-gray-600 rounded-lg bg:gray-200 dark:bg-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </label>
                        </div>
                    </fieldset>

                    {/* Security & Permissions */}
                    <fieldset className="p-6 mb-8 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <legend className="flex items-center mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
                            <LockClosedIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            Security & Permissions
                        </legend>
                        <div className="space-y-4">
                            <label className="block text-gray-700 dark:text-gray-300">
                                <span className="text-gray-700 dark:text-gray-300">Enable Two-Factor Authentication (2FA):</span>
                                <input
                                    type="checkbox"
                                    name="enable2FA"
                                    checked={companyInfo.enable2FA}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'autoGenerateQR')}
                                    ref={refs.enable2FA}
                                    className="block mt-1"
                                />
                            </label>
                        </div>
                    </fieldset>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {isEditing ? 'Update Company' : 'Create Company'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateCompany;