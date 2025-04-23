import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { createRawMaterial } from '../../services/productionapi'; // Adjust the import path as necessary

function RawMaterialModal({ onClose, onSubmit, editingMaterial }) {
    const [formData, setFormData] = useState({
        name: editingMaterial?.name || '',
        category: editingMaterial?.category || '',
        stock: editingMaterial?.stock || 0,
        unit: editingMaterial?.unit || '',
        barcode: editingMaterial?.barcode || '',
        supplier: editingMaterial?.supplier || '',
        cost_price: editingMaterial?.cost_price || '',
        selling_price: editingMaterial?.selling_price || '',
        expiry_date: editingMaterial?.expiry_date || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMaterial) {
                const updated = await updateRawMaterial(editingMaterial.id, formData);
                onSubmit(updated.data);
            } else {
                const created = await createRawMaterial(formData);
                onSubmit(created.data);
            }
            onClose();
        } catch (error) {
            console.error('Error saving raw material:', error);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-xl z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Modal content remains the same, just update the form fields */}
            <motion.div
                className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col border border-gray-300 dark:border-gray-700"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                        {editingMaterial ? 'Edit Raw Material' : 'Add Raw Material'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                {/* Form (Scrollable) */}
                <div className="overflow-y-auto flex-grow p-4">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Material Name *", name: "name", value: formData.name, required: true },
                            { label: "Category", name: "category", value: formData.category },
                            { label: "Stock *", name: "stock", value: formData.stock, type: "number", required: true },
                            { label: "Unit", name: "unit", value: formData.unit },
                            { label: "Barcode", name: "barcode", value: formData.barcode },
                            { label: "Supplier", name: "supplier", value: formData.supplier },
                            { label: "Cost Price", name: "cost_price", value: formData.cost_price, type: "number" },
                            { label: "Selling Price", name: "selling_price", value: formData.selling_price, type: "number" },
                            { label: "Expiry Date", name: "expiry_date", value: formData.expiry_date, type: "date" }
                        ].map((field, index) => (
                            <div key={index} className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {field.label}
                                </label>
                                <input
                                    type={field.type || "text"}
                                    name={field.name}
                                    value={field.value}
                                    onChange={handleChange}
                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                                    required={field.required}
                                />
                            </div>
                        ))}
                    </form>
                </div>


                {/* Modal Footer */}
                <div className="flex justify-end space-x-2 border-t pt-3 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-lg transition"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default RawMaterialModal;