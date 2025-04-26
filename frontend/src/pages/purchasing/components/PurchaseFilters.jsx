// src/pages/purchasing/components/PurchaseFilters.jsx
import React from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { FaFilter, FaFileExcel } from "react-icons/fa";

const PurchaseFilters = ({
    showFilters,
    fromDate,
    toDate,
    searchTerm,
    onSearchChange,
    onFilterChange,
    onToggleFilters,
    onRefresh,
    onExport,
    onCreateEntry
}) => {
    return (
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search items, bill number, supplier..."
                    value={searchTerm}
                    onChange={onSearchChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onCreateEntry}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Create Purchase Entry
                </button>
                <button
                    onClick={onToggleFilters}
                    className="flex items-center gap-2 bg-white border dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <FiRefreshCw /> Refresh
                </button>
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <FaFileExcel /> Export
                </button>
            </div>

            {showFilters && (
                <div className="bg-white dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 p-4 rounded-lg shadow-md mb-6 border border-gray-200 w-full">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                        <FaFilter /> Purchase Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => onFilterChange('fromDate', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => onFilterChange('toDate', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={onRefresh}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseFilters;