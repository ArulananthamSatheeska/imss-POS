import React from "react";

const HeldSalesList = ({ heldSales, onRecall, onDelete, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Held Sales</h2>
                {heldSales.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-300">No held sales found.</p>
                ) : (
                    <div className="overflow-auto max-h-96">
                        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">Hold ID</th>
                                    <th className="px-3 py-2">Bill Number</th>
                                    <th className="px-3 py-2">Customer</th>
                                    <th className="px-3 py-2">Held At</th>
                                    <th className="px-3 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heldSales.map((sale) => (
                                    <tr key={sale.saleId} className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <td className="px-3 py-2 font-mono">{sale.saleId}</td>
                                        <td className="px-3 py-2">{sale.billNumber || "-"}</td>
                                        <td className="px-3 py-2">{sale.customerInfo?.name || "-"}</td>
                                        <td className="px-3 py-2">{new Date(sale.heldAt).toLocaleString()}</td>
                                        <td className="px-3 py-2 text-center space-x-2">
                                            <button
                                                onClick={() => onRecall(sale.saleId)}
                                                className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                title="Recall Sale"
                                            >
                                                Recall
                                            </button>
                                            <button
                                                onClick={() => onDelete(sale.saleId)}
                                                className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 font-semibold text-gray-700 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeldSalesList;
