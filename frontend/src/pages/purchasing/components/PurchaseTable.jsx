import React from "react";

const PurchaseTable = ({
    items,
    searchTerm,
    loading,
    expandedRow,
    onToggleRow,
    onEditItem,
    onEditInvoice,
    onDeleteInvoice,
    formatCurrency,
}) => {
    const filteredItems = items.filter(
        (item) =>
            item.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.supplier?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm table-auto">
                <thead className="bg-gray-100 dark:bg-gray-800 text-left">
                    <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center p-6">
                                Loading purchases...
                            </td>
                        </tr>
                    ) : filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center p-6">
                                No matching records found.
                            </td>
                        </tr>
                    ) : (
                        filteredItems.map((purchase, index) => (
                            <React.Fragment key={purchase.id}>
                                <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-semibold text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => onToggleRow(index)}>
                                        {purchase.invoice_number}
                                    </td>
                                    <td className="p-3">{purchase.supplier?.supplier_name}</td>
                                    <td className="p-3 text-right">{formatCurrency(purchase.total)}</td>
                                    <td className="p-3 text-center">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${purchase.status === "paid"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {purchase.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center space-x-2">
                                        <button
                                            onClick={() => onEditInvoice(purchase)}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Edit Invoice"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => onDeleteInvoice(purchase.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete Invoice"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>

                                {expandedRow === index && (
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        <td colSpan="6" className="p-4">
                                            <div className="text-sm space-y-2">
                                                <p>
                                                    <strong>Invoice Date:</strong> {purchase.date_of_purchase}
                                                </p>
                                                <p>
                                                    <strong>Store:</strong> {purchase.store?.store_name || "N/A"}
                                                </p>
                                                <p>
                                                    <strong>Items:</strong>
                                                </p>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs border mt-2">
                                                        <thead className="bg-gray-200 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="p-2">#</th>
                                                                <th className="p-2">Product</th>
                                                                <th className="p-2 text-center">Qty</th>
                                                                <th className="p-2 text-right">Cost</th>
                                                                <th className="p-2 text-right">Tax</th>
                                                                <th className="p-2 text-right">Discount</th>
                                                                <th className="p-2 text-right">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {purchase.items.map((item, idx) => (
                                                                <tr key={idx} className="border-t">
                                                                    <td className="p-2">{idx + 1}</td>
                                                                    <td className="p-2">{item.product?.product_name || "N/A"}</td>
                                                                    <td className="p-2 text-center">{item.quantity}</td>
                                                                    <td className="p-2 text-right">{formatCurrency(item.buying_cost)}</td>
                                                                    <td className="p-2 text-right">{formatCurrency(item.tax)}</td>
                                                                    <td className="p-2 text-right">{formatCurrency(item.discount_amount)}</td>
                                                                    <td className="p-2 text-right">
                                                                        {formatCurrency(item.quantity * item.buying_cost - item.discount_amount + item.tax)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PurchaseTable;
