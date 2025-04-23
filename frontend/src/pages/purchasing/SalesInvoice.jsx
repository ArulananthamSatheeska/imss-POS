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
        time: new Date().toLocaleTimeString(),
    });

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
        const updatedItems = items.filter((_, idx) => idx !== index);
        setItems(updatedItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newInvoice = {
            customer,
            items,
            total: calculateTotal(),
            date: new Date().toLocaleDateString(),
            status: 'pending',
        };
        onGenerateInvoice(newInvoice);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-screen mt-20 max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6 text-blue-900">Fill Invoice Details</h3>
                <div className="grid grid-cols-1 gap-6">
                    {/* Invoice Details */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No:</label>
                            <input
                                type="text"
                                name="no"
                                value={invoice.no}
                                onChange={(e) => setInvoice({ ...invoice, no: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Invoice No"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date:</label>
                            <input
                                type="date"
                                name="date"
                                value={invoice.date}
                                onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Time:</label>
                            <input
                                type="time"
                                name="time"
                                value={invoice.time}
                                onChange={(e) => setInvoice({ ...invoice, time: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div>
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">Customer Details</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={customer.name}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Customer Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address:</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={customer.address}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Customer Address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone:</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={customer.phone}
                                    onChange={handleCustomerChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Customer Phone"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Item Table */}
                    <div>
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">Items</h4>
                        <table className="w-full mb-4">
                            <thead>
                                <tr className="bg-blue-900 text-white">
                                    <th className="p-2 text-center">Item Description</th>
                                    <th className="p-2 text-center">Qty</th>
                                    <th className="p-2 text-center">Price (LKR)</th>
                                    <th className="p-2 text-center">Dis (LKR)</th>
                                    <th className="p-2 text-center">Dis (%)</th>
                                    <th className="p-2 text-center">Total (LKR)</th>
                                    <th className="p-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="border-b text-center border-gray-200">
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                name="description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-full text-left p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter Item Description"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                name="qty"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-20 text-center p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="1"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                name="unitPrice"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-28 p-2 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                name="discountAmount"
                                                value={item.discountAmount}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-24 p-2 border text-center border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                name="discountPercentage"
                                                value={item.discountPercentage}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-20 text-center p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Save Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

// Dashboard Component
const Dashboard = () => {
    const [invoices, setInvoices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGenerateInvoice = (newInvoice) => {
        setInvoices([...invoices, newInvoice]);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Sales Invoice Dashboard</h1>
            <button
                onClick={() => setIsModalOpen(true)}
                className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
            >
                Create Sales Invoice
            </button>

            {/* Invoice List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Invoices</h2>
                {invoices.length === 0 ? (
                    <p className="text-gray-500">No invoices available.</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th className="p-2 text-left">Invoice No</th>
                                <th className="p-2 text-left">Customer Name</th>
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2 text-left">Total</th>
                                <th className="p-2 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="p-2">{invoice.no}</td>
                                    <td className="p-2">{invoice.customer.name}</td>
                                    <td className="p-2">{invoice.date}</td>
                                    <td className="p-2">${invoice.total.toFixed(2)}</td>
                                    <td className="p-2">{invoice.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for Creating Invoice */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
                        <h2 className="text-xl font-semibold mb-4">Create Sales Invoice</h2>
                        <SalesInvoiceForm
                            onGenerateInvoice={handleGenerateInvoice}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;