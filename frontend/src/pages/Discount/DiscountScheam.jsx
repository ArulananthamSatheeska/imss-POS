import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Helper function to check if a date is in the past (considers the whole day)
const isDateInPast = (dateString) => {
  if (!dateString) return false; // No end date means it never expires based on date
  try {
    const endDate = new Date(dateString);
    endDate.setHours(23, 59, 59, 999);
    return endDate < new Date();
  } catch (e) {
    console.error('Error parsing date for past check:', dateString, e);
    return false;
  }
};

// Helper function to calculate the effective active status
const calculateEffectiveActiveStatus = (scheme) => {
  return scheme.active && !isDateInPast(scheme.endDate);
};

const DiscountScheam = () => {
  const [schemes, setSchemes] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]); // New state for customers
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
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false); // New state for customer dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [schemeToDelete, setSchemeToDelete] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const productInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const customerInputRef = useRef(null); // New ref for customer dropdown
  const modalRef = useRef(null);
  const filterInputRef = useRef(null);
  const schemesListRef = useRef(null);

  // Fetch products, categories, customers, and discount schemes on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productResponse, categoryResponse, customerResponse, schemeResponse] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/products'),
          axios.get('http://127.0.0.1:8000/api/categories'),
          axios.get('http://127.0.0.1:8000/api/customers'), // Fetch customers
          axios.get('http://127.0.0.1:8000/api/discount-schemes'),
        ]);

        setProducts(Array.isArray(productResponse.data.data) ? productResponse.data.data : []);
        setCategories(Array.isArray(categoryResponse.data) ? categoryResponse.data : []);
        setCustomers(Array.isArray(customerResponse.data.data) ? customerResponse.data.data : []); // Set customers

        const fetchedSchemes = (Array.isArray(schemeResponse.data.data) ? schemeResponse.data.data : []).map((s) => ({
          ...s,
          appliesTo: s.applies_to,
          startDate: s.start_date,
          endDate: s.end_date,
        }));

        setSchemes(fetchedSchemes);
      } catch (error) {
        console.error('Error fetching data:', error);
        setProducts([]);
        setCategories([]);
        setCustomers([]);
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
      if (form.appliesTo === 'product' && productInputRef.current && !productInputRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
      if (form.appliesTo === 'category' && categoryInputRef.current && !categoryInputRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (form.appliesTo === 'customerGroup' && customerInputRef.current && !customerInputRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
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
  }, [form.appliesTo]);

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
        if (isCustomerDropdownOpen) setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, isFilterDropdownOpen, isProductDropdownOpen, isCategoryDropdownOpen, isCustomerDropdownOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'appliesTo') {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        target: '',
      }));
      setSearchTerm('');
      setIsProductDropdownOpen(false);
      setIsCategoryDropdownOpen(false);
      setIsCustomerDropdownOpen(false);
    } else if (name === 'target') {
      setSearchTerm(value);
      setForm((prev) => ({ ...prev, [name]: value }));
      if (form.appliesTo === 'product') {
        setIsProductDropdownOpen(true);
      } else if (form.appliesTo === 'category') {
        setIsCategoryDropdownOpen(true);
      } else if (form.appliesTo === 'customerGroup') {
        setIsCustomerDropdownOpen(true);
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // When selecting from dropdown
  const handleSelect = (value, type) => {
    setForm((prev) => ({ ...prev, target: value }));
    setSearchTerm(value);
    if (type === 'product') {
      setIsProductDropdownOpen(false);
    } else if (type === 'category') {
      setIsCategoryDropdownOpen(false);
    } else if (type === 'customer') {
      setIsCustomerDropdownOpen(false);
    }
  };

  // When selecting from filter dropdown
  const handleFilterSelect = (value, type) => {
    setFilterValue(value);
    setFilterSearchTerm(value);
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
      startDate: formatDate(scheme.startDate) === 'N/A' ? '' : formatDate(scheme.startDate),
      endDate: formatDate(scheme.endDate) === 'N/A' ? '' : formatDate(scheme.endDate),
      active: scheme.active,
    });
    setSearchTerm(scheme.target);
    setEditSchemeId(scheme.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setIsCustomerDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input Validations
    if (form.appliesTo === 'product' && !products.some((p) => p.product_name === form.target)) {
      alert('Please select a valid product from the list.');
      return;
    }
    if (form.appliesTo === 'category' && !categories.some((c) => c.name === form.target)) {
      alert('Please select a valid category from the list.');
      return;
    }
    if (form.appliesTo === 'customerGroup' && !customers.some((c) => c.customer_name === form.target)) {
      alert('Please select a valid customer from the list.');
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

    const finalActiveStatus = form.active && !isDateInPast(form.endDate);

    const payload = {
      name: form.name,
      type: form.type,
      value: form.value,
      applies_to: form.appliesTo,
      target: form.target,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      active: finalActiveStatus,
    };

    try {
      let response;
      if (editSchemeId) {
        response = await axios.put(`http://127.0.0.1:8000/api/discount-schemes/${editSchemeId}`, payload);
        const updatedScheme = {
          ...response.data.data,
          appliesTo: response.data.data.applies_to,
          startDate: response.data.data.start_date,
          endDate: response.data.data.end_date,
        };
        setSchemes(schemes.map((scheme) => (scheme.id === editSchemeId ? updatedScheme : scheme)));
        alert('Discount scheme updated successfully!');
      } else {
        response = await axios.post('http://127.0.0.1:8000/api/discount-schemes', payload);
        const newScheme = {
          ...response.data.data,
          appliesTo: response.data.data.applies_to,
          startDate: response.data.data.start_date,
          endDate: response.data.data.end_date,
        };
        setSchemes([...schemes, newScheme]);
        alert('Discount scheme created successfully!');
      }
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
      setFilterValue('');
      setFilterSearchTerm('');
      setIsFilterDropdownOpen(false);
      if (value === 'date') {
        const today = new Date().toISOString().split('T')[0];
        setFilterValue(today);
      }
    } else if (name === 'filterValue') {
      setFilterValue(value);
      if (filterType === 'category' || filterType === 'product' || filterType === 'customerGroup') {
        setFilterSearchTerm(value);
        setIsFilterDropdownOpen(true);
      } else {
        setIsFilterDropdownOpen(false);
      }
    }
  };

  const clearFilter = () => {
    setFilterType('');
    setFilterValue('');
    setFilterSearchTerm('');
    setIsFilterDropdownOpen(false);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'N/A';
    return `Rs. ${num.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  const filteredProducts = useMemo(
    () => products.filter((product) => product.product_name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [categories, searchTerm]
  );

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())),
    [customers, searchTerm]
  );

  const filteredFilterProducts = useMemo(
    () => products.filter((product) => product.product_name.toLowerCase().includes(filterSearchTerm.toLowerCase())),
    [products, filterSearchTerm]
  );

  const filteredFilterCategories = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(filterSearchTerm.toLowerCase())),
    [categories, filterSearchTerm]
  );

  const filteredFilterCustomers = useMemo(
    () => customers.filter((customer) => customer.customer_name.toLowerCase().includes(filterSearchTerm.toLowerCase())),
    [customers, filterSearchTerm]
  );

  const filteredSchemes = useMemo(() => {
    let result = schemes;

    if (filterType && filterValue) {
      result = result.filter((scheme) => {
        try {
          const isEffectivelyActive = calculateEffectiveActiveStatus(scheme);

          if (filterType === 'status') {
            const filterStatus = filterValue === 'true';
            return isEffectivelyActive === filterStatus;
          }
          if (filterType === 'date') {
            const filterDate = new Date(filterValue);
            if (isNaN(filterDate.getTime())) return false;
            filterDate.setHours(0, 0, 0, 0);

            const schemeStartDate = scheme.startDate ? new Date(scheme.startDate) : null;
            if (schemeStartDate) schemeStartDate.setHours(0, 0, 0, 0);

            const schemeEndDate = scheme.endDate ? new Date(scheme.endDate) : null;
            if (schemeEndDate) schemeEndDate.setHours(23, 59, 59, 999);

            const startsBeforeOrOnFilter = !schemeStartDate || schemeStartDate <= filterDate;
            const endsAfterOrOnFilter = !schemeEndDate || schemeEndDate >= filterDate;

            return scheme.active && startsBeforeOrOnFilter && endsAfterOrOnFilter;
          }
          if (filterType === 'category') {
            return scheme.appliesTo === 'category' && scheme.target === filterValue;
          }
          if (filterType === 'product') {
            return scheme.appliesTo === 'product' && scheme.target === filterValue;
          }
          if

            (filterType === 'customerGroup') {
            return scheme.appliesTo === 'customerGroup' && scheme.target === filterValue;
          }
        } catch (e) {
          console.error('Filtering error for scheme:', scheme, e);
          return false;
        }
        return true;
      });
    }

    return result;
  }, [schemes, filterType, filterValue]);

  const handlePrint = () => {
    window.print();
  };

  const inputStyle =
    'p-2 sm:p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white border border-gray-300 text-black placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-sm sm:text-base transition duration-200 ease-in-out';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm sm:text-base dark:bg-gray-900 dark:text-white">
        Loading discount scheme data...
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
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
          #print-area h2,
          #print-area table {
            color: black !important;
          }
          #print-area table th,
          #print-area table td {
            border: 1px solid #ccc;
            color: black !important;
            padding: 4px 6px;
            font-size: 10pt;
          }
          #print-area .action-col,
          #print-area .action-btn {
            display: none !important;
          }
          #print-area .status-badge {
            border: 1px solid #ccc;
            padding: 1px 3px;
            border-radius: 4px;
            background-color: white !important;
            color: black !important;
            font-size: 9pt;
          }
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
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen px-2 py-6 text-gray-900 transition-colors duration-500 bg-gray-50 sm:px-4 sm:py-10 dark:bg-gray-900 dark:text-white">
        <div className="max-w-full p-4 mx-auto bg-white shadow-lg sm:max-w-7xl sm:p-6 dark:bg-gray-800 rounded-2xl">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-2xl font-bold no-print sm:mb-6 sm:text-4xl"
          >
            Discount Schemes & Promotions
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="p-4 mb-8 text-gray-900 bg-gray-100 border border-gray-200 shadow-md sm:p-6 lg:p-8 sm:mb-12 dark:bg-gray-800 dark:text-white rounded-2xl dark:border-gray-700 no-print"
          >
            <h2 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
              {editSchemeId ? 'Edit Discount Scheme' : 'Create New Discount Scheme'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 bg-transparent sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium">
                  Scheme Name <span className="text-red-500">*</span>
                </label>
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
              <div>
                <label htmlFor="type" className="block mb-1 text-sm font-medium">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select id="type" name="type" value={form.type} onChange={handleChange} className={inputStyle} required>
                  <option value="percentage">Percentage (%)</option>
                  <option value="amount">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div>
                <label htmlFor="value" className="block mb-1 text-sm font-medium">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  id="value"
                  type="number"
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={form.type === 'percentage' ? 'Enter % (e.g., 10)' : 'Enter Amount (e.g., 50.00)'}
                  className={inputStyle}
                  required
                  min="0"
                  step={form.type === 'percentage' ? '0.1' : '0.01'}
                />
              </div>
              <div>
                <label htmlFor="appliesTo" className="block mb-1 text-sm font-medium">
                  Applies To <span className="text-red-500">*</span>
                </label>
                <select id="appliesTo" name="appliesTo" value={form.appliesTo} onChange={handleChange} className={inputStyle} required>
                  <option value="product">Specific Product</option>
                  <option value="category">Category</option>
                  <option value="customerGroup">Customer Group</option>
                </select>
              </div>
              <div className="relative">
                <label htmlFor="target" className="block mb-1 text-sm font-medium">
                  {form.appliesTo === 'product' ? 'Product' : form.appliesTo === 'category' ? 'Category' : 'Customer Group'}
                  <span className="text-red-500">*</span>
                </label>
                {form.appliesTo === 'product' ? (
                  <div ref={productInputRef}>
                    <input
                      id="target"
                      type="text"
                      name="target"
                      value={searchTerm}
                      onChange={handleChange}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      placeholder="Type to search products..."
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
                      value={searchTerm}
                      onChange={handleChange}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      placeholder="Type to search categories..."
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
                ) : (
                  <div ref={customerInputRef}>
                    <input
                      id="target"
                      type="text"
                      name="target"
                      value={searchTerm}
                      onChange={handleChange}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      placeholder="Type to search customers..."
                      className={inputStyle}
                      required
                      autoComplete="off"
                    />
                    <AnimatePresence>
                      {isCustomerDropdownOpen && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 dark:bg-gray-700 dark:border-gray-600"
                        >
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <li
                                key={customer.id}
                                onClick={() => handleSelect(customer.customer_name, 'customer')}
                                className="px-3 py-1 text-sm text-black cursor-pointer sm:px-4 sm:py-2 sm:text-base hover:bg-blue-100 dark:text-white dark:hover:bg-blue-600"
                              >
                                {customer.customer_name}
                              </li>
                            ))
                          ) : (
                            <li className="px-3 py-1 text-sm text-gray-500 sm:px-4 sm:py-2 sm:text-base dark:text-gray-400">
                              No customers found matching "{searchTerm}"
                            </li>
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="startDate" className="block mb-1 text-sm font-medium">
                  Start Date (Optional)
                </label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block mb-1 text-sm font-medium">
                  End Date (Optional)
                </label>
                <input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  min={form.startDate}
                  className={inputStyle}
                />
              </div>
              <label className="flex items-center col-span-1 gap-2 mt-4 sm:mt-6 sm:col-span-1">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-500 rounded sm:w-5 sm:h-5 focus:ring-blue-400 dark:bg-gray-600 dark:border-gray-500"
                />
                <span className="text-sm font-medium sm:text-base">Set Active</span>
              </label>
              <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:col-span-2 lg:col-span-3 sm:items-center sm:justify-start">
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

          <motion.div
            id="print-area"
            ref={schemesListRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="p-4 bg-gray-100 border border-gray-200 shadow-lg sm:p-6 lg:p-8 dark:bg-gray-800 rounded-2xl dark:border-gray-700"
          >
            <div className="flex flex-col items-start justify-between gap-4 mb-4 sm:flex-row sm:items-center sm:mb-6">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Discount Schemes List{' '}
                {filterType &&
                  `(Filtered by ${filterType}: ${filterType === 'status' ? (filterValue === 'true' ? 'Active' : 'Inactive') : filterValue
                  })`}
              </h2>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:text-base bg-gradient-to-r from-green-600 to-green-500 rounded-xl hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 no-print"
              >
                Print List
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:mb-6 no-print">
              <div className="flex-grow min-w-[150px]">
                <label htmlFor="filterType" className="block mb-1 text-sm font-medium sm:text-base">
                  Filter By
                </label>
                <select id="filterType" name="filterType" value={filterType} onChange={handleFilterChange} className={inputStyle}>
                  <option value="">All Schemes</option>
                  <option value="status">Status (Effective)</option>
                  <option value="date">Active On Date</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                  <option value="customerGroup">Customer Group</option>
                </select>
              </div>
              {filterType === 'status' && (
                <div className="flex-grow min-w-[150px]">
                  <label htmlFor="filterValueStatus" className="block mb-1 text-sm font-medium sm:text-base">
                    Status
                  </label>
                  <select
                    id="filterValueStatus"
                    name="filterValue"
                    value={filterValue}
                    onChange={handleFilterChange}
                    className={inputStyle}
                    required
                  >
                    <option value="" disabled>
                      Select Status
                    </option>
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
                    name="filterValue"
                    value={filterValue}
                    onChange={handleFilterChange}
                    className={inputStyle}
                    required
                  />
                </div>
              )}
              {(filterType === 'category' || filterType === 'product' || filterType === 'customerGroup') && (
                <div className="relative flex-grow min-w-[200px]" ref={filterInputRef}>
                  <label htmlFor="filterValueSearch" className="block mb-1 text-sm font-medium sm:text-base">
                    {filterType === 'category' ? 'Category Name' : filterType === 'product' ? 'Product Name' : 'Customer Name'}
                  </label>
                  <input
                    id="filterValueSearch"
                    type="text"
                    name="filterValue"
                    value={filterSearchTerm}
                    onChange={handleFilterChange}
                    onFocus={() => setIsFilterDropdownOpen(true)}
                    placeholder={`Type to search ${filterType}...`}
                    className={inputStyle}
                    autoComplete="off"
                    required
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
                        ) : filterType === 'product' ? (
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
                        ) : (
                          filteredFilterCustomers.length > 0 ? (
                            filteredFilterCustomers.map((customer) => (
                              <li
                                key={customer.id}
                                onClick={() => handleFilterSelect(customer.customer_name, 'customer')}
                                className="px-3 py-1 text-sm text-black cursor-pointer sm:px-4 sm:py-2 sm:text-base hover:bg-blue-100 dark:text-white dark:hover:bg-blue-600"
                              >
                                {customer.customer_name}
                              </li>
                            ))
                          ) : (
                            <li className="px-3 py-1 text-sm text-gray-500 sm:px-4 sm:py-2 sm:text-base dark:text-gray-400">
                              No customers found matching "{filterSearchTerm}"
                            </li>
                          )
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {filterType && (
                <button
                  onClick={clearFilter}
                  className="self-end px-4 py-2 text-sm font-semibold text-white transition duration-200 ease-in-out sm:py-3 sm:text-base bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl hover:from-gray-700 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {filteredSchemes.length === 0 ? (
              <p className="text-sm italic text-center opacity-75 sm:text-base">
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
                      <th className="px-2 py-2 font-semibold text-center sm:px-4 sm:py-3 action-col no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                      {filteredSchemes.map((scheme) => {
                        const isEffectivelyActive = calculateEffectiveActiveStatus(scheme);
                        return (
                          <motion.tr
                            key={scheme.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">{scheme.name}</td>
                            <td className="px-2 py-2 capitalize sm:px-4 sm:py-3">{scheme.type}</td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              {scheme.type === 'percentage' ? `${scheme.value}%` : formatCurrency(scheme.value)}
                            </td>
                            <td className="px-2 py-2 capitalize sm:px-4 sm:py-3">
                              {scheme.appliesTo === 'customerGroup' ? 'Customer Group' : scheme.appliesTo}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">{scheme.target}</td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                              {formatDate(scheme.startDate)} → {formatDate(scheme.endDate)}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <span
                                className={`status-badge px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${isEffectivelyActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                  }`}
                              >
                                {isEffectivelyActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center sm:px-4 sm:py-3 action-col no-print">
                              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                                <button
                                  onClick={() => handleEdit(scheme)}
                                  title="Edit Scheme"
                                  className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg action-btn sm:px-3 sm:text-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(scheme.id)}
                                  title="Delete Scheme"
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
                  <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:justify-end sm:gap-4 sm:mt-6">
                    <button
                      onClick={cancelDelete}
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