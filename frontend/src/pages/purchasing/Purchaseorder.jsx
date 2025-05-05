import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiChevronDown, FiChevronUp, FiEdit, FiTrash2, FiPrinter } from 'react-icons/fi';
import PrintablePurchaseOrder from './PrintablePurchaseOrder';

const API_BASE_URL = 'http://127.0.0.1:8080/api';

// New component for printing all orders
const PrintableOrdersReport = ({ orders, formatCurrency }) => {
    return (
        <div className="p-8 bg-white border border-gray-300 rounded-lg printable-orders-report dark:bg-white dark:border-gray-300">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders Summary</h1>
                <p className="text-sm text-gray-500">Generated on {new Date().toLocaleString()}</p>
            </div>
            <table className="min-w-full text-sm border border-gray-300">
                <thead className="text-white bg-blue-900">
                    <tr>
                        <th className="px-4 py-3 font-semibold text-left border-r border-gray-300">Order ID</th>
                        <th className="px-4 py-3 font-semibold text-left border-r border-gray-300">Supplier</th>
                        <th className="px-4 py-3 font-semibold text-right border-r border-gray-300">Total</th>
                        <th className="px-4 py-3 font-semibold text-left">Items</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order, index) => (
                        <tr key={order.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 border-r border-gray-300">#{order.id}</td>
                            <td className="px-4 py-3 border-r border-gray-300">
                                <div className="font-semibold">{order.supplier?.supplier_name || order.contact_name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{order.phone || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-3 text-right border-r border-gray-300">{formatCurrency(order.total)}</td>
                            <td className="px-4 py-3">
                                {Array.isArray(order.order_items) && order.order_items.length > 0 ? (
                                    <ul className="text-xs list-disc list-inside">
                                        {order.order_items.map((item) => (
                                            <li key={item.id}>
                                                {item.description || 'N/A'} (Qty: {item.qty}, Unit Price: {formatCurrency(item.unit_price)})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-500">No items</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-6 text-right">
                <p className="text-sm font-semibold">
                    Total Across All Orders: {formatCurrency(orders.reduce((sum, order) => sum + Number(order.total || 0), 0))}
                </p>
            </div>
        </div>
    );
};

const PurchaseOrder = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [supplier, setSupplier] = useState({
        contactName: '',
        address: '',
        phone: '',
    });
    const [items, setItems] = useState([
        { description: '', qty: 1, unitPrice: 0, total: 0 },
    ]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showOrders, setShowOrders] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [printOrderData, setPrintOrderData] = useState(null);
    const [printAllOrders, setPrintAllOrders] = useState(false);

    // Fetch suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/suppliers`);
                setSuppliers(response.data);
            } catch (error) {
                setError('Failed to load suppliers');
            }
        };
        fetchSuppliers();
    }, []);

    // Fetch purchase orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/purchase-orders`);
                setOrders(response.data);
            } catch (error) {
                setError('Failed to load orders: ' + error.message);
            }
        };
        fetchOrders();
    }, []);

    // Update supplier details
    useEffect(() => {
        if (selectedSupplierId && !editingOrder) {
            const selected = suppliers.find((sup) => sup.id === parseInt(selectedSupplierId));
            if (selected) {
                setSupplier({
                    contactName: selected.supplier_name,
                    address: selected.address,
                    phone: selected.contact,
                });
            }
        } else if (!selectedSupplierId && !editingOrder) {
            setSupplier({ contactName: '', address: '', phone: '' });
        }
    }, [selectedSupplierId, suppliers, editingOrder]);

    const handleSupplierChange = (e) => {
        setSelectedSupplierId(e.target.value);
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];
        updatedItems[index][name] = name === 'qty' || name === 'unitPrice' ? Number(value) : value;
        updatedItems[index].total = updatedItems[index].qty * updatedItems[index].unitPrice;
        setItems(updatedItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', qty: 1, unitPrice: 0, total: 0 }]);
    };

    const removeItem = (index) => {
        const updatedItems = items.filter((_, idx) => idx !== index);
        setItems(updatedItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (!selectedSupplierId) {
            setError('Please select a supplier');
            alert('Please select a supplier');
            return;
        }

        const data = {
            supplierId: selectedSupplierId,
            contactName: supplier.contactName,
            phone: supplier.phone,
            address: supplier.address,
            items: items.map((item) => ({
                description: item.description,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: item.total,
            })),
        };

        try {
            let response;
            if (editingOrder) {
                response = await axios.put(`${API_BASE_URL}/purchase-orders/${editingOrder.id}`, data);
            } else {
                response = await axios.post(`${API_BASE_URL}/purchase-orders`, data);
            }
            setSuccess(response.data.message);
            setOrders((prev) => {
                if (editingOrder) {
                    return prev.map((order) =>
                        order.id === editingOrder.id ? response.data.purchaseOrder : order
                    );
                }
                return [...prev, response.data.purchaseOrder];
            });
            resetForm();
            alert(editingOrder ? 'Purchase order updated successfully!' : 'Purchase order created successfully!');
        } catch (err) {
            const errorMessage = err.response?.status === 422
                ? 'Validation failed: ' + JSON.stringify(err.response.data.errors)
                : 'Failed to submit order: ' + err.message;
            setError(errorMessage);
            alert(errorMessage);
        }
    };

    const resetForm = () => {
        setSelectedSupplierId('');
        setSupplier({ contactName: '', address: '', phone: '' });
        setItems([{ description: '', qty: 1, unitPrice: 0, total: 0 }]);
        setEditingOrder(null);
    };

    const handleEdit = (order) => {
        setEditingOrder(order);
        setSelectedSupplierId(order.supplier_id.toString());
        setSupplier({
            contactName: order.contact_name,
            address: order.address,
            phone: order.phone,
        });
        setItems(
            order.order_items.map((item) => ({
                description: item.description,
                qty: item.qty,
                unitPrice: Number(item.unit_price),
                total: Number(item.total),
            }))
        );
        setShowOrders(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/purchase-orders/${id}`);
            setOrders(orders.filter((order) => order.id !== id));
            setSuccess('Purchase order deleted successfully');
            alert('Purchase order deleted successfully');
        } catch (error) {
            setError('Failed to delete order: ' + error.message);
            alert('Failed to delete order');
        }
    };

    const handleViewPrint = (order) => {
        setPrintOrderData({
            supplier: {
                name: order.supplier?.supplier_name || order.contact_name || 'N/A',
                address: order.address || 'N/A',
                phone: order.phone || 'N/A',
            },
            items: order.order_items.map((item) => ({
                id: item.id,
                description: item.description || 'N/A',
                qty: item.qty || 0,
                unitPrice: Number(item.unit_price) || 0,
                total: Number(item.total) || 0,
            })),
            footerDetails: {
                approvedBy: 'System',
                nextApprovalTo: '',
                dateTime: new Date(order.updated_at || order.created_at || Date.now()).toLocaleString(),
            },
            total: Number(order.total) || 0,
            order: {
                no: order.id.toString(),
                date: new Date(order.created_at || Date.now()).toLocaleDateString(),
                time: new Date(order.created_at || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            },
        });
    };

    const closePrintModal = () => {
        setPrintOrderData(null);
    };

    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    const formatCurrency = (amount) => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            return 'LKR 0.00';
        }
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    };

    const handlePrintOrders = () => {
        if (orders.length === 0) {
            alert('No orders to print.');
            return;
        }
        setPrintAllOrders(true);
        setTimeout(() => {
            window.print();
            setPrintAllOrders(false);
        }, 100); // Small delay to ensure component renders
    };

    return (
        <div className="flex flex-col min-h-screen p-4 bg-transparent">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-purchase-order, .printable-purchase-order *, 
                        .printable-orders-report, .printable-orders-report * {
                            visibility: visible;
                        }
                        .printable-purchase-order, .printable-orders-report {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto;
                            margin: 0;
                            padding: 20mm;
                            box-sizing: border-box;
                            background: white;
                            color: black;
                        }
                        /* Ensure table borders and backgrounds print correctly */
                        .printable-purchase-order table, .printable-orders-report table {
                            border-collapse: collapse;
                            width: 100%;
                        }
                        .printable-purchase-order th, .printable-purchase-order td,
                        .printable-orders-report th, .printable-orders-report td {
                            border: 1px solid #d1d5db;
                            padding: 8px;
                            color: #1f2937;
                        }
                        .printable-purchase-order th, .printable-orders-report th {
                            background-color: #1e40af;
                            color: white;
                        }
                        /* Override Tailwind dark mode for printing */
                        .dark .printable-purchase-order, .dark .printable-orders-report {
                            background: white;
                            color: black;
                        }
                        .dark .printable-purchase-order th, .dark .printable-purchase-order td,
                        .dark .printable-orders-report th, .dark .printable-orders-report td {
                            border-color: #d1d5db;
                            color: #1f2937;
                        }
                        .dark .printable-purchase-order th, .dark .printable-orders-report th {
                            background-color: #1e40af;
                            color: white;
                        }
                    }
                    /* Hide printable report on screen */
                    .printable-orders-report {
                        display: none;
                    }
                    @media print {
                        .printable-orders-report {
                            display: block;
                        }
                    }
                `}
            </style>
            <div className="py-3 mb-6 text-center text-white rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800">
                <h1 className="text-2xl font-bold">PURCHASE ORDER</h1>
                <p className="text-sm opacity-90">Manage your purchase orders</p>
            </div>

            <div className="flex items-center justify-end mb-6 gap-x-3">
                <button
                    onClick={() => setShowOrders(!showOrders)}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                    {showOrders ? 'Hide Orders' : 'View Orders'}
                </button>
                {showOrders && (
                    <button
                        onClick={handlePrintOrders}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        <FiPrinter /> Print All Orders
                    </button>
                )}
            </div>

            {showOrders ? (
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
                            <thead className="text-xs tracking-wider text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Order ID</th>
                                    <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Supplier</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                            No purchase orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order, index) => (
                                        <React.Fragment key={order.id}>
                                            <tr
                                                className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${expandedRow === index ? 'bg-blue-50 dark:bg-slate-700' : ''}`}
                                            >
                                                <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    <button onClick={() => toggleRow(index)} className="hover:underline focus:outline-none">
                                                        ORD{order.id}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {order.supplier?.supplier_name || order.contact_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{order.phone}</div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-right text-gray-800 dark:text-white whitespace-nowrap">
                                                    {formatCurrency(order.total)}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-x-3">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleViewPrint(order); }}
                                                            title="View/Reprint"
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
                                                        >
                                                            <FiPrinter size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(order); }}
                                                            title="Edit Order"
                                                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 focus:outline-none"
                                                        >
                                                            <FiEdit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                                                            title="Delete Order"
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleRow(index); }}
                                                            title={expandedRow === index ? 'Collapse Details' : 'Expand Details'}
                                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                                                        >
                                                            {expandedRow === index ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === index && (
                                                <tr className="bg-gray-50 dark:bg-slate-900/30">
                                                    <td colSpan={4} className="px-4 py-4 md:px-6 md:py-4">
                                                        <div className="grid grid-cols-1 gap-6">
                                                            <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700">
                                                                <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">Order Items ({order.order_items?.length || 0})</h4>
                                                                {Array.isArray(order.order_items) && order.order_items.length > 0 ? (
                                                                    <div className="overflow-x-auto max-h-60">
                                                                        <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-slate-600">
                                                                            <thead className="sticky top-0 text-gray-700 bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                                                                <tr>
                                                                                    <th className="px-2 py-1 font-medium text-left">Description</th>
                                                                                    <th className="px-2 py-1 font-medium text-center">Qty</th>
                                                                                    <th className="px-2 py-1 font-medium text-right">Unit Price</th>
                                                                                    <th className="px-2 py-1 font-medium text-right">Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
                                                                                {order.order_items.map((item) => (
                                                                                    <tr key={item.id}>
                                                                                        <td className="px-2 py-1 font-medium text-gray-900 dark:text-white">
                                                                                            {item.description || 'N/A'}
                                                                                        </td>
                                                                                        <td className="px-2 py-1 text-center text-gray-600 dark:text-gray-300">{item.qty}</td>
                                                                                        <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-300">
                                                                                            {formatCurrency(item.unit_price)}
                                                                                        </td>
                                                                                        <td className="px-2 py-1 font-semibold text-right text-gray-900 dark:text-white">
                                                                                            {formatCurrency(item.total)}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">No item details available.</p>
                                                                )}
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
                </div>
            ) : (
                <>
                    <div className="space-y-6 supplier-info">
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">Supplier Information</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</label>
                                <select
                                    name="supplier"
                                    value={selectedSupplierId}
                                    onChange={handleSupplierChange}
                                    className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((sup) => (
                                        <option key={sup.id} value={sup.id}>
                                            {sup.supplier_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={supplier.phone}
                                    readOnly
                                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                    placeholder="Phone Number"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={supplier.address}
                                    readOnly
                                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                    placeholder="Supplier Address"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-6 items-table">
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">Order Items</h3>
                        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-slate-700">
                            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
                                <thead className="text-xs tracking-wider text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-left">Description</th>
                                        <th className="px-4 py-3 font-semibold text-center">Quantity</th>
                                        <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                                        <th className="px-4 py-3 font-semibold text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                                    {items.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    name="description"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Item Description"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    name="qty"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-full p-2 text-center bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    name="unitPrice"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    className="w-full p-2 text-right bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-right text-gray-900 dark:text-white">
                                                {formatCurrency(item.total)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-start mt-4">
                            <button
                                onClick={addItem}
                                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Add Item
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 text-right total">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Total: {formatCurrency(calculateTotal())}</h3>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            {editingOrder ? 'Update Order' : 'Submit Order'}
                        </button>
                    </div>

                    {error && <div className="mt-4 text-center text-red-500">{error}</div>}
                    {success && <div className="mt-4 text-center text-green-500">{success}</div>}
                </>
            )}

            {printOrderData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800 flex flex-col">
                        <div className="flex items-center justify-between flex-shrink-0 p-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Order Preview (#{printOrderData.order.no})</h3>
                            <button
                                onClick={closePrintModal}
                                className="p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                aria-label="Close preview"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            <PrintablePurchaseOrder orderData={printOrderData} />
                        </div>
                        <div className="flex justify-end flex-shrink-0 p-4 border-t dark:border-gray-700">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                <FiPrinter /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {printAllOrders && (
                <PrintableOrdersReport orders={orders} formatCurrency={formatCurrency} />
            )}
        </div>
    );
};

export default PurchaseOrder;