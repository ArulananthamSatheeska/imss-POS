import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ProductDetailsModal = ({ productId, onClose }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch product details when the modal is opened
    useEffect(() => {
        if (!productId) return;

        const fetchProductDetails = async () => {
            try {
                const response = await axios.get(
                    `http://127.0.0.1:8000/api/products/${productId}`
                );
                setProduct(response.data.data);
                setError(null);
            } catch (err) {
                setError("Failed to fetch product details.");
                toast.error("Error fetching product details: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

    if (!productId) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="w-full max-w-lg bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-2xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Loading Product Details...
                    </h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="w-full max-w-lg bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-2xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Error
                    </h2>
                    <p className="text-lg text-red-600 text-center">{error}</p>
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full flex flex-col max-w-lg bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-2xl p-6 transform transition-all duration-300 ease-in-out hover:scale-105">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Product Details
                </h2>
                <div className="space-y-6">
                    {/* Product Name */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Name
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                            {product.product_name}
                        </p>
                    </div>

                    {/* Category */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Category
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                            {product.category}
                        </p>
                    </div>

                    {/* Buying Price */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Buying Price
                        </label>
                        <p className="text-lg font-semibold text-blue-600">
                            LKR {product.buying_cost}
                        </p>
                    </div>

                    {/* Selling Price */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Selling Price
                        </label>
                        <p className="text-lg font-semibold text-green-600">
                            LKR {product.sales_price}
                        </p>
                    </div>

                    {/* Opening Quantity */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Opening Quantity
                        </label>
                        <p className="text-lg font-semibold text-purple-600">
                            {product.opening_stock_quantity}
                        </p>
                    </div>

                    {/* Opening Value */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Opening Value
                        </label>
                        <p className="text-lg font-semibold text-indigo-600">
                            LKR {product.opening_stock_quantity * product.buying_cost}
                        </p>
                    </div>

                    {/* Additional Fields */}
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Supplier
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                            {product.supplier}
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Expiry Date
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                            {product.expiry_date}
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Barcode
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                            {product.barcode}
                        </p>
                    </div>
                </div>

                {/* Close Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;