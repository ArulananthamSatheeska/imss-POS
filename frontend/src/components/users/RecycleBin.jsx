import React, { useState, useEffect } from "react";
import { Undo2, Trash2, UserCircle2, Search, Package, Receipt, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

// Extended mock data with more variety
const MOCK_DELETED_DATA = {
    users: [
        {
            id: 1,
            type: "user",
            name: "Alice Johnson",
            email: "alice@example.com",
            role: "admin",
            deleted_at: "2025-04-01T14:32:00",
        },
        {
            id: 2,
            type: "user",
            name: "Bob Smith",
            email: "bob@example.com",
            role: "manager",
            deleted_at: "2025-04-03T09:12:00",
        },
        {
            id: 3,
            type: "user",
            name: "Charlie Brown",
            email: "charlie@example.com",
            role: "staff",
            deleted_at: "2025-04-05T19:48:00",
        },
    ],
    items: [
        {
            id: 101,
            type: "item",
            name: "Premium Coffee",
            sku: "COF-001",
            price: 4.99,
            category: "Beverages",
            deleted_at: "2025-04-02T11:15:00",
        },
        {
            id: 102,
            type: "item",
            name: "Chocolate Cake",
            sku: "CAK-012",
            price: 7.99,
            category: "Desserts",
            deleted_at: "2025-04-04T16:45:00",
        },
        {
            id: 103,
            type: "item",
            name: "Avocado Toast",
            sku: "BRK-005",
            price: 8.49,
            category: "Breakfast",
            deleted_at: "2025-04-06T08:30:00",
        },
    ],
    bills: [
        {
            id: 1001,
            type: "bill",
            reference: "INV-2025-0042",
            amount: 42.99,
            customer: "Walk-in",
            status: "voided",
            deleted_at: "2025-04-05T12:30:00",
        },
        {
            id: 1002,
            type: "bill",
            reference: "INV-2025-0045",
            amount: 28.75,
            customer: "John Doe",
            status: "refunded",
            deleted_at: "2025-04-07T15:20:00",
        },
    ],
};

// Animation variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
    },
    exit: { opacity: 0, x: -50 }
};

const RecycleBin = () => {
    const [deletedEntries, setDeletedEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [expandedFilters, setExpandedFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        // Simulate API fetch with loading state
        setIsLoading(true);
        setTimeout(() => {
            const allEntries = [
                ...MOCK_DELETED_DATA.users,
                ...MOCK_DELETED_DATA.items,
                ...MOCK_DELETED_DATA.bills,
            ];
            setDeletedEntries(allEntries);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleRestore = (id, type) => {
        setDeletedEntries(deletedEntries.filter((entry) => entry.id !== id));
        toast.success(
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
            >
                <motion.span
                    animate={{ rotate: [-30, 10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    🔄
                </motion.span>
                {type.charAt(0).toUpperCase() + type.slice(1)} restored successfully!
            </motion.div>
        );
    };

    const handlePermanentDelete = (id, name) => {
        if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        setDeletedEntries(deletedEntries.filter((entry) => entry.id !== id));
        toast.error(
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
            >
                <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                >
                    🗑️
                </motion.span>
                Entry permanently deleted
            </motion.div>
        );
    };

    const filteredEntries = deletedEntries.filter((entry) => {
        // Filter by type
        const typeMatch = selectedType === "all" || entry.type === selectedType;

        // Filter by search term
        const searchMatch =
            entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.sku?.toLowerCase().includes(searchTerm.toLowerCase());

        // Date filters
        const now = new Date();
        const entryDate = new Date(entry.deleted_at);
        const daysOld = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));

        let dateMatch = true;
        if (dateFilter === "today") dateMatch = daysOld === 0;
        else if (dateFilter === "week") dateMatch = daysOld <= 7;
        else if (dateFilter === "month") dateMatch = daysOld <= 30;

        // Type-specific filters
        let roleMatch = true;
        let categoryMatch = true;
        let statusMatch = true;

        if (entry.type === "user" && roleFilter !== "all") {
            roleMatch = entry.role === roleFilter;
        }

        if (entry.type === "item" && categoryFilter !== "all") {
            categoryMatch = entry.category === categoryFilter;
        }

        if (entry.type === "bill" && statusFilter !== "all") {
            statusMatch = entry.status === statusFilter;
        }

        return typeMatch && searchMatch && dateMatch && roleMatch && categoryMatch && statusMatch;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case "user":
                return <UserCircle2 size={20} className="text-blue-500" />;
            case "item":
                return <Package size={20} className="text-emerald-500" />;
            case "bill":
                return <Receipt size={20} className="text-purple-500" />;
            default:
                return null;
        }
    };

    const formatEntryDetails = (entry) => {
        switch (entry.type) {
            case "user":
                return (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                    >
                        <div className="font-medium text-gray-900 dark:text-white">{entry.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{entry.email}</div>
                        <div className="mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${entry.role === "admin" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                    entry.role === "manager" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}>
                                {entry.role}
                            </span>
                        </div>
                    </motion.div>
                );
            case "item":
                return (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                    >
                        <div className="font-medium text-gray-900 dark:text-white">{entry.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {entry.sku}</div>
                        <div className="flex gap-2 mt-1">
                            <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                LKR {entry.price.toFixed(2)}
                            </span>
                            <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {entry.category}
                            </span>
                        </div>
                    </motion.div>
                );
            case "bill":
                return (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                    >
                        <div className="font-medium text-gray-900 dark:text-white">Invoice #{entry.reference}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{entry.customer}</div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-sm font-semibold">
                                LKR {entry.amount.toFixed(2)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full 
                ${entry.status === "voided" ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" :
                                    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                                {entry.status}
                            </span>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    const clearFilters = () => {
        setSelectedType("all");
        setDateFilter("all");
        setRoleFilter("all");
        setCategoryFilter("all");
        setStatusFilter("all");
        setSearchTerm("");
    };

    const activeFilters = [
        selectedType !== "all" && `Type: ${selectedType}`,
        dateFilter !== "all" && `Date: ${dateFilter}`,
        roleFilter !== "all" && `Role: ${roleFilter}`,
        categoryFilter !== "all" && `Category: ${categoryFilter}`,
        statusFilter !== "all" && `Status: ${statusFilter}`,
        searchTerm && `Search: "${searchTerm}"`
    ].filter(Boolean);

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg"
                    >
                        <Trash2 size={24} className="text-white" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            Recycle Bin
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage deleted users, items, and transactions
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExpandedFilters(!expandedFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium"
                    >
                        {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Advanced Filters
                    </motion.button>

                    {activeFilters.length > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium"
                        >
                            <X size={16} />
                            Clear ({activeFilters.length})
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Search and Type Filter */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-3"
            >
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email, SKU or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-200"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={18} className="text-gray-400" />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 d-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-800 transition-all duration-200"
                    >
                        <option value="all">All Types</option>
                        <option value="user">Users</option>
                        <option value="item">Items</option>
                        <option value="bill">Bills</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown size={18} className="text-gray-400" />
                    </div>
                </div>
            </motion.div>

            {/* Expanded Filters Section */}
            <AnimatePresence>
                {expandedFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-inner border border-gray-200 dark:border-gray-700"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Deletion Date
                                </label>
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="all">Any Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>

                            {selectedType === "user" || selectedType === "all" ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        User Role
                                    </label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                            ) : null}

                            {selectedType === "item" || selectedType === "all" ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Item Category
                                    </label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="Beverages">Beverages</option>
                                        <option value="Desserts">Desserts</option>
                                        <option value="Breakfast">Breakfast</option>
                                    </select>
                                </div>
                            ) : null}

                            {selectedType === "bill" || selectedType === "all" ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Bill Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="voided">Voided</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2"
                >
                    {activeFilters.map((filter, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs flex items-center gap-1.5"
                        >
                            {filter}
                            <button
                                onClick={() => {
                                    if (filter.includes("Type:")) setSelectedType("all");
                                    else if (filter.includes("Date:")) setDateFilter("all");
                                    else if (filter.includes("Role:")) setRoleFilter("all");
                                    else if (filter.includes("Category:")) setCategoryFilter("all");
                                    else if (filter.includes("Status:")) setStatusFilter("all");
                                    else if (filter.includes("Search:")) setSearchTerm("");
                                }}
                                className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Main Content - Scrolling Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700"
            >
                <div className="relative h-[calc(100vh-400px)] min-h-[400px] overflow-auto">
                    {/* Sticky Header Container */}
                    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Entry
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Deleted At
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                        </table>
                    </div>

                    {/* Scrollable Content */}
                    {isLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center text-gray-500 dark:text-gray-400 absolute inset-0 flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"
                            ></motion.div>
                            Loading deleted items...
                        </motion.div>
                    ) : filteredEntries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <AnimatePresence>
                                        {filteredEntries.map((entry) => (
                                            <motion.tr
                                                key={`${entry.type}-${entry.id}`}
                                                layout
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                variants={itemVariants}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0">
                                                            {getTypeIcon(entry.type)}
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                            {entry.type}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {formatEntryDetails(entry)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(entry.deleted_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                                        {new Date(entry.deleted_at).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleRestore(entry.id, entry.type)}
                                                            title="Restore"
                                                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                                                        >
                                                            <Undo2 size={18} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handlePermanentDelete(entry.id, entry.name || entry.reference)}
                                                            title="Delete permanently"
                                                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center text-gray-500 dark:text-gray-400"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 0.5 }}
                                className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                            >
                                <Search size={24} className="text-gray-400" />
                            </motion.div>
                            <h3 className="text-lg font-medium mb-1">
                                No deleted entries found
                            </h3>
                            <p className="max-w-md mx-auto">
                                {searchTerm || selectedType !== "all" || activeFilters.length > 1
                                    ? "Try adjusting your search or filters"
                                    : "The recycle bin is currently empty"}
                            </p>
                            {(searchTerm || activeFilters.length > 0) && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium"
                                >
                                    Clear all filters
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Custom scrollbar styling */}
            <style jsx>{`
                div::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                div::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                }
                div::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }
                .dark div::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                .dark div::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                }
                .dark div::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>

            {/* Summary Stats */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <div className="text-blue-800 dark:text-blue-200 text-sm font-medium">Users</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-1">
                            {deletedEntries.filter(e => e.type === "user").length}
                        </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-emerald-800 dark:text-emerald-200 text-sm font-medium">Items</div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">
                            {deletedEntries.filter(e => e.type === "item").length}
                        </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30">
                        <div className="text-purple-800 dark:text-purple-200 text-sm font-medium">Bills</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-300 mt-1">
                            {deletedEntries.filter(e => e.type === "bill").length}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default RecycleBin;