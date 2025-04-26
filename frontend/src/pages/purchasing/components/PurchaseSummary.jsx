// src/pages/purchasing/components/PurchaseSummary.jsx
import React from "react";

const PurchaseSummary = ({ totals, formatCurrency }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Purchase Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    title="Subtotal"
                    value={totals.subtotal}
                    formatCurrency={formatCurrency}
                    borderColor="border-blue-500"
                    textColor="text-blue-400"
                />
                <SummaryCard
                    title="Total Discount"
                    value={totals.totalDiscount}
                    formatCurrency={formatCurrency}
                    borderColor="border-red-500"
                    textColor="text-red-400"
                />
                <SummaryCard
                    title="Total Tax"
                    value={totals.totalTax}
                    formatCurrency={formatCurrency}
                    borderColor="border-yellow-500"
                    textColor="text-yellow-400"
                />
                <SummaryCard
                    title="Grand Total"
                    value={totals.grandTotal}
                    formatCurrency={formatCurrency}
                    borderColor="border-green-500"
                    textColor="text-green-400"
                />
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, formatCurrency, borderColor, textColor }) => (
    <div className={`p-4 rounded-xl shadow-sm border-l-4 ${borderColor} bg-white dark:bg-slate-900`}>
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            {title}
        </h4>
        <p className={`text-xl font-bold text-gray-900 dark:${textColor}`}>
            {formatCurrency(value)}
        </p>
    </div>
);

export default PurchaseSummary;