import React, { useState, useEffect } from 'react';

// Sample data structure for outstanding transactions
const initialOutstandingData = [
    { id: 1, customer: 'John Doe', totalAmount: 200, paidAmount: 100, dueDate: '2025-03-15', status: 'Pending' },
    { id: 2, customer: 'Jane Smith', totalAmount: 350, paidAmount: 150, dueDate: '2025-03-20', status: 'Pending' },
    { id: 3, customer: 'Mark Lee', totalAmount: 500, paidAmount: 300, dueDate: '2025-03-10', status: 'Pending' },
];

const Outstanding = () => {
    const [outstandingTransactions, setOutstandingTransactions] = useState(initialOutstandingData);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Filter transactions based on search query and status
    const filterTransactions = () => {
        return outstandingTransactions.filter((transaction) => {
            const isStatusMatch = filterStatus === 'All' || transaction.status === filterStatus;
            const isSearchMatch = transaction.customer.toLowerCase().includes(searchQuery.toLowerCase());
            return isStatusMatch && isSearchMatch;
        });
    };

    // Handle payment update for a transaction
    const handlePayment = (id) => {
        const updatedTransactions = outstandingTransactions.map((transaction) => {
            if (transaction.id === id) {
                transaction.paidAmount = transaction.totalAmount; // Set paidAmount to totalAmount
                transaction.status = 'Paid'; // Update status to 'Paid'
            }
            return transaction;
        });
        setOutstandingTransactions(updatedTransactions);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6">
            <h2 className="text-2xl font-semibold mb-4">Outstanding Transactions</h2>

            {/* Search bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by customer name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Filter by Status */}
            <div className="mb-4 flex items-center space-x-4">
                <label className="font-medium">Status: </label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                </select>
            </div>

            {/* Outstanding Transactions Table */}
            <table className="w-full table-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <thead>
                    <tr>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Customer</th>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Total Amount</th>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Paid Amount</th>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Outstanding Balance</th>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Due Date</th>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Status</th>
                        <th className="px-4 py-2 text-left border-b dark:border-gray-700">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filterTransactions().map((transaction) => (
                        <tr
                            key={transaction.id}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                            <td className="px-4 py-2 border-b dark:border-gray-700">{transaction.customer}</td>
                            <td className="px-4 py-2 border-b dark:border-gray-700">{transaction.totalAmount}</td>
                            <td className="px-4 py-2 border-b dark:border-gray-700">{transaction.paidAmount}</td>
                            <td className="px-4 py-2 border-b dark:border-gray-700">
                                {transaction.totalAmount - transaction.paidAmount}
                            </td>
                            <td className="px-4 py-2 border-b dark:border-gray-700">{transaction.dueDate}</td>
                            <td className="px-4 py-2 border-b dark:border-gray-700">{transaction.status}</td>
                            <td className="px-4 py-2 border-b dark:border-gray-700">
                                {transaction.status === 'Pending' && (
                                    <button
                                        onClick={() => handlePayment(transaction.id)}
                                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        Mark as Paid
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Outstanding;
