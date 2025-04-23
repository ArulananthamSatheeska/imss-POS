import React, { useState } from 'react';

const SalesInvoiceForm = ({
    selectedCustomer,
    cartItems,
    onCustomerSelect,
    onAddItem,
    onRemoveItem,
    onGenerateInvoice,
    onCancel,
}) => {
    const [customer, setCustomer] = useState(selectedCustomer || {
        name: '',
        address: '',
        phone: '',
        email: '',
    });

    const [items, setItems] = useState(cartItems || [
        { id: 1, description: '', qty: 1, unitPrice: 0, discountAmount: 0, discountPercentage: 0, total: 0 },
    ]);

    const [invoice, setInvoice] = useState({
        no: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomer({ ...customer, [name]: value });
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        updatedItems[index][name] = name === 'description' ? value : parseFloat(value) || 0;

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

    const handleSubmit = (e) => {
        e.preventDefault();
        const newInvoice = {
            ...invoice,
            customer,
            items,
            total: calculateTotal(),
            status: 'pending',
        };
        onGenerateInvoice(newInvoice);
    };

    return (
        <div className="fixed inset-0 bg-slate-200 dark:bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="dark:bg-gray-800 p-8  rounded-lg shadow-xl w-full max-w-screen-xl max-h-[100vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6 text-blue-400">Fill Invoice Details</h3>

                <form onSubmit={handleSubmit} className='dark:bg-gray-800 p-8  rounded-lg shadow-xl w-full max-w-screen-xl max-h-[100vh] overflow-y-auto'>
                    {/* Invoice Details */}
                    <div className="grid grid-cols-1  md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Invoice No:</label>
                            <input
                                type="text"
                                name="no"
                                value={invoice.no}
                                onChange={(e) => setInvoice({ ...invoice, no: e.target.value })}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                placeholder="INV-001"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Date:</label>
                            <input
                                type="date"
                                name="date"
                                value={invoice.date}
                                onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Time:</label>
                            <input
                                type="time"
                                name="time"
                                value={invoice.time}
                                onChange={(e) => setInvoice({ ...invoice, time: e.target.value })}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">Customer Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={customer.name}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    placeholder="Customer Name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Address:</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={customer.address}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    placeholder="Customer Address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={customer.phone}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    placeholder="Phone Number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={customer.email}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    placeholder="customer@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Item Table */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Items</h4>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-300"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full mb-4">
                                <thead>
                                    <tr className="bg-gray-700 text-gray-300">
                                        <th className="p-3 text-left">Description</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Price</th>
                                        <th className="p-3 text-right">Discount (LKR)</th>
                                        <th className="p-3 text-right">Discount (%)</th>
                                        <th className="p-3 text-right">Total</th>
                                        <th className="p-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    name="description"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                                                    placeholder="Item description"
                                                    required
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    name="qty"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-20 p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-center"
                                                    min="1"
                                                    required
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    name="unitPrice"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-28 p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-right"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    name="discountAmount"
                                                    value={item.discountAmount}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-right"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    name="discountPercentage"
                                                    value={item.discountPercentage}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-20 p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-right"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <div className="w-32 p-2 bg-gray-700 rounded-md text-right">
                                                    {item.total.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length <= 1}
                                                    className={`p-2 rounded-md ${items.length <= 1 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                    title={items.length <= 1 ? "Can't remove the only item" : "Remove item"}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-4">
                            <div className="bg-gray-700 p-4 rounded-lg w-64">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300">Subtotal:</span>
                                    <span className="text-white">{calculateTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300">Tax:</span>
                                    <span className="text-white">0.00</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold border-t border-gray-600 pt-2">
                                    <span className="text-gray-300">Total:</span>
                                    <span className="text-blue-400">{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-6 border-t border-gray-700 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-300 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [invoices, setInvoices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleGenerateInvoice = (newInvoice) => {
        setInvoices([...invoices, { ...newInvoice, id: Date.now() }]);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
                        Sales Invoice Dashboard
                    </h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow transition duration-300"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Create Invoice
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500 dark:text-gray-400 absolute left-3 top-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                {/* Invoices List */}
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">Recent Invoices</h2>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
                        </div>
                    </div>

                    {filteredInvoices.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">
                                No invoices found. Create your first invoice!
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                                        <th className="p-3 text-left">Invoice No</th>
                                        <th className="p-3 text-left">Customer</th>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-right">Amount</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                        >
                                            <td className="p-3 text-blue-700 dark:text-blue-300 font-semibold">
                                                {invoice.no}
                                            </td>
                                            <td className="p-3">{invoice.customer.name}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{invoice.date}</td>
                                            <td className="p-3 text-right font-mono">LKR {invoice.total.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${invoice.status === 'paid'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : invoice.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                        }`}
                                                >
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center flex justify-center space-x-2">
                                                <button
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                    title="Edit"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Creating Invoice */}
            {isModalOpen && (
                <SalesInvoiceForm
                    onGenerateInvoice={handleGenerateInvoice}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );

};

export default Dashboard;