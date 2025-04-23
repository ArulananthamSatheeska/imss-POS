import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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
        active: true,
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
    const schemesListRef = useRef(null); // Ref for the section to print

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
                // Ensure appliesTo and date fields are consistent
                const formattedSchemes = (Array.isArray(schemeResponse.data.data) ? schemeResponse.data.data : []).map(s => ({
                    ...s,
                    appliesTo: s.applies_to, // Use consistent field name
                    startDate: s.start_date, // Use consistent field name
                    endDate: s.end_date      // Use consistent field name
                }));
                setSchemes(formattedSchemes);

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
    }, []);

    // Close dropdowns and modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close form dropdowns
            if (form.appliesTo === 'product' && productInputRef.current && !productInputRef.current.contains(event.target)) {
                setIsProductDropdownOpen(false);
            }
             if (form.appliesTo === 'category' && categoryInputRef.current && !categoryInputRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
            // Close filter dropdown
            if (filterInputRef.current && !filterInputRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
            // Close delete modal
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowDeleteModal(false);
                setSchemeToDelete(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [form.appliesTo]); // Re-run if appliesTo changes

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
    }, [showDeleteModal, isFilterDropdownOpen, isProductDropdownOpen, isCategoryDropdownOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'appliesTo') {
            setForm((prev) => ({
                ...prev,
                [name]: value,
                target: '', // Clear target when appliesTo changes
            }));
            setSearchTerm(''); // Clear search term as well
            setIsProductDropdownOpen(false); // Close dropdowns
            setIsCategoryDropdownOpen(false);
        } else if (name === 'target') {
            setSearchTerm(value); // Update search term for input display
            setForm((prev) => ({ ...prev, [name]: value })); // Update form target (can be partial)
            if (form.appliesTo === 'product') {
                setIsProductDropdownOpen(true);
            } else if (form.appliesTo === 'category') {
                setIsCategoryDropdownOpen(true);
            }
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    // Select item from form dropdown
    const handleSelect = (value, type) => {
        setForm((prev) => ({ ...prev, target: value })); // Set the actual target value in the form
        setSearchTerm(value); // Update the displayed search term
        if (type === 'product') {
            setIsProductDropdownOpen(false);
        } else {
            setIsCategoryDropdownOpen(false);
        }
    };

    // Select item from filter dropdown
    const handleFilterSelect = (value, type) => {
        setFilterValue(value); // Set the actual filter value
        setFilterSearchTerm(value); // Update the displayed search term in filter input
        setIsFilterDropdownOpen(false);
    };

    const handleEdit = (scheme) => {
        setForm({
            name: scheme.name,
            type: scheme.type,
            value: scheme.value,
            appliesTo: scheme.appliesTo, // Use consistent field
            target: scheme.target,
            startDate: formatDate(scheme.startDate) === 'N/A' ? '' : formatDate(scheme.startDate), // Ensure correct format for date input
            endDate: formatDate(scheme.endDate) === 'N/A' ? '' : formatDate(scheme.endDate),     // Ensure correct format for date input
            active: scheme.active,
        });
        setSearchTerm(scheme.target); // Set search term for input display
        setEditSchemeId(scheme.id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see the form
    };

    const handleCancelEdit = () => {
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

        // Validation
        if (form.appliesTo === 'product' && !products.some((p) => p.product_name === form.target)) {
            alert('Please select a valid product from the list.');
            return;
        }
        if (form.appliesTo === 'category' && !categories.some((c) => c.name === form.target)) {
            alert('Please select a valid category from the list.');
            return;
        }
        // Add validation for customer group if needed
        if (form.appliesTo === 'customerGroup' && !form.target.trim()) {
             alert('Please enter a customer group name.');
             return;
        }
        // Basic value validation
        if (form.value === '' || form.value < 0) {
             alert('Please enter a valid non-negative discount value.');
             return;
        }
         // Date validation (end date must be >= start date if both are set)
        if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
            alert('End date cannot be earlier than the start date.');
            return;
        }


        const payload = {
            name: form.name,
            type: form.type,
            value: form.value,
            applies_to: form.appliesTo, // API uses applies_to
            target: form.target,
            start_date: form.startDate || null, // Send null if empty
            end_date: form.endDate || null,     // Send null if empty
            active: form.active,
        };

        try {
            let updatedScheme;
            if (editSchemeId) {
                const response = await axios.put(`http://127.0.0.1:8000/api/discount-schemes/${editSchemeId}`, payload);
                updatedScheme = { ...response.data.data, appliesTo: response.data.data.applies_to, startDate: response.data.data.start_date, endDate: response.data.data.end_date }; // Ensure consistency
                setSchemes(
                    schemes.map((scheme) =>
                        scheme.id === editSchemeId ? updatedScheme : scheme
                    )
                );
                 alert('Discount scheme updated successfully!');
            } else {
                const response = await axios.post('http://127.0.0.1:8000/api/discount-schemes', payload);
                updatedScheme = { ...response.data.data, appliesTo: response.data.data.applies_to, startDate: response.data.data.start_date, endDate: response.data.data.end_date }; // Ensure consistency
                setSchemes([...schemes, updatedScheme]);
                 alert('Discount scheme created successfully!');
            }

            // Reset form completely
            handleCancelEdit();

        } catch (error) {
            console.error('Error saving discount scheme:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || `Failed to ${editSchemeId ? 'update' : 'create'} discount scheme.`;
            alert(errorMsg);
        }
    };

    const handleDelete = (id) => {
        setSchemeToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!schemeToDelete) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/discount-schemes/${schemeToDelete}`);
            setSchemes(schemes.filter((scheme) => scheme.id !== schemeToDelete));
            setShowDeleteModal(false);
            setSchemeToDelete(null);
            alert('Discount scheme deleted successfully!');
        } catch (error) {
            console.error('Error deleting discount scheme:', error.response?.data || error.message);
             const errorMsg = error.response?.data?.message || 'Failed to delete discount scheme.';
            alert(errorMsg);
            setShowDeleteModal(false);
            setSchemeToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSchemeToDelete(null);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'filterType') {
            setFilterType(value);
            setFilterValue(''); // Reset value when type changes
            setFilterSearchTerm(''); // Reset search term
            setIsFilterDropdownOpen(false);
            // Set default date to today for date filter ONLY if type is date
            if (value === 'date') {
                const today = new Date().toISOString().split('T')[0];
                setFilterValue(today); // Set the date value
            }
        } else if (name === 'filterValue') {
            setFilterValue(value); // Update the actual filter value
            // If it's a searchable type, update search term and open dropdown
            if (filterType === 'category' || filterType === 'product') {
                setFilterSearchTerm(value); // Update the displayed search term
                setIsFilterDropdownOpen(true);
            }
        }
    };

    const clearFilter = () => {
        setFilterType('');
        setFilterValue('');
        setFilterSearchTerm('');
        setIsFilterDropdownOpen(false);
    };

    // --- Formatting Functions ---
    const formatCurrency = (amount) => {
       const num = parseFloat(amount);
       if (isNaN(num)) return 'N/A';
        return `Rs. ${num.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
             // Check if the date is valid after parsing
             if (isNaN(date.getTime())) {
                // Try parsing potentially different formats if needed, or return N/A
                // Example: Try parsing 'YYYY-MM-DD HH:MM:SS' if the default fails
                // For now, just return N/A for invalid dates
                return 'N/A';
            }
            // Format to YYYY-MM-DD for consistency and input compatibility
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return 'N/A'; // Return N/A if any error occurs during parsing/formatting
        }
    };

    // --- Input Style ---
    const inputStyle =
        'p-2 sm:p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white border border-gray-300 text-black placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-sm sm:text-base transition duration-200 ease-in-out';

    // --- Memoized Filtered Data ---
    const filteredProducts = useMemo(() => products.filter((product) =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    const filteredCategories = useMemo(() => categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [categories, searchTerm]);

    const filteredFilterProducts = useMemo(() => products.filter((product) =>
        product.product_name.toLowerCase().includes(filterSearchTerm.toLowerCase())
    ), [products, filterSearchTerm]);

    const filteredFilterCategories = useMemo(() => categories.filter((category) =>
        category.name.toLowerCase().includes(filterSearchTerm.toLowerCase())
    ), [categories, filterSearchTerm]);

    // Filter schemes based on filterType and filterValue
    const filteredSchemes = useMemo(() => {
        if (!filterType || !filterValue) return schemes;

        return schemes.filter((scheme) => {
            try {
                if (filterType === 'status') {
                    const isActive = filterValue === 'true';
                    return scheme.active === isActive;
                }
                if (filterType === 'date') {
                    // Check if the scheme is active on the selected date
                    // Assumes date format 'YYYY-MM-DD' from filterValue
                    const filterDate = new Date(filterValue + 'T00:00:00'); // Use start of day for comparison
                     if (isNaN(filterDate.getTime())) return false; // Invalid filter date

                    const schemeStartDate = scheme.startDate ? new Date(formatDate(scheme.startDate) + 'T00:00:00') : null;
                    const schemeEndDate = scheme.endDate ? new Date(formatDate(scheme.endDate) + 'T23:59:59') : null; // Use end of day

                    const startsBeforeOrOnFilter = !schemeStartDate || isNaN(schemeStartDate.getTime()) || schemeStartDate <= filterDate;
                    const endsAfterOrOnFilter = !schemeEndDate || isNaN(schemeEndDate.getTime()) || schemeEndDate >= filterDate;
                    const noEndDate = !schemeEndDate || isNaN(schemeEndDate.getTime()); // Handle schemes with no end date

                    return startsBeforeOrOnFilter && (endsAfterOrOnFilter || noEndDate);

                }
                if (filterType === 'category') {
                    // Ensure appliesTo matches and target matches filterValue
                    return scheme.appliesTo === 'category' && scheme.target === filterValue;
                }
                if (filterType === 'product') {
                     // Ensure appliesTo matches and target matches filterValue
                    return scheme.appliesTo === 'product' && scheme.target === filterValue;
                }
            } catch (e) {
                 console.error("Filtering error for scheme:", scheme, e);
                 return false; // Exclude if error occurs during filtering
            }
            return true; // Should not be reached if filterType is valid
        });
    }, [schemes, filterType, filterValue]);

    // --- Print Functionality ---
    const handlePrint = () => {
        window.print(); // Uses browser's print functionality with CSS media queries
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-sm sm:text-base dark:bg-gray-900 dark:text-white">
                Loading discount scheme data...
            </div>
        );
    }

    return (
        <>
            {/* Print specific styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden; /* Hide everything by default */
                    }
                    #print-area, #print-area * {
                        visibility: visible; /* Make only the print area visible */
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
                         background-color: white !important; /* Ensure white background for printing */
                         color: black !important; /* Ensure black text */
                    }
                    #print-area h2, #print-area table {
                        color: black !important; /* Ensure heading and table text are black */
                    }
                     #print-area table th, #print-area table td {
                        border: 1px solid #ccc; /* Add simple borders for print table */
                        color: black !important;
                        padding: 4px 6px; /* Adjust padding for print */
                    }
                     #print-area .action-col, #print-area .action-btn {
                         display: none !important; /* Hide action column and buttons */
                     }
                     #print-area .status-badge {
                         border: 1px solid #ccc; /* Simple border for status */
                         padding: 2px 4px;
                         background-color: white !important; /* Remove background color */
                         color: black !important;
                     }
                     /* Ensure no dark mode styles interfere */
                     #print-area .dark\:bg-gray-800, #print-area .dark\:bg-gray-700, #print-area .dark\:text-white, #print-area .dark\:border-gray-700 {
                        background-color: white !important;
                        color: black !important;
                        border-color: #ccc !important;
                     }
                     /* Hide the form, filter controls, and print button itself */
                    .no-print {
                         display: none !important;
                     }
                }
            `}</style>

            <div className="min-h-screen px-2 py-6 text-gray-900 transition-colors duration-500 bg-gray-50 sm:px-4 sm:py-10 dark:bg-gray-900 dark:text-white">
                <div className="max-w-full p-4 mx-auto bg-white shadow-lg sm:max-w-6xl sm:p-6 dark:bg-gray-800 rounded-2xl">
                    <motion.h1
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-4 text-2xl font-bold no-print sm:mb-6 sm:text-4xl" // Hide heading in print
                    >
                        Discount Scheme and Promotions
                    </motion.h1>

                    {/* FORM SECTION - Hide in print */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="p-4 mb-8 text-gray-900 bg-gray-100 border border-gray-200 shadow-md sm:p-8 sm:mb-12 dark:bg-gray-800 dark:text-white rounded-2xl dark:border-gray-700 no-print" // Added no-print class
                    >
                        <h2 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
                            {editSchemeId ? 'Edit Discount Scheme' : 'Create New Discount Scheme'}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 bg-transparent sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block mb-1 text-sm font-medium">Scheme Name</label>
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
                            {/* Type */}
                             <div>
                                <label htmlFor="type" className="block mb-1 text-sm font-medium">Discount Type</label>
                                <select id="type" name="type" value={form.type} onChange={handleChange} className={inputStyle}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="amount">Fixed Amount (Rs.)</option>
                                </select>
                            </div>
                            {/* Value */}
                             <div>
                                <label htmlFor="value" className="block mb-1 text-sm font-medium">Value</label>
                                <input
                                     id="value"
                                    type="number"
                                    name="value"
                                    value={form.value}
                                    onChange={handleChange}
                                    placeholder={form.type === 'percentage' ? 'Discount %' : 'Amount in Rs.'}
                                    className={inputStyle}
                                    required
                                    min="0"
                                    step="0.01" // Allow decimals for amounts
                                />
                            </div>
                             {/* Applies To */}
                            <div>
                                <label htmlFor="appliesTo" className="block mb-1 text-sm font-medium">Applies To</label>
                                <select id="appliesTo" name="appliesTo" value={form.appliesTo} onChange={handleChange} className={inputStyle}>
                                    <option value="product">Specific Product</option>
                                    <option value="category">Category</option>
                                    <option value="customerGroup">Customer Group</option> {/* Added Customer Group */}
                                </select>
                             </div>

                            {/* Target Input - Conditional rendering */}
                            <div className="relative"> {/* Wrap in relative container for dropdown positioning */}
                                <label htmlFor="target" className="block mb-1 text-sm font-medium">
                                    {form.appliesTo === 'product' ? 'Product' : form.appliesTo === 'category' ? 'Category' : 'Customer Group'}
                                </label>
                                {form.appliesTo === 'product' ? (
                                    <div ref={productInputRef}>
                                        <input
                                            id="target"
                                            type="text"
                                            name="target"
                                            value={searchTerm} // Display search term
                                            onChange={handleChange}
                                            onFocus={() => setIsProductDropdownOpen(true)}
                                            placeholder="Type to search products"
                                            className={inputStyle}
                                            required
                                            autoComplete="off"
                                        />
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
                                            value={searchTerm} // Display search term
                                            onChange={handleChange}
                                            onFocus={() => setIsCategoryDropdownOpen(true)}
                                            placeholder="Type to search categories"
                                            className={inputStyle}
                                            required
                                            autoComplete="off"
                                        />
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
                                ) : ( // Customer Group Input
                                    <input
                                        id="target"
                                        type="text"
                                        name="target"
                                        value={form.target} // Direct value binding
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
                                    min={form.startDate} // Prevent end date being before start date
                                    className={inputStyle}
                                />
                            </div>
                            {/* Active Checkbox */}
                            <label className="flex items-center col-span-1 gap-2 mt-4 sm:mt-7"> {/* Align with inputs */}
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={form.active}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-500 rounded sm:w-5 sm:h-5 focus:ring-blue-400 dark:bg-gray-600 dark:border-gray-500"
                                />
                                <span className="text-sm font-medium sm:text-base">Active Scheme</span>
                            </label>
                            {/* Buttons */}
                            <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:col-span-2 lg:col-span-3 sm:items-center"> {/* Adjust span for layout */}
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

                    {/* SCHEME LIST SECTION - This section will be printed */}
                    <motion.div
                        id="print-area" // ID for print CSS targeting
                        ref={schemesListRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="p-4 bg-gray-100 border border-gray-200 shadow-lg sm:p-8 dark:bg-gray-800 rounded-2xl dark:border-gray-700"
                    >
                        <div className="flex flex-col items-start justify-between gap-4 mb-4 sm:flex-row sm:items-center sm:mb-6">
                           <h2 className="text-xl font-semibold sm:text-2xl">
                              Discount Schemes List {filterType && `(Filtered by ${filterType})`}
                           </h2>
                           <button
                              onClick={handlePrint}
                              className="px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:text-base bg-gradient-to-r from-green-600 to-green-500 rounded-xl hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 no-print" // Added no-print class
                           >
                              Print List
                           </button>
                        </div>


                        {/* FILTER SECTION - Hide in print */}
                        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-end sm:mb-6 no-print"> {/* Added no-print class */}
                            {/* Filter Type */}
                            <div className="flex-1 min-w-[150px]">
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
                                    <option value="status">Status</option>
                                    <option value="date">Active On Date</option>
                                    <option value="category">Category</option>
                                    <option value="product">Product</option>
                                     {/* Add other filter types if needed */}
                                </select>
                            </div>

                            {/* Conditional Filter Value Input */}
                             {filterType === 'status' && (
                                <div className="flex-1 min-w-[150px]">
                                    <label htmlFor="filterValueStatus" className="block mb-1 text-sm font-medium sm:text-base">
                                        Status
                                    </label>
                                    <select
                                        id="filterValueStatus"
                                        name="filterValue" // Name matches the state key
                                        value={filterValue} // Value comes from filterValue state
                                        onChange={handleFilterChange}
                                        className={inputStyle}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            )}
                            {filterType === 'date' && (
                                <div className="flex-1 min-w-[150px]">
                                    <label htmlFor="filterValueDate" className="block mb-1 text-sm font-medium sm:text-base">
                                        Date
                                    </label>
                                    <input
                                        id="filterValueDate"
                                        type="date"
                                        name="filterValue" // Name matches the state key
                                        value={filterValue} // Value comes from filterValue state
                                        onChange={handleFilterChange}
                                        className={inputStyle}
                                    />
                                </div>
                            )}
                            {(filterType === 'category' || filterType === 'product') && (
                                <div className="relative flex-1 min-w-[200px]" ref={filterInputRef}>
                                    <label htmlFor="filterValueSearch" className="block mb-1 text-sm font-medium sm:text-base">
                                        {filterType === 'category' ? 'Category Name' : 'Product Name'}
                                    </label>
                                    <input
                                        id="filterValueSearch"
                                        type="text"
                                        name="filterValue" // Name matches the state key
                                        value={filterSearchTerm} // Display search term
                                        onChange={handleFilterChange}
                                        onFocus={() => setIsFilterDropdownOpen(true)}
                                        placeholder={`Type to search ${filterType}...`}
                                        className={inputStyle}
                                        autoComplete="off"
                                    />
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
                                                ) : ( // Product
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

                        {/* SCHEMES TABLE */}
                        {filteredSchemes.length === 0 ? (
                            <p className="text-sm italic opacity-75 sm:text-base">
                                {schemes.length === 0 ? 'No discount schemes have been created yet.' : 'No discount schemes match the current filter.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs text-left sm:text-sm">
                                    <thead className="bg-gray-200 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Name</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Type</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Value</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Applies To</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Target</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Duration</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3">Status</th>
                                            <th className="px-2 py-2 font-semibold sm:px-4 sm:py-3 action-col">Action</th> {/* Class to hide in print */}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredSchemes.map((scheme) => (
                                            <motion.tr
                                                key={scheme.id}
                                                layout // Animate layout changes (like filtering)
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
                                                    {scheme.appliesTo}
                                                </td>
                                                <td className="px-2 py-2 sm:px-4 sm:py-3">{scheme.target}</td>
                                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                                    {formatDate(scheme.startDate)} → {formatDate(scheme.endDate)}
                                                </td>
                                                <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                    <span
                                                        className={`status-badge px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                                                            scheme.active
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {scheme.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2 sm:px-4 sm:py-3 action-col"> {/* Class to hide in print */}
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <button
                                                            onClick={() => handleEdit(scheme)}
                                                            className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg action-btn sm:px-3 sm:text-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(scheme.id)}
                                                             className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-lg action-btn sm:px-3 sm:text-sm hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div> {/* End of print-area */}

                    {/* DELETE CONFIRMATION MODAL - Hide in print */}
                    <AnimatePresence>
                        {showDeleteModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 no-print"> {/* Added no-print class */}
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
                                    <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:gap-4 sm:mt-6">
                                        <button
                                            onClick={confirmDelete}
                                            className="px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:text-base bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={cancelDelete}
                                             className="px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:text-base bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl hover:from-gray-700 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div> {/* End max-w container */}
            </div> {/* End main container */}
        </>
    );
};

export default DiscountScheam;