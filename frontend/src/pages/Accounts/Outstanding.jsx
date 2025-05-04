import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Outstanding = () => {
    const [outstandingTransactions, setOutstandingTransactions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchOutstanding();
    }, []);

    const fetchOutstanding = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await axios.get('/api/outstanding');
            setOutstandingTransactions(response.data);
        } catch (err) {
            setError('Failed to fetch outstanding transactions. Please try again later.');
            console.error('Error fetching outstanding transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions based on search query and status
    const filteredTransactions = outstandingTransactions.filter((transaction) => {
        const isStatusMatch = filterStatus === 'All' || transaction.status === filterStatus;
        const isSearchMatch =
            transaction.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.id.toString().includes(searchQuery);
        return isStatusMatch && isSearchMatch;
    });

    // Handle payment update for a transaction
    const handlePayment = async (id) => {
        if (!window.confirm('Are you sure you want to mark this transaction as paid?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await axios.patch(`/api/outstanding/${id}`, {
                status: 'Paid',
                paid_amount: outstandingTransactions.find(t => t.id === id).total_amount
            });

            if (response.status === 200) {
                setSuccessMessage('Transaction marked as paid successfully!');
                fetchOutstanding(); // Refresh the list
            }
        } catch (err) {
            setError('Failed to update transaction status. Please try again.');
            console.error('Error updating transaction:', err);
        } finally {
            setLoading(false);
        }
    };

    // Format currency values
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Determine if a transaction is overdue
    const isOverdue = (dateString, status) => {
        return new Date(dateString) < new Date() && status === 'Pending';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-6">
            <h2 className="text-2xl font-semibold mb-6">Outstanding Transactions</h2>

            {/* Status messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="search" className="block text-sm font-medium mb-1">Search</label>
                    <input
                        id="search"
                        type="text"
                        placeholder="Search by customer name or ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="p-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium mb-1">Filter by Status</label>
                    <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="p-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">All Transactions</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Outstanding Transactions Table */}
            {!loading && (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <table className="w-full table-auto">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left">ID</th>
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-left">Total Amount</th>
                                <th className="px-4 py-3 text-left">Paid Amount</th>
                                <th className="px-4 py-3 text-left">Pending Amount</th>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Payment Type</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((transaction) => (
                                    <tr
                                        key={`${transaction.type}-${transaction.id}`}
                                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-4 py-3">#{transaction.id}</td>
                                        <td className="px-4 py-3 font-medium">{transaction.customer_name}</td>
                                        <td className="px-4 py-3">{formatCurrency(transaction.total_amount)}</td>
                                        <td className="px-4 py-3">{formatCurrency(transaction.paid_amount)}</td>
                                        <td className="px-4 py-3">{formatCurrency(transaction.final_outstanding_amount)}</td>
                                        <td className="px-4 py-3">
                                            {formatDate(transaction.date)}
                                            {isOverdue(transaction.date, transaction.status) && (
                                                <span className="ml-2 text-xs text-red-500">Overdue</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{transaction.payment_type || transaction.payment_method}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${transaction.status === 'Paid'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                                                : isOverdue(transaction.date, transaction.status)
                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                                                }`}>
                                                {isOverdue(transaction.date, transaction.status) ? 'Overdue' : transaction.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {transaction.status === 'Pending' && (
                                                <button
                                                    onClick={() => handlePayment(transaction.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                                    disabled={loading}
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No transactions found matching your criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Outstanding;