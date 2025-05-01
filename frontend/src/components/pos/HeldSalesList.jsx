import React from "react";

const HeldSalesList = ({ heldSales, onRecall, onDelete, onClose, loading }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Held Sales List</h2>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Close"
                    >
                        Close
                    </button>
                </div>
                {loading ? (
                    <div className="text-center text-gray-700 dark:text-gray-300">Loading held sales...</div>
                ) : heldSales.length === 0 ? (
                    <div className="text-center text-gray-700 dark:text-gray-300">No held sales found.</div>
                ) : (
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                            <thead className="text-xs text-white uppercase bg-gray-700 dark:bg-gray-700 dark:text-amber-400 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 border border-gray-600">Hold ID</th>
                                    <th className="px-3 py-2 border border-gray-600">Date Held</th>
                                    <th className="px-3 py-2 border border-gray-600">Bill Number</th>
                                    <th className="px-3 py-2 border border-gray-600">Sale Type</th>
                                    <th className="px-3 py-2 border border-gray-600">Customer</th>
                                    <th className="px-3 py-2 border border-gray-600">Total Items</th>
                                    <th className="px-3 py-2 border border-gray-600">Total Amount</th>
                                    <th className="px-3 py-2 border border-gray-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heldSales.map((sale) => (
                                    <tr key={sale.hold_id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <td className="px-3 py-2 border border-gray-600">{sale.hold_id}</td>
                                        <td className="px-3 py-2 border border-gray-600">{new Date(sale.heldAt || sale.created_at || sale.createdAt).toLocaleString()}</td>
                                        <td className="px-3 py-2 border border-gray-600">{sale.billNumber || sale.bill_number || "-"}</td>
                                        <td className="px-3 py-2 border border-gray-600">{sale.saleType || sale.sale_type || "-"}</td>
                                        <td className="px-3 py-2 border border-gray-600">{sale.customerInfo?.name || sale.customer_name || "-"}</td>
                                        <td className="px-3 py-2 border border-gray-600">{sale.products ? sale.products.length : 0}</td>
                                        <td className="px-3 py-2 border border-gray-600 text-right">
                                            {sale.totals?.finalTotal ? sale.totals.finalTotal.toFixed(2) : "-"}
                                        </td>
                                        <td className="px-3 py-2 border border-gray-600 text-center space-x-2">
                                            <button
                                                onClick={() => onRecall(sale.hold_id)}
                                                className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                title="Recall Sale"
                                            >
                                                Recall
                                            </button>
                                            <button
                                                onClick={() => onDelete(sale.hold_id)}
                                                className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                title="Delete Sale"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeldSalesList;
