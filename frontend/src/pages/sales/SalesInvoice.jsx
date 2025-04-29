import React, { useState, useEffect, useRef, useCallback } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { toast } from 'react-toastify';

const SalesInvoice = ({
  initialData,
  isEditMode,
  onGenerateInvoice,
  onCancel,
  onUpdateInvoice,
}) => {
  const draftKey = 'salesInvoiceDraft';

  // --- State ---
  const [formData, setFormData] = useState(() => {
    const defaultState = {
      invoice: {
        no: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      },
      customer: { name: '', address: '', phone: '', email: '' },
      items: [
        { id: Date.now(), description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0, productId: null },
      ],
      purchaseDetails: { method: 'cash', amount: 0 },
      status: 'pending',
      id: null,
    };

    if (isEditMode && initialData) {
      return {
        ...defaultState,
        ...initialData,
        invoice: { ...defaultState.invoice, ...(initialData.invoice || {}) },
        customer: { ...defaultState.customer, ...(initialData.customer || {}) },
        items: (initialData.items || []).map((item) => ({
          ...item,
          id: item.id || Date.now() + Math.random(),
          productId: item.productId || null,
        })),
        purchaseDetails: { ...defaultState.purchaseDetails, ...(initialData.purchaseDetails || {}) },
        id: initialData.id || null,
        status: initialData.status || 'pending',
      };
    }

    try {
      const savedDraft = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (savedDraft?.invoice && savedDraft?.customer && savedDraft?.items && savedDraft?.purchaseDetails) {
        const itemsWithIds = (savedDraft.items || []).map((item) => ({
          ...item,
          id: item.id || Date.now() + Math.random(),
          productId: item.productId || null,
        }));
        return { ...defaultState, ...savedDraft, items: itemsWithIds, id: null, status: 'pending' };
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return defaultState;
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const firstInputRef = useRef(null);
  const itemRefs = useRef([]);
  const purchaseAmountRef = useRef(null);

  // --- Fetch Products ---
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/products');
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products.');
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      const { id, status, ...draftData } = formData;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [formData, isEditMode]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, formData.items.length);
    formData.items.forEach((_, index) => {
      if (!itemRefs.current[index]) {
        itemRefs.current[index] = {};
      }
    });
  }, [formData.items]);

  // --- Input Handling ---
  const handleInputChange = (e, section, field, index = null) => {
    const { name, value, type } = e.target;
    const targetName = name || field;
    let processedValue = value;

    setFormData((prevFormData) => {
      const newData = { ...prevFormData };

      if (index !== null && section === 'items') {
        const newItems = [...newData.items];
        if (!newItems[index]) return prevFormData;

        if (type === 'number' || ['qty', 'unitPrice', 'discountAmount', 'discountPercentage'].includes(targetName)) {
          processedValue = value === '' ? '' : parseFloat(value);
          if (isNaN(processedValue) && value !== '') {
            processedValue = 0;
          }
        }
        newItems[index] = { ...newItems[index], [targetName]: processedValue };

        // Recalculate item total and sync discounts
        const item = newItems[index];
        const qty = parseFloat(item.qty) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const totalBeforeDiscount = qty * unitPrice;

        if (targetName === 'discountAmount') {
          const discountAmount = Math.max(0, parseFloat(item.discountAmount) || 0);
          newItems[index].discountPercentage = totalBeforeDiscount > 0 ? ((discountAmount / totalBeforeDiscount) * 100).toFixed(2) : 0;
          newItems[index].discountAmount = Math.min(totalBeforeDiscount, discountAmount);
        } else if (targetName === 'discountPercentage') {
          const discountPercentage = Math.min(100, Math.max(0, parseFloat(item.discountPercentage) || 0));
          newItems[index].discountAmount = ((totalBeforeDiscount * discountPercentage) / 100).toFixed(2);
          newItems[index].discountPercentage = discountPercentage;
        }

        const currentDiscountAmount = Math.max(0, parseFloat(newItems[index].discountAmount) || 0);
        newItems[index].total = totalBeforeDiscount - Math.min(totalBeforeDiscount, currentDiscountAmount);

        newData.items = newItems;
      } else if (section === 'purchaseDetails' && targetName === 'amount') {
        processedValue = value === '' ? '' : parseFloat(value);
        if (isNaN(processedValue) && value !== '') {
          processedValue = 0;
        }
        newData[section] = { ...newData[section], [targetName]: processedValue };
      } else if (section) {
        newData[section] = { ...newData[section], [targetName]: value };
      }
      return newData;
    });

    // Clear specific error
    let errorKey = '';
    if (index !== null && section === 'items') {
      errorKey = `item${targetName.charAt(0).toUpperCase() + targetName.slice(1)}${index}`;
    } else if (section === 'invoice') {
      errorKey = `invoice${targetName.charAt(0).toUpperCase() + targetName.slice(1)}`;
    } else if (section === 'customer') {
      errorKey = `customer${targetName.charAt(0).toUpperCase() + targetName.slice(1)}`;
    } else if (section === 'purchaseDetails' && targetName === 'amount') {
      errorKey = 'purchaseAmount';
    }
    if (section === 'items' && errors.items) {
      setErrors((prev) => ({ ...prev, items: undefined }));
    }
    if (errorKey && errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  // --- Handle Product Selection ---
  const handleProductSelect = (selectedOption, index) => {
    setFormData((prevFormData) => {
      const newItems = [...prevFormData.items];
      if (!newItems[index]) return prevFormData;

      const product = selectedOption ? products.find((p) => p.product_id === selectedOption.value) : null;
      newItems[index] = {
        ...newItems[index],
        productId: product ? product.product_id : null,
        description: product ? product.product_name : '',
        unitPrice: product ? parseFloat(product.sales_price) || 0 : 0,
        qty: newItems[index].qty || 1,
        discountAmount: newItems[index].discountAmount || 0,
        discountPercentage: newItems[index].discountPercentage || 0,
      };

      // Recalculate total
      const qty = parseFloat(newItems[index].qty) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      const totalBeforeDiscount = qty * unitPrice;
      const discountAmount = Math.max(0, parseFloat(newItems[index].discountAmount) || 0);
      newItems[index].total = totalBeforeDiscount - Math.min(totalBeforeDiscount, discountAmount);

      return { ...prevFormData, items: newItems };
    });

    // Clear errors
    setErrors((prev) => ({
      ...prev,
      [`itemDescription${index}`]: undefined,
      [`itemUnitPrice${index}`]: undefined,
    }));
  };

  // --- Item Management ---
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          description: '',
          qty: 1,
          unitPrice: 0,
          discountAmount: 0,
          discountPercentage: 0,
          total: 0,
          productId: null,
        },
      ],
    }));
    setTimeout(() => {
      const lastIndex = formData.items.length;
      if (itemRefs.current[lastIndex]?.description) {
        itemRefs.current[lastIndex].description.focus();
      }
    }, 0);
  };

  const removeItem = (indexToRemove) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== indexToRemove),
    }));
    itemRefs.current.splice(indexToRemove, 1);
  };

  // --- Calculations ---
  const calculateSubtotal = useCallback(() => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  }, [formData.items]);

  const calculateTax = useCallback((subtotal) => {
    return subtotal * 0.10;
  }, []);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  }, [calculateSubtotal, calculateTax]);

  const calculateBalance = useCallback(() => {
    const total = calculateTotal();
    const amountPaid = parseFloat(formData.purchaseDetails.amount) || 0;
    return amountPaid - total;
  }, [calculateTotal, formData.purchaseDetails.amount]);

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    const { invoice, customer, items, purchaseDetails } = formData;

    if (!invoice.no?.trim()) newErrors.invoiceNo = 'Invoice number is required';
    if (!invoice.date) newErrors.invoiceDate = 'Invoice date is required';
    if (!invoice.time) newErrors.invoiceTime = 'Invoice time is required';
    else if (!/^\d{2}:\d{2}$/.test(invoice.time)) newErrors.invoiceTime = 'Invalid time format (HH:MM)';

    if (!customer.name?.trim()) newErrors.customerName = 'Customer name is required';
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.customerEmail = 'Invalid email address';
    }

    if (!items || items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      items.forEach((item, idx) => {
        if (!item.description?.trim()) newErrors[`itemDescription${idx}`] = 'Description is required';
        const qty = parseFloat(item.qty);
        if (isNaN(qty) || qty <= 0) newErrors[`itemQty${idx}`] = 'Qty must be > 0';
        const unitPrice = parseFloat(item.unitPrice);
        if (isNaN(unitPrice) || unitPrice < 0) newErrors[`itemUnitPrice${idx}`] = 'Price >= 0';
        const discountAmount = parseFloat(item.discountAmount);
        if (!isNaN(discountAmount) && discountAmount < 0)
          newErrors[`itemDiscountAmount${idx}`] = 'Disc. Amt >= 0';
        const discountPercentage = parseFloat(item.discountPercentage);
        if (!isNaN(discountPercentage) && (discountPercentage < 0 || discountPercentage > 100))
          newErrors[`itemDiscountPercentage${idx}`] = 'Disc. % (0-100)';

        if (item.productId) {
          const product = products.find((p) => p.product_id === item.productId);
          if (product && qty > product.opening_stock_quantity) {
            newErrors[`itemQty${idx}`] = `Qty exceeds stock (${product.opening_stock_quantity})`;
          }
        }
      });
    }

    const purchaseAmount = parseFloat(purchaseDetails.amount);
    if (purchaseDetails.amount !== '' && (isNaN(purchaseAmount) || purchaseAmount < 0)) {
      newErrors.purchaseAmount = 'Amount paid cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Form Submission ---
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSuccessMessage('');
      setErrorMessage('');

      if (!validateForm()) {
        setErrorMessage('Please fix the validation errors indicated below.');
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey && firstInputRef.current) {
          let errorElement = null;
          if (firstErrorKey.startsWith('item')) {
            const match = firstErrorKey.match(/item([A-Za-z]+)(\d+)/);
            if (match) {
              const field = match[1].toLowerCase();
              const index = parseInt(match[2], 10);
              errorElement = itemRefs.current?.[index]?.[field];
            }
          } else if (firstErrorKey.startsWith('invoice')) {
            errorElement = document.getElementById(firstErrorKey);
          } else if (firstErrorKey.startsWith('customer')) {
            errorElement = document.getElementById(firstErrorKey);
          } else if (firstErrorKey === 'purchaseAmount') {
            errorElement = purchaseAmountRef.current;
          }

          if (errorElement && typeof errorElement.focus === 'function') {
            errorElement.focus();
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            firstInputRef.current.focus();
          }
        }
        return;
      }

      setLoading(true);

      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          description: item.description,
          qty: parseFloat(item.qty) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          discountAmount: parseFloat(item.discountAmount) || 0,
          discountPercentage: parseFloat(item.discountPercentage) || 0,
          productId: item.productId || undefined,
        })),
        purchaseDetails: {
          ...formData.purchaseDetails,
          amount: parseFloat(formData.purchaseDetails.amount) || 0,
        },
        id: isEditMode ? formData.id : undefined,
      };
      if (!isEditMode) {
        delete payload.id;
      }

      try {
        if (isEditMode) {
          await onUpdateInvoice(payload, formData.id);
          setSuccessMessage('Invoice updated successfully!');
        } else {
          await onGenerateInvoice(payload);
          setSuccessMessage('Invoice created successfully! Clearing form...');
          localStorage.removeItem(draftKey);
          setFormData({
            invoice: {
              no: '',
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            },
            customer: { name: '', address: '', phone: '', email: '' },
            items: [
              {
                id: Date.now(),
                description: '',
                qty: 1,
                unitPrice: 0,
                discountAmount: 0,
                discountPercentage: 0,
                total: 0,
                productId: null,
              },
            ],
            purchaseDetails: { method: 'cash', amount: 0 },
            status: 'pending',
            id: null,
          });
          setErrors({});
          if (firstInputRef.current) firstInputRef.current.focus();
          setTimeout(() => {
            setSuccessMessage('');
          }, 2500);
        }
      } catch (error) {
        console.error('Submit error:', error);
        let displayError = isEditMode ? 'Failed to update invoice.' : 'Failed to save invoice.';
        let backendErrors = {};

        if (error.response?.status === 422 && error.response?.data?.errors) {
          backendErrors = error.response.data.errors;
          const errorMessages = Object.values(backendErrors).flat();
          displayError = `Validation failed: ${errorMessages.join(' ')}`;
          const mappedErrors = {};
          Object.keys(backendErrors).forEach((key) => {
            const message = backendErrors[key][0];
            if (key.startsWith('items.')) {
              const parts = key.split('.');
              if (parts.length === 3) {
                const index = parts[1];
                const field = parts[2];
                const frontendField =
                  field === 'qty'
                    ? 'Qty'
                    : field === 'unitPrice'
                    ? 'UnitPrice'
                    : field === 'discountAmount'
                    ? 'DiscountAmount'
                    : field === 'discountPercentage'
                    ? 'DiscountPercentage'
                    : field.charAt(0).toUpperCase() + field.slice(1);
                mappedErrors[`item${frontendField}${index}`] = message;
              }
            } else if (key.startsWith('customer.')) {
              const field = key.split('.')[1];
              mappedErrors[`customer${field.charAt(0).toUpperCase() + field.slice(1)}`] = message;
            } else if (key.startsWith('invoice.')) {
              const field = key.split('.')[1];
              mappedErrors[`invoice${field.charAt(0).toUpperCase() + field.slice(1)}`] = message;
            } else if (key === 'purchaseDetails.amount') {
              mappedErrors.purchaseAmount = message;
            } else {
              mappedErrors[key] = message;
            }
          });
          setErrors((prev) => ({ ...prev, ...mappedErrors }));
        } else if (error.response?.data?.message) {
          displayError = error.response.data.message;
        } else if (error.message) {
          displayError = error.message;
        }
        setErrorMessage(displayError);
      } finally {
        setLoading(false);
      }
    },
    [formData, isEditMode, validateForm, onGenerateInvoice, onUpdateInvoice, errors, products]
  );

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit(e);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, handleSubmit]);

  // --- Enter Key Navigation ---
  const handleItemKeyDown = (index, fieldName, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const fieldsOrder = ['description', 'qty', 'unitPrice', 'discountAmount', 'discountPercentage'];
      const currentFieldIndex = fieldsOrder.indexOf(fieldName);

      if (currentFieldIndex === -1) return;

      if (currentFieldIndex < fieldsOrder.length - 1) {
        const nextField = fieldsOrder[currentFieldIndex + 1];
        itemRefs.current[index]?.[nextField]?.focus();
      } else {
        if (index < formData.items.length - 1) {
          itemRefs.current[index + 1]?.description?.focus();
        } else {
          purchaseAmountRef.current?.focus();
        }
      }
    }
  };

  // --- Ref Assignment Helper ---
  const setItemRef = (element, index, fieldName) => {
    if (element) {
      if (!itemRefs.current[index]) {
        itemRefs.current[index] = {};
      }
      itemRefs.current[index][fieldName] = element;
    }
  };

  // --- Calculated values ---
  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const correctTotal = subtotal + tax;
  const balance = calculateBalance();

  // --- Product Options for Dropdown ---
  const productOptions = products.map((product) => ({
    value: product.product_id,
    label: `${product.product_name} (Stock: ${product.opening_stock_quantity})`,
  }));

  // --- Custom Styles for react-select ---
  const getSelectStyles = (index) => ({
    control: (provided) => ({
      ...provided,
      backgroundColor: '#2d3748',
      borderColor: errors[`itemDescription${index}`] ? '#f56565' : '#4a5568',
      color: '#ffffff',
      '&:hover': { borderColor: '#a0aec0' },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#2d3748',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#4a5568' : '#2d3748',
      color: '#ffffff',
      '&:hover': { backgroundColor: '#4a5568' },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#ffffff',
    }),
    input: (provided) => ({
      ...provided,
      color: '#ffffff',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#a0aec0',
    }),
  });

  // --- JSX ---
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-200 dark:bg-gray-900 bg-opacity-90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoiceTitle"
    >
      <div className="dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-screen-2xl max-h-[95vh] flex flex-col">
        <h3 id="invoiceTitle" className="flex-shrink-0 mb-4 text-2xl font-bold text-blue-500 md:text-3xl">
          {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
        </h3>

        <form
          id="invoiceForm"
          onSubmit={handleSubmit}
          noValidate
          className="flex-grow w-full p-4 overflow-y-auto shadow-lg bg-gray-800/50 rounded-xl md:p-6 backdrop-blur-sm"
        >
          <p className="mb-6 text-sm text-gray-400">
            {isEditMode ? `Editing Invoice ID: ${formData.id}` : 'Fill in the details below.'}
          </p>

          {/* Invoice Details Section */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-300">
                Invoice No <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="invoiceNo"
                  ref={firstInputRef}
                  type="text"
                  name="no"
                  value={formData.invoice.no}
                  onChange={(e) => handleInputChange(e, 'invoice', 'no')}
                  className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${
                    errors.invoiceNo ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'
                  }`}
                  placeholder="e.g., INV-2024-001"
                  aria-invalid={!!errors.invoiceNo}
                  aria-describedby="invoiceNoError"
                  required
                />
                {errors.invoiceNo && (
                  <p id="invoiceNoError" className="mt-1 text-xs text-red-400">
                    {errors.invoiceNo}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-300">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="invoiceDate"
                  type="date"
                  name="date"
                  value={formData.invoice.date}
                  onChange={(e) => handleInputChange(e, 'invoice', 'date')}
                  className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${
                    errors.invoiceDate ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'
                  }`}
                  aria-invalid={!!errors.invoiceDate}
                  aria-describedby="invoiceDateError"
                  required
                />
                {errors.invoiceDate && (
                  <p id="invoiceDateError" className="mt-1 text-xs text-red-400">
                    {errors.invoiceDate}
                  </p>
                )}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="invoiceTime" className="block text-sm font-medium text-gray-300">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="invoiceTime"
                  type="time"
                  name="time"
                  value={formData.invoice.time}
                  onChange={(e) => handleInputChange(e, 'invoice', 'time')}
                  className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${
                    errors.invoiceTime ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hoverPretty-printed code block: border-gray-500'
                  }`}
                  aria-invalid={!!errors.invoiceTime}
                  aria-describedby="invoiceTimeError"
                  step="60"
                  required
                />
                {errors.invoiceTime && (
                  <p id="invoiceTimeError" className="mt-1 text-xs text-red-400">
                    {errors.invoiceTime}
                  </p>
                )}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details Section */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-1 h-5 mr-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-lg font-semibold text-blue-400">Customer Information</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  name="name"
                  value={formData.customer.name}
                  onChange={(e) => handleInputChange(e, 'customer', 'name')}
                  className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${
                    errors.customerName ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'
                  }`}
                  placeholder="John Doe"
                  aria-invalid={!!errors.customerName}
                  aria-describedby="customerNameError"
                  required
                />
                {errors.customerName && (
                  <p id="customerNameError" className="mt-1 text-xs text-red-400">
                    {errors.customerName}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-300">
                  Address
                </label>
                <input
                  id="customerAddress"
                  type="text"
                  name="address"
                  value={formData.customer.address}
                  onChange={(e) => handleInputChange(e, 'customer', 'address')}
                  className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                  placeholder="123 Main St, City"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300">
                  Phone
                </label>
                <div className="relative">
                  <input
                    id="customerPhone"
                    type="tel"
                    name="phone"
                    value={formData.customer.phone}
                    onChange={(e) => handleInputChange(e, 'customer', 'phone')}
                    className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                    placeholder="+94 123 456 7890"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="customerEmail"
                    type="email"
                    name="email"
                    value={formData.customer.email}
                    onChange={(e) => handleInputChange(e, 'customer', 'email')}
                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${
                      errors.customerEmail ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'
                    }`}
                    placeholder="customer@example.com"
                    aria-invalid={!!errors.customerEmail}
                    aria-describedby="customerEmailError"
                  />
                  {errors.customerEmail && (
                    <p id="customerEmailError" className="mt-1 text-xs text-red-400">
                      {errors.customerEmail}
                    </p>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Item Table Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-1 h-5 mr-2 bg-blue-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-blue-400">
                  Invoice Items <span className="text-red-500">*</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-1.5 text-sm text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/20"
                aria-label="Add new item row"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Item
              </button>
            </div>
            {errors.items && <p className="mb-2 text-xs text-red-400">{errors.items}</p>}

            <div className="overflow-x-auto border rounded-lg shadow-inner border-gray-700/50">
              <table className="w-full min-w-[900px]" role="grid" aria-label="Invoice items">
                <thead className="sticky top-0 z-10">
                  <tr className="text-gray-300 bg-gray-700/90 backdrop-blur-sm">
                    <th className="p-3 text-sm font-semibold text-left" scope="col" style={{ width: '30%' }}>
                      Description *
                    </th>
                    <th className="p-3 text-sm font-semibold text-center" scope="col" style={{ width: '8%' }}>
                      Qty *
                    </th>
                    <th className="p-3 text-sm font-semibold text-right" scope="col" style={{ width: '14%' }}>
                      Unit Price (LKR) *
                    </th>
                    <th className="p-3 text-sm font-semibold text-right" scope="col" style={{ width: '14%' }}>
                      Disc. (LKR)
                    </th>
                    <th className="p-3 text-sm font-semibold text-right" scope="col" style={{ width: '10%' }}>
                      Disc. (%)
                    </th>
                    <th className="p-3 text-sm font-semibold text-right" scope="col" style={{ width: '16%' }}>
                      Total (LKR)
                    </th>
                    <th className="p-3 text-sm font-semibold text-center" scope="col" style={{ width: '8%' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {formData.items.map((item, index) => {
                    const selectedProduct = item.productId
                      ? productOptions.find((option) => option.value === item.productId)
                      : null;

                    return (
                      <tr
                        key={item.id}
                        className={`${
                          index % 2 === 0 ? 'bg-gray-700/30' : 'bg-gray-700/20'
                        } hover:bg-gray-700/40 transition-colors`}
                      >
                        <td className="p-2 align-top">
                          <Select
                            ref={(el) => setItemRef(el, index, 'description')}
                            options={productOptions}
                            value={selectedProduct}
                            onChange={(option) => handleProductSelect(option, index)}
                            placeholder={productsLoading ? 'Loading products...' : 'Select a product'}
                            isClearable
                            isDisabled={productsLoading}
                            styles={getSelectStyles(index)}
                            classNamePrefix="react-select"
                            onKeyDown={(e) => handleItemKeyDown(index, 'description', e)}
                            aria-invalid={!!errors[`itemDescription${index}`]}
                            aria-describedby={`itemDescriptionError${index}`}
                          />
                          {errors[`itemDescription${index}`] && (
                            <p id={`itemDescriptionError${index}`} className="mt-1 text-xs text-red-400">
                              {errors[`itemDescription${index}`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 align-top">
                          <input
                            ref={(el) => setItemRef(el, index, 'qty')}
                            type="number"
                            name="qty"
                            value={item.qty}
                            onChange={(e) => handleInputChange(e, 'items', 'qty', index)}
                            onKeyDown={(e) => handleItemKeyDown(index, 'qty', e)}
                            className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-center transition-all ${
                              errors[`itemQty${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'
                            }`}
                            step="any"
                            placeholder=""
                            aria-invalid={!!errors[`itemQty${index}`]}
                            aria-describedby={`itemQtyError${index}`}
                            required
                          />
                          {errors[`itemQty${index}`] && (
                            <p id={`itemQtyError${index}`} className="mt-1 text-xs text-red-400">
                              {errors[`itemQty${index}`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 align-top">
                          <input
                            ref={(el) => setItemRef(el, index, 'unitPrice')}
                            type="number"
                            name="unitPrice"
                            value={item.unitPrice}
                            onChange={(e) => handleInputChange(e, 'items', 'unitPrice', index)}
                            onKeyDown={(e) => handleItemKeyDown(index, 'unitPrice', e)}
                            className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${
                              errors[`itemUnitPrice${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'
                            }`}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            aria-invalid={!!errors[`itemUnitPrice${index}`]}
                            aria-describedby={`itemUnitPriceError${index}`}
                            required
                          />
                          {errors[`itemUnitPrice${index}`] && (
                            <p id={`itemUnitPriceError${index}`} className="mt-1 text-xs text-red-400">
                              {errors[`itemUnitPrice${index}`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 align-top">
                          <input
                            ref={(el) => setItemRef(el, index, 'discountAmount')}
                            type="number"
                            name="discountAmount"
                            value={item.discountAmount}
                            onChange={(e) => handleInputChange(e, 'items', 'discountAmount', index)}
                            onKeyDown={(e) => handleItemKeyDown(index, 'discountAmount', e)}
                            className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${
                              errors[`itemDiscountAmount${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'
                            }`}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            aria-invalid={!!errors[`itemDiscountAmount${index}`]}
                            aria-describedby={`itemDiscountAmountError${index}`}
                          />
                          {errors[`itemDiscountAmount${index}`] && (
                            <p id={`itemDiscountAmountError${index}`} className="mt-1 text-xs text-red-400">
                              {errors[`itemDiscountAmount${index}`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 align-top">
                          <div className="relative">
                            <input
                              ref={(el) => setItemRef(el, index, 'discountPercentage')}
                              type="number"
                              name="discountPercentage"
                              value={item.discountPercentage}
                              onChange={(e) => handleInputChange(e, 'items', 'discountPercentage', index)}
                              onKeyDown={(e) => handleItemKeyDown(index, 'discountPercentage', e)}
                              className={`w-full p-2 pr-6 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${
                                errors[`itemDiscountPercentage${index}`]
                                  ? 'border-red-500'
                                  : 'border-gray-600/30 hover:border-gray-500'
                              }`}
                              min="0"
                              max="100"
                              step="1"
                              placeholder="0"
                              aria-invalid={!!errors[`itemDiscountPercentage${index}`]}
                              aria-describedby={`itemDiscountPercentageError${index}`}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          </div>
                          {errors[`itemDiscountPercentage${index}`] && (
                            <p id={`itemDiscountPercentageError${index}`} className="mt-1 text-xs text-red-400">
                              {errors[`itemDiscountPercentage${index}`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 font-medium text-right text-white align-middle">
                          {(parseFloat(item.total) || 0).toFixed(2)}
                        </td>
                        <td className="p-2 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length <= 1}
                            className={`p-1.5 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 ${
                              formData.items.length <= 1
                                ? 'text-gray-500 cursor-not-allowed'
                                : 'text-red-500 hover:bg-red-500/20 hover:text-red-400'
                            }`}
                            title={formData.items.length <= 1 ? 'Cannot remove the only item' : 'Remove this item'}
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-gray-400 md:hidden">Scroll table horizontally.</p>
          </div>

          {/* Purchase Details & Totals Section */}
          <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex items-center mb-3">
                <div className="w-1 h-5 mr-2 bg-blue-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-blue-400">Purchase Details</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="purchaseMethod" className="block text-sm font-medium text-gray-300">
                    Payment Method
                  </label>
                  <select
                    id="purchaseMethod"
                    name="method"
                    value={formData.purchaseDetails.method}
                    onChange={(e) => handleInputChange(e, 'purchaseDetails', 'method')}
                    className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="purchaseAmount" className="block text-sm font-medium text-gray-300">
                    Amount Paid (LKR)
                  </label>
                  <div className="relative">
                    <input
                      id="purchaseAmount"
                      ref={purchaseAmountRef}
                      type="number"
                      name="amount"
                      value={formData.purchaseDetails.amount}
                      onChange={(e) => handleInputChange(e, 'purchaseDetails', 'amount')}
                      className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-right transition-all ${
                        errors.purchaseAmount ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'
                      }`}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      aria-invalid={!!errors.purchaseAmount}
                      aria-describedby="purchaseAmountError"
                    />
                    {errors.purchaseAmount && (
                      <p id="purchaseAmountError" className="mt-1 text-xs text-red-400">
                        {errors.purchaseAmount}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="flex flex-col justify-center h-full p-4 shadow-lg bg-gradient-to-br from-gray-700/60 to-gray-700/40 rounded-xl">
                <h4 className="mb-3 text-base font-semibold text-gray-200">Invoice Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="font-medium text-white">LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Tax (10%):</span>
                    <span className="font-medium text-white">LKR {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-base font-semibold border-t border-gray-600/50">
                    <span className="text-gray-200">Total Amount:</span>
                    <span className="text-white">LKR {correctTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Amount Paid:</span>
                    <span className="font-medium text-white">
                      LKR {(parseFloat(formData.purchaseDetails.amount) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-600/50">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-gray-200">
                        {balance < 0 ? 'Balance Due:' : 'Balance (Change):'}
                      </span>
                      <span className={`font-bold ${balance < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        LKR {Math.abs(balance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Buttons Footer */}
          <div className="sticky bottom-0 flex flex-wrap items-center justify-end px-4 pt-4 pb-1 -mx-4 space-x-3 border-t bg-gray-800/50 border-gray-700/50 backdrop-blur-sm md:-mx-6 md:px-6">
            <div className="flex-grow mr-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-2 text-sm text-white rounded-lg shadow-md bg-red-600/90 animate-fade-in"
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 w-5 h-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="break-words">{errorMessage}</span>
                  </div>
                </div>
              )}
              {successMessage && (
                <div
                  role="alert"
                  className="p-2 text-sm text-white rounded-lg shadow-md bg-green-600/90 animate-fade-in"
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 w-5 h-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="break-words">{successMessage}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center flex-shrink-0 space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center px-5 py-2 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-md bg-gray-600/50 hover:bg-gray-500/60 hover:shadow-gray-500/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel (Esc)
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center shadow-md hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-2 text-white animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V8H4z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {isEditMode ? 'Update Invoice (Ctrl+S)' : 'Save Invoice (Ctrl+S)'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesInvoice;