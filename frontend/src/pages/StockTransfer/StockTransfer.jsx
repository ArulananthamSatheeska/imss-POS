import React, { useState } from 'react';

const mockWarehouses = ["Main Warehouse", "Outlet 1", "Outlet 2"];
const mockItems = [
    { id: 1, name: "Coca-Cola 500ml", available: 150 },
    { id: 2, name: "Pepsi 1L", available: 80 },
    { id: 3, name: "Fanta 250ml", available: 100 },
];

const StockTransfer = () => {
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState('');
    const [transferList, setTransferList] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);

    const addItemToTransfer = () => {
        if (!selectedItem || !quantity || !fromWarehouse || !toWarehouse || fromWarehouse === toWarehouse) return;

        const item = mockItems.find(i => i.id === parseInt(selectedItem));
        if (!item || quantity > item.available) return alert("Invalid quantity");

        setTransferList(prev => [...prev, { ...item, quantity: parseInt(quantity) }]);
        setSelectedItem('');
        setQuantity('');
    };

    const handleTransfer = () => {
        // backend API call goes here
        alert("✅ Stock transferred successfully!");
        setTransferList([]);
        setFromWarehouse('');
        setToWarehouse('');
        setShowConfirm(false);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Stock Transfer</h1>

            {/* Warehouse Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1">From Warehouse</label>
                    <select
                        value={fromWarehouse}
                        onChange={e => setFromWarehouse(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    >
                        <option value="">Select...</option>
                        {mockWarehouses.map((wh, i) => (
                            <option key={i} value={wh}>{wh}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">To Warehouse</label>
                    <select
                        value={toWarehouse}
                        onChange={e => setToWarehouse(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    >
                        <option value="">Select...</option>
                        {mockWarehouses.map((wh, i) => (
                            <option key={i} value={wh}>{wh}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Item Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Select Item</label>
                    <select
                        value={selectedItem}
                        onChange={e => setSelectedItem(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    >
                        <option value="">Choose item...</option>
                        {mockItems.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} (Available: {item.available})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    />
                </div>
                <div>
                    <button
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        onClick={addItemToTransfer}
                    >
                        + Add to Transfer
                    </button>
                </div>
            </div>

            {/* Transfer List */}
            {transferList.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Transfer Summary</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white shadow-sm rounded">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="text-left px-4 py-2">Item</th>
                                    <th className="text-left px-4 py-2">Quantity</th>
                                    <th className="text-left px-4 py-2">Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transferList.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="px-4 py-2">{item.name}</td>
                                        <td className="px-4 py-2">{item.quantity}</td>
                                        <td className="px-4 py-2">{item.available}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                        onClick={() => setShowConfirm(true)}
                    >
                        🚚 Confirm Transfer
                    </button>
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Confirm Stock Transfer</h3>
                        <p className="mb-4 text-gray-600">Are you sure you want to transfer stock from <strong>{fromWarehouse}</strong> to <strong>{toWarehouse}</strong>?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowConfirm(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleTransfer} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>

            )}
            {/* Divider */}
            <hr className="my-10" />

            {/* STOCK TRANSFER HISTORY */}
            <h2 className="text-xl font-bold mb-4">📋 Stock Transfer History</h2>

            <div className="mb-4 flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search by ID or Item"
                    className="px-3 py-2 border rounded w-full md:w-64"
                />
                <select className="px-3 py-2 border rounded">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                </select>
                <select className="px-3 py-2 border rounded">
                    <option value="">All Warehouses</option>
                    {mockWarehouses.map((wh, i) => (
                        <option key={i} value={wh}>{wh}</option>
                    ))}
                </select>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white shadow rounded">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left">Transfer ID</th>
                            <th className="px-4 py-2 text-left">From</th>
                            <th className="px-4 py-2 text-left">To</th>
                            <th className="px-4 py-2 text-left">Items</th>
                            <th className="px-4 py-2 text-left">Total Qty</th>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">TRF202404{i + 1}</td>
                                <td className="px-4 py-2">Main Warehouse</td>
                                <td className="px-4 py-2">Outlet 1</td>
                                <td className="px-4 py-2">Coca-Cola, Pepsi...</td>
                                <td className="px-4 py-2">120</td>
                                <td className="px-4 py-2">2025-04-15</td>
                                <td className="px-4 py-2">
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Completed</span>
                                </td>
                                <td className="px-4 py-2 space-x-2">
                                    <button className="text-blue-600 hover:underline text-sm">View</button>
                                    <button className="text-red-600 hover:underline text-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default StockTransfer;
