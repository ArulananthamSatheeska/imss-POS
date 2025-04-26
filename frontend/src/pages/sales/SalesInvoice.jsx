import React, { useState, useEffect, useRef } from 'react';

const SalesInvoice = ({
    selectedCustomer,
    cartItems,
    // onCustomerSelect, // Prop not used in the provided code snippet
    // onAddItem,      // Prop not used in the provided code snippet
    // onRemoveItem,   // Prop not used in the provided code snippet
    onGenerateInvoice, // This function (from parent) makes the API call
    onCancel,
}) => {
    // Load draft from localStorage if available
    const draftKey = 'salesInvoiceDraft';
    const savedDraft = JSON.parse(localStorage.getItem(draftKey) || 'null');

    const [customer, setCustomer] = useState(savedDraft?.customer || selectedCustomer || {
        name: '', address: '', phone: '', email: '',
    });
    const [items, setItems] = useState(savedDraft?.items || cartItems || [
        { id: Date.now(), description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 }, // Use timestamp for unique default key
    ]);
    const [invoice, setInvoice] = useState(savedDraft?.invoice || {
        no: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), // Use 24hr format often expected by backend
    });
    const [purchaseDetails, setPurchaseDetails] = useState(savedDraft?.purchaseDetails || {
        method: 'cash', amount: 0,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const firstInputRef = useRef(null);
    const itemRefs = useRef([]);
    const purchaseAmountRef = useRef(null);

    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const draft = { customer, items, invoice, purchaseDetails };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [customer, items, invoice, purchaseDetails]);

    const validateForm = () => {
        const newErrors = {};
        // --- Basic Required Checks ---
        if (!invoice.no.trim()) newErrors.invoiceNo = 'Invoice number is required';
        if (!invoice.date) newErrors.invoiceDate = 'Invoice date is required';
        if (!invoice.time) newErrors.invoiceTime = 'Invoice time is required'; // Basic check
        else if (!/^\d{2}:\d{2}$/.test(invoice.time)) newErrors.invoiceTime = 'Invalid time format (HH:MM)'; // More specific format check if needed

        if (!customer.name.trim()) newErrors.customerName = 'Customer name is required';

        // --- Email Validation ---
        if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
            newErrors.customerEmail = 'Invalid email address';
        }

        // --- Item Validation ---
        if (!items || items.length === 0) {
            newErrors.items = 'At least one item is required';
        } else {
            items.forEach((item, idx) => {
                if (!item.description.trim()) newErrors[`itemDescription${idx}`] = 'Description is required';
                if (item.qty == null || item.qty <= 0) newErrors[`itemQty${idx}`] = 'Quantity must be greater than zero'; // Check for null too
                if (item.unitPrice == null || item.unitPrice < 0) newErrors[`itemUnitPrice${idx}`] = 'Unit price cannot be negative';
                if (item.discountAmount == null || item.discountAmount < 0) newErrors[`itemDiscountAmount${idx}`] = 'Discount amount cannot be negative';
                 if (item.discountPercentage == null || item.discountPercentage < 0 || item.discountPercentage > 100) {
                    newErrors[`itemDiscountPercentage${idx}`] = 'Discount % must be between 0 and 100';
                 }
            });
        }

         // --- Purchase Details Validation ---
        if (purchaseDetails.amount == null || purchaseDetails.amount < 0) {
             newErrors.purchaseAmount = 'Purchase amount cannot be negative';
         }
         // You might add validation for payment method if needed, though the select handles it generally.

        setErrors(newErrors);
        // console.log("Validation Errors:", newErrors); // Debug validation
        return Object.keys(newErrors).length === 0;
    };


    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
        // Clear specific error when user types
        const errorKey = `customer${name.charAt(0).toUpperCase() + name.slice(1)}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
         // Special case for email validation trigger
         if (name === 'email' && errors.customerEmail) {
             setErrors(prev => ({ ...prev, customerEmail: undefined }));
         }
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        let numericValue = name === 'description' ? value : parseFloat(value);
        // Handle case where parseFloat results in NaN (e.g., empty input) -> treat as 0 for calculation
        if (typeof numericValue === 'number' && isNaN(numericValue)) {
            numericValue = 0;
        }
        updatedItems[index][name] = numericValue;


        // Recalculate dependent fields (total, potentially discount sync)
        const item = updatedItems[index];
        const qty = item.qty || 0;
        const unitPrice = item.unitPrice || 0;
        const totalBeforeDiscount = qty * unitPrice;

        // Sync discounts: prioritize the field being changed
        if (name === 'discountAmount') {
            const discountAmount = item.discountAmount || 0;
            updatedItems[index].discountPercentage = totalBeforeDiscount > 0
                ? Math.min(100, Math.max(0, (discountAmount / totalBeforeDiscount) * 100)) // Clamp between 0-100
                : 0;
        } else if (name === 'discountPercentage') {
            const discountPercentage = item.discountPercentage || 0;
            updatedItems[index].discountAmount = (totalBeforeDiscount * Math.min(100, Math.max(0, discountPercentage))) / 100; // Clamp percentage
        }

        // Ensure discount amount doesn't exceed totalBeforeDiscount
        updatedItems[index].discountAmount = Math.min(totalBeforeDiscount, updatedItems[index].discountAmount || 0);

        // Final total calculation
        updatedItems[index].total = totalBeforeDiscount - (updatedItems[index].discountAmount || 0);

        setItems(updatedItems);

        // Clear errors for the specific field changed
        const errorKey = `item${name.charAt(0).toUpperCase() + name.slice(1)}${index}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
    };


    const handlePurchaseDetailsChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'amount') {
            processedValue = parseFloat(value);
             if (isNaN(processedValue)) {
                 processedValue = 0;
             }
        }
        setPurchaseDetails(prev => ({ ...prev, [name]: processedValue }));

        if (name === 'amount' && errors.purchaseAmount) {
            setErrors(prev => ({ ...prev, purchaseAmount: undefined }));
        }
    };

    const addItem = () => {
        const newItem = {
            id: Date.now(), // Use timestamp or UUID for better key uniqueness
            description: '',
            qty: 1,
            unitPrice: 0,
            discountAmount: 0,
            discountPercentage: 0,
            total: 0,
        };
        setItems([...items, newItem]);
        // Focus logic remains the same
        setTimeout(() => {
            const lastIndex = items.length; // Index will be length - 1 after adding, so use length for ref lookup
            if (itemRefs.current[lastIndex] && itemRefs.current[lastIndex].description) {
                 // Ensure itemRefs array is correctly populated for the new item index
                 itemRefs.current[lastIndex].description.focus();
            }
        }, 0);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const updatedItems = items.filter((_, idx) => idx !== index);
            setItems(updatedItems);
            // Clean up refs for removed item (optional but good practice)
            itemRefs.current.splice(index, 1);
            // Also clean up potential errors associated with removed item indices higher than the removed one (tricky)
            // Easiest might be to re-validate or just let next validation handle it.
        }
    };

    // --- Calculations --- (Keep for display, backend recalculates)
    const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.total || 0), 0);
    const calculateTax = (subtotal) => subtotal * 0.10; // 10% Tax Rate
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTax(subtotal);
        return subtotal + tax;
    };
    const calculateBalance = () => {
        const total = calculateTotal();
        const amountPaid = purchaseDetails.amount || 0;
        return amountPaid - total;
    };
    // --- End Calculations ---


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage(''); // Clear previous messages
        setErrorMessage('');

        if (!validateForm()) {
            setErrorMessage('Please fix the validation errors indicated below.');
             // Find the first error element and scroll to it (optional enhancement)
             const firstErrorKey = Object.keys(errors).find(key => errors[key]);
             if (firstErrorKey) {
                 // Logic to find the corresponding input element based on the key and focus/scroll
             }
            return;
        }

        setLoading(true);

        // Let backend calculate totals for accuracy
        const itemsPayload = items.map(({ id, ...item }) => ({
             ...item,
             // Ensure numeric types are sent correctly
             qty: parseFloat(item.qty) || 0,
             unitPrice: parseFloat(item.unitPrice) || 0,
             discountAmount: parseFloat(item.discountAmount) || 0,
             discountPercentage: parseFloat(item.discountPercentage) || 0,
             // 'total' will be ignored/recalculated by backend
        }));

        const invoiceDataToSend = {
            invoice: {
                 no: invoice.no,
                 date: invoice.date,
                 time: invoice.time,
            },
            customer: {
                 name: customer.name,
                 address: customer.address || null, // Send null if empty
                 phone: customer.phone || null,
                 email: customer.email || null,
            },
            items: itemsPayload,
            purchaseDetails: {
                 method: purchaseDetails.method,
                 amount: parseFloat(purchaseDetails.amount) || 0,
            },
            status: 'pending', // Default status
        };

        // console.log("Data being sent to backend:", JSON.stringify(invoiceDataToSend, null, 2)); // DEBUG: Log payload

        try {
            // Call the actual API function passed via props
            const result = await onGenerateInvoice(invoiceDataToSend); // Pass the structured data

            setSuccessMessage('Invoice saved successfully!');
            // console.log("Invoice creation successful:", result); // Log success response from parent

            // Clear the form and draft on successful submission
            setCustomer({ name: '', address: '', phone: '', email: '' });
            setItems([{ id: Date.now(), description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 }]);
            setInvoice({ no: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) });
            setPurchaseDetails({ method: 'cash', amount: 0 });
            setErrors({});
            localStorage.removeItem(draftKey);

            // Optionally call onCancel or navigate away after success display
            // setTimeout(() => { onCancel(); }, 2000);


        } catch (error) {
            // console.error("Error caught in handleSubmit:", error); // Debug caught error
            // Enhance error message display
            let displayError = 'Failed to save invoice. Please try again.';
            if (error.response && error.response.data && error.response.data.errors) {
                // Laravel validation error
                const validationErrors = error.response.data.errors;
                const errorMessages = Object.values(validationErrors).flat(); // Get all error messages
                displayError = `Validation failed: ${errorMessages.join(' ')}`;
                 // Optionally, update the errors state to highlight fields from backend validation
                 // This requires mapping backend error keys (e.g., 'items.0.qty') to frontend state keys (e.g., 'itemQty0')
            } else if (error.response && error.response.data && error.response.data.message) {
                // General backend error message
                 displayError = error.response.data.message;
            } else if (error.message) {
                 displayError = error.message;
            }
             setErrorMessage(displayError);
        } finally {
            setLoading(false);
        }
    };

    // Keyboard shortcuts: Ctrl+S to save, Esc to cancel
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                // Use the button's click or directly call handleSubmit
                // document.getElementById('invoiceForm').requestSubmit(); // Might not work reliably with async/state updates
                handleSubmit(e); // Call directly
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, handleSubmit]); // Add handleSubmit dependency


    // Handle Enter key navigation and adding new item
     const handleItemKeyDown = (index, fieldName, e) => {
         if (e.key === 'Enter') {
             e.preventDefault();
             const fieldsOrder = ['description', 'qty', 'unitPrice', 'discountAmount', 'discountPercentage'];
             const currentFieldIndex = fieldsOrder.indexOf(fieldName);

             if (currentFieldIndex === -1) return;

             // Move to next field in the current item
             if (currentFieldIndex < fieldsOrder.length - 1) {
                 const nextField = fieldsOrder[currentFieldIndex + 1];
                 // Ensure the ref structure is populated before accessing
                 if (itemRefs.current[index] && itemRefs.current[index][nextField]) {
                     itemRefs.current[index][nextField].focus();
                 }
             } else {
                 // Last field ('discountPercentage') in the current item
                 // Option 1: Move to the *next* item's description
                 if (index < items.length - 1) {
                      if (itemRefs.current[index + 1] && itemRefs.current[index + 1].description) {
                         itemRefs.current[index + 1].description.focus();
                     }
                 }
                 // Option 2: Add a new item and focus its description
                 // else {
                 //     addItem(); // This already includes focus logic
                 // }
                 // Option 3: Move to purchase amount (as currently implemented)
                 else {
                    if (purchaseAmountRef.current) {
                         purchaseAmountRef.current.focus();
                     }
                 }
             }
         }
     };

    // --- REF MANAGEMENT ---
    // Ensure itemRefs array has entries for all current items
     useEffect(() => {
         itemRefs.current = itemRefs.current.slice(0, items.length); // Trim if items were removed
         items.forEach((_, index) => {
             if (!itemRefs.current[index]) {
                 itemRefs.current[index] = {}; // Initialize ref object for new items
             }
         });
     }, [items]);

    // Helper to assign refs correctly
     const setItemRef = (element, index, fieldName) => {
         if (element) {
             if (!itemRefs.current[index]) {
                 itemRefs.current[index] = {};
             }
             itemRefs.current[index][fieldName] = element;
         }
     };


    // --- JSX --- (Mostly unchanged, adding ref assignments and aria-describedby)
    const subtotal = calculateSubtotal(); // Calculate once for display
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;
    const balance = calculateBalance();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-200 dark:bg-gray-900 bg-opacity-90" role="dialog" aria-modal="true" aria-labelledby="invoiceTitle">
            <div className="dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-screen-2xl max-h-[95vh] flex flex-col">
                <h3 id="invoiceTitle" className="flex-shrink-0 mb-4 text-2xl font-bold text-blue-500 md:text-3xl">Fill Invoice Details</h3>

                {/* Form scrolls, not the whole modal background */}
                <form
                    id="invoiceForm"
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex-grow w-full p-4 overflow-y-auto shadow-lg bg-gray-800/50 rounded-xl md:p-6 backdrop-blur-sm" // Use flex-grow to take available space
                >
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="mb-1 text-xl font-bold text-blue-400 md:text-2xl">Create Invoice</h2>
                        <p className="text-sm text-gray-400">Fill in the details below</p>
                    </div>

                     {/* Invoice Details */}
                    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                       {/* Invoice No */}
                        <div className="space-y-1">
                             <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-300">Invoice No <span className="text-red-500">*</span></label>
                             <div className="relative">
                                 <input
                                    id="invoiceNo"
                                    ref={firstInputRef}
                                    type="text"
                                    name="no"
                                    value={invoice.no}
                                    onChange={(e) => {
                                        setInvoice({ ...invoice, no: e.target.value });
                                        if(errors.invoiceNo) setErrors(prev => ({...prev, invoiceNo: undefined}));
                                    }}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceNo ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    placeholder="INV-001"
                                    aria-invalid={!!errors.invoiceNo}
                                    aria-describedby="invoiceNoError"
                                    required
                                />
                                {/* Icon removed as it was just '#' */}
                             </div>
                             {errors.invoiceNo && <p id="invoiceNoError" className="mt-1 text-xs text-red-400">{errors.invoiceNo}</p>}
                         </div>
                        {/* Date */}
                        <div className="space-y-1">
                             <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-300">Date <span className="text-red-500">*</span></label>
                             <div className="relative">
                                 <input
                                    id="invoiceDate"
                                    type="date"
                                    name="date"
                                    value={invoice.date}
                                    onChange={(e) => {
                                        setInvoice({ ...invoice, date: e.target.value });
                                        if(errors.invoiceDate) setErrors(prev => ({...prev, invoiceDate: undefined}));
                                    }}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceDate ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    aria-invalid={!!errors.invoiceDate}
                                    aria-describedby="invoiceDateError"
                                    required
                                />
                                {/* Calendar Icon */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                             </div>
                            {errors.invoiceDate && <p id="invoiceDateError" className="mt-1 text-xs text-red-400">{errors.invoiceDate}</p>}
                        </div>
                        {/* Time */}
                         <div className="space-y-1">
                             <label htmlFor="invoiceTime" className="block text-sm font-medium text-gray-300">Time <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                     id="invoiceTime"
                                    type="time" // Renders browser's time picker
                                    name="time"
                                    value={invoice.time} // Should be in HH:MM format
                                     onChange={(e) => {
                                         setInvoice({ ...invoice, time: e.target.value });
                                         if(errors.invoiceTime) setErrors(prev => ({...prev, invoiceTime: undefined}));
                                     }}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceTime ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    aria-invalid={!!errors.invoiceTime}
                                    aria-describedby="invoiceTimeError"
                                    step="60" // Only show hours and minutes
                                     required
                                 />
                                {/* Clock Icon */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 </div>
                             </div>
                             {errors.invoiceTime && <p id="invoiceTimeError" className="mt-1 text-xs text-red-400">{errors.invoiceTime}</p>}
                         </div>
                    </div>

                    {/* Customer Details */}
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            <div className="w-1 h-5 mr-2 bg-blue-500 rounded-full"></div>
                             <h4 className="text-lg font-semibold text-blue-400">Customer Information</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                           {/* Customer Name */}
                            <div className="space-y-1">
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-300">Name <span className="text-red-500">*</span></label>
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
                                {errors.customerName && <p id="customerNameError" className="mt-1 text-xs text-red-400">{errors.customerName}</p>}
                            </div>
                            {/* Customer Address */}
                            <div className="space-y-1">
                                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-300">Address</label>
                                <input
                                    id="customerAddress"
                                    type="text"
                                    name="address"
                                    value={customer.address}
                                    onChange={handleCustomerChange}
                                    className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                                    placeholder="123 Main St"
                                />
                            </div>
                            {/* Customer Phone */}
                             <div className="space-y-1">
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300">Phone</label>
                                <div className="relative">
                                    <input
                                        id="customerPhone"
                                        type="tel"
                                        name="phone"
                                        value={customer.phone}
                                        onChange={handleCustomerChange}
                                        className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                                        placeholder="+94 123 456 7890"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                </div>
                            </div>
                            {/* Customer Email */}
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                </div>
                                {errors.customerEmail && <p id="customerEmailError" className="mt-1 text-xs text-red-400">{errors.customerEmail}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Item Table */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <div className="w-1 h-5 mr-2 bg-blue-500 rounded-full"></div>
                                <h4 className="text-lg font-semibold text-blue-400">Invoice Items <span className="text-red-500">*</span></h4>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center px-3 py-1.5 text-sm text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/20"
                                aria-label="Add item"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Add
                            </button>
                        </div>
                         {errors.items && <p className="mb-2 text-xs text-red-400">{errors.items}</p>}

                        <div className="overflow-x-auto border rounded-lg shadow-inner border-gray-700/50">
                            <table className="w-full min-w-[800px]" role="grid" aria-label="Invoice items"> {/* Added min-width */}
                                <thead className="sticky top-0 z-10"> {/* Sticky header */}
                                    <tr className="text-gray-300 bg-gray-700/90 backdrop-blur-sm"> {/* Semi-transparent sticky header */}
                                        <th className="p-3 text-sm font-medium text-left" scope="col" style={{width: '30%'}}>Description *</th>
                                        <th className="p-3 text-sm font-medium text-left" scope="col" style={{width: '10%'}}>Qty *</th>
                                        <th className="p-3 text-sm font-medium text-left" scope="col" style={{width: '15%'}}>Price (LKR) *</th>
                                        <th className="p-3 text-sm font-medium text-left" scope="col" style={{width: '15%'}}>Discount (LKR)</th>
                                        <th className="p-3 text-sm font-medium text-left" scope="col" style={{width: '10%'}}>Discount (%)</th>
                                        <th className="p-3 text-sm font-medium text-left" scope="col" style={{width: '15%'}}>Total (LKR)</th>
                                        <th className="p-3 text-sm font-medium text-center" scope="col" style={{width: '5%'}}></th> {/* Actions Column */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className={`border-t border-gray-700/30 ${index % 2 === 0 ? 'bg-gray-700/30' : 'bg-gray-700/20'} hover:bg-gray-700/40 transition-colors`}>
                                            {/* Description */}
                                            <td className="p-2">
                                                <input
                                                     ref={el => setItemRef(el, index, 'description')}
                                                    type="text"
                                                    name="description"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'description', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white transition-all ${errors[`itemDescription${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    placeholder="Item description"
                                                    aria-invalid={!!errors[`itemDescription${index}`]}
                                                    aria-describedby={`itemDescriptionError${index}`}
                                                    required
                                                />
                                                {errors[`itemDescription${index}`] && <p id={`itemDescriptionError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemDescription${index}`]}</p>}
                                            </td>
                                            {/* Qty */}
                                            <td className="p-2">
                                                <input
                                                     ref={el => setItemRef(el, index, 'qty')}
                                                    type="number"
                                                    name="qty"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'qty', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-center transition-all ${errors[`itemQty${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0.01" // Allow fractional qty? If not, use min="1"
                                                    step="any" // Allow decimals if needed, else step="1"
                                                    placeholder="1"
                                                    aria-invalid={!!errors[`itemQty${index}`]}
                                                    aria-describedby={`itemQtyError${index}`}
                                                    required
                                                />
                                                {errors[`itemQty${index}`] && <p id={`itemQtyError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemQty${index}`]}</p>}
                                            </td>
                                            {/* Unit Price */}
                                             <td className="p-2">
                                                 {/* Removed relative container as LKR prefix is now in header */}
                                                <input
                                                     ref={el => setItemRef(el, index, 'unitPrice')}
                                                    type="number"
                                                    name="unitPrice"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'unitPrice', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemUnitPrice${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    aria-invalid={!!errors[`itemUnitPrice${index}`]}
                                                    aria-describedby={`itemUnitPriceError${index}`}
                                                    required
                                                />
                                                {errors[`itemUnitPrice${index}`] && <p id={`itemUnitPriceError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemUnitPrice${index}`]}</p>}
                                            </td>
                                             {/* Discount Amount */}
                                             <td className="p-2">
                                                <input
                                                     ref={el => setItemRef(el, index, 'discountAmount')}
                                                    type="number"
                                                    name="discountAmount"
                                                    value={item.discountAmount}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'discountAmount', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemDiscountAmount${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0"
                                                    step="0.01"
                                                     placeholder="0.00"
                                                    aria-invalid={!!errors[`itemDiscountAmount${index}`]}
                                                    aria-describedby={`itemDiscountAmountError${index}`}
                                                />
                                                 {errors[`itemDiscountAmount${index}`] && <p id={`itemDiscountAmountError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemDiscountAmount${index}`]}</p>}
                                            </td>
                                            {/* Discount Percentage */}
                                            <td className="p-2">
                                                <div className="relative">
                                                    <input
                                                         ref={el => setItemRef(el, index, 'discountPercentage')}
                                                        type="number"
                                                        name="discountPercentage"
                                                        value={item.discountPercentage}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        onKeyDown={(e) => handleItemKeyDown(index, 'discountPercentage', e)}
                                                        className={`w-full p-2 pr-6 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemDiscountPercentage${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                         placeholder="0"
                                                        aria-invalid={!!errors[`itemDiscountPercentage${index}`]}
                                                        aria-describedby={`itemDiscountPercentageError${index}`}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                        <span className="text-xs text-gray-400">%</span>
                                                    </div>
                                                </div>
                                                {errors[`itemDiscountPercentage${index}`] && <p id={`itemDiscountPercentageError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemDiscountPercentage${index}`]}</p>}
                                            </td>
                                             {/* Total */}
                                             <td className="p-2 font-medium text-right text-white">
                                                {/* Display calculated total */}
                                                {(item.total || 0).toFixed(2)}
                                            </td>
                                            {/* Actions */}
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length <= 1}
                                                    className={`p-1.5 rounded-md transition-all ${items.length <= 1 ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:bg-red-500/20 hover:text-red-400'}`}
                                                    title={items.length <= 1 ? "Cannot remove the only item" : "Remove item"}
                                                    aria-label={`Remove item ${index + 1}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* Purchase Details & Totals Section */}
                    <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
                        {/* Purchase Details - takes 2/3 width on medium+ screens */}
                        <div className="md:col-span-2">
                             <div className="flex items-center mb-3">
                                <div className="w-1 h-5 mr-2 bg-blue-500 rounded-full"></div>
                                <h4 className="text-lg font-semibold text-blue-400">Purchase Details</h4>
                             </div>
                             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                 {/* Payment Method */}
                                <div className="space-y-1">
                                    <label htmlFor="purchaseMethod" className="block text-sm font-medium text-gray-300">Payment Method</label>
                                    <select
                                        id="purchaseMethod"
                                        name="method"
                                        value={purchaseDetails.method}
                                        onChange={handlePurchaseDetailsChange}
                                         className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                 {/* Purchase Amount */}
                                 <div className="space-y-1">
                                     <label htmlFor="purchaseAmount" className="block text-sm font-medium text-gray-300">Amount Paid (LKR)</label>
                                    <div className="relative">
                                        <input
                                            id="purchaseAmount"
                                            ref={purchaseAmountRef}
                                            type="number"
                                            name="amount"
                                             value={purchaseDetails.amount} // Controlled component
                                             onChange={handlePurchaseDetailsChange}
                                            className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-right transition-all ${errors.purchaseAmount ? 'border-red-500' : 'border-gray-600/50 hover:border-gray-500'}`}
                                            min="0"
                                             step="0.01" // Allow cents
                                            placeholder="0.00"
                                            aria-invalid={!!errors.purchaseAmount}
                                            aria-describedby="purchaseAmountError"
                                        />
                                    </div>
                                    {errors.purchaseAmount && <p id="purchaseAmountError" className="mt-1 text-xs text-red-400">{errors.purchaseAmount}</p>}
                                </div>
                             </div>
                        </div>

                        {/* Totals Section - takes 1/3 width on medium+ screens */}
                        <div className="md:col-span-1">
                             {/* Optional: Add a small title for totals */}
                            {/* <h4 className="mb-3 text-lg font-semibold text-blue-400">Summary</h4> */}
                             <div className="flex flex-col justify-center h-full p-4 shadow-lg bg-gradient-to-br from-gray-700/60 to-gray-700/40 rounded-xl">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">Subtotal:</span>
                                        <span className="font-medium text-white">LKR {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">Tax (10%):</span>
                                        <span className="font-medium text-white">LKR {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold">
                                        <span className="text-gray-200">Total:</span>
                                        <span className="text-white">LKR {total.toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between pt-1 text-sm border-t border-gray-600/50">
                                         <span className="text-gray-300">Amount Paid:</span>
                                         <span className="font-medium text-white">LKR {(purchaseDetails.amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-600/50">
                                        <div className="flex justify-between text-lg">
                                            <span className="font-semibold text-gray-200">Balance:</span>
                                            <span className={`font-bold ${balance < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                LKR {balance.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Action Buttons */}
                    {/* Stick buttons to the bottom of the scrollable form area */}
                    <div className="sticky bottom-0 flex justify-end px-4 pt-4 pb-1 -mx-4 space-x-4 border-t border-gray-700/50 bg-gray-800/50 md:-mx-6 md:px-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex items-center px-5 py-2 text-white transition-all duration-300 rounded-lg shadow-md bg-gray-600/50 hover:bg-gray-500/60 hover:shadow-gray-500/10"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                           Cancel (Esc)
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center shadow-md hover:shadow-blue-500/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 mr-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8H4z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Save Invoice (Ctrl+S)
                                </>
                            )}
                        </button>
                    </div>

                    {/* Success/Error Notifications */}
                    {/* These can appear right above the buttons */}
                    <div className="pt-4">
                         {successMessage && (
                            <div role="alert" className="p-3 mt-4 text-sm text-white rounded-lg shadow-lg bg-green-600/90 animate-fade-in">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    {successMessage}
                                </div>
                            </div>
                        )}
                        {errorMessage && (
                            <div role="alert" className="p-3 mt-4 text-sm text-white rounded-lg shadow-lg bg-red-600/90 animate-fade-in">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    {errorMessage}
                                </div>
                            </div>
                        )}
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SalesInvoice;