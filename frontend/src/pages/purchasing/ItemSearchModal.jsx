import React, { useState } from 'react';

const dummyItems = [
    { id: 1, name: "Item A", price: 100 },
    { id: 2, name: "Item B", price: 150 },
    { id: 3, name: "Item C", price: 200 },
];

const ItemSearchModal = ({ onClose, onAddItem }) => {
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);
    const [expiry, setExpiry] = useState('');

    const filteredItems = dummyItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        if (selectedItem && quantity > 0 && price > 0) {
            onAddItem({ ...selectedItem, name: selectedItem.name }, quantity, price, expiry);
            onClose();
        } else {
            alert("Please select item, quantity and price");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Search Item</h2>
                <input
                    type="text"
                    placeholder="Search item..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />
                <ul className="max-h-40 overflow-y-auto border rounded mb-4">
                    {filteredItems.map(item => (
                        <li
                            key={item.id}
                            className={`p-2 hover:bg-blue-100 cursor-pointer ${selectedItem?.id === item.id ? "bg-blue-200" : ""
                                }`}
                            onClick={() => {
                                setSelectedItem(item);
                                setPrice(item.price);
                            }}
                        >
                            {item.name} - LKR {item.price}
                        </li>
                    ))}
                </ul>
                {selectedItem && (
                    <div className="space-y-3">
                        <input
                            type="number"
                            placeholder="Quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                        <input
                            type="date"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        className="px-4 py-2 bg-gray-400 text-white rounded"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded"
                        onClick={handleAdd}
                    >
                        Add Item
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemSearchModal;
