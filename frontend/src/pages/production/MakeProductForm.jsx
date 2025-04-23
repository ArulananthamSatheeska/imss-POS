import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createProductionItem } from '../../services/productionapi'; // Adjust the import path as necessary
import { getRawMaterials, getProductionCategories } from '../../services/productionapi';

function MakeProductForm({ onClose, onSubmit, editingProduct }) {
    const [productName, setProductName] = useState(editingProduct?.name || '');
    const [categoryId, setCategoryId] = useState(editingProduct?.category_id || '');
    const [salesPrice, setSalesPrice] = useState(editingProduct?.sales_price || 0);
    const [wholesalePrice, setWholesalePrice] = useState(editingProduct?.wholesale_price || 0);
    const [mrpPrice, setMrpPrice] = useState(editingProduct?.mrp_price || 0);
    const [rawMaterialsList, setRawMaterialsList] = useState(editingProduct?.formulas || []);
    const [selectedRawMaterialId, setSelectedRawMaterialId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);

    const [rawMaterials, setRawMaterials] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [materialsRes, categoriesRes] = await Promise.all([
                    getRawMaterials(),
                    getProductionCategories()
                ]);
                setRawMaterials(materialsRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const handleAddRawMaterial = () => {
        if (selectedRawMaterialId && quantity > 0 && price > 0) {
            const selectedMaterial = rawMaterials.find(m => m.id == selectedRawMaterialId);
            const newMaterial = {
                raw_material_id: selectedRawMaterialId,
                itemName: selectedMaterial.name,
                quantity,
                price,
                total: quantity * price
            };
            setRawMaterialsList([...rawMaterialsList, newMaterial]);
            setSelectedRawMaterialId('');
            setQuantity(1);
            setPrice(0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const productData = {
                name: productName,
                category_id: categoryId,
                sales_price: salesPrice,
                wholesale_price: wholesalePrice,
                mrp_price: mrpPrice,
                raw_materials: rawMaterialsList.map(item => ({
                    raw_material_id: item.raw_material_id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const created = await createProductionItem(productData);
            onSubmit(created.data);
            onClose();
        } catch (error) {
            console.error('Error creating product:', error);
        }
    };

    return (
        <div className="fixed inset-0 w-full flex items-center justify-center bg-slate-400 bg-opacity-50 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl relative my-8">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Modal Title */}
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                    Make Product
                </h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-w-full mx-auto">
                    {/* Product Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Product Name
                            </label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Raw Material Input Section */}
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Add Raw Material</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            {/* Raw Material Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Raw Material
                                </label>
                                <select
                                    value={selectedRawMaterialId}
                                    onChange={(e) => setSelectedRawMaterialId(e.target.value)}
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Material</option>
                                    {rawMaterials.map(material => (
                                        <option key={material.id} value={material.id}>
                                            {material.name} ({material.category})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                                    min="1"
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Add Button */}
                            <div className="flex items-end h-full">
                                <button
                                    type="button"
                                    onClick={handleAddRawMaterial}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                                    disabled={!selectedRawMaterialId || quantity <= 0 || price <= 0}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Raw Material Table */}
                    {rawMaterialsList.length > 0 && (
                        <div className="overflow-auto max-h-64">
                            <table className="w-full border-collapse border rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                                        <th className="p-2 border">#</th>
                                        <th className="p-2 border">Item Name</th>
                                        <th className="p-2 border">Quantity</th>
                                        <th className="p-2 border">Price</th>
                                        <th className="p-2 border">Total</th>
                                        <th className="p-2 border">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawMaterialsList.map((item, index) => (
                                        <tr key={index} className="border text-center dark:text-white">
                                            <td className="p-2 border">{index + 1}</td>
                                            <td className="p-2 border">{item.itemName}</td>
                                            <td className="p-2 border">{item.quantity}</td>
                                            <td className="p-2 border">{item.price.toFixed(2)}</td>
                                            <td className="p-2 border">{(item.quantity * item.price).toFixed(2)}</td>
                                            <td className="p-2 border">
                                                <button
                                                    type="button"
                                                    onClick={() => setRawMaterialsList(rawMaterialsList.filter((_, i) => i !== index))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pricing Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Sales Price
                            </label>
                            <input
                                type="number"
                                value={salesPrice}
                                onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Wholesale Price
                            </label>
                            <input
                                type="number"
                                value={wholesalePrice}
                                onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                MRP Price
                            </label>
                            <input
                                type="number"
                                value={mrpPrice}
                                onChange={(e) => setMrpPrice(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                            disabled={!productName || !categoryId || rawMaterialsList.length === 0}
                        >
                            Save Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MakeProductForm;