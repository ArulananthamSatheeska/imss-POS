import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Outstanding = () => {
    const [outstandingTransactions, setOutstandingTransactions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Modal state for recording payment
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    // Modal state for viewing paid details
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsTransaction, setDetailsTransaction] = useState(null);

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
        const isStatusMatch = filterStatus === 'All' || transaction.status === filterStatus || (filterStatus === 'Partial' && transaction.status === 'Partial');
        const isSearchMatch =
            transaction.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.id.toString().includes(searchQuery);
        return isStatusMatch && isSearchMatch;
    });

    // Open modal to enter payment amount and date
    const openPaymentModal = (transaction) => {
        setSelectedTransaction(transaction);
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setModalError(null);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTransaction(null);
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setModalError(null);
    };

    // Submit payment update
    const submitPayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
            setModalError('Please enter a valid payment amount.');
            return;
        }
        if (Number(paymentAmount) > selectedTransaction.final_outstanding_amount) {
            setModalError('Payment amount cannot exceed the pending amount.');
            return;
        }

        try {
            setModalLoading(true);
            setModalError(null);
            const response = await axios.patch(`/api/outstanding/${selectedTransaction.id}`, {
                paid_amount: Number(paymentAmount),
                payment_date: paymentDate,
            });
            if (response.status === 200) {
                setSuccessMessage('Payment updated successfully!');
                closeModal();
                fetchOutstanding();
            }
        } catch (err) {
            setModalError('Failed to update payment. Please try again.');
            console.error('Error updating payment:', err);
        } finally {
            setModalLoading(false);
        }
    };

    // Format currency values
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR'
        }).format(value);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Determine if a transaction is overdue
    const isOverdue = (dateString, status) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date() && (status === 'Pending' || status === 'Partial');
    };

    // Get status badge class
    const getStatusClass = (status, date) => {
        if (status === 'Paid') {
            return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
        } else if (isOverdue(date, status)) {
            return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
        } else if (status === 'Partial') {
            return 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100';
        } else {
            return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
        }
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
                        <option value="Partial">Partial</option>
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
                                <th className="px-4 py-3 text-left">View Details</th>
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
                                            <button
                                                onClick={() => {
                                                    setDetailsTransaction(transaction);
                                                    setIsDetailsModalOpen(true);
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatDate(transaction.date)}
                                            {isOverdue(transaction.date, transaction.status) && (
                                                <span className="ml-2 text-xs text-red-500">Overdue</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{transaction.payment_type || transaction.payment_method}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(transaction.status, transaction.date)}`}>
                                                {transaction.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {transaction.status !== 'Paid' && (
                                                <button
                                                    onClick={() => openPaymentModal(transaction)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                                    disabled={loading || modalLoading}
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No transactions found matching your criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
                        <p className="mb-2">Customer: {selectedTransaction.customer_name}</p>
                        <p className="mb-2">Pending Amount: {formatCurrency(selectedTransaction.final_outstanding_amount)}</p>
                        <label className="block mb-1 font-medium" htmlFor="paymentAmount">Payment Amount</label>
                        <input
                            id="paymentAmount"
                            type="number"
                            min="0"
                            max={selectedTransaction.final_outstanding_amount}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Enter payment amount"
                            className="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="block mb-1 font-medium" htmlFor="paymentDate">Payment Date</label>
                        <input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {modalError && (
                            <p className="text-red-600 mb-4">{modalError}</p>
                        )}
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
                                disabled={modalLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitPayment}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                disabled={modalLoading}
                            >
                                {modalLoading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Paid Details Modal */}
            {isDetailsModalOpen && detailsTransaction && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                        <p className="mb-2 font-medium">Customer: {detailsTransaction.customer_name}</p>
                        <p className="mb-2">Total Amount: {formatCurrency(detailsTransaction.total_amount)}</p>
                        <p className="mb-2">Pending Amount: {formatCurrency(detailsTransaction.final_outstanding_amount)}</p>
                        <p className="mb-2">Paid Amount: {formatCurrency(detailsTransaction.paid_amount)}</p>
                        {detailsTransaction.payment_history && detailsTransaction.payment_history.length > 0 ? (
                            <div className="mt-4 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded p-2">
                                <h4 className="font-semibold mb-2">Payment History</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {detailsTransaction.payment_history.map((payment, index) => (
                                        <li key={index}>
                                            {formatDate(payment.payment_date)} - {formatCurrency(payment.amount)} via {payment.payment_method || 'N/A'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No payment history available.</p>
                        )}
                        <button
                            onClick={() => setIsDetailsModalOpen(false)}
                            className="mt-4 px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Outstanding;
