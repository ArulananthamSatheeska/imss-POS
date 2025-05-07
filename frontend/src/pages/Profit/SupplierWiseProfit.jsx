import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReportTable from '../../components/reports/ReportTable';

const SupplierWiseProfit = () => {
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Format currency for LKR
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

    // Fetch suppliers from backend
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/suppliers');
                setSuppliers(response.data);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
                setError('Failed to load suppliers');
            }
        };
        fetchSuppliers();
    }, []);

    // Fetch sales items for the selected supplier
    useEffect(() => {
        if (!selectedSupplier) {
            setReportData([]);
            setSummary({});
            return;
        }

        const fetchSupplierSales = async () => {
            setLoading(true);
            setError('');
            try {
                const params = {};
                if (fromDate) params.from = fromDate;
                if (toDate) params.to = toDate;

                const response = await axios.get(`http://127.0.0.1:8000/api/supplier-profit/${selectedSupplier}`, { params });
                const salesData = response.data.items || [];

                // Process sales data for the table
                const processedData = salesData.map((item) => ({
                    product_name: item.product_name || 'Unknown Product',
                    total_quantity_sold: item.quantity_sold || 0,
                    total_sales_amount: formatCurrency(item.sales_amount || 0),
                    total_cost: formatCurrency(item.cost || 0),
                    total_profit: formatCurrency(item.profit || 0),
                    profit_percentage: item.profit_percentage
                        ? `${parseFloat(item.profit_percentage).toFixed(2)}%`
                        : '0.00%',
                }));

                // Use summary from backend
                const summaryData = {
                    totalSellingPriceAll: formatCurrency(response.data.summary?.total_sales_amount || 0),
                    totalProfitAll: formatCurrency(response.data.summary?.total_profit || 0),
                    totalCostPriceAll: formatCurrency(response.data.summary?.total_cost || 0),
                    totalProfitPercentage: response.data.summary?.total_profit_percentage || '0.00%',
                };

                setReportData(processedData);
                setSummary(summaryData);
            } catch (error) {
                console.error('Error fetching supplier sales:', error);
                if (error.response?.status === 404) {
                    setError('Selected supplier not found');
                } else if (error.response?.status === 500) {
                    setError('Server error: Unable to fetch supplier sales data');
                } else {
                    setError('Failed to load sales data for the selected supplier');
                }
                setReportData([]);
                setSummary({});
            } finally {
                setLoading(false);
            }
        };

        fetchSupplierSales();
    }, [selectedSupplier, fromDate, toDate]);

    return (
        <div className="flex flex-col min-h-screen p-4 bg-transparent">
            {/* Header */}
            <div className="p-2 text-center text-white bg-blue-600 rounded-t-lg">
                <h1 className="text-2xl font-bold">Supplier Wise Profit Report</h1>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                {/* Supplier Dropdown */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex flex-col">
                        <span className="mb-1 font-medium">Select Supplier:</span>
                        <select
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a supplier</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.supplier_name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Date Filters */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex flex-col">
                        <span className="mb-1 font-medium">From Date:</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="flex flex-col">
                        <span className="mb-1 font-medium">To Date:</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>
                </div>

                {/* Status Messages */}
                <div className="flex-1 min-w-[200px]">
                    {loading && <p className="text-blue-500">Loading...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                    <button
                        className="px-4 py-2 text-white transition duration-300 bg-green-500 rounded-lg hover:bg-green-600"
                        disabled={!reportData.length}
                    >
                        Export to Excel
                    </button>
                    <button
                        className="px-4 py-2 text-white transition duration-300 bg-red-500 rounded-lg hover:bg-red-600"
                        disabled={!reportData.length}
                    >
                        Export to PDF
                    </button>
                    <button
                        className="px-4 py-2 text-white transition duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
                        disabled={!reportData.length}
                    >
                        Print
                    </button>
                </div>
            </div>

            {/* Report Table */}
            {reportData.length > 0 ? (
                <>
                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                        <ReportTable
                            data={reportData}
                            columns={[
                                { header: 'Product Name', field: 'product_name' },
                                { header: 'Qty Sold', field: 'total_quantity_sold' },
                                { header: 'Sales Amount', field: 'total_sales_amount' },
                                { header: 'Cost', field: 'total_cost' },
                                { header: 'Profit', field: 'total_profit' },
                                { header: 'Profit %', field: 'profit_percentage' },
                            ]}
                        />
                    </div>

                    {/* Summary Section */}
                    <div className="p-4 mt-4 text-center bg-transparent rounded-lg shadow-lg">
                        <h2 className="mb-4 text-xl font-bold">Supplier Summary</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="p-4 rounded-lg bg-cyan-800">
                                <p className="text-sm text-cyan-500">Total Sales</p>
                                <p className="text-2xl font-bold text-cyan-300">
                                    {summary.totalSellingPriceAll || 'LKR 0.00'}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-rose-800">
                                <p className="text-sm text-pink-500">Total Profit</p>
                                <p className="text-2xl font-bold text-pink-300">
                                    {summary.totalProfitAll || 'LKR 0.00'}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-lime-800">
                                <p className="text-sm text-lime-500">Total Cost</p>
                                <p className="text-2xl font-bold text-lime-300">
                                    {summary.totalCostPriceAll || 'LKR 0.00'}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-fuchsia-800">
                                <p className="text-sm text-fuchsia-500">Profit Margin</p>
                                <p className="text-2xl font-bold text-fuchsia-300">
                                    {summary.totalProfitPercentage || '0.00%'}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                !loading && (
                    <p className="text-center text-gray-500">
                        No data available for selected supplier
                    </p>
                )
            )}
        </div>
    );
};

export default SupplierWiseProfit;