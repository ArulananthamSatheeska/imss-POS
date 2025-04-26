import React, { useState } from 'react';

const SupplierModal = ({ onClose, onSave }) => {
    const [supplier, setSupplier] = useState({
        name: '',
        contact: '',
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!supplier.name) return alert("Supplier name is required");
        onSave({ ...supplier, id: Date.now().toString() });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Supplier Name"
                        value={supplier.name}
                        onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Contact Number"
                        value={supplier.contact}
                        onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={supplier.email}
                        onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-400 text-white rounded"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierModal;