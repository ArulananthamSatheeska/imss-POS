import React, { useState, useEffect, useRef, useCallback } from 'react';
// Assuming you might use a toast library for better notifications
// import { toast } from 'react-toastify'; // Or your preferred library

const SalesInvoice = ({
    initialData,        // Data for editing an existing invoice
    isEditMode,         // Flag indicating if it's create or edit mode
    onGenerateInvoice,  // Function to call API for creating invoice
    onCancel,           // Function to call when cancelling/closing the form
    onUpdateInvoice,    // Function to call API for updating invoice
}) => {
    const draftKey = 'salesInvoiceDraft';

    // --- Consolidated State (From First Snippet) ---
    const [formData, setFormData] = useState(() => {
        const defaultState = {
            invoice: { no: "", date: new Date().toISOString().split("T")[0], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) },
            customer: { name: "", address: "", phone: "", email: "" },
            items: [{ id: Date.now(), description: "", qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 }],
            purchaseDetails: { method: "cash", amount: 0 },
            status: "pending",
            id: null,
        };

        if (isEditMode && initialData) {
            return {
                ...defaultState,
                ...initialData,
                invoice: { ...defaultState.invoice, ...(initialData.invoice || {}) },
                customer: { ...defaultState.customer, ...(initialData.customer || {}) },
                items: (initialData.items || []).map(item => ({ ...item, id: item.id || Date.now() + Math.random() })),
                purchaseDetails: { ...defaultState.purchaseDetails, ...(initialData.purchaseDetails || {}) },
                id: initialData.id || null,
                status: initialData.status || 'pending',
            };
        }

        try {
            const savedDraft = JSON.parse(localStorage.getItem(draftKey) || 'null');
            if (savedDraft?.invoice && savedDraft?.customer && savedDraft?.items && savedDraft?.purchaseDetails) {
                const itemsWithIds = (savedDraft.items || []).map(item => ({ ...item, id: item.id || Date.now() + Math.random() }));
                return { ...defaultState, ...savedDraft, items: itemsWithIds, id: null, status: 'pending' };
            }
        } catch (error) {
            console.error("Error loading draft:", error);
        }
        return defaultState;
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const firstInputRef = useRef(null);
    const itemRefs = useRef([]);
    const purchaseAmountRef = useRef(null);

    // --- Effects (From First Snippet) ---
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

    // --- Input Handling (From First Snippet, Adapted Slightly) ---
    const handleInputChange = (e, section, field, index = null) => {
        const { name, value, type } = e.target;
        const targetName = name || field;
        let processedValue = value;

        setFormData(prevFormData => {
            const newData = { ...prevFormData };

            if (index !== null && section === 'items') {
                const newItems = [...newData.items];
                if (!newItems[index]) return prevFormData;

                if (type === 'number' || ['qty', 'unitPrice', 'discountAmount', 'discountPercentage'].includes(targetName)) {
                    processedValue = parseFloat(value);
                    if (isNaN(processedValue)) {
                        processedValue = ''; // Keep visually empty
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
                    newItems[index].discountPercentage = totalBeforeDiscount > 0
                        ? Math.min(100, Math.max(0, (discountAmount / totalBeforeDiscount) * 100)).toFixed(2)
                        : 0;
                    newItems[index].discountAmount = Math.min(totalBeforeDiscount, discountAmount);
                } else if (targetName === 'discountPercentage') {
                    const discountPercentage = Math.min(100, Math.max(0, parseFloat(item.discountPercentage) || 0));
                     newItems[index].discountAmount = ((totalBeforeDiscount * discountPercentage) / 100).toFixed(2);
                     newItems[index].discountPercentage = discountPercentage; // Apply clamped value back
                }

                 let currentDiscountAmount = Math.max(0, parseFloat(newItems[index].discountAmount) || 0);
                 currentDiscountAmount = Math.min(totalBeforeDiscount, currentDiscountAmount);
                 newItems[index].total = totalBeforeDiscount - currentDiscountAmount;

                newData.items = newItems;

            } else if (section === 'purchaseDetails' && targetName === 'amount') {
                 processedValue = parseFloat(value);
                 if (isNaN(processedValue)) {
                     processedValue = ''; // Keep visually empty
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
        if (section === 'items' && errors.items) { // Clear general items error
            setErrors(prev => ({ ...prev, items: undefined }));
        }
        if (errorKey && errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
    };

    // --- Item Management (From First Snippet) ---
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { id: Date.now(), description: "", qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 }
            ],
        }));
        setTimeout(() => {
            const lastIndex = formData.items.length; // Index before state update finishes
            if (itemRefs.current[lastIndex]?.description) {
                itemRefs.current[lastIndex].description.focus();
            }
        }, 0);
    };

    const removeItem = (indexToRemove) => {
        if (formData.items.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, index) => index !== indexToRemove),
        }));
        itemRefs.current.splice(indexToRemove, 1);
    };

    // --- Calculations (From First Snippet) ---
    const calculateSubtotal = useCallback(() => {
        return formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    }, [formData.items]);

    const calculateTax = useCallback((subtotal) => {
        return subtotal * 0.10; // 10% Tax Rate
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

    // --- Validation (From First Snippet) ---
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
                 if (!isNaN(discountAmount) && discountAmount < 0) newErrors[`itemDiscountAmount${idx}`] = 'Disc. Amt >= 0';
                 const discountPercentage = parseFloat(item.discountPercentage);
                 if (!isNaN(discountPercentage) && (discountPercentage < 0 || discountPercentage > 100)) newErrors[`itemDiscountPercentage${idx}`] = 'Disc. % (0-100)';
            });
        }

        const purchaseAmount = parseFloat(purchaseDetails.amount);
        if (purchaseDetails.amount !== '' && (isNaN(purchaseAmount) || purchaseAmount < 0)) {
             newErrors.purchaseAmount = 'Amount paid cannot be negative';
         }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Form Submission (From First Snippet) ---
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!validateForm()) {
            setErrorMessage('Please fix the validation errors indicated below.');
            // Basic focus on first overall input if errors exist
            const firstErrorKey = Object.keys(errors)[0];
             if (firstErrorKey && firstInputRef.current) {
                 // Attempt to find the specific error field and focus it
                 let errorElement = null;
                 // ... (more detailed focus logic from first snippet could be re-added here if needed) ...
                 if (firstErrorKey.startsWith('item')) {
                     const match = firstErrorKey.match(/item([A-Za-z]+)(\d+)/);
                    if(match) {
                        const field = match[1].toLowerCase();
                        const index = parseInt(match[2], 10);
                        errorElement = itemRefs.current?.[index]?.[field];
                    }
                 } else if (firstErrorKey.startsWith('invoice')) {
                    errorElement = document.getElementById(firstErrorKey); // Match input ID
                 } else if (firstErrorKey.startsWith('customer')) {
                     errorElement = document.getElementById(firstErrorKey); // Match input ID
                 } else if (firstErrorKey === 'purchaseAmount') {
                    errorElement = purchaseAmountRef.current;
                 }

                if (errorElement && typeof errorElement.focus === 'function') {
                    errorElement.focus();
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 } else {
                    firstInputRef.current.focus(); // Fallback
                 }
             }
             return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            items: formData.items.map(item => ({
                // Remove temporary frontend ID before sending if backend generates its own
                // id: isEditMode ? item.id : undefined, // Only keep ID if updating
                description: item.description,
                qty: parseFloat(item.qty) || 0,
                unitPrice: parseFloat(item.unitPrice) || 0,
                discountAmount: parseFloat(item.discountAmount) || 0,
                discountPercentage: parseFloat(item.discountPercentage) || 0,
                 // Backend should recalculate total
            })),
            purchaseDetails: {
                 ...formData.purchaseDetails,
                 amount: parseFloat(formData.purchaseDetails.amount) || 0,
             },
            id: isEditMode ? formData.id : undefined, // Ensure ID included only for update
        };
         if (!isEditMode) {
             delete payload.id; // Explicitly remove ID for creation
         }

        try {
            if (isEditMode) {
                await onUpdateInvoice(payload, formData.id);
                setSuccessMessage('Invoice updated successfully!');
                // Maybe close after delay? onCancel();
            } else {
                await onGenerateInvoice(payload);
                setSuccessMessage('Invoice created successfully! Clearing form...');
                localStorage.removeItem(draftKey);
                // Reset form to default state after successful creation
                setFormData({
                    invoice: { no: "", date: new Date().toISOString().split("T")[0], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) },
                    customer: { name: "", address: "", phone: "", email: "" },
                    items: [{ id: Date.now(), description: "", qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 }],
                    purchaseDetails: { method: "cash", amount: 0 },
                    status: "pending", id: null,
                });
                setErrors({});
                if(firstInputRef.current) firstInputRef.current.focus();
                 setTimeout(() => {
                    setSuccessMessage('');
                    // onCancel(); // Optionally close modal
                 }, 2500);
            }
        } catch (error) {
            console.error("Submit error:", error);
            let displayError = isEditMode ? 'Failed to update invoice.' : 'Failed to save invoice.';
            let backendErrors = {};

            if (error.response?.status === 422 && error.response?.data?.errors) {
                backendErrors = error.response.data.errors;
                const errorMessages = Object.values(backendErrors).flat();
                displayError = `Validation failed: ${errorMessages.join(' ')}`;
                 const mappedErrors = {};
                 Object.keys(backendErrors).forEach(key => {
                    const message = backendErrors[key][0];
                    if (key.startsWith('items.')) {
                        const parts = key.split('.');
                        if (parts.length === 3) {
                            const index = parts[1];
                            const field = parts[2];
                            const frontendField = field === 'qty' ? 'Qty' : field === 'unitPrice' ? 'UnitPrice' : field === 'discountAmount' ? 'DiscountAmount' : field === 'discountPercentage' ? 'DiscountPercentage' : field.charAt(0).toUpperCase() + field.slice(1);
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
                 setErrors(prev => ({ ...prev, ...mappedErrors }));
            } else if (error.response?.data?.message) {
                displayError = error.response.data.message;
            } else if (error.message) {
                displayError = error.message;
            }
            setErrorMessage(displayError);
        } finally {
            setLoading(false);
        }
    }, [formData, isEditMode, validateForm, onGenerateInvoice, onUpdateInvoice, errors /* remove errors if focus logic isn't used*/ ]); // Keep 'errors' if using it in focus logic

    // --- Keyboard Shortcuts (From First Snippet) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSubmit(e); // Call submit handler directly
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, handleSubmit]); // Add handleSubmit dependency

    // --- Enter Key Navigation (From First Snippet) ---
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
                    // Or uncomment to add item instead:
                    // addItem();
                 }
             }
         }
     };

    // --- Ref Assignment Helper (From First Snippet) ---
     const setItemRef = (element, index, fieldName) => {
         if (element) {
             if (!itemRefs.current[index]) {
                 itemRefs.current[index] = {};
             }
             itemRefs.current[index][fieldName] = element;
         }
     };

    // --- Calculated values for display (From First Snippet) ---
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const correctTotal = subtotal + tax; // Use this for display
    const balance = calculateBalance();


    // --- JSX --- (Structure and Styles from Second Snippet, Content/Handlers from First)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-200 dark:bg-gray-900 bg-opacity-90" role="dialog" aria-modal="true" aria-labelledby="invoiceTitle">
            {/* Modal Content Box */}
            <div className="dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-screen-2xl max-h-[95vh] flex flex-col">
                {/* Title from First Snippet */}
                <h3 id="invoiceTitle" className="flex-shrink-0 mb-4 text-2xl font-bold text-blue-500 md:text-3xl">
                     {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
                </h3>

                {/* Scrollable Form Area */}
                <form
                    id="invoiceForm"
                    onSubmit={handleSubmit} // Use onSubmit on form
                    noValidate // Prevent browser default validation UI
                    className="flex-grow w-full p-4 overflow-y-auto shadow-lg bg-gray-800/50 rounded-xl md:p-6 backdrop-blur-sm" // Styles from second snippet
                >
                    {/* Optional: Header text from first snippet */}
                    <p className="mb-6 text-sm text-gray-400">
                         {isEditMode ? `Editing Invoice ID: ${formData.id}` : 'Fill in the details below.'}
                    </p>

                     {/* Invoice Details Section */}
                    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                       {/* Invoice No */}
                        <div className="space-y-1">
                             <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-300">Invoice No <span className="text-red-500">*</span></label>
                             <div className="relative">
                                 <input
                                    id="invoiceNo" // ID for label and potential focus
                                    ref={firstInputRef} // Focus target
                                    type="text"
                                    name="no" // Matches formData key
                                    value={formData.invoice.no}
                                    onChange={(e) => handleInputChange(e, "invoice", "no")}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceNo ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    placeholder="e.g., INV-2024-001"
                                    aria-invalid={!!errors.invoiceNo}
                                    aria-describedby="invoiceNoError"
                                    required
                                />
                                {/* Error message display */}
                                {errors.invoiceNo && <p id="invoiceNoError" className="mt-1 text-xs text-red-400">{errors.invoiceNo}</p>}
                             </div>
                         </div>
                        {/* Date */}
                        <div className="space-y-1">
                             <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-300">Date <span className="text-red-500">*</span></label>
                             <div className="relative">
                                 <input
                                    id="invoiceDate"
                                    type="date"
                                    name="date" // Matches formData key
                                    value={formData.invoice.date}
                                    onChange={(e) => handleInputChange(e, "invoice", "date")}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceDate ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    aria-invalid={!!errors.invoiceDate}
                                    aria-describedby="invoiceDateError"
                                    required
                                />
                                {errors.invoiceDate && <p id="invoiceDateError" className="mt-1 text-xs text-red-400">{errors.invoiceDate}</p>}
                                {/* Calendar Icon */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                             </div>
                            </div>
                        {/* Time */}
                         <div className="space-y-1">
                             <label htmlFor="invoiceTime" className="block text-sm font-medium text-gray-300">Time <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="invoiceTime"
                                    type="time"
                                    name="time" // Matches formData key
                                    value={formData.invoice.time} // Should be HH:MM
                                    onChange={(e) => handleInputChange(e, "invoice", "time")}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.invoiceTime ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'}`}
                                    aria-invalid={!!errors.invoiceTime}
                                    aria-describedby="invoiceTimeError"
                                    step="60" // Only hours and minutes
                                    required
                                 />
                                  {errors.invoiceTime && <p id="invoiceTimeError" className="mt-1 text-xs text-red-400">{errors.invoiceTime}</p>}
                                {/* Clock Icon */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                           {/* Customer Name */}
                            <div className="space-y-1">
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-300">Name <span className="text-red-500">*</span></label>
                                <input
                                    id="customerName" // ID for label and potential focus
                                    type="text"
                                    name="name" // Matches formData key
                                    value={formData.customer.name}
                                    onChange={(e) => handleInputChange(e, "customer", "name")}
                                    className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.customerName ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'}`}
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
                                    name="address" // Matches formData key
                                    value={formData.customer.address}
                                    onChange={(e) => handleInputChange(e, "customer", "address")}
                                    className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                                    placeholder="123 Main St, City"
                                />
                                {/* No error display needed for optional field unless specifically validated */}
                            </div>
                            {/* Customer Phone */}
                             <div className="space-y-1">
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300">Phone</label>
                                <div className="relative">
                                    <input
                                        id="customerPhone"
                                        type="tel"
                                        name="phone" // Matches formData key
                                        value={formData.customer.phone}
                                        onChange={(e) => handleInputChange(e, "customer", "phone")}
                                        className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                                        placeholder="+94 123 456 7890"
                                    />
                                    {/* Phone Icon */}
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                </div>
                                 {/* No error display needed */}
                            </div>
                            {/* Customer Email */}
                             <div className="space-y-1">
                                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300">Email</label>
                                <div className="relative">
                                    <input
                                        id="customerEmail" // ID for label and potential focus
                                        type="email"
                                        name="email" // Matches formData key
                                        value={formData.customer.email}
                                        onChange={(e) => handleInputChange(e, "customer", "email")}
                                        className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all ${errors.customerEmail ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'}`}
                                        placeholder="customer@example.com"
                                        aria-invalid={!!errors.customerEmail}
                                        aria-describedby="customerEmailError"
                                    />
                                     {errors.customerEmail && <p id="customerEmailError" className="mt-1 text-xs text-red-400">{errors.customerEmail}</p>}
                                    {/* Email Icon */}
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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
                                <h4 className="text-lg font-semibold text-blue-400">Invoice Items <span className="text-red-500">*</span></h4>
                            </div>
                            {/* Add Item Button - Styled from second snippet */}
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center px-3 py-1.5 text-sm text-white transition-all duration-300 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/20"
                                aria-label="Add new item row"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Add Item
                            </button>
                        </div>
                         {/* General items error */}
                         {errors.items && <p className="mb-2 text-xs text-red-400">{errors.items}</p>}

                        {/* Table Container */}
                        <div className="overflow-x-auto border rounded-lg shadow-inner border-gray-700/50">
                            {/* Use min-w for responsiveness */}
                            <table className="w-full min-w-[900px]" role="grid" aria-label="Invoice items">
                                {/* Sticky Header - Styled from second snippet */}
                                <thead className="sticky top-0 z-10">
                                    <tr className="text-gray-300 bg-gray-700/90 backdrop-blur-sm">
                                        <th className="p-3 text-sm font-semibold text-left" scope="col" style={{width: '30%'}}>Description *</th>
                                        <th className="p-3 text-sm font-semibold text-center" scope="col" style={{width: '8%'}}>Qty *</th>
                                        <th className="p-3 text-sm font-semibold text-right" scope="col" style={{width: '14%'}}>Unit Price (LKR) *</th>
                                        <th className="p-3 text-sm font-semibold text-right" scope="col" style={{width: '14%'}}>Disc. (LKR)</th>
                                        <th className="p-3 text-sm font-semibold text-right" scope="col" style={{width: '10%'}}>Disc. (%)</th>
                                        <th className="p-3 text-sm font-semibold text-right" scope="col" style={{width: '16%'}}>Total (LKR)</th>
                                        <th className="p-3 text-sm font-semibold text-center" scope="col" style={{width: '8%'}}>Action</th>
                                    </tr>
                                </thead>
                                {/* Table Body - Styled from second snippet */}
                                <tbody className="divide-y divide-gray-700/30">
                                    {/* Map through formData.items */}
                                    {formData.items.map((item, index) => (
                                        <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-700/30' : 'bg-gray-700/20'} hover:bg-gray-700/40 transition-colors`}>
                                            {/* Description */}
                                            <td className="p-2 align-top">
                                                <input
                                                     ref={el => setItemRef(el, index, 'description')}
                                                    type="text"
                                                    name="description" // Matches item field
                                                    value={item.description}
                                                    onChange={(e) => handleInputChange(e, "items", "description", index)}
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
                                            <td className="p-2 align-top">
                                                <input
                                                    ref={el => setItemRef(el, index, 'qty')}
                                                    type="number"
                                                    name="qty" // Matches item field
                                                    value={item.qty}
                                                    onChange={(e) => handleInputChange(e, "items", "qty", index)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'qty', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-center transition-all ${errors[`itemQty${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0.01" step="any"
                                                    placeholder="1"
                                                    aria-invalid={!!errors[`itemQty${index}`]}
                                                    aria-describedby={`itemQtyError${index}`}
                                                    required
                                                />
                                                {errors[`itemQty${index}`] && <p id={`itemQtyError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemQty${index}`]}</p>}
                                            </td>
                                            {/* Unit Price */}
                                             <td className="p-2 align-top">
                                                <input
                                                    ref={el => setItemRef(el, index, 'unitPrice')}
                                                    type="number"
                                                    name="unitPrice" // Matches item field
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleInputChange(e, "items", "unitPrice", index)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'unitPrice', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemUnitPrice${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0" step="0.01"
                                                    placeholder="0.00"
                                                    aria-invalid={!!errors[`itemUnitPrice${index}`]}
                                                    aria-describedby={`itemUnitPriceError${index}`}
                                                    required
                                                />
                                                {errors[`itemUnitPrice${index}`] && <p id={`itemUnitPriceError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemUnitPrice${index}`]}</p>}
                                            </td>
                                             {/* Discount Amount */}
                                             <td className="p-2 align-top">
                                                <input
                                                    ref={el => setItemRef(el, index, 'discountAmount')}
                                                    type="number"
                                                    name="discountAmount" // Matches item field
                                                    value={item.discountAmount}
                                                    onChange={(e) => handleInputChange(e, "items", "discountAmount", index)}
                                                    onKeyDown={(e) => handleItemKeyDown(index, 'discountAmount', e)}
                                                    className={`w-full p-2 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemDiscountAmount${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                    min="0" step="0.01"
                                                    placeholder="0.00"
                                                    aria-invalid={!!errors[`itemDiscountAmount${index}`]}
                                                    aria-describedby={`itemDiscountAmountError${index}`}
                                                />
                                                 {errors[`itemDiscountAmount${index}`] && <p id={`itemDiscountAmountError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemDiscountAmount${index}`]}</p>}
                                            </td>
                                            {/* Discount Percentage */}
                                            <td className="p-2 align-top">
                                                <div className="relative">
                                                    <input
                                                        ref={el => setItemRef(el, index, 'discountPercentage')}
                                                        type="number"
                                                        name="discountPercentage" // Matches item field
                                                        value={item.discountPercentage}
                                                        onChange={(e) => handleInputChange(e, "items", "discountPercentage", index)}
                                                        onKeyDown={(e) => handleItemKeyDown(index, 'discountPercentage', e)}
                                                        className={`w-full p-2 pr-6 bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white text-right transition-all ${errors[`itemDiscountPercentage${index}`] ? 'border-red-500' : 'border-gray-600/30 hover:border-gray-500'}`}
                                                        min="0" max="100" step="0.01"
                                                        placeholder="0"
                                                        aria-invalid={!!errors[`itemDiscountPercentage${index}`]}
                                                        aria-describedby={`itemDiscountPercentageError${index}`}
                                                    />
                                                    {/* Percentage Sign */}
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                        <span className="text-xs text-gray-400">%</span>
                                                    </div>
                                                </div>
                                                {errors[`itemDiscountPercentage${index}`] && <p id={`itemDiscountPercentageError${index}`} className="mt-1 text-xs text-red-400">{errors[`itemDiscountPercentage${index}`]}</p>}
                                            </td>
                                             {/* Total (Display calculated value) */}
                                             <td className="p-2 font-medium text-right text-white align-middle">
                                                {(parseFloat(item.total) || 0).toFixed(2)}
                                            </td>
                                            {/* Actions (Remove Button) */}
                                            <td className="p-2 text-center align-middle">
                                                {/* Styled from second snippet */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={formData.items.length <= 1}
                                                    className={`p-1.5 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 ${formData.items.length <= 1 ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:bg-red-500/20 hover:text-red-400'}`}
                                                    title={formData.items.length <= 1 ? "Cannot remove the only item" : "Remove this item"}
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
                        {/* Optional helper text */}
                        <p className="mt-1 text-xs text-gray-400 md:hidden">Scroll table horizontally.</p>
                    </div>


                    {/* Purchase Details & Totals Section */}
                    <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
                        {/* Purchase Details */}
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
                                        name="method" // Matches formData key
                                        value={formData.purchaseDetails.method}
                                        onChange={(e) => handleInputChange(e, "purchaseDetails", "method")}
                                        className="w-full p-3 text-white transition-all border rounded-lg bg-gray-700/80 border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="online">Online Payment</option>
                                    </select>
                                </div>
                                 {/* Amount Paid */}
                                 <div className="space-y-1">
                                     <label htmlFor="purchaseAmount" className="block text-sm font-medium text-gray-300">Amount Paid (LKR)</label>
                                    <div className="relative">
                                        <input
                                            id="purchaseAmount" // ID for label and potential focus
                                            ref={purchaseAmountRef} // Ref for focus
                                            type="number"
                                            name="amount" // Matches formData key
                                            value={formData.purchaseDetails.amount}
                                            onChange={(e) => handleInputChange(e, "purchaseDetails", "amount")}
                                            className={`w-full p-3 bg-gray-700/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-right transition-all ${errors.purchaseAmount ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600/50 hover:border-gray-500'}`}
                                            min="0" step="0.01"
                                            placeholder="0.00"
                                            aria-invalid={!!errors.purchaseAmount}
                                            aria-describedby="purchaseAmountError"
                                        />
                                         {errors.purchaseAmount && <p id="purchaseAmountError" className="mt-1 text-xs text-red-400">{errors.purchaseAmount}</p>}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="md:col-span-1">
                             {/* Summary Box - Styled from second snippet */}
                             <div className="flex flex-col justify-center h-full p-4 shadow-lg bg-gradient-to-br from-gray-700/60 to-gray-700/40 rounded-xl">
                                <h4 className="mb-3 text-base font-semibold text-gray-200">Invoice Summary</h4>
                                <div className="space-y-2">
                                    {/* Subtotal */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">Subtotal:</span>
                                        <span className="font-medium text-white">LKR {subtotal.toFixed(2)}</span>
                                    </div>
                                    {/* Tax */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">Tax (10%):</span>
                                        <span className="font-medium text-white">LKR {tax.toFixed(2)}</span>
                                    </div>
                                     {/* Grand Total */}
                                    <div className="flex justify-between pt-1 text-base font-semibold border-t border-gray-600/50">
                                        <span className="text-gray-200">Total Amount:</span>
                                        <span className="text-white">LKR {correctTotal.toFixed(2)}</span> {/* Use correctTotal */}
                                    </div>
                                    {/* Amount Paid */}
                                     <div className="flex justify-between text-sm">
                                         <span className="text-gray-300">Amount Paid:</span>
                                         <span className="font-medium text-white">LKR {(parseFloat(formData.purchaseDetails.amount) || 0).toFixed(2)}</span>
                                    </div>
                                    {/* Balance Due/Overpaid */}
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
                     {/* Styled from second snippet */}
                    <div className="sticky bottom-0 flex flex-wrap items-center justify-end px-4 pt-4 pb-1 -mx-4 space-x-3 border-t bg-gray-800/50 border-gray-700/50 backdrop-blur-sm md:-mx-6 md:px-6">
                        {/* Error/Success Message Area */}
                        <div className='flex-grow mr-4'>
                         {errorMessage && (
                            <div role="alert" className="p-2 text-sm text-white rounded-lg shadow-md bg-red-600/90 animate-fade-in">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    <span className='break-words'>{errorMessage}</span>
                                </div>
                            </div>
                        )}
                         {successMessage && (
                            <div role="alert" className="p-2 text-sm text-white rounded-lg shadow-md bg-green-600/90 animate-fade-in">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    <span className='break-words'>{successMessage}</span>
                                </div>
                            </div>
                        )}
                        </div>
                         {/* Buttons */}
                         <div className='flex items-center flex-shrink-0 space-x-3'>
                            {/* Cancel Button - Styled from second snippet */}
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex items-center px-5 py-2 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-md bg-gray-600/50 hover:bg-gray-500/60 hover:shadow-gray-500/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            Cancel (Esc)
                            </button>
                             {/* Submit Button - Styled from second snippet */}
                            <button
                                type="submit" // Submit the form
                                disabled={loading}
                                className={`px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center shadow-md hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 mr-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8H4z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        {isEditMode ? 'Update Invoice (Ctrl+S)' : 'Save Invoice (Ctrl+S)'}
                                    </>
                                )}
                            </button>
                         </div>
                    </div>
                     {/* Notifications are now inside the sticky footer */}
                </form>
            </div>
        </div>
    );
};

export default SalesInvoice;