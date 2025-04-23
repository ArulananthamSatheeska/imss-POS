import React, { useState } from 'react';

const SalesReturn = () => {
    const [returnItems, setReturnItems] = useState([]);
    const [newReturn, setNewReturn] = useState({
        invoiceNumber: '',
        customerName: '',
        items: [],
        refundMethod: 'cash',
        remarks: '',
        attachments: []
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReturn({
            ...newReturn,
            [name]: value
        });
    };

    const handleAddItem = () => {
        const newItem = {
            productId: '',
            productName: '',
            quantity: 0,
            price: 0,
            reason: ''
        };
        setNewReturn({
            ...newReturn,
            items: [...newReturn.items, newItem]
        });
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...newReturn.items];
        updatedItems[index][name] = value;
        setNewReturn({
            ...newReturn,
            items: updatedItems
        });
    };

    const handleSubmitReturn = () => {
        if (newReturn.invoiceNumber && newReturn.customerName && newReturn.items.length > 0) {
            setReturnItems([...returnItems, newReturn]);
            setNewReturn({
                invoiceNumber: '',
                customerName: '',
                items: [],
                refundMethod: 'cash',
                remarks: '',
                attachments: []
            });
            alert('Sales Return submitted successfully!');
        } else {
            alert('Please fill all required fields.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Sales Return Dashboard */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Sales Return Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Returns Today</h2>
                            <p className="text-2xl font-bold text-blue-500">8</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Returns This Month</h2>
                            <p className="text-2xl font-bold text-green-500">35</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Returns This Year</h2>
                            <p className="text-2xl font-bold text-purple-500">150</p>
                        </div>
                    </div>
                </div>

                {/* Sales Return Form */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Sales Return Form</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="invoiceNumber"
                                placeholder="Invoice Number"
                                value={newReturn.invoiceNumber}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <input
                                type="text"
                                name="customerName"
                                placeholder="Customer Name"
                                value={newReturn.customerName}
                                onChange={handleInputChange}
                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Items to Return</h3>
                            {newReturn.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <input
                                        type="text"
                                        name="productId"
                                        placeholder="Product ID"
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        name="productName"
                                        placeholder="Product Name"
                                        value={item.productName}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <input
                                        type="number"
                                        name="quantity"
                                        placeholder="Quantity"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        name="reason"
                                        placeholder="Reason"
                                        value={item.reason}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={handleAddItem}
                                className="w-full md:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                            >
                                Add Item
                            </button>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Refund Method</label>
                            <select
                                name="refundMethod"
                                value={newReturn.refundMethod}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="store-credit">Store Credit</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Remarks</label>
                            <textarea
                                name="remarks"
                                value={newReturn.remarks}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={handleSubmitReturn}
                            className="mt-4 w-full md:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
                        >
                            Submit Return
                        </button>
                    </div>
                </div>

                {/* Sales Return History */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Sales Return History</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Invoice Number</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Customer Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Items</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Refund Method</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnItems.map((returnItem, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{returnItem.invoiceNumber}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{returnItem.customerName}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                                            {returnItem.items.map((item, i) => (
                                                <div key={i}>{item.productName} (Qty: {item.quantity})</div>
                                            ))}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{returnItem.refundMethod}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">Approved</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReturn;