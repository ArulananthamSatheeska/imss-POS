import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRotateCcw, FiTrash2, FiLoader, FiAlertCircle } from "react-icons/fi";

const HeldSalesList = ({ heldSales, onRecall, onDelete, onClose, loading }) => {
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const slideUp = {
        hidden: { y: 50, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
        exit: { y: 50, opacity: 0, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={fadeIn}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            >
                <motion.div
                    variants={slideUp}
                    className="w-full max-w-5xl p-6 mx-4 bg-white rounded-xl shadow-2xl dark:bg-gray-800 max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-2 rounded-lg">
                                Held Sales
                            </span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            title="Close"
                            aria-label="Close"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center flex-1 text-gray-700 dark:text-gray-300">
                                <FiLoader className="w-8 h-8 mb-4 animate-spin text-blue-500" />
                                <p>Loading held sales...</p>
                            </div>
                        ) : heldSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 text-gray-700 dark:text-gray-300">
                                <FiAlertCircle className="w-8 h-8 mb-4 text-yellow-500" />
                                <p className="text-lg">No held sales found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Sales you hold will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden flex flex-col">
                                {/* Summary Bar */}
                                <div className="bg-blue-50 dark:bg-gray-700 p-3 rounded-lg mb-4 flex flex-wrap justify-between items-center">
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                        <span className="font-semibold">{heldSales.length}</span> held sales
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        Total items:{" "}
                                        <span className="font-semibold">
                                            {heldSales.reduce((sum, sale) => sum + (sale.total_items || 0), 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-auto flex-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                                        <thead className="text-xs text-white uppercase bg-gradient-to-r from-blue-600 to-blue-800 dark:from-gray-700 dark:to-gray-900 dark:text-amber-400 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600">Hold ID</th>
                                                <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600">Date Held</th>
                                                {/* Removed Bill # column as per user request */}
                                                {/* <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600">Bill #</th> */}
                                                <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600 text-center">Total Items</th>
                                                <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600 text-right">Total Amount</th>
                                                <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600">Type</th>
                                                <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600">Customer</th>
                                                {/* Removed redundant Items and Amount columns for clarity */}
                                                {/* <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600">Items</th> */}
                                                {/* <th className="px-4 py-3 border-r border-blue-500 dark:border-gray-600 text-right">Amount</th> */}
                                                <th className="px-4 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {heldSales.map((sale) => (
                                                <tr
                                                    key={`${sale.hold_id}-${sale.heldAt || sale.created_at || sale.createdAt}`}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                                                >
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        #{sale.hold_id}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {new Date(sale.heldAt || sale.created_at || sale.createdAt).toLocaleString()}
                                                    </td>
                                                    {/* Removed Bill # cell as per user request */}
                                                    {/* <td className="px-4 py-3">
                                                        {sale.billNumber || sale.bill_number || "-"}
                                                    </td> */}
                                                    <td className="px-4 py-3 text-center">
                                                        {sale.total_items || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        {sale.total_amount !== undefined ? `LKR ${sale.total_amount.toFixed(2)}` : "-"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${(sale.saleType || sale.sale_type) === 'retail'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            }`}>
                                                            {sale.saleType || sale.sale_type || "Cash"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {sale.customerInfo?.name || sale.customer_name || "Walk-in"}
                                                    </td>
                                                    {/* Removed redundant Items and Amount cells for clarity */}
                                                    {/* <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                                                            {sale.products ? sale.products.length : 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {sale.totals?.finalTotal ? (
                                                            <span className="text-blue-600 dark:text-blue-300">
                                                                ${sale.totals.finalTotal.toFixed(2)}
                                                            </span>
                                                        ) : "-"}
                                                    </td> */}
                                                    <td className="px-4 py-3 text-center space-x-2">
                                                        <button
                                                            onClick={() => onRecall(sale.hold_id)}
                                                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg transition-colors duration-200"
                                                            title="Recall Sale"
                                                            aria-label="Recall"
                                                        >
                                                            <FiRotateCcw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => onDelete(sale.hold_id)}
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200"
                                                            title="Delete Sale"
                                                            aria-label="Delete"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg transition-colors duration-200"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HeldSalesList;