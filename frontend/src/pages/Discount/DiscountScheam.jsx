import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Helper function to check if a date is in the past (considers the whole day)
const isDateInPast = (dateString) => {
    if (!dateString) return false; // No end date means it never expires based on date
    try {
        // Set time to the end of the day for comparison
        const endDate = new Date(dateString);
        endDate.setHours(23, 59, 59, 999);
        return endDate < new Date(); // Is the end of the specified day before now?
    } catch (e) {
        console.error("Error parsing date for past check:", dateString, e);
        return false; // Treat parse errors as not in the past
    }
};

// Helper function to calculate the effective active status
const calculateEffectiveActiveStatus = (scheme) => {
    // Must have active flag set AND (no end date OR end date is not in the past)
    return scheme.active && !isDateInPast(scheme.endDate);
};


const DiscountScheam = () => {
    const [schemes, setSchemes] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '',
        type: 'percentage',
        value: '',
        appliesTo: 'product',
        target: '',
        startDate: '',
        endDate: '',
        active: true, // User's intended active state
    });
    const [editSchemeId, setEditSchemeId] = useState(null);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [schemeToDelete, setSchemeToDelete] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [filterSearchTerm, setFilterSearchTerm] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const productInputRef = useRef(null);
    const categoryInputRef = useRef(null);
    const modalRef = useRef(null);
    const filterInputRef = useRef(null);
    const schemesListRef = useRef(null);

    // Fetch products, categories, and discount schemes on component mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const productResponse = await axios.get('http://127.0.0.1:8000/api/products');
                setProducts(Array.isArray(productResponse.data.data) ? productResponse.data.data : []);

                const categoryResponse = await axios.get('http://127.0.0.1:8000/api/categories');
                setCategories(Array.isArray(categoryResponse.data) ? categoryResponse.data : []);

                const schemeResponse = await axios.get('http://127.0.0.1:8000/api/discount-schemes');
                // Format schemes, keep original 'active' flag separate from effective status
                const fetchedSchemes = (Array.isArray(schemeResponse.data.data) ? schemeResponse.data.data : []).map(s => ({
                    ...s,
                    appliesTo: s.applies_to,
                    startDate: s.start_date,
                    endDate: s.end_date,
                    // 'active' here is the value stored in the DB (user's last saved intent)
                    // We will calculate effective status dynamically where needed
                }));

                // --- Optional: Update backend for schemes that *became* inactive due to date ---
                // This can be resource-intensive if done frequently on frontend load.
                // Consider a backend job for this if possible.
                // const schemesToUpdate = fetchedSchemes.filter(s =>
                //     s.active && isDateInPast(s.endDate)
                // );
                // for (const scheme of schemesToUpdate) {
                //     try {
                //         console.log(`Scheme ${scheme.id} has expired, attempting to update backend status to inactive.`);
                //         await axios.put(`http://127.0.0.1:8000/api/discount-schemes/${scheme.id}`, {
                //             ...scheme, // Send original data
                //             active: false, // Set inactive
                //             // Ensure backend field names are correct
                //             applies_to: scheme.appliesTo,
                //             start_date: scheme.startDate,
                //             end_date: scheme.endDate
                //         });
                //         // Update the flag in our fetched data immediately
                //         scheme.active = false;
                //     } catch (error) {
                //         console.error(`Error auto-updating expired scheme ${scheme.id} status:`, error);
                //         // Proceed even if update fails, display will still show inactive
                //     }
                // }
                // --- End Optional Backend Update ---

                setSchemes(fetchedSchemes);

            } catch (error) {
                console.error('Error fetching data:', error);
                setProducts([]);
                setCategories([]);
                setSchemes([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // Run only on mount

    // Close dropdowns and modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (form.appliesTo === 'product' && productInputRef.current && !productInputRef.current.contains(event.target)) {
                setIsProductDropdownOpen(false);
            }
            if (form.appliesTo === 'category' && categoryInputRef.current && !categoryInputRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
            if (filterInputRef.current && !filterInputRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowDeleteModal(false);
                setSchemeToDelete(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [form.appliesTo]); // Re-run if appliesTo changes refs

    // Close modal/dropdowns with Escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (showDeleteModal) {
                    setShowDeleteModal(false);
                    setSchemeToDelete(null);
                }
                if (isFilterDropdownOpen) setIsFilterDropdownOpen(false);
                if (isProductDropdownOpen) setIsProductDropdownOpen(false);
                if (isCategoryDropdownOpen) setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showDeleteModal, isFilterDropdownOpen, isProductDropdownOpen, isCategoryDropdownOpen]); // Dependencies are correct

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'appliesTo') {
            setForm((prev) => ({
                ...prev,
                [name]: value,
                target: '', // Reset target when type changes
            }));
            setSearchTerm('');
            setIsProductDropdownOpen(false);
            setIsCategoryDropdownOpen(false);
        } else if (name === 'target') {
            setSearchTerm(value); // Update search term as user types
            setForm((prev) => ({ ...prev, [name]: value })); // Update form state
            if (form.appliesTo === 'product') {
                setIsProductDropdownOpen(true);
            } else if (form.appliesTo === 'category') {
                setIsCategoryDropdownOpen(true);
            }
        } else {
             // For 'active' checkbox, use checked, otherwise use value
            setForm((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    // When selecting from dropdown
    const handleSelect = (value, type) => {
        setForm((prev) => ({ ...prev, target: value }));
        setSearchTerm(value); // Sync search term display with selected value
        if (type === 'product') {
            setIsProductDropdownOpen(false);
        } else {
            setIsCategoryDropdownOpen(false);
        }
    };

     // When selecting from *filter* dropdown
    const handleFilterSelect = (value, type) => {
        setFilterValue(value); // This is the actual value to filter by
        setFilterSearchTerm(value); // Update the input display
        setIsFilterDropdownOpen(false);
    };

    // Populate form for editing
    const handleEdit = (scheme) => {
        setForm({
            name: scheme.name,
            type: scheme.type,
            value: scheme.value,
            appliesTo: scheme.appliesTo,
            target: scheme.target,
            // Use formatDate for date inputs, handle null/undefined
            startDate: formatDate(scheme.startDate) === 'N/A' ? '' : formatDate(scheme.startDate),
            endDate: formatDate(scheme.endDate) === 'N/A' ? '' : formatDate(scheme.endDate),
            // Set checkbox based on the *saved* active status from DB
            active: scheme.active,
        });
        setSearchTerm(scheme.target); // Pre-fill search term for product/category
        setEditSchemeId(scheme.id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const handleCancelEdit = () => {
        // Reset form to initial state
        setForm({
            name: '',
            type: 'percentage',
            value: '',
            appliesTo: 'product',
            target: '',
            startDate: '',
            endDate: '',
            active: true,
        });
        setSearchTerm('');
        setEditSchemeId(null);
        setIsProductDropdownOpen(false);
        setIsCategoryDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Input Validations ---
        if (form.appliesTo === 'product' && !products.some((p) => p.product_name === form.target)) {
            alert('Please select a valid product from the list.');
            return;
        }
        if (form.appliesTo === 'category' && !categories.some((c) => c.name === form.target)) {
            alert('Please select a valid category from the list.');
            return;
        }
        if (form.appliesTo === 'customerGroup' && !form.target.trim()) {
            alert('Please enter a customer group name.');
            return;
        }
        if (form.value === '' || parseFloat(form.value) < 0) {
            alert('Please enter a valid non-negative discount value.');
            return;
        }
        if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
            alert('End date cannot be earlier than the start date.');
            return;
        }
        // --- End Validations ---


        // Calculate the final active status to be sent to the backend
        const finalActiveStatus = form.active && !isDateInPast(form.endDate);

        // Prepare payload with backend-expected field names
        const payload = {
            name: form.name,
            type: form.type,
            value: form.value,
            applies_to: form.appliesTo, // Use snake_case
            target: form.target,
            start_date: form.startDate || null, // Use snake_case, send null if empty
            end_date: form.endDate || null,   // Use snake_case, send null if empty
            active: finalActiveStatus, // Send the calculated final status
        };

        try {
            let response;
            if (editSchemeId) {
                // --- Update Existing Scheme ---
                response = await axios.put(`http://127.0.0.1:8000/api/discount-schemes/${editSchemeId}`, payload);
                const updatedScheme = { // Map response back to frontend state structure
                    ...response.data.data,
                    appliesTo: response.data.data.applies_to,
                    startDate: response.data.data.start_date,
                    endDate: response.data.data.end_date
                    // 'active' flag comes directly from the response (which should reflect finalActiveStatus)
                };
                // Update the scheme in the local state
                setSchemes(
                    schemes.map((scheme) =>
                        scheme.id === editSchemeId ? updatedScheme : scheme
                    )
                );
                alert('Discount scheme updated successfully!');
            } else {
                // --- Create New Scheme ---
                response = await axios.post('http://127.0.0.1:8000/api/discount-schemes', payload);
                 const newScheme = { // Map response back to frontend state structure
                    ...response.data.data,
                    appliesTo: response.data.data.applies_to,
                    startDate: response.data.data.start_date,
                    endDate: response.data.data.end_date
                };
                // Add the new scheme to the local state
                setSchemes([...schemes, newScheme]);
                alert('Discount scheme created successfully!');
            }

            handleCancelEdit(); // Reset form after successful operation

        } catch (error) {
            console.error('Error saving discount scheme:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || `Failed to ${editSchemeId ? 'update' : 'create'} discount scheme.`;
            alert(errorMsg);
        }
    };

    // Initiate deletion process
    const handleDelete = (id) => {
        setSchemeToDelete(id);
        setShowDeleteModal(true);
    };

    // Confirm and execute deletion
    const confirmDelete = async () => {
        if (!schemeToDelete) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/discount-schemes/${schemeToDelete}`);
            // Remove from local state
            setSchemes(schemes.filter((scheme) => scheme.id !== schemeToDelete));
            setShowDeleteModal(false);
            setSchemeToDelete(null);
            alert('Discount scheme deleted successfully!');
        } catch (error) {
            console.error('Error deleting discount scheme:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || 'Failed to delete discount scheme.';
            alert(errorMsg);
            // Keep modal open on error? Or close? Let's close it.
            setShowDeleteModal(false);
            setSchemeToDelete(null);
        }
    };

    // Cancel deletion from modal
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSchemeToDelete(null);
    };

    // Handle changes in filter inputs
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'filterType') {
            setFilterType(value);
            setFilterValue(''); // Reset value when type changes
            setFilterSearchTerm(''); // Reset search term
            setIsFilterDropdownOpen(false);
            if (value === 'date') { // Default date filter to today
                const today = new Date().toISOString().split('T')[0];
                setFilterValue(today);
            }
        } else if (name === 'filterValue') {
            setFilterValue(value); // Update the actual filter value
            // If it's a searchable type, update search term and open dropdown
            if (filterType === 'category' || filterType === 'product') {
                setFilterSearchTerm(value);
                setIsFilterDropdownOpen(true);
            } else {
                setIsFilterDropdownOpen(false); // Close dropdown for non-search types
            }
        }
    };

    // Clear all filters
    const clearFilter = () => {
        setFilterType('');
        setFilterValue('');
        setFilterSearchTerm('');
        setIsFilterDropdownOpen(false);
    };

    // Format currency
    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return 'N/A';
        // Simple formatting, adjust locale/options as needed
        return `Rs. ${num.toFixed(2)}`;
    };

    // Format date as YYYY-MM-DD, handles invalid/null dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            // Check if the date is valid after parsing
            if (isNaN(date.getTime())) {
                 return 'N/A';
            }
            const year = date.getFullYear();
            // getMonth is 0-indexed, padStart adds leading zero if needed
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return 'N/A'; // Return N/A on error
        }
    };

    // Memoized filtered lists for performance
    const filteredProducts = useMemo(() => products.filter((product) =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    const filteredCategories = useMemo(() => categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [categories, searchTerm]);

    // For the filter dropdowns
    const filteredFilterProducts = useMemo(() => products.filter((product) =>
        product.product_name.toLowerCase().includes(filterSearchTerm.toLowerCase())
    ), [products, filterSearchTerm]);

    const filteredFilterCategories = useMemo(() => categories.filter((category) =>
        category.name.toLowerCase().includes(filterSearchTerm.toLowerCase())
    ), [categories, filterSearchTerm]);

    // Memoized list of schemes based on active filters
    const filteredSchemes = useMemo(() => {
        // Start with all schemes
        let result = schemes;

        if (filterType && filterValue) {
            result = result.filter((scheme) => {
                try {
                    // Calculate effective status for filtering
                    const isEffectivelyActive = calculateEffectiveActiveStatus(scheme);

                    if (filterType === 'status') {
                        const filterStatus = filterValue === 'true'; // Convert filter string to boolean
                        return isEffectivelyActive === filterStatus;
                    }
                    if (filterType === 'date') {
                         // Check if the scheme is active *on* the filter date
                        const filterDate = new Date(filterValue);
                        if (isNaN(filterDate.getTime())) return false; // Invalid filter date
                        filterDate.setHours(0, 0, 0, 0); // Start of filter day

                        const schemeStartDate = scheme.startDate ? new Date(scheme.startDate) : null;
                        if (schemeStartDate) schemeStartDate.setHours(0, 0, 0, 0);

                        const schemeEndDate = scheme.endDate ? new Date(scheme.endDate) : null;
                        if (schemeEndDate) schemeEndDate.setHours(23, 59, 59, 999); // End of scheme end day

                        // Check date range validity against filter date
                        const startsBeforeOrOnFilter = !schemeStartDate || schemeStartDate <= filterDate;
                        const endsAfterOrOnFilter = !schemeEndDate || schemeEndDate >= filterDate;

                        // Scheme must be active (flag) AND within date range for the *filter* date
                        return scheme.active && startsBeforeOrOnFilter && endsAfterOrOnFilter;
                    }
                    if (filterType === 'category') {
                        return scheme.appliesTo === 'category' && scheme.target === filterValue;
                    }
                    if (filterType === 'product') {
                        return scheme.appliesTo === 'product' && scheme.target === filterValue;
                    }
                } catch (e) {
                    console.error("Filtering error for scheme:", scheme, e);
                    return false; // Exclude schemes that cause errors during filtering
                }
                return true; // Should not be reached if filterType is valid
            });
        }

        return result;
    }, [schemes, filterType, filterValue]); // Re-calculate when these change


    // Print handler
    const handlePrint = () => {
        window.print();
    };

    // Common input style
    const inputStyle =
        'p-2 sm:p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white border border-gray-300 text-black placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-sm sm:text-base transition duration-200 ease-in-out';

    // Loading state UI
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-sm sm:text-base dark:bg-gray-900 dark:text-white">
                Loading discount scheme data...
            </div>
        );
    }

    // Main component render
    return (
        <>
             {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        border: none;
                        box-shadow: none;
                        background-color: white !important;
                        color: black !important;
                    }
                    #print-area h2, #print-area table {
                        color: black !important;
                    }
                    #print-area table th, #print-area table td {
                        border: 1px solid #ccc;
                        color: black !important;
                        padding: 4px 6px; /* Smaller padding for print */
                        font-size: 10pt; /* Smaller font for print */
                    }
                    #print-area .action-col, #print-area .action-btn {
                        display: none !important; /* Hide actions */
                    }
                    #print-area .status-badge {
                        border: 1px solid #ccc;
                        padding: 1px 3px;
                        border-radius: 4px;
                        background-color: white !important;
                        color: black !important;
                        font-size: 9pt;
                    }
                    /* Override dark mode styles for print */
                    #print-area .dark\\:bg-gray-800,
                    #print-area .dark\\:bg-gray-700,
                    #print-area .dark\\:bg-gray-600,
                    #print-area .dark\\:text-white,
                    #print-area .dark\\:text-gray-300,
                    #print-area .dark\\:text-gray-400,
                    #print-area .dark\\:text-green-100,
                    #print-area .dark\\:border-gray-700 {
                        background-color: white !important;
                        color: black !important;
                        border-color: #ccc !important;
                    }
                     /* Hide elements not meant for printing */
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="min-h-screen px-2 py-6 text-gray-900 transition-colors duration-500 bg-gray-50 sm:px-4 sm:py-10 dark:bg-gray-900 dark:text-white">
                <div className="max-w-full p-4 mx-auto bg-white shadow-lg sm:max-w-7xl sm:p-6 dark:bg-gray-800 rounded-2xl"> {/* Increased max-width */}
                    {/* Page Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-4 text-2xl font-bold no-print sm:mb-6 sm:text-4xl"
                    >
                        Discount Schemes & Promotions
                    </motion.h1>

                    {/* Form Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="p-4 mb-8 text-gray-900 bg-gray-100 border border-gray-200 shadow-md sm:p-6 lg:p-8 sm:mb-12 dark:bg-gray-800 dark:text-white rounded-2xl dark:border-gray-700 no-print" // Added lg:p-8 for more space
                    >
                        <h2 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
                            {editSchemeId ? 'Edit Discount Scheme' : 'Create New Discount Scheme'}
                        </h2>
                        {/* Form Grid */}
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 bg-transparent sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                            {/* Scheme Name */}
                            <div>
                                <label htmlFor="name" className="block mb-1 text-sm font-medium">Scheme Name <span className="text-red-500">*</span></label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Summer Sale 10%"
                                    className={inputStyle}
                                    required
                                />
                            </div>
                            {/* Discount Type */}
                            <div>
                                <label htmlFor="type" className="block mb-1 text-sm font-medium">Discount Type <span className="text-red-500">*</span></label>
                                <select id="type" name="type" value={form.type} onChange={handleChange} className={inputStyle} required>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="amount">Fixed Amount (Rs.)</option>
                                </select>
                            </div>
                            {/* Discount Value */}
                            <div>
                                <label htmlFor="value" className="block mb-1 text-sm font-medium">Discount Value <span className="text-red-500">*</span></label>
                                <input
                                    id="value"
                                    type="number"
                                    name="value"
                                    value={form.value}
                                    onChange={handleChange}
                                    placeholder={form.type === 'percentage' ? 'Enter % (e.g., 10)' : 'Enter Amount (e.g., 50.00)'}
                                    className={inputStyle}
                                    required
                                    min="0" // Ensure non-negative
                                    step={form.type === 'percentage' ? '0.1' : '0.01'} // Appropriate step
                                />
                            </div>
                             {/* Applies To */}
                            <div>
                                <label htmlFor="appliesTo" className="block mb-1 text-sm font-medium">Applies To <span className="text-red-500">*</span></label>
                                <select id="appliesTo" name="appliesTo" value={form.appliesTo} onChange={handleChange} className={inputStyle} required>
                                    <option value="product">Specific Product</option>
                                    <option value="category">Category</option>
                                    <option value="customerGroup">Customer Group</option>
                                    {/* Add more options like 'all_products' if needed */}
                                </select>
                            </div>
                             {/* Target Input (Conditional) */}
                            <div className="relative">
                                <label htmlFor="target" className="block mb-1 text-sm font-medium">
                                    {/* Dynamic Label */}
                                    {form.appliesTo === 'product' ? 'Product' : form.appliesTo === 'category' ? 'Category' : 'Customer Group'}
                                    <span className="text-red-500">*</span>
                                </label>
                                {/* Conditional Rendering for Target Input */}
                                {form.appliesTo === 'product' ? (
                                    <div ref={productInputRef}>
                                        <input
                                            id="target"
                                            type="text"
                                            name="target"
                                            value={searchTerm} // Controlled by searchTerm for dynamic filtering
                                            onChange={handleChange}
                                            onFocus={() => setIsProductDropdownOpen(true)} // Open on focus
                                            placeholder="Type to search products..."
                                            className={inputStyle}
                                            required
                                            autoComplete="off" // Prevent browser suggestions interfering
                                        />
                                        {/* Product Dropdown */}
                                        <AnimatePresence>
                                            {isProductDropdownOpen && (
                                                <motion.ul
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 dark:bg-gray-700 dark:border-gray-600"
                                                >
                                                    {filteredProducts.length > 0 ? (
                                                        filteredProducts.map((product) => (
                                                            <li
                                                                key={product.id}
                                                                onClick={() => handleSelect(product.product_name, 'product')}
                                                                className="px-3 py-1 text-sm text-black cursor-pointer sm:px-4 sm:py-2 sm:text-base hover:bg-blue-100 dark:text-white dark:hover:bg-blue-600"
                                                            >
                                                                {product.product_name}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-3 py-1 text-sm text-gray-500 sm:px-4 sm:py-2 sm:text-base dark:text-gray-400">
                                                            No products found matching "{searchTerm}"
                                                        </li>
                                                    )}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : form.appliesTo === 'category' ? (
                                     <div ref={categoryInputRef}>
                                        <input
                                            id="target"
                                            type="text"
                                            name="target"
                                            value={searchTerm} // Controlled by searchTerm
                                            onChange={handleChange}
                                            onFocus={() => setIsCategoryDropdownOpen(true)} // Open on focus
                                            placeholder="Type to search categories..."
                                            className={inputStyle}
                                            required
                                            autoComplete="off"
                                        />
                                        {/* Category Dropdown */}
                                        <AnimatePresence>
                                            {isCategoryDropdownOpen && (
                                                <motion.ul
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 dark:bg-gray-700 dark:border-gray-600"
                                                >
                                                    {filteredCategories.length > 0 ? (
                                                        filteredCategories.map((category) => (
                                                            <li
                                                                key={category.id}
                                                                onClick={() => handleSelect(category.name, 'category')}
                                                                className="px-3 py-1 text-sm text-black cursor-pointer sm:px-4 sm:py-2 sm:text-base hover:bg-blue-100 dark:text-white dark:hover:bg-blue-600"
                                                            >
                                                                {category.name}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-3 py-1 text-sm text-gray-500 sm:px-4 sm:py-2 sm:text-base dark:text-gray-400">
                                                            No categories found matching "{searchTerm}"
                                                        </li>
                                                    )}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                     // Simple input for Customer Group
                                    <input
                                        id="target"
                                        type="text"
                                        name="target"
                                        value={form.target} // Directly controlled by form state
                                        onChange={handleChange}
                                        placeholder="Enter Customer Group Name"
                                        className={inputStyle}
                                        required
                                    />
                                )}
                            </div>
                             {/* Start Date */}
                            <div>
                                <label htmlFor="startDate" className="block mb-1 text-sm font-medium">Start Date (Optional)</label>
                                <input
                                    id="startDate"
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    // max={form.endDate} // Optional: prevent start after end
                                />
                            </div>
                             {/* End Date */}
                            <div>
                                <label htmlFor="endDate" className="block mb-1 text-sm font-medium">End Date (Optional)</label>
                                <input
                                    id="endDate"
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    min={form.startDate} // Prevent end before start
                                    className={inputStyle}
                                />
                            </div>
                            {/* Active Checkbox */}
                             <label className="flex items-center col-span-1 gap-2 mt-4 sm:mt-6 sm:col-span-1"> {/* Adjusted positioning */}
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={form.active} // Reflects user's intent
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-500 rounded sm:w-5 sm:h-5 focus:ring-blue-400 dark:bg-gray-600 dark:border-gray-500"
                                />
                                <span className="text-sm font-medium sm:text-base">Set Active</span>
                                {/* Tooltip/Info about date override could be added here */}
                            </label>
                             {/* Buttons: Placed in the last column/row for better layout */}
                             <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:col-span-2 lg:col-span-3 sm:items-center sm:justify-start"> {/* Aligned start */}
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:py-3 sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                >
                                    {editSchemeId ? 'Update Scheme' : 'Add Scheme'}
                                </button>
                                {editSchemeId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-6 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:py-3 sm:text-base bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl hover:from-gray-700 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>

                    {/* Schemes List Section */}
                    <motion.div
                        id="print-area" // ID for print styles
                        ref={schemesListRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="p-4 bg-gray-100 border border-gray-200 shadow-lg sm:p-6 lg:p-8 dark:bg-gray-800 rounded-2xl dark:border-gray-700" // Increased padding
                    >
                         {/* List Header and Print Button */}
                        <div className="flex flex-col items-start justify-between gap-4 mb-4 sm:flex-row sm:items-center sm:mb-6">
                            <h2 className="text-xl font-semibold sm:text-2xl">
                                Discount Schemes List {filterType && `(Filtered by ${filterType}: ${filterType === 'status' ? (filterValue === 'true' ? 'Active' : 'Inactive') : filterValue})`} {/* More descriptive title */}
                            </h2>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:text-base bg-gradient-to-r from-green-600 to-green-500 rounded-xl hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 no-print"
                            >
                                Print List
                            </button>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:mb-6 no-print"> {/* Added flex-wrap */}
                            {/* Filter Type Select */}
                            <div className="flex-grow min-w-[150px]"> {/* Use flex-grow */}
                                <label htmlFor="filterType" className="block mb-1 text-sm font-medium sm:text-base">
                                    Filter By
                                </label>
                                <select
                                    id="filterType"
                                    name="filterType"
                                    value={filterType}
                                    onChange={handleFilterChange}
                                    className={inputStyle}
                                >
                                    <option value="">All Schemes</option>
                                    <option value="status">Status (Effective)</option> {/* Clarify effective status */}
                                    <option value="date">Active On Date</option>
                                    <option value="category">Category</option>
                                    <option value="product">Product</option>
                                </select>
                            </div>
                            {/* Conditional Filter Value Inputs */}
                            {filterType === 'status' && (
                                <div className="flex-grow min-w-[150px]">
                                    <label htmlFor="filterValueStatus" className="block mb-1 text-sm font-medium sm:text-base">
                                        Status
                                    </label>
                                    <select
                                        id="filterValueStatus"
                                        name="filterValue" // Name should be filterValue
                                        value={filterValue}
                                        onChange={handleFilterChange}
                                        className={inputStyle}
                                        required // Ensure a value is selected if type is status
                                    >
                                        <option value="" disabled>Select Status</option> {/* Nicer placeholder */}
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            )}
                            {filterType === 'date' && (
                                <div className="flex-grow min-w-[150px]">
                                    <label htmlFor="filterValueDate" className="block mb-1 text-sm font-medium sm:text-base">
                                        Date
                                    </label>
                                    <input
                                        id="filterValueDate"
                                        type="date"
                                        name="filterValue" // Name should be filterValue
                                        value={filterValue}
                                        onChange={handleFilterChange}
                                        className={inputStyle}
                                        required // Ensure a date is selected if type is date
                                    />
                                </div>
                            )}
                            {(filterType === 'category' || filterType === 'product') && (
                                <div className="relative flex-grow min-w-[200px]" ref={filterInputRef}>
                                    <label htmlFor="filterValueSearch" className="block mb-1 text-sm font-medium sm:text-base">
                                        {filterType === 'category' ? 'Category Name' : 'Product Name'}
                                    </label>
                                    <input
                                        id="filterValueSearch"
                                        type="text"
                                        name="filterValue" // Name should be filterValue
                                        value={filterSearchTerm} // Display search term
                                        onChange={handleFilterChange} // Update filterValue and searchTerm
                                        onFocus={() => setIsFilterDropdownOpen(true)}
                                        placeholder={`Type to search ${filterType}...`}
                                        className={inputStyle}
                                        autoComplete="off"
                                        required // Ensure a value is selected if type is category/product
                                    />
                                    {/* Filter Dropdown */}
                                    <AnimatePresence>
                                        {isFilterDropdownOpen && (
                                            <motion.ul
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                {filterType === 'category' ? (
                                                    filteredFilterCategories.length > 0 ? (
                                                        filteredFilterCategories.map((category) => (
                                                            <li
                                                                key={category.id}
                                                                onClick={() => handleFilterSelect(category.name, 'category')}
                                                                className="px-3 py-1 text-sm text-black cursor-pointer sm:px-4 sm:py-2 sm:text-base hover:bg-blue-100 dark:text-white dark:hover:bg-blue-600"
                                                            >
                                                                {category.name}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-3 py-1 text-sm text-gray-500 sm:px-4 sm:py-2 sm:text-base dark:text-gray-400">
                                                            No categories found matching "{filterSearchTerm}"
                                                        </li>
                                                    )
                                                ) : ( // Assumes filterType === 'product'
                                                    filteredFilterProducts.length > 0 ? (
                                                        filteredFilterProducts.map((product) => (
                                                            <li
                                                                key={product.id}
                                                                onClick={() => handleFilterSelect(product.product_name, 'product')}
                                                                className="px-3 py-1 text-sm text-black cursor-pointer sm:px-4 sm:py-2 sm:text-base hover:bg-blue-100 dark:text-white dark:hover:bg-blue-600"
                                                            >
                                                                {product.product_name}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-3 py-1 text-sm text-gray-500 sm:px-4 sm:py-2 sm:text-base dark:text-gray-400">
                                                            No products found matching "{filterSearchTerm}"
                                                        </li>
                                                    )
                                                )}
                                            </motion.ul>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                             {/* Clear Filter Button */}
                            {filterType && (
                                <button
                                    onClick={clearFilter}
                                    className="self-end px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:py-3 sm:text-base bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl hover:from-gray-700 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>

                        {/* Schemes Table or No Schemes Message */}
                        {filteredSchemes.length === 0 ? (
                            <p className="text-sm italic text-center opacity-75 sm:text-base">
                                {schemes.length === 0 ? 'No discount schemes have been created yet.' : 'No discount schemes match the current filter.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs text-left sm:text-sm">
                                    {/* Table Header */}
                                    <thead className="bg-gray-200 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Name</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Type</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Value</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Applies To</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Target</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Duration</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Status</th>
                                            <th className="px-2 py-2 font-semibold text-center sm:px-4 sm:py-3 action-col no-print">Action</th> {/* Centered, No Print */}
                                        </tr>
                                    </thead>
                                    {/* Table Body */}
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        <AnimatePresence>
                                            {filteredSchemes.map((scheme) => {
                                                // Determine effective status for display right before rendering
                                                const isEffectivelyActive = calculateEffectiveActiveStatus(scheme);
                                                return (
                                                    <motion.tr
                                                        key={scheme.id}
                                                        layout // Animate layout changes
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    >
                                                        <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">{scheme.name}</td>
                                                        <td className="px-2 py-2 capitalize sm:px-4 sm:py-3">{scheme.type}</td>
                                                        <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                            {scheme.type === 'percentage'
                                                                ? `${scheme.value}%`
                                                                : formatCurrency(scheme.value)}
                                                        </td>
                                                        <td className="px-2 py-2 capitalize sm:px-4 sm:py-3">
                                                            {scheme.appliesTo === 'customerGroup' ? 'Customer Group' : scheme.appliesTo}
                                                        </td>
                                                        <td className="px-2 py-2 sm:px-4 sm:py-3">{scheme.target}</td>
                                                        <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                                            {formatDate(scheme.startDate)} → {formatDate(scheme.endDate)}
                                                        </td>
                                                        {/* Status Badge */}
                                                        <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                            <span
                                                                className={`status-badge px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                                                                    isEffectivelyActive // Use calculated effective status for styling
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                                                }`}
                                                            >
                                                                {isEffectivelyActive ? 'Active' : 'Inactive'} {/* Display based on effective status */}
                                                            </span>
                                                        </td>
                                                         {/* Action Buttons */}
                                                        <td className="px-2 py-2 text-center sm:px-4 sm:py-3 action-col no-print"> {/* Centered, No Print */}
                                                            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center"> {/* Center buttons */}
                                                                <button
                                                                    onClick={() => handleEdit(scheme)}
                                                                    title="Edit Scheme" // Tooltip
                                                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg action-btn sm:px-3 sm:text-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(scheme.id)}
                                                                     title="Delete Scheme" // Tooltip
                                                                    className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-lg action-btn sm:px-3 sm:text-sm hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>

                     {/* Delete Confirmation Modal */}
                    <AnimatePresence>
                        {showDeleteModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 no-print">
                                <motion.div
                                    ref={modalRef}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full max-w-xs p-4 bg-white shadow-2xl sm:max-w-md sm:p-6 rounded-2xl dark:bg-gray-800 dark:border dark:border-gray-700"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="modal-title"
                                >
                                    <h3 id="modal-title" className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                                        Confirm Deletion
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-600 sm:text-base dark:text-gray-300">
                                        Are you sure you want to delete this discount scheme? This action cannot be undone.
                                    </p>
                                    {/* Modal Buttons */}
                                    <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:justify-end sm:gap-4 sm:mt-6"> {/* Align end */}
                                        <button
                                            onClick={cancelDelete} // Cancel button first (safer default)
                                            className="order-2 px-4 py-2 text-sm font-semibold text-gray-700 transition duration-200 ease-in-out bg-gray-200 sm:order-1 sm:text-base rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 dark:focus:ring-offset-gray-800"
                                        >
                                            Cancel
                                        </button>
                                         <button
                                            onClick={confirmDelete}
                                            className="order-1 px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:order-2 sm:text-base bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default DiscountScheam;