import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PurchaseForm from './PurchaseForm';
import PrintPreviewModal from './PrintPreviewModal';

const PurchaseList = () => {
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        supplier: '',
        paymentMethod: ''
    });
    const [showForm, setShowForm] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [viewingPurchase, setViewingPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        fetchPurchases();
        fetchSuppliers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [purchases, filters]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/purchases');
            const data = await response.json();
            setPurchases(data);
            setFilteredPurchases(data);
        } catch (error) {
            toast.error('Failed to load purchases');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/suppliers');
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            toast.error('Failed to load suppliers');
        }
    };

    const applyFilters = () => {
        let result = [...purchases];

        if (filters.fromDate) {
            result = result.filter(p => new Date(p.date) >= new Date(filters.fromDate));
        }

        if (filters.toDate) {
            result = result.filter(p => new Date(p.date) <= new Date(filters.toDate));
        }

        if (filters.supplier) {
            result = result.filter(p => p.supplier.id === filters.supplier);
        }

        if (filters.paymentMethod) {
            result = result.filter(p => p.paymentMethod === filters.paymentMethod);
        }

        setFilteredPurchases(result);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase?\nThis action will update the stock and remove this entry permanently.')) {
            try {
                await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
                toast.success('Purchase deleted successfully');
                fetchPurchases();
            } catch (error) {
                toast.error('Failed to delete purchase');
            }
        }
    };

    const handleSave = async (purchaseData) => {
        try {
            const method = editingPurchase ? 'PUT' : 'POST';
            const url = editingPurchase ? `/api/purchases/${editingPurchase.id}` : '/api/purchases';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData)
            });

            if (!response.ok) throw new Error('Failed to save');

            setShowForm(false);
            fetchPurchases();
            toast.success(`Purchase ${editingPurchase ? 'updated' : 'created'} successfully`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase Invoices</h1>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                        setEditingPurchase(null);
                        setShowForm(true);
                    }}
                >
                    New Purchase
                </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-1">From Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">To Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Supplier</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={filters.supplier}
                            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1">Payment Method</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                        >
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="credit">Credit</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Purchase Table */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 border">Invoice No</th>
                                <th className="p-3 border">Date</th>
                                <th className="p-3 border">Supplier</th>
                                <th className="p-3 border">Total</th>
                                <th className="p-3 border">Payment</th>
                                <th className="p-3 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.map(purchase => (
                                <tr key={purchase.id} className="hover:bg-gray-50">
                                    <td className="p-3 border">{purchase.invoiceNumber}</td>
                                    <td className="p-3 border">{new Date(purchase.date).toLocaleDateString()}</td>
                                    <td className="p-3 border">{purchase.supplier?.name || 'N/A'}</td>
                                    <td className="p-3 border">{purchase.total.toFixed(2)}</td>
                                    <td className="p-3 border">
                                        <span className={`px-2 py-1 rounded-full text-xs ${purchase.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                            purchase.paymentMethod === 'credit' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {purchase.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="p-3 border">
                                        <div className="flex space-x-2">
                                            <button
                                                className="text-blue-500 hover:text-blue-700"
                                                onClick={() => setViewingPurchase(purchase)}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="text-green-500 hover:text-green-700"
                                                onClick={() => {
                                                    setEditingPurchase(purchase);
                                                    setShowForm(true);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(purchase.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-auto">
                        <PurchaseForm
                            existingPurchase={editingPurchase}
                            onSave={handleSave}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingPurchase(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {viewingPurchase && (
                <PrintPreviewModal
                    purchase={viewingPurchase}
                    onClose={() => setViewingPurchase(null)}
                    onPrint={() => window.print()}
                />
            )}
        </div>
    );
};

export default PurchaseList;