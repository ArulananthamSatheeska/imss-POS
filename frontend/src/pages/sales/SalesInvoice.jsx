import React, { useState, useEffect, useRef, useCallback } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { toast } from 'react-toastify';

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded">
          <h1 className="font-bold">Something went wrong.</h1>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const SalesInvoice = ({ initialData, isEditMode, onGenerateInvoice, onCancel, onUpdateInvoice }) => {
  const draftKey = 'salesInvoiceDraft';
  const formatDate = (date) => {
    try {
      return date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const invoiceNoRef = useRef(null);
  const invoiceDateRef = useRef(null);
  const invoiceTimeRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerAddressRef = useRef(null);
  const customerPhoneRef = useRef(null);
  const customerEmailRef = useRef(null);
  const purchaseMethodRef = useRef(null);
  const purchaseAmountRef = useRef(null);
  const taxPercentageRef = useRef(null);
  const itemRefs = useRef([]);

  const [formData, setFormData] = useState(() => {
    const defaultState = {
      invoice: {
        no: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      },
      customer: { id: null, name: '', address: '', phone: '', email: '' },
      items: [{ id: Date.now(), description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0, productId: null }],
      purchaseDetails: { method: 'cash', amount: 0, taxPercentage: 0 },
      status: 'pending',
      id: null,
    };

    if (isEditMode && initialData) {
      return {
        ...defaultState,
        ...initialData,
        invoice: {
          ...defaultState.invoice,
          ...(initialData.invoice || {}),
          date: formatDate(initialData.invoice?.date),
        },
        customer: {
          ...defaultState.customer,
          id: initialData.customer?.id || null,
          name: initialData.customer?.name || '',
          address: initialData.customer?.address || '',
          phone: initialData.customer?.phone || '',
          email: initialData.customer?.email || '',
        },
        items: (initialData.items || []).map((item, idx) => ({
          ...item,
          id: item.id || Date.now() + idx,
          productId: item.productId || item.product_id || null,
          qty: item.qty || item.quantity || 1,
          unitPrice: item.unitPrice || item.unit_price || 0,
          discountAmount: item.discountAmount || item.discount_amount || 0,
          discountPercentage: item.discountPercentage || item.discount_percentage || 0,
          total: item.total || 0,
        })),
        purchaseDetails: {
          ...defaultState.purchaseDetails,
          ...(initialData.purchaseDetails || {}),
          taxPercentage: initialData.tax_percentage || 0, // Use tax_percentage from backend
        },
        id: initialData.id || null,
      };
    }

    const savedDraft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (savedDraft) {
      return {
        ...defaultState,
        ...savedDraft,
        invoice: { ...defaultState.invoice, ...savedDraft.invoice, date: formatDate(savedDraft.invoice?.date) },
        customer: { ...defaultState.customer, ...savedDraft.customer, id: savedDraft.customer?.id || null },
        items: (savedDraft.items || []).map((item, idx) => ({
          ...item,
          id: item.id || Date.now() + idx,
          total: item.total || 0,
          unitPrice: item.unitPrice || 0,
          salesPrice: item.salesPrice || 0,
          discountAmount: item.discountAmount || 0,
          discountPercentage: item.discountPercentage || 0,
        })),
        purchaseDetails: { ...defaultState.purchaseDetails, ...(savedDraft.purchaseDetails || {}), taxPercentage: savedDraft.purchaseDetails?.taxPercentage || 0 },
        id: null,
      };
    }

    return defaultState;
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/products');
        setProducts(response.data.data || []);
      } catch {
        toast.error('Failed to load products.');
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/customers');
        setCustomers(response.data.data || []);
      } catch {
        toast.error('Failed to load customers.');
      } finally {
        setCustomersLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    itemRefs.current = formData.items.map((_, index) => ({
      description: { current: null },
      qty: { current: null },
    }));
  }, [formData.items.length]);

  useEffect(() => {
    invoiceNoRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      const { id, status, ...draftData } = formData;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [formData, isEditMode]);

  const handleInputChange = (e, section, field, index = null) => {
    const { name, value } = e.target;
    const targetName = name || field;
    let processedValue = value;

    setFormData((prev) => {
      const newData = { ...prev };
      if (index !== null && section === 'items') {
        const newItems = [...newData.items];
        if (targetName === 'qty') {
          processedValue = value === '' ? '' : parseFloat(value) || 0;
          newItems[index] = { ...newItems[index], qty: processedValue };
          const item = newItems[index];
          const qty = parseFloat(item.qty) || 0;
          const salesPrice = parseFloat(item.salesPrice) || 0;
          newItems[index].total = qty * salesPrice;
        }
        newData.items = newItems;
      } else {
        if (section === 'purchaseDetails' && (targetName === 'amount' || targetName === 'taxPercentage')) {
          processedValue = value === '' ? '' : parseFloat(value) || 0;
        }
        newData[section] = { ...newData[section], [targetName]: processedValue };
      }
      return newData;
    });

    setErrors((prev) => ({
      ...prev,
      [`${section === 'items' ? `item${targetName.charAt(0).toUpperCase() + targetName.slice(1)}${index}` : `${section}${targetName.charAt(0).toUpperCase() + targetName.slice(1)}`}`]: undefined,
      items: undefined,
    }));
  };

  const handleCustomerSelect = (selectedOption) => {
    const customer = selectedOption ? customers.find((c) => c.id === selectedOption.value) : null;
    setFormData((prev) => ({
      ...prev,
      customer: {
        id: customer ? customer.id : null,
        name: customer ? customer.customer_name : '',
        address: customer ? customer.address || '' : '',
        phone: customer ? customer.phone || '' : '',
        email: customer ? customer.email || '' : '',
      },
    }));
    setErrors((prev) => ({ ...prev, customerName: undefined, customerEmail: undefined }));
    setTimeout(() => customerAddressRef.current?.focus(), 0);
  };

  const handleProductSelect = (selectedOption, index) => {
    const product = selectedOption ? products.find((p) => p.product_id === selectedOption.value) : null;
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productId: product ? product.product_id : null,
        description: product ? product.product_name : '',
        unitPrice: product ? parseFloat(product.mrp) || 0 : 0,
        salesPrice: product ? parseFloat(product.sales_price) || 0 : 0,
        discountAmount: product ? (parseFloat(product.mrp) || 0) - (parseFloat(product.sales_price) || 0) : 0,
        discountPercentage: product && (parseFloat(product.mrp) || 0) > 0
          ? (((parseFloat(product.mrp) - parseFloat(product.sales_price)) / parseFloat(product.mrp)) * 100) : 0,
      };
      const item = newItems[index];
      const qty = parseFloat(item.qty) || 0;
      const salesPrice = parseFloat(item.salesPrice) || 0;
      newItems[index].total = qty * salesPrice;
      return { ...prev, items: newItems };
    });
    setErrors((prev) => ({ ...prev, [`itemDescription${index}`]: undefined }));
    setTimeout(() => itemRefs.current[index]?.qty?.current?.focus(), 0);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0, productId: null }],
    }));
    setTimeout(() => itemRefs.current[formData.items.length]?.description?.current?.focus(), 0);
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      toast.warn('Cannot remove the only item.');
      return;
    }
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const calculateSubtotal = useCallback(() => formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0), [formData.items]);
  const calculateTax = useCallback((subtotal) => {
    const taxPercentage = parseFloat(formData.purchaseDetails.taxPercentage) || 0;
    return subtotal * (taxPercentage / 100);
  }, [formData.purchaseDetails.taxPercentage]);
  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    return subtotal + calculateTax(subtotal);
  }, [calculateSubtotal, calculateTax]);
  const calculateBalance = useCallback(() => (parseFloat(formData.purchaseDetails.amount) || 0) - calculateTotal(), [calculateTotal, formData.purchaseDetails.amount]);

  const validateForm = () => {
    const newErrors = {};
    const { invoice, customer, items, purchaseDetails } = formData;

    // if (!invoice.no?.trim()) newErrors.invoiceNo = 'Invoice number is required';
    if (!invoice.date) newErrors.invoiceDate = 'Invoice date is required';
    if (!invoice.time || !/^\d{2}:\d{2}$/.test(invoice.time)) newErrors.invoiceTime = 'Invalid time format (HH:MM)';
    if (!customer.name?.trim()) newErrors.customerName = 'Customer name is required';
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) newErrors.customerEmail = 'Invalid email address';
    if (!items.length) newErrors.items = 'At least one item is required';
    if (purchaseDetails.taxPercentage !== '' && parseFloat(purchaseDetails.taxPercentage) < 0) {
      newErrors.purchaseTaxPercentage = 'Tax percentage cannot be negative';
    }

    items.forEach((item, idx) => {
      if (!item.productId && !item.description?.trim()) newErrors[`itemDescription${idx}`] = 'Description or product is required';
      if ((item.qty === '' || parseFloat(item.qty) <= 0)) newErrors[`itemQty${idx}`] = 'Quantity must be positive';
      const product = products.find((p) => p.product_id === item.productId);
      if (product && parseFloat(item.qty) > parseFloat(product.opening_stock_quantity)) {
        newErrors[`itemQty${idx}`] = `Quantity exceeds stock (${product.opening_stock_quantity})`;
      }
    });

    if (purchaseDetails.amount !== '' && parseFloat(purchaseDetails.amount) < 0) newErrors.purchaseAmount = 'Amount paid cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) {
        toast.warn('Please fix validation errors.');
        return;
      }

      setLoading(true);
      const payload = {
        invoice: formData.invoice,
        customer: {
          id: formData.customer.id || null,
          name: formData.customer.name,
          address: formData.customer.address || null,
          phone: formData.customer.phone || null,
          email: formData.customer.email || null,
        },
        items: formData.items.map((item) => ({
          id: isEditMode && item.id ? item.id : undefined,
          product_id: item.productId || null,
          description: item.description || 'Item',
          qty: parseFloat(item.qty) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          salesPrice: parseFloat(item.salesPrice) || 0,
          discountAmount: parseFloat(item.discountAmount) || 0,
          discountPercentage: parseFloat(item.discountPercentage) || 0,
          total: parseFloat(item.total) || 0,
        })),
        purchaseDetails: {
          method: formData.purchaseDetails.method,
          amount: parseFloat(formData.purchaseDetails.amount) || 0,
          taxPercentage: parseFloat(formData.purchaseDetails.taxPercentage) || 0,
        },
        status: formData.status,
      };

      try {
        if (isEditMode) {
          await onUpdateInvoice(payload, formData.id);
          toast.success('Invoice updated!');
        } else {
          await onGenerateInvoice(payload);
          toast.success('Invoice created!');
          localStorage.removeItem(draftKey);
          setFormData({
            invoice: { no: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) },
            customer: { id: null, name: '', address: '', phone: '', email: '' },
            items: [{ id: Date.now(), description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0, productId: null }],
            purchaseDetails: { method: 'cash', amount: 0, taxPercentage: 0 },
            status: 'pending',
            id: null,
          });
          setErrors({});
          invoiceNoRef.current?.focus();
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to save invoice.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [formData, isEditMode, onGenerateInvoice, onUpdateInvoice, products]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onCancel]);

  const getFieldOrder = useCallback(() => {
    const fields = [
      { ref: invoiceNoRef, name: 'invoiceNo', type: 'input' },
      { ref: invoiceDateRef, name: 'invoiceDate', type: 'input' },
      { ref: invoiceTimeRef, name: 'invoiceTime', type: 'input' },
      { ref: customerNameRef, name: 'customerName', type: 'select' },
      { ref: customerAddressRef, name: 'customerAddress', type: 'input' },
      { ref: customerPhoneRef, name: 'customerPhone', type: 'input' },
      { ref: customerEmailRef, name: 'customerEmail', type: 'input' },
    ];
    formData.items.forEach((_, index) => {
      fields.push(
        { ref: itemRefs.current[index]?.description, name: `itemDescription${index}`, type: 'select', index },
        { ref: itemRefs.current[index]?.qty, name: `itemQty${index}`, type: 'input', index },
        { ref: itemRefs.current[index]?.unitPrice, name: `itemUnitPrice${index}`, type: 'input', index },
        { ref: itemRefs.current[index]?.discountAmount, name: `itemDiscountAmount${index}`, type: 'input', index },
        { ref: itemRefs.current[index]?.discountPercentage, name: `itemDiscountPercentage${index}`, type: 'input', index },
      );
    });
    fields.push(
      { ref: purchaseMethodRef, name: 'purchaseMethod', type: 'select-native' },
      { ref: purchaseAmountRef, name: 'purchaseAmount', type: 'input' },
      { ref: taxPercentageRef, name: 'purchaseTaxPercentage', type: 'input' }
    );
    return fields;
  }, [formData.items]);

  const handleEnterKey = (e, currentRef, itemIndex = null) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();

    const fields = getFieldOrder();
    const currentFieldIndex = fields.findIndex((field) => field.ref?.current === currentRef.current);
    if (currentFieldIndex === -1) return;

    const currentField = fields[currentFieldIndex];
    if (currentField.type === 'select' && currentField.name === 'customerName' && !formData.customer.name) return;
    if (currentField.type === 'select' && currentField.name.startsWith('itemDescription') && !formData.items[itemIndex]?.productId) return;

    if (currentField.name === `itemDiscountPercentage${formData.items.length - 1}`) {
      addItem();
      return;
    }

    if (currentField.ref === purchaseAmountRef) {
      document.getElementById('invoiceForm')?.requestSubmit();
      return;
    }

    for (let i = currentFieldIndex + 1; i < fields.length; i++) {
      const nextField = fields[i];
      if (nextField.ref?.current) {
        nextField.ref.current.focus();
        if (nextField.type === 'input') nextField.ref.current.select?.();
        break;
      }
    }
  };

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.customer_name }));
  const productOptions = products.map((p) => ({ value: p.product_id, label: `${p.product_name} (Stock: ${p.opening_stock_quantity ?? 'N/A'})` }));

  const getSelectStyles = (hasError) => ({
    control: (provided, state) => ({
      ...provided,
      borderColor: hasError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : hasError ? '0 0 0 1px #ef4444' : 'none',
      '&:hover': { borderColor: hasError ? '#ef4444' : '#9ca3af' },
      minHeight: '42px',
    }),
    menu: (provided) => ({ ...provided, zIndex: 50 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#dbeafe' : state.isFocused ? '#eff6ff' : 'white',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  });

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();
  const balance = calculateBalance();

  const assignRef = (index, field, element) => {
    if (!itemRefs.current[index]) itemRefs.current[index] = {};
    itemRefs.current[index][field] = { current: element };
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
        <div className="flex flex-col w-full max-w-screen-2xl max-h-[95vh] p-6 bg-white rounded-lg shadow-xl">
          <h3 className="mb-4 text-2xl font-bold text-blue-600">{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</h3>
          <form id="invoiceForm" onSubmit={handleSubmit} noValidate className="flex-grow p-4 overflow-y-auto border bg-gray-50 rounded-xl">
            <div className="p-4 mb-6 bg-white border rounded-lg">
              <h4 className="pb-2 mb-3 text-lg font-semibold border-b">Invoice Details</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="invoiceNo" className="block mb-1 text-sm font-medium">Invoice No</label>
                  <input
                    id="invoiceNo"
                    ref={invoiceNoRef}
                    type="text"
                    value={formData.invoice.no}
                    onChange={(e) => handleInputChange(e, 'invoice', 'no')}
                    onKeyDown={(e) => handleEnterKey(e, invoiceNoRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${errors.invoiceNo ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="INV-2024-001"
                    readOnly
                  />
                  {/* {errors.invoiceNo && <p className="mt-1 text-xs text-red-600">{errors.invoiceNo}</p>} */}
                </div>
                <div>
                  <label htmlFor="invoiceDate" className="block mb-1 text-sm font-medium">Date <span className="text-red-500">*</span></label>
                  <input
                    id="invoiceDate"
                    ref={invoiceDateRef}
                    type="date"
                    value={formData.invoice.date}
                    onChange={(e) => handleInputChange(e, 'invoice', 'date')}
                    onKeyDown={(e) => handleEnterKey(e, invoiceDateRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${errors.invoiceDate ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    required
                  />
                  {errors.invoiceDate && <p className="mt-1 text-xs text-red-600">{errors.invoiceDate}</p>}
                </div>
                <div>
                  <label htmlFor="invoiceTime" className="block mb-1 text-sm font-medium">Time <span className="text-red-500">*</span></label>
                  <input
                    id="invoiceTime"
                    ref={invoiceTimeRef}
                    type="time"
                    value={formData.invoice.time}
                    onChange={(e) => handleInputChange(e, 'invoice', 'time')}
                    onKeyDown={(e) => handleEnterKey(e, invoiceTimeRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${errors.invoiceTime ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    required
                  />
                  {errors.invoiceTime && <p className="mt-1 text-xs text-red-600">{errors.invoiceTime}</p>}
                </div>
              </div>
            </div>

            <div className="p-4 mb-6 bg-white border rounded-lg">
              <h4 className="pb-2 mb-3 text-lg font-semibold border-b">Customer Information</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label htmlFor="customerName" className="block mb-1 text-sm font-medium">Name <span className="text-red-500">*</span></label>
                  <Select
                    inputId="customerName"
                    ref={customerNameRef}
                    options={customerOptions}
                    value={customerOptions.find((option) => option.label === formData.customer.name) || null}
                    onChange={handleCustomerSelect}
                    placeholder={customersLoading ? 'Loading...' : 'Select customer'}
                    isClearable
                    isSearchable
                    isDisabled={customersLoading}
                    styles={getSelectStyles(!!errors.customerName)}
                    onKeyDown={(e) => handleEnterKey(e, customerNameRef)}
                  />
                  {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
                </div>
                <div>
                  <label htmlFor="customerAddress" className="block mb-1 text-sm font-medium">Address</label>
                  <input
                    id="customerAddress"
                    ref={customerAddressRef}
                    type="text"
                    value={formData.customer.address}
                    onChange={(e) => handleInputChange(e, 'customer', 'address')}
                    onKeyDown={(e) => handleEnterKey(e, customerAddressRef)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block mb-1 text-sm font-medium">Phone</label>
                  <input
                    id="customerPhone"
                    ref={customerPhoneRef}
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => handleInputChange(e, 'customer', 'phone')}
                    onKeyDown={(e) => handleEnterKey(e, customerPhoneRef)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="+94 123 456 7890"
                  />
                </div>
                <div>
                  <label htmlFor="customerEmail" className="block mb-1 text-sm font-medium">Email</label>
                  <input
                    id="customerEmail"
                    ref={customerEmailRef}
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => handleInputChange(e, 'customer', 'email')}
                    onKeyDown={(e) => handleEnterKey(e, customerEmailRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${errors.customerEmail ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="customer@example.com"
                  />
                  {errors.customerEmail && <p className="mt-1 text-xs text-red-600">{errors.customerEmail}</p>}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-3">
                <h4 className="text-lg font-semibold">Invoice Items <span className="text-red-500">*</span></h4>
                <button type="button" onClick={addItem} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Add Item
                </button>
              </div>
              {errors.items && <p className="mb-2 text-sm text-red-600">{errors.items}</p>}
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="relative p-4 bg-white border rounded-lg">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute p-1 text-gray-400 rounded-full top-2 right-2 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <label htmlFor={`itemDescription${index}`} className="block mb-1 text-sm font-medium">Product <span className="text-red-500">*</span></label>
                        <Select
                          inputId={`itemDescription${index}`}
                          ref={(el) => assignRef(index, 'description', el)}
                          options={productOptions}
                          value={productOptions.find((option) => option.value === item.productId) || null}
                          onChange={(option) => handleProductSelect(option, index)}
                          placeholder="Select product"
                          isClearable
                          isSearchable
                          styles={getSelectStyles(!!errors[`itemDescription${index}`])}
                          onKeyDown={(e) => handleEnterKey(e, itemRefs.current[index]?.description, index)}
                        />
                        {errors[`itemDescription${index}`] && <p className="mt-1 text-xs text-red-600">{errors[`itemDescription${index}`]}</p>}
                      </div>
                      <div className="md:col-span-1">
                        <label htmlFor={`itemQty${index}`} className="block mb-1 text-sm font-medium">Qty <span className="text-red-500">*</span></label>
                        <input
                          id={`itemQty${index}`}
                          ref={(el) => assignRef(index, 'qty', el)}
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleInputChange(e, 'items', 'qty', index)}
                          onKeyDown={(e) => handleEnterKey(e, itemRefs.current[index]?.qty, index)}
                          className={`w-full p-2.5 border rounded-md focus:outline-none ${errors[`itemQty${index}`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                          min="0.01"
                          step="any"
                          required
                        />
                        {errors[`itemQty${index}`] && <p className="mt-1 text-xs text-red-600">{errors[`itemQty${index}`]}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`itemUnitPrice${index}`} className="block mb-1 text-sm font-medium">Unit Price (LKR) <span className="text-red-500">*</span></label>
                        <input
                          id={`itemUnitPrice${index}`}
                          type="number"
                          value={item.unitPrice}
                          className={`w-full p-2.5 border rounded-md focus:outline-none ${errors[`itemUnitPrice${index}`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                          readOnly
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`itemDiscountAmount${index}`} className="block mb-1 text-sm font-medium">Disc. (LKR)</label>
                        <input
                          id={`itemDiscountAmount${index}`}
                          ref={(el) => assignRef(index, 'discountAmount', el)}
                          type="number"
                          value={item.discountAmount}
                          onChange={(e) => handleInputChange(e, 'items', 'discountAmount', index)}
                          onKeyDown={(e) => handleEnterKey(e, itemRefs.current[index]?.discountAmount, index)}
                          className={`w-full p-2.5 border rounded-md focus:outline-none ${errors[`itemDiscountAmount${index}`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                          min="0"
                          step="0.01"
                        />
                        {errors[`itemDiscountAmount${index}`] && <p className="mt-1 text-xs text-red-600">{errors[`itemDiscountAmount${index}`]}</p>}
                      </div>
                      <div className="md:col-span-1">
                        <label htmlFor={`itemDiscountPercentage${index}`} className="block mb-1 text-sm font-medium">Disc. (%)</label>
                        <input
                          id={`itemDiscountPercentage${index}`}
                          ref={(el) => assignRef(index, 'discountPercentage', el)}
                          type="number"
                          value={item.discountPercentage}
                          onChange={(e) => handleInputChange(e, 'items', 'discountPercentage', index)}
                          onKeyDown={(e) => handleEnterKey(e, itemRefs.current[index]?.discountPercentage, index)}
                          className={`w-full p-2.5 border rounded-md focus:outline-none ${errors[`itemDiscountPercentage${index}`] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                          min="0"
                          max="100"
                          step="1"
                        />
                        {errors[`itemDiscountPercentage${index}`] && <p className="mt-1 text-xs text-red-600">{errors[`itemDiscountPercentage${index}`]}</p>}
                      </div>
                      <div className="flex items-end md:col-span-2">
                        <span className="w-full p-2.5 text-right font-medium">{(parseFloat(item.total) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-4 bg-white border rounded-lg md:col-span-2">
                <h4 className="pb-2 mb-3 text-lg font-semibold border-b">Payment Details</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="purchaseMethod" className="block mb-1 text-sm font-medium">Payment Method</label>
                    <select
                      id="purchaseMethod"
                      ref={purchaseMethodRef}
                      value={formData.purchaseDetails.method}
                      onChange={(e) => handleInputChange(e, 'purchaseDetails', 'method')}
                      onKeyDown={(e) => handleEnterKey(e, purchaseMethodRef)}
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="purchaseAmount" className="block mb-1 text-sm font-medium">Amount Paid (LKR)</label>
                    <input
                      id="purchaseAmount"
                      ref={purchaseAmountRef}
                      type="number"
                      value={formData.purchaseDetails.amount}
                      onChange={(e) => handleInputChange(e, 'purchaseDetails', 'amount')}
                      onKeyDown={(e) => handleEnterKey(e, purchaseAmountRef)}
                      className={`w-full p-2.5 border rounded-md focus:outline-none ${errors.purchaseAmount ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                      min="0"
                      step="0.01"
                    />
                    {errors.purchaseAmount && <p className="mt-1 text-xs text-red-600">{errors.purchaseAmount}</p>}
                  </div>
                  <div>
                    <label htmlFor="taxPercentage" className="block mb-1 text-sm font-medium">Tax (%)</label>
                    <input
                      id="taxPercentage"
                      ref={taxPercentageRef}
                      type="number"
                      value={formData.purchaseDetails.taxPercentage}
                      onChange={(e) => handleInputChange(e, 'purchaseDetails', 'taxPercentage')}
                      onKeyDown={(e) => handleEnterKey(e, taxPercentageRef)}
                      className={`w-full p-2.5 border rounded-md focus:outline-none ${errors.purchaseTaxPercentage ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                      min="0"
                      step="0.1"
                    />
                    {errors.purchaseTaxPercentage && <p className="mt-1 text-xs text-red-600">{errors.purchaseTaxPercentage}</p>}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-100 border rounded-lg">
                <h4 className="mb-3 text-base font-semibold">Invoice Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({formData.purchaseDetails.taxPercentage}%):</span>
                    <span>LKR {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-semibold border-t">
                    <span>Total:</span>
                    <span>LKR {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span>LKR {(parseFloat(formData.purchaseDetails.amount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-lg border-t">
                    <span>{balance < 0 ? 'Balance Due:' : 'Change:'}</span>
                    <span className={balance < 0 ? 'text-red-600' : 'text-blue-600'}>LKR {Math.abs(balance).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 py-3 mt-6 -mx-4 bg-gray-100 border-t rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${loading ? 'opacity-70' : ''}`}
                >
                  {loading ? 'Processing...' : isEditMode ? 'Update Invoice (Ctrl+S)' : 'Save Invoice (Ctrl+S)'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SalesInvoice;