import React, { useState } from 'react';

const PurchaseOrder = () => {
    const [supplier, setSupplier] = useState({
        companyName: '',
        contactName: '',
        address: '',
        phone: '',
        email: '',
    });

    const [items, setItems] = useState([
        { description: '', qty: 1, unitPrice: 0, total: 0 }
    ]);

    const handleSupplierChange = (e) => {
        const { name, value } = e.target;
        setSupplier({ ...supplier, [name]: value });
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        updatedItems[index][name] = value;
        updatedItems[index].total = updatedItems[index].qty * updatedItems[index].unitPrice;
        setItems(updatedItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', qty: 1, unitPrice: 0, total: 0 }]);
    };

    const removeItem = (index) => {
        const updatedItems = items.filter((_, idx) => idx !== index);
        setItems(updatedItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-full mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-6">
            {/* Purchase Order Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">Purchase Order</h2>
                <button
                    onClick={handlePrint}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
                >
                    Print Order
                </button>
            </div>

            {/* Supplier Information */}
            <div className="supplier-info space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300">Company Name</label>
                        <input
                            type="text"
                            name="companyName"
                            value={supplier.companyName}
                            onChange={handleSupplierChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                            placeholder="Company Name"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300">Contact Name</label>
                        <input
                            type="text"
                            name="contactName"
                            value={supplier.contactName}
                            onChange={handleSupplierChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                            placeholder="Contact Name"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={supplier.phone}
                            onChange={handleSupplierChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                            placeholder="Phone Number"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={supplier.email}
                            onChange={handleSupplierChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                            placeholder="Email Address"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 dark:text-gray-300">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={supplier.address}
                            onChange={handleSupplierChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                            placeholder="Supplier Address"
                        />
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="items-table space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Order Items</h3>
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left bg-gray-200 dark:bg-gray-700">
                            <th className="p-3 border dark:border-gray-700">Description</th>
                            <th className="p-3 border dark:border-gray-700">Quantity</th>
                            <th className="p-3 border dark:border-gray-700">Unit Price</th>
                            <th className="p-3 border dark:border-gray-700">Total</th>
                            <th className="p-3 border dark:border-gray-700"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="transition-all duration-500 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800">
                                <td className="p-3 border dark:border-gray-700">
                                    <input
                                        type="text"
                                        name="description"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Item Description"
                                    />
                                </td>
                                <td className="p-3 border dark:border-gray-700">
                                    <input
                                        type="number"
                                        name="qty"
                                        value={item.qty}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                                        min="1"
                                    />
                                </td>
                                <td className="p-3 border dark:border-gray-700">
                                    <input
                                        type="number"
                                        name="unitPrice"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500"
                                        min="0"
                                    />
                                </td>
                                <td className="p-3 border dark:border-gray-700">{item.total.toFixed(2)}</td>
                                <td className="p-3 border dark:border-gray-700">
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-start mt-4">
                    <button
                        onClick={addItem}
                        className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300"
                    >
                        Add Item
                    </button>
                </div>
            </div>

            {/* Total Calculation */}
            <div className="total text-right mt-6">
                <h3 className="font-semibold text-xl">Total: ${calculateTotal().toFixed(2)}</h3>
            </div>

            {/* Submit Button */}
            <div className="text-center mt-6">
                <button className="px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300">
                    Submit Order
                </button>
            </div>
        </div>
    );
};

export default PurchaseOrder;
