import React, { useState, useEffect } from "react";
import { FaRedo } from "react-icons/fa";

const mockItems = [
    { itemCode: "101", itemName: "Pepsi", systemQty: 100 },
    { itemCode: "102", itemName: "Chips", systemQty: 200 },
    { itemCode: "103", itemName: "Water", systemQty: 50 },
    { itemCode: "104", itemName: "Bread", systemQty: 75 },
    { itemCode: "105", itemName: "Milk", systemQty: 120 },
];

const locations = ["Main Store", "Warehouse", "Outlet 1", "Outlet 2"];

const StockRecheckDashboard = () => {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredItems, setFilteredItems] = useState(mockItems);
    const [formData, setFormData] = useState({
        itemCode: "",
        itemName: "",
        systemQty: 0,
        storeQty: "",
        location: "",
        remarks: "",
        updateActualStock: false,
    });
    const [errors, setErrors] = useState({});
    const [savedItems, setSavedItems] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");

    // Filter items based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredItems(mockItems);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            setFilteredItems(
                mockItems.filter(
                    (item) =>
                        item.itemCode.toLowerCase().includes(lowerTerm) ||
                        item.itemName.toLowerCase().includes(lowerTerm)
                )
            );
        }
    }, [searchTerm]);

    // Auto-fill itemName and systemQty when itemCode changes
    useEffect(() => {
        const selected = mockItems.find((item) => item.itemCode === formData.itemCode);
        if (selected) {
            setFormData((prev) => ({
                ...prev,
                itemName: selected.itemName,
                systemQty: selected.systemQty,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                itemName: "",
                systemQty: 0,
            }));
        }
    }, [formData.itemCode]);

    // Calculate quantity difference
    const quantityDifference =
        formData.storeQty !== "" && formData.systemQty !== null
            ? parseInt(formData.storeQty, 10) - parseInt(formData.systemQty, 10)
            : 0;

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if ((name === "storeQty") && value !== "") {
            if (!/^\d*$/.test(value)) {
                return; // ignore invalid input
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));

        setSuccessMessage("");
    };

    // Validate form fields
    const validate = () => {
        const newErrors = {};
        if (!formData.itemCode.trim()) newErrors.itemCode = "Item Code is required";
        if (!formData.location.trim()) newErrors.location = "Location is required";
        if (formData.storeQty === "") newErrors.storeQty = "Store Quantity is required";
        return newErrors;
    };

    // Handle form submission
    const handleSave = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setSuccessMessage("");
            return;
        }

        // Check if item already saved
        const existingIndex = savedItems.findIndex(
            (item) => item.itemCode === formData.itemCode && item.location === formData.location
        );

        let updatedSavedItems = [...savedItems];
        const newItem = {
            itemCode: formData.itemCode,
            itemName: formData.itemName,
            systemQty: formData.systemQty,
            storeQty: parseInt(formData.storeQty, 10),
            difference: quantityDifference,
            location: formData.location,
            remarks: formData.remarks,
            status: quantityDifference === 0 ? "OK" : "Discrepancy",
            updateActualStock: formData.updateActualStock,
            date: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            updatedSavedItems[existingIndex] = newItem;
        } else {
            updatedSavedItems.push(newItem);
        }

        setSavedItems(updatedSavedItems);
        setSuccessMessage("Stock recheck saved successfully!");
        setFormData({
            itemCode: "",
            itemName: "",
            systemQty: 0,
            storeQty: "",
            location: "",
            remarks: "",
            updateActualStock: false,
        });
        setShowForm(false);
    };

    // Handle cancel button
    const handleCancel = () => {
        setFormData({
            itemCode: "",
            itemName: "",
            systemQty: 0,
            storeQty: "",
            location: "",
            remarks: "",
            updateActualStock: false,
        });
        setErrors({});
        setSuccessMessage("");
        setShowForm(false);
    };

    // Highlight rows with major discrepancies (difference > 10 or < -10)
    const isMajorDiscrepancy = (diff) => diff > 10 || diff < -10;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-500">
            {/* Dashboard Header */}
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Stock Recheck Dashboard</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-amber-600 font-semibold py-2 px-4 rounded-full shadow-md transition-colors duration-300 fixed bottom-8 right-8 z-50"
                    aria-label="Recheck Stock"
                    title="Recheck Stock"
                >
                    <FaRedo />
                    <span>Recheck Stock</span>
                </button>
            </header>

            {/* Stock Recheck Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50 overflow-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl p-6 mx-4">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Stock Recheck Form</h2>
                        <form
                            onSubmit={handleSave}
                            noValidate
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-4xl transition-all duration-300 ease-in-out transform hover:shadow-2xl"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Item Code with search - Full width */}
                                <div className="md:col-span-2 relative transition-all duration-200 ease-in-out">
                                    <label
                                        htmlFor="itemCode"
                                        className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200"
                                    >
                                        Item Code
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="itemCode"
                                            name="itemCode"
                                            value={formData.itemCode}
                                            onChange={(e) => {
                                                handleChange(e);
                                                setSearchTerm(e.target.value);
                                            }}
                                            autoComplete="off"
                                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 ${errors.itemCode
                                                ? "border-red-500 focus:ring-red-500 animate-pulse"
                                                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                            placeholder="Search or enter item code"
                                        />
                                        {/* Search dropdown with animation */}
                                        {searchTerm && filteredItems.length > 0 && (
                                            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden transition-all duration-300 origin-top transform scale-y-100 opacity-100 max-h-60 overflow-y-auto">
                                                {filteredItems.map((item) => (
                                                    <li
                                                        key={item.itemCode}
                                                        className="px-4 py-3 cursor-pointer hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors duration-150"
                                                        onClick={() => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                itemCode: item.itemCode,
                                                                itemName: item.itemName,
                                                                systemQty: item.systemQty,
                                                            }));
                                                            setSearchTerm("");
                                                        }}
                                                    >
                                                        {item.itemCode} - {item.itemName}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    {errors.itemCode && (
                                        <p className="mt-1 text-red-500 text-sm animate-bounce">
                                            {errors.itemCode}
                                        </p>
                                    )}
                                </div>

                                {/* Item Name (auto-filled) */}
                                <div className="transition-all duration-200 ease-in-out hover:scale-[1.01]">
                                    <label
                                        htmlFor="itemName"
                                        className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200"
                                    >
                                        Item Name
                                    </label>
                                    <input
                                        type="text"
                                        id="itemName"
                                        name="itemName"
                                        value={formData.itemName}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors duration-200"
                                        placeholder="Auto-filled"
                                    />
                                </div>

                                {/* System Stock Quantity */}
                                <div className="transition-all duration-200 ease-in-out hover:scale-[1.01]">
                                    <label
                                        htmlFor="systemQty"
                                        className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200"
                                    >
                                        System Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        id="systemQty"
                                        name="systemQty"
                                        value={formData.systemQty}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors duration-200"
                                        placeholder="Auto-filled"
                                    />
                                </div>

                                {/* Store Stock Quantity */}
                                <div className="transition-all duration-200 ease-in-out hover:scale-[1.01]">
                                    <label
                                        htmlFor="storeQty"
                                        className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200"
                                    >
                                        Store Stock Quantity
                                    </label>
                                    <input
                                        type="text"
                                        id="storeQty"
                                        name="storeQty"
                                        value={formData.storeQty}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 ${errors.storeQty
                                            ? "border-red-500 focus:ring-red-500 animate-pulse"
                                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                            } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                        placeholder="Enter store stock quantity"
                                        inputMode="numeric"
                                    />
                                    {errors.storeQty && (
                                        <p className="mt-1 text-red-500 text-sm animate-bounce">
                                            {errors.storeQty}
                                        </p>
                                    )}
                                </div>

                                {/* Quantity Difference */}
                                <div className="transition-all duration-200 ease-in-out hover:scale-[1.01]">
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200">
                                        Quantity Difference
                                    </label>
                                    <input
                                        type="number"
                                        value={quantityDifference}
                                        readOnly
                                        className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${quantityDifference === 0
                                            ? "border-green-500 text-green-700 dark:text-green-400 dark:border-green-400"
                                            : "border-red-500 text-red-700 dark:text-red-400 dark:border-red-400"
                                            } bg-gray-100 dark:bg-gray-600 cursor-not-allowed`}
                                    />
                                </div>

                                {/* Location Dropdown */}
                                <div className="transition-all duration-200 ease-in-out hover:scale-[1.01]">
                                    <label
                                        htmlFor="location"
                                        className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200"
                                    >
                                        Location / Store
                                    </label>
                                    <select
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 ${errors.location
                                            ? "border-red-500 focus:ring-red-500 animate-pulse"
                                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                            } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                                    >
                                        <option value="">Select location</option>
                                        {locations.map((loc) => (
                                            <option key={loc} value={loc}>
                                                {loc}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.location && (
                                        <p className="mt-1 text-red-500 text-sm animate-bounce">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                {/* Remarks - Full width */}
                                <div className="md:col-span-2 transition-all duration-200 ease-in-out hover:scale-[1.01]">
                                    <label
                                        htmlFor="remarks"
                                        className="block text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors duration-200"
                                    >
                                        Remarks
                                    </label>
                                    <textarea
                                        id="remarks"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 resize-none"
                                        placeholder="Enter remarks (optional)"
                                    />
                                </div>

                                {/* Checkbox - Full width */}
                                <div className="md:col-span-2 transition-all duration-200 ease-in-out">
                                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300">
                                        <input
                                            type="checkbox"
                                            id="updateActualStock"
                                            name="updateActualStock"
                                            checked={formData.updateActualStock}
                                            onChange={handleChange}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                                        />
                                        <label
                                            htmlFor="updateActualStock"
                                            className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-200"
                                        >
                                            Update actual stock in overall stock report
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Full width with animation */}
                            <div className="md:col-span-2 mt-8 flex justify-end space-x-4 transition-all duration-300">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-1 transform"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-1 transform hover:shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rechecked Items Table */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Item Code
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Item Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                System Qty
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Store Qty
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Difference
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {savedItems.length === 0 && (
                            <tr>
                                <td colSpan="8" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    No rechecked items found.
                                </td>
                            </tr>
                        )}
                        {savedItems.map((item, index) => (
                            <tr
                                key={index}
                                className={`${isMajorDiscrepancy(item.difference)
                                    ? "bg-red-100 dark:bg-red-900"
                                    : item.difference !== 0
                                        ? "bg-yellow-100 dark:bg-yellow-900"
                                        : "bg-white dark:bg-gray-800"
                                    }`}
                            >
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.itemCode}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.itemName}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.systemQty}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.storeQty}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.difference}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.location}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {item.status}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    <button
                                        onClick={() => {
                                            // Edit item: populate form and show modal
                                            setFormData({
                                                itemCode: item.itemCode,
                                                itemName: item.itemName,
                                                systemQty: item.systemQty,
                                                storeQty: item.storeQty.toString(),
                                                location: item.location,
                                                remarks: item.remarks,
                                                updateActualStock: item.updateActualStock,
                                            });
                                            setShowForm(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-semibold"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockRecheckDashboard;
