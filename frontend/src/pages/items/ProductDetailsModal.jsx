import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ProductDetailsModal = ({ productId, onClose }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!productId) return;

        const fetchProductDetails = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/products/${productId}`);
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

    if (loading || error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center animate-fadeIn">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                        {loading ? "Loading Product..." : "Error"}
                    </h2>
                    {error && <p className="text-red-600 dark:text-red-400 text-base">{error}</p>}
                    <button
                        onClick={onClose}
                        className="mt-6 px-8 py-3 text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // Calculate business metrics
    const profitPerUnit = product.sales_price - product.buying_cost;
    const profitMargin = (profitPerUnit / product.buying_cost) * 100;
    const stockValue = product.opening_stock_quantity * product.buying_cost;
    const potentialRevenue = product.opening_stock_quantity * product.sales_price;
    const wholesaleProfit = product.wholesale_price ? product.wholesale_price - product.buying_cost : 0;

    // Parse extra fields if they exist
    const extraFields = product.extra_fields 
        ? (typeof product.extra_fields === 'string' 
            ? JSON.parse(product.extra_fields) 
            : product.extra_fields)
        : [];

    // Organize fields into logical groups
    const fieldGroups = [
        {
            title: "Basic Information",
            icon: "📝",
            fields: [
                { label: "Product Name", value: product.product_name },
                { label: "Item Code", value: product.item_code },
                { label: "Category", value: product.category },
                { label: "Unit Type", value: product.unit_type },
                { label: "Barcode", value: product.barcode },
                { label: "Batch Number", value: product.batch_number },
            ]
        },
        {
            title: "Pricing",
            icon: "💰",
            fields: [
                { label: "Buying Cost", value: `LKR ${product.buying_cost?.toLocaleString()}` },
                { label: "Selling Price", value: `LKR ${product.sales_price?.toLocaleString()}` },
                { label: "MRP", value: `LKR ${product.mrp?.toLocaleString()}` },
                { label: "Minimum Price", value: `LKR ${product.minimum_price?.toLocaleString()}` },
                { label: "Wholesale Price", value: product.wholesale_price ? `LKR ${product.wholesale_price?.toLocaleString()}` : "N/A" },
                { label: "Profit per Unit", value: `LKR ${profitPerUnit?.toFixed(2)} (${profitMargin?.toFixed(2)}%)` },
            ]
        },
        {
            title: "Inventory",
            icon: "📦",
            fields: [
                { label: "Opening Quantity", value: product.opening_stock_quantity },
                { label: "Opening Value", value: `LKR ${stockValue?.toLocaleString()}` },
                { label: "Potential Revenue", value: `LKR ${potentialRevenue?.toLocaleString()}` },
                { label: "Minimum Stock Qty", value: product.minimum_stock_quantity || "N/A" },
                { label: "Supplier", value: product.supplier || "N/A" },
                { label: "Expiry Date", value: product.expiry_date || "N/A" },
            ]
        },
        {
            title: "Storage",
            icon: "🏷️",
            fields: [
                { label: "Store Location", value: product.store_location || "N/A" },
                { label: "Cabinet", value: product.cabinet || "N/A" },
                { label: "Row", value: product.row || "N/A" },
            ]
        },
        ...(extraFields.length > 0 ? [{
            title: "Additional Fields",
            icon: "➕",
            fields: extraFields.map((field, index) => ({
                label: field.name || `Extra Field ${index + 1}`,
                value: field.value || "N/A"
            }))
        }] : [])
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 space-y-6 overflow-y-auto max-h-[90vh] animate-slideUp">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Product Icon */}
                    <div className="flex-shrink-0">
                        <div className="h-40 w-40 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>

                    {/* Product Title and Basic Info */}
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{product.product_name}</h2>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div><span className="font-semibold">Code:</span> {product.item_code || "N/A"}</div>
                            <div><span className="font-semibold">Category:</span> {product.category || "N/A"}</div>
                            <div><span className="font-semibold">Barcode:</span> {product.barcode || "N/A"}</div>
                            <div><span className="font-semibold">Batch:</span> {product.batch_number || "N/A"}</div>
                        </div>
                        
                        {/* Price Highlights */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-center border border-blue-100 dark:border-blue-900/50">
                                <div className="text-xs text-blue-600 dark:text-blue-300">Buying Price</div>
                                <div className="font-bold text-blue-800 dark:text-blue-200">LKR {product.buying_cost?.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg text-center border border-green-100 dark:border-green-900/50">
                                <div className="text-xs text-green-600 dark:text-green-300">Selling Price</div>
                                <div className="font-bold text-green-800 dark:text-green-200">LKR {product.sales_price?.toLocaleString()}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg text-center border border-purple-100 dark:border-purple-900/50">
                                <div className="text-xs text-purple-600 dark:text-purple-300">Profit/Unit</div>
                                <div className="font-bold text-purple-800 dark:text-purple-200">LKR {profitPerUnit?.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Field Groups */}
                <div className="space-y-6">
                    {fieldGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                                <span className="text-lg">{group.icon}</span>
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{group.title}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                {group.fields.map((field, fieldIndex) => (
                                    <div key={fieldIndex} className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {field.label}
                                        </label>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {field.value || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Close Button */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;