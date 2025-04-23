import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import PrintableQuotation from './PrintableQuotation';

const Quotation = () => {
    const [quotations, setQuotations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [customer, setCustomer] = useState({
        name: '',
        address: '',
        phone: '',
        email: ''
    });

    const [items, setItems] = useState([
        { description: '', qty: 1, unitPrice: 0, freeQty: 0, discountAmount: 0, discountPercentage: 0, total: 0 }
    ]);

    const [footerDetails, setFooterDetails] = useState({
        approvedBy: '',
        nextApprovalTo: '',
        details: '',
        dateTime: ''
    });

    const [invoice, setInvoice] = useState({
        no: '',
        date: '',
        time: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const quotationsPerPage = 5;

    const handleInvoiceChange = (e) => {
        const { name, value } = e.target;
        setInvoice({ ...invoice, [name]: value });
    };

    const printableRef = useRef();

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomer({ ...customer, [name]: value });
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        updatedItems[index][name] = value;

        // Calculate total based on quantity, unit price, and discounts
        const item = updatedItems[index];
        const totalBeforeDiscount = item.qty * item.unitPrice;
        const discountAmount = item.discountAmount || 0;
        const discountPercentage = item.discountPercentage || 0;

        if (name === 'discountAmount') {
            updatedItems[index].discountPercentage = (discountAmount / totalBeforeDiscount) * 100;
        } else if (name === 'discountPercentage') {
            updatedItems[index].discountAmount = (totalBeforeDiscount * discountPercentage) / 100;
        }

        updatedItems[index].total = totalBeforeDiscount - updatedItems[index].discountAmount;
        setItems(updatedItems);
    };

    const handleFooterChange = (e) => {
        const { name, value } = e.target;
        setFooterDetails({ ...footerDetails, [name]: value });
    };

    const addItem = () => {
        setItems([...items, { description: '', qty: 1, unitPrice: 0, freeQty: 0, discountAmount: 0, discountPercentage: 0, total: 0 }]);
    };

    const removeItem = (index) => {
        const updatedItems = items.filter((_, idx) => idx !== index);
        setItems(updatedItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newQuotation = {
            customer,
            items,
            total: calculateTotal(),
            date: new Date().toLocaleDateString(),
            footerDetails
        };
        setQuotations([...quotations, newQuotation]);
        setCustomer({ name: '', address: '', phone: '', email: '' });
        setItems([{ description: '', qty: 1, unitPrice: 0, freeQty: 0, discountAmount: 0, discountPercentage: 0, total: 0 }]);
        setFooterDetails({ approvedBy: '', nextApprovalTo: '', details: '', dateTime: '' });
        setShowForm(false);
    };

    const handlePrint = () => {
        setShowPrintPreview(true);
        setTimeout(() => {
            const element = printableRef.current;
            const opt = {
                margin: 5,
                filename: 'quotation.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
            setShowPrintPreview(false);
        }, 0);
    };

    const handleKeyDown = (e, index, fieldName) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextField = document.querySelector(`[name="${fieldName}"]`);
            if (nextField) nextField.focus();
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleDelete = (index) => {
        const updatedQuotations = quotations.filter((_, idx) => idx !== index);
        setQuotations(updatedQuotations);
    };

    const handleEdit = (index) => {
        const quotation = quotations[index];
        setCustomer(quotation.customer);
        setItems(quotation.items);
        setFooterDetails(quotation.footerDetails);
        setShowForm(true);
    };

    const handleView = (index) => {
        const quotation = quotations[index];
        setCustomer(quotation.customer);
        setItems(quotation.items);
        setFooterDetails(quotation.footerDetails);
        setShowPrintPreview(true);
    };

    const indexOfLastQuotation = currentPage * quotationsPerPage;
    const indexOfFirstQuotation = indexOfLastQuotation - quotationsPerPage;
    const currentQuotations = quotations.slice(indexOfFirstQuotation, indexOfLastQuotation);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="bg-white text-gray-900">
            <div className="max-w-4xl mx-auto p-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-100 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Total Quotations</h3>
                        <p className="text-2xl font-bold">{quotations.length}</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Total Revenue</h3>
                        <p className="text-2xl font-bold">LKR {quotations.reduce((sum, q) => sum + q.total, 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Pending Approvals</h3>
                        <p className="text-2xl font-bold">0</p>
                    </div>
                </div>

                {/* Create New Quotation Button */}
                <div className="text-center ml-96  -mr-60 mb-8">
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2 bg-blue-500  text-white rounded-md hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Create New Quotation
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search quotations..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Quotation List */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Quotation List</h3>
                    {currentQuotations.map((quotation, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-md mb-4">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">{quotation.customer.name}</span>
                                <span className="text-sm text-gray-600">{quotation.date}</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                Total: LKR {quotation.total.toFixed(2)}
                            </div>
                            <div className="mt-2 flex space-x-2">
                                <button
                                    onClick={() => handleView(index)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => handleEdit(index)}
                                    className="px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(index)}
                                    className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    <div className="flex justify-center mt-8">
                        {Array.from({ length: Math.ceil(quotations.length / quotationsPerPage) }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => paginate(i + 1)}
                                className={`px-4 py-2 mx-1 ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-md`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quotation Form Popup */}
                {showForm && (
                    <div className="fixed inset-0 mt-20 mb-5 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-lg shadow-lg w-screen max-w-screen max-h-[90vh] overflow-y-auto animate-fade-in mt-16 mb-16 flex">
                            {/* Form for Manual Input */}
                            <div className="w-full">
                                <h3 className="text-xl font-semibold mb-4">Fill Quotation Details</h3>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    {/* Invoice Details */}
                                    <div className='grid grid-cols-3 gap-4 mb-4'>
                                        <div>
                                            <label className="block font-semibold">Invoice No:</label>
                                            <input
                                                type="text"
                                                name="no"
                                                value={invoice.no}
                                                onChange={handleInvoiceChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                placeholder="Enter Invoice No"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold">Invoice Date:</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={invoice.date}
                                                onChange={handleInvoiceChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold">Invoice Time:</label>
                                            <input
                                                type="time"
                                                name="time"
                                                value={invoice.time}
                                                onChange={handleInvoiceChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <h4 className='font-semibold text-blue-900'>Customer Details</h4>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block font-semibold">Customer Name:</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={customer.name}
                                                onChange={handleCustomerChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                placeholder="Enter Customer Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold">Customer Address:</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={customer.address}
                                                onChange={handleCustomerChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                placeholder="Enter Customer Address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold">Customer Phone:</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={customer.phone}
                                                onChange={handleCustomerChange}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                placeholder="Enter Customer Phone"
                                            />
                                        </div>
                                    </div>

                                    <table className="w-full mb-4">
                                        <thead>
                                            <tr className="bg-blue-900 text-white">
                                                <th className="p-2 text-center">Item Description</th>
                                                <th className="p-2 text-center">Qty</th>
                                                <th className="p-2 text-center">Price (LKR)</th>
                                                <th className="p-2 text-center">Free (Qty)</th>
                                                <th className="p-2 text-center">Dis(LKR)</th>
                                                <th className="p-2 text-center">Dis(%)</th>
                                                <th className="p-2 text-center">Total (LKR)</th>
                                                <th className="p-2 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="border-b text-center border-gray-200">
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            name="description"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                                                            className="w-full text-left p-2 border border-gray-300 rounded-md"
                                                            placeholder="Enter Item Description"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            name="qty"
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'qty')}
                                                            className="w-20  text-center p-2 border border-gray-300 rounded-md"
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            name="unitPrice"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'unitPrice')}
                                                            className="w-28 p-2 text-right border border-gray-300 rounded-md"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            name="freeQty"
                                                            value={item.freeQty}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'freeQty')}
                                                            className="w-16 p-2 border text-center border-gray-300 rounded-md"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            name="discountAmount"
                                                            value={item.discountAmount}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'discountAmount')}
                                                            className="w-24 p-2 border text-center border-gray-300 rounded-md"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            name="discountPercentage"
                                                            value={item.discountPercentage}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'discountPercentage')}
                                                            className="w-20 text-center p-2 border border-gray-300 rounded-md"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            name="total"
                                                            value={item.total.toFixed(2)}
                                                            readOnly
                                                            className="w-40 p-2 border border-gray-300 rounded-md bg-gray-100"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-300"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Add Item
                                    </button>
                                </div>

                                {/* Submit and Cancel Buttons */}
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 bg-gray-500 text-center text-white rounded-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="px-6 py-2 bg-blue-500 text-center text-white rounded-md hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Print Quotation
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleSubmit}
                                        className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Save Quotation
                                    </button>
                                </div>
                            </div>

                            {/* Floating Print Preview */}
                            {showPrintPreview && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                                    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <div ref={printableRef}>
                                            <PrintableQuotation
                                                customer={customer}
                                                items={items}
                                                footerDetails={footerDetails}
                                                total={calculateTotal()}
                                                invoice={invoice}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Quotation;