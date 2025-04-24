import React, { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

const SalesInvoice = ({
    selectedCustomer,
    cartItems,
    onCustomerSelect,
    onAddItem,
    onRemoveItem,
    onGenerateInvoice,
    onCancel,
}) => {
    // Load draft from localStorage if available
    const draftKey = 'salesInvoiceDraft';
    const savedDraft = JSON.parse(localStorage.getItem(draftKey) || 'null');

    const [customer, setCustomer] = useState(savedDraft?.customer || selectedCustomer || {
        name: '',
        address: '',
        phone: '',
        email: '',
    });

    const [items, setItems] = useState(savedDraft?.items || cartItems || [
        { id: 1, description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 },
    ]);

    const [invoice, setInvoice] = useState(savedDraft?.invoice || {
        no: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Refs for auto-focus and keyboard navigation
    const firstInputRef = useRef(null);
    const itemRefs = useRef([]);


    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                // Use consistent base URL for API
                let baseUrl = 'http://127.0.0.1:8000/api/products';
                let url = baseUrl;
                if (searchTerm) {
                    url = `${baseUrl}/search?q=${encodeURIComponent(searchTerm)}`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.data);
                } else {
                    console.error('Failed to fetch products');
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoadingProducts(false);
            }
        };

        const debouncedFetch = debounce(fetchProducts, 300);
        debouncedFetch();

        return () => debouncedFetch.cancel();
    }, [searchTerm]);


    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

    const handleProductSelect = (index, value) => {
        const selectedProduct = products.find(p =>
            p.product_name.toLowerCase() === value.toLowerCase() ||
            (p.short_name && p.short_name.toLowerCase() === value.toLowerCase()) ||
            p.item_code.toLowerCase() === value.toLowerCase() ||
            (p.barcode && p.barcode.toLowerCase() === value.toLowerCase())
        );

        if (selectedProduct) {
            const updatedItems = [...items];
            updatedItems[index] = {
                ...updatedItems[index],
                description: selectedProduct.product_name,
                unitPrice: selectedProduct.sales_price,
                mrp: selectedProduct.mrp,
                productId: selectedProduct.product_id,
            };
            setItems(updatedItems);
        }
    };

    // Persist draft to localStorage on changes
    useEffect(() => {
        const draft = { customer, items, invoice };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [customer, items, invoice]);

    // Validation function
    const validateForm = () => {
        const newErrors = {};
        if (!invoice.no.trim()) newErrors.invoiceNo = 'Invoice number is required';
        if (!invoice.date) newErrors.invoiceDate = 'Invoice date is required';
        if (!invoice.time) newErrors.invoiceTime = 'Invoice time is required';

        if (!customer.name.trim()) newErrors.customerName = 'Customer name is required';
        if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) newErrors.customerEmail = 'Invalid email address';

        items.forEach((item, idx) => {
            if (!item.description.trim()) newErrors[`itemDescription${idx}`] = 'Description is required';
            if (item.qty <= 0) newErrors[`itemQty${idx}`] = 'Quantity must be greater than zero';
            if (item.unitPrice < 0) newErrors[`itemUnitPrice${idx}`] = 'Unit price cannot be negative';
            if (item.discountAmount < 0) newErrors[`itemDiscountAmount${idx}`] = 'Discount cannot be negative';
            if (item.discountPercentage < 0 || item.discountPercentage > 100) newErrors[`itemDiscountPercentage${idx}`] = 'Discount % must be between 0 and 100';
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomer({ ...customer, [name]: value });
        setErrors((prev) => ({ ...prev, [`customer${name.charAt(0).toUpperCase() + name.slice(1)}`]: undefined }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];

        if (name === 'description') {
            setSearchTerm(value);
            updatedItems[index][name] = value;
        } else {
            updatedItems[index][name] = name === 'description' ? value : parseFloat(value) || 0;
        }

        // Calculate total based on quantity, unit price, and discounts
        const item = updatedItems[index];
        const totalBeforeDiscount = item.qty * item.unitPrice;
        const discountAmount = item.discountAmount || 0;
        const discountPercentage = item.discountPercentage || 0;

        if (name === 'discountAmount') {
            updatedItems[index].discountPercentage = totalBeforeDiscount > 0
                ? (discountAmount / totalBeforeDiscount) * 100
                : 0;
        } else if (name === 'discountPercentage') {
            updatedItems[index].discountAmount = (totalBeforeDiscount * discountPercentage) / 100;
        }

        updatedItems[index].total = totalBeforeDiscount - updatedItems[index].discountAmount;
        setItems(updatedItems);

        // Clear errors for this field
        setErrors((prev) => ({ ...prev, [`item${name.charAt(0).toUpperCase() + name.slice(1)}${index}`]: undefined }));
    };

    const addItem = () => {
        const newItem = {
            id: items.length + 1,
            description: '',
            qty: 1,
            unitPrice: 0,
            discountAmount: 0,
            discountPercentage: 0,
            total: 0,
        };
        setItems([...items, newItem]);
        setTimeout(() => {
            const lastIndex = items.length;
            if (itemRefs.current[lastIndex]) {
                itemRefs.current[lastIndex].description.focus();
            }
        }, 0);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const updatedItems = items.filter((_, idx) => idx !== index);
            setItems(updatedItems);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setErrorMessage('Please fix the errors before submitting.');
            return;
        }
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const newInvoice = {
                ...invoice,
                customer,
                items,
                total: calculateTotal(),
                status: 'pending',
            };
            await onGenerateInvoice(newInvoice);
            setSuccessMessage('Invoice saved successfully!');
            localStorage.removeItem(draftKey);
        } catch (error) {
            setErrorMessage('Failed to save invoice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Keyboard shortcuts: Ctrl+S to save, Esc to cancel
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                document.getElementById('invoiceForm').requestSubmit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    // Handle Enter key navigation and adding new item
    const handleItemKeyDown = (index, fieldName, e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const fieldsOrder = ['description', 'qty', 'unitPrice', 'discountAmount', 'discountPercentage'];
            const currentFieldIndex = fieldsOrder.indexOf(fieldName);
            if (currentFieldIndex === -1) return;

            // Move to next field in current item
            if (currentFieldIndex < fieldsOrder.length - 1) {
                const nextField = fieldsOrder[currentFieldIndex + 1];
                if (itemRefs.current[index] && itemRefs.current[index][nextField]) {
                    itemRefs.current[index][nextField].focus();
                }
            } else {
                // Last field, move to next item description or add new item
                if (index < items.length - 1) {
                    if (itemRefs.current[index + 1] && itemRefs.current[index + 1].description) {
                        itemRefs.current[index + 1].description.focus();
                    }
                } else {
                    addItem();
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-200 dark:bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="invoiceTitle">
            <div className="dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-screen-2xl max-h-[95vh]">
                <h3 id="invoiceTitle" className="text-3xl font-bold mb-6 text-blue-500">Fill Invoice Details</h3>

                <form
                    id="invoiceForm"
                    onSubmit={handleSubmit}
                    noValidate
                    className="bg-gray-800/50 rounded-xl p-6 shadow-lg backdrop-blur-sm w-full max-h-[75vh] overflow-y-auto"
                >   {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-blue-400 mb-1">Create Invoice</h2>
                        <p className="text-gray-400 text-sm">Fill in the details below to create a new invoice</p>
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="space-y-1">
                            <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-300">Invoice No</label>
                            <div className="relative">
                                <input
                                    id="invoiceNo"
                                    ref={firstInputRef}
                                    type="text"
                                    name="no"
                                    value={invoice.no}
                                    onChange={(e) => setInvoice({ ...invoice, no: e.target.value })}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceNo ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    placeholder="INV-001"
                                    aria-invalid={!!errors.invoiceNo}
                                    aria-describedby="invoiceNoError"
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="text-gray-400 text-xs">#</span>
                                </div>
                            </div>
                            {errors.invoiceNo && <p id="invoiceNoError" className="text-red-400 text-xs mt-1">{errors.invoiceNo}</p>}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-300">Date</label>
                            <div className="relative">
                                <input
                                    id="invoiceDate"
                                    type="date"
                                    name="date"
                                    value={invoice.date}
                                    onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceDate ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    aria-invalid={!!errors.invoiceDate}
                                    aria-describedby="invoiceDateError"
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            {errors.invoiceDate && <p id="invoiceDateError" className="text-red-400 text-xs mt-1">{errors.invoiceDate}</p>}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="invoiceTime" className="block text-sm font-medium text-gray-300">Time</label>
                            <div className="relative">
                                <input
                                    id="invoiceTime"
                                    type="time"
                                    name="time"
                                    value={invoice.time}
                                    onChange={(e) => setInvoice({ ...invoice, time: e.target.value })}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceTime ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    aria-invalid={!!errors.invoiceTime}
                                    aria-describedby="invoiceTimeError"
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            {errors.invoiceTime && <p id="invoiceTimeError" className="text-red-400 text-xs mt-1">{errors.invoiceTime}</p>}
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <div className="w-1 h-6 bg-blue-500 rounded-full mr-2"></div>
                            <h4 className="text-lg font-semibold text-blue-400">Customer Information</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-300">Name</label>
                                <input
                                    id="customerName"
                                    type="text"
                                    name="name"
                                    value={customer.name}
                                    onChange={handleCustomerChange}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.customerName ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    placeholder="John Doe"
                                    aria-invalid={!!errors.customerName}
                                    aria-describedby="customerNameError"
                                    required
                                />
                                {errors.customerName && <p id="customerNameError" className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-300">Address</label>
                                <input
                                    id="customerAddress"
                                    type="text"
                                    name="address"
                                    value={customer.address}
                                    onChange={handleCustomerChange}
                                    className="w-full p-3 bg-gray-700/80 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all hover:border-gray-500"
                                    placeholder="123 Main St"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300">Phone</label>
                                <div className="relative">
                                    <input
                                        id="customerPhone"
                                        type="tel"
                                        name="phone"
                                        value={customer.phone}
                                        onChange={handleCustomerChange}
                                        className="w-full p-3 bg-gray-700/80 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all hover:border-gray-500"
                                        placeholder="+94 123 456 7890"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300">Email</label>
                                <div className="relative">
                                    <input
                                        id="customerEmail"
                                        type="email"
                                        name="email"
                                        value={customer.email}
                                        onChange={handleCustomerChange}
                                        className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.customerEmail ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                        placeholder="customer@example.com"
                                        aria-invalid={!!errors.customerEmail}
                                        aria-describedby="customerEmailError"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.customerEmail && <p id="customerEmailError" className="text-red-400 text-xs mt-1">{errors.customerEmail}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Item Table */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <div className="w-1 h-6 bg-blue-500 rounded-full mr-2"></div>
                                <h4 className="text-lg font-semibold text-blue-400">Invoice Items</h4>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 shadow-md hover:shadow-blue-500/20"
                                aria-label="Add item"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-700/50 shadow-lg">
                            <table className="w-full mb-4" role="grid" aria-label="Invoice items">
                                <thead>
                                    <tr className="bg-gray-700/80 text-gray-300">
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Description</th>
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Qty</th>
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Price</th>
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Discount (LKR)</th>
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Discount (%)</th>
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Total</th>
                                        <th className="p-3 text-left text-sm font-medium" scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className={`border-t border-gray-700/30 ${index % 2 === 0 ? 'bg-gray-700/30' : 'bg-gray-700/20'} hover:bg-gray-700/40 transition-colors`}>
                                            <td className="p-2">
                                                <div className="relative">
                                                    <input
                                                        ref={el => {
                                                            if (!itemRefs.current[index]) itemRefs.current[index] = {};
                                                            itemRefs.current[index].description = el;
                                                        }}
                                                        type="text"
                                                        name="description"
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        onBlur={(e) => handleProductSelect(index, e.target.value)}
                                                        onKeyDown={(e) => handleItemKeyDown(index, 'description', e)}
                                                        list={`productList${index}`}
                                                        className={`w-full p-2 bg-gray-700/20 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white transition-all ${errors[`itemDescription${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                        placeholder="Search product..."
                                                        aria-invalid={!!errors[`itemDescription${index}`]}
                                                        aria-describedby={`itemDescriptionError${index}`}
                                                        required
                                                    />
                                                    {loadingProducts && (
                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <datalist id={`productList${index}`}>
                                                        {products.map((product) => (
                                                            <option key={product.product_id} value={product.product_name}>
                                                                {product.item_code} - {product.sales_price} LKR
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                    {errors[`itemDescription${index}`] && <p id={`itemDescriptionError${index}`} className="text-red-400 text-xs mt-1">{errors[`itemDescription${index}`]}</p>}
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    ref={el => {
                                                        if (!itemRefs.current[index]) itemRefs.current[index] = {};
                                                        itemRefs.current[index].qty = el;
                                                    }}
                                                    type="number"
                                                    name="qty"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'qty', e)}
                                                    className={`w-20 p-2 bg-gray-700/20 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-center transition-all ${errors[`itemQty${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="1"
                                                    aria-invalid={!!errors[`itemQty${index}`]}
                                                    aria-describedby={`itemQtyError${index}`}
                                                    required
                                                />
                                                {errors[`itemQty${index}`] && <p id={`itemQtyError${index}`} className="text-red-400 text-xs mt-1">{errors[`itemQty${index}`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <div className="relative">
                                                    <input
                                                        ref={el => {
                                                            if (!itemRefs.current[index]) itemRefs.current[index] = {};
                                                            itemRefs.current[index].unitPrice = el;
                                                        }}
                                                        type="number"
                                                        name="unitPrice"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        onKeyDown={(e) => handleItemKeyDown(index, 'unitPrice', e)}
                                                        className={`w-28 p-2 bg-gray-700/20 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemUnitPrice${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                        min="0"
                                                        step="0.01"
                                                        aria-invalid={!!errors[`itemUnitPrice${index}`]}
                                                        aria-describedby={`itemUnitPriceError${index}`}
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                                        <span className="text-gray-400 text-xs">LKR</span>
                                                    </div>
                                                </div>
                                                {errors[`itemUnitPrice${index}`] && <p id={`itemUnitPriceError${index}`} className="text-red-400 text-xs mt-1">{errors[`itemUnitPrice${index}`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    ref={el => {
                                                        if (!itemRefs.current[index]) itemRefs.current[index] = {};
                                                        itemRefs.current[index].discountAmount = el;
                                                    }}
                                                    type="number"
                                                    name="discountAmount"
                                                    value={item.discountAmount}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'discountAmount', e)}
                                                    className={`w-24 p-2 bg-gray-700/20 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemDiscountAmount${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0"
                                                    step="0.01"
                                                    aria-invalid={!!errors[`itemDiscountAmount${index}`]}
                                                    aria-describedby={`itemDiscountAmountError${index}`}
                                                />
                                                {errors[`itemDiscountAmount${index}`] && <p id={`itemDiscountAmountError${index}`} className="text-red-400 text-xs mt-1">{errors[`itemDiscountAmount${index}`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <div className="relative">
                                                    <input
                                                        ref={el => {
                                                            if (!itemRefs.current[index]) itemRefs.current[index] = {};
                                                            itemRefs.current[index].discountPercentage = el;
                                                        }}
                                                        type="number"
                                                        name="discountPercentage"
                                                        value={item.discountPercentage}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        onKeyDown={(e) => handleItemKeyDown(index, 'discountPercentage', e)}
                                                        className={`w-20 p-2 bg-gray-700/20 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemDiscountPercentage${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        aria-invalid={!!errors[`itemDiscountPercentage${index}`]}
                                                        aria-describedby={`itemDiscountPercentageError${index}`}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                        <span className="text-gray-400 text-xs">%</span>
                                                    </div>
                                                </div>
                                                {errors[`itemDiscountPercentage${index}`] && <p id={`itemDiscountPercentageError${index}`} className="text-red-400 text-xs mt-1">{errors[`itemDiscountPercentage${index}`]}</p>}
                                            </td>
                                            <td className="p-2 items-end">
                                                <div className="w-32 p-2 bg-gray-700/30 rounded text-right text-white font-medium">
                                                    LKR {item.total.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length <= 1}
                                                    className={`p-2 rounded-md transition-all ${items.length <= 1 ? 'bg-gray-600/30 text-gray-400 cursor-not-allowed' : 'bg-red-600/80 text-white hover:bg-red-500 shadow-md hover:shadow-red-500/20'}`}
                                                    title={items.length <= 1 ? "Can't remove the only item" : "Remove item"}
                                                    aria-label={`Remove item ${index + 1}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-6">
                            <div className="bg-gradient-to-br from-gray-700/80 to-gray-700/50 p-6 rounded-xl shadow-lg w-80">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Subtotal:</span>
                                        <span className="text-white font-medium">LKR {calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Tax (10%):</span>
                                        <span className="text-white font-medium">LKR {(calculateTotal() * 0.1).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-600/50">
                                        <div className="flex justify-between text-right text-lg">
                                            <span className="text-gray-300 font-semibold">Total:</span>
                                            <span className="text-blue-400 font-bold">LKR {(calculateTotal() * 1.1).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700/50">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 bg-gray-600/50 text-white rounded-lg hover:bg-gray-500/60 transition-all duration-300 flex items-center shadow-md hover:shadow-gray-500/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center shadow-md hover:shadow-blue-500/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Save Invoice
                                </>
                            )}
                        </button>
                    </div>

                    {/* Success/Error Notifications */}
                    {successMessage && (
                        <div role="alert" className="mt-6 p-4 bg-green-600/90 text-white rounded-lg shadow-lg animate-fade-in">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {successMessage}
                            </div>
                        </div>
                    )}
                    {errorMessage && (
                        <div role="alert" className="mt-6 p-4 bg-red-600/90 text-white rounded-lg shadow-lg animate-fade-in">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errorMessage}
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default SalesInvoice;
