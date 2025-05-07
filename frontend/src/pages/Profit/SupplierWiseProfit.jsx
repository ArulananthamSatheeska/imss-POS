import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReportTable from '../../components/reports/ReportTable';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export const SupplierWiseProfit = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [reportData, setReportData] = useState([]);
    const [itemDetails, setItemDetails] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    // Fetch suppliers from the backend
    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/suppliers');
            setSuppliers(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setError('Failed to load suppliers. Please try again.');
        }
    };

    // Fetch report data from the backend based on selected supplier
    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get('http://127.0.0.1:8000/api/sales/supplier-wise-profit-report', {
                params: { supplierName: selectedSupplier },
            });

            if (response.data?.reportData) {
                // Process data for profit percentages and quantity
                const processedData = response.data.reportData.map(item => ({
                    ...item,
                    profit_percentage: item.profitPercentage, // Already formatted as 'X.XX%'
                    totalQuantity: item.totalQuantity,
                }));

                // Extract item details
                const items = response.data.reportData.flatMap(item => item.items || []);

                setReportData(processedData);
                setItemDetails(items);
                setSummary({
                    ...response.data.summary,
                    totalProfitPercentage: response.data.summary.averageProfitPercentageAll,
                    totalQuantityAll: response.data.summary.totalQuantityAll,
                });

                if (processedData.length === 0) {
                    setError(`No data found for supplier "${selectedSupplier}".`);
                }
            } else {
                setReportData([]);
                setItemDetails([]);
                setSummary({});
                setError(`No data found for supplier "${selectedSupplier}".`);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            const errorMessage = error.response?.data?.error || 'Failed to load report data. Please try again.';
            setError(errorMessage);
            setReportData([]);
            setItemDetails([]);
            setSummary({});
        } finally {
            setLoading(false);
        }
    };

    // Fetch suppliers on component mount
    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Fetch report data when the selected supplier changes
    useEffect(() => {
        if (selectedSupplier) fetchReportData();
    }, [selectedSupplier]);

    // Toggle row expansion
    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    // Export to Excel
    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const summaryWs = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Supplier Summary');
        const itemsWs = XLSX.utils.json_to_sheet(itemDetails);
        XLSX.utils.book_append_sheet(wb, itemsWs, 'Item Details');
        XLSX.writeFile(wb, 'Supplier_Wise_Profit_Report.xlsx');
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Supplier Wise Profit Report', 10, 10);
        doc.autoTable({
            head: [['Supplier', 'Total Quantity', 'Total Cost', 'Total Sales', 'Total Profit', 'Profit %']],
            body: reportData.map(row => [
                row.supplierName,
                row.totalQuantity,
                row.totalCostPrice,
                row.totalSellingPrice,
                row.totalProfit,
                row.profit_percentage,
            ]),
            startY: 20,
        });
        doc.text('Item Details', 10, doc.lastAutoTable.finalY + 10);
        doc.autoTable({
            head: [['Product Name', 'Quantity', 'Unit Price', 'Total Cost', 'Total Sales', 'Profit']],
            body: itemDetails.map(item => [
                item.product_name,
                item.quantity,
                item.unit_price,
                item.total_cost,
                item.total_sales,
                item.profit,
            ]),
            startY: doc.lastAutoTable.finalY + 20,
        });
        doc.save('Supplier_Wise_Profit_Report.pdf');
    };

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
                            <option value="">Select a Supplier</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.supplier_name}>
                                    {supplier.supplier_name}
                                </option>
                            ))}
                        </select>
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
                        onClick={exportToExcel}
                        className="px-4 py-2 text-white transition duration-300 bg-green-500 rounded-lg hover:bg-green-600"
                        disabled={!reportData.length}
                    >
                        Export to Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="px-4 py-2 text-white transition duration-300 bg-red-500 rounded-lg hover:bg-red-600"
                        disabled={!reportData.length}
                    >
                        Export to PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 text-white transition duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
                        disabled={!reportData.length}
                    >
                        Print
                    </button>
                </div>
            </div>

            {/* Report Table */}
            {reportData.length > 0 ? (
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
                            <thead className="text-xs tracking-wider text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Supplier Name</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total Quantity</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total Cost</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total Sales</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total Profit</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Profit %</th>
                                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                                {reportData.map((row, index) => (
                                    <React.Fragment key={row.supplierName}>
                                        <tr
                                            className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                                                expandedRow === index ? 'bg-blue-50 dark:bg-slate-700' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleRow(index)}
                                                    className="hover:underline focus:outline-none"
                                                >
                                                    {row.supplierName}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {row.totalQuantity}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {row.totalCostPrice}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {row.totalSellingPrice}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-right text-gray-800 dark:text-white whitespace-nowrap">
                                                {row.totalProfit}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {row.profit_percentage}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleRow(index)}
                                                    title={expandedRow === index ? 'Collapse Details' : 'Expand Details'}
                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                                                >
                                                    {expandedRow === index ? (
                                                        <FiChevronUp size={18} />
                                                    ) : (
                                                        <FiChevronDown size={18} />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === index && (
                                            <tr className="bg-gray-50 dark:bg-slate-900/30">
                                                <td colSpan={7} className="px-4 py-4 md:px-6 md:py-4">
                                                    <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700">
                                                        <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                                            Item Details ({row.items?.length || 0})
                                                        </h4>
                                                        {row.items && row.items.length > 0 ? (
                                                            <div className="overflow-x-auto max-h-60">
                                                                <ReportTable
                                                                    data={row.items}
                                                                    columns={[
                                                                        { header: 'Product Name', field: 'product_name' },
                                                                        { header: 'Quantity', field: 'quantity' },
                                                                        { header: 'Unit Price', field: 'unit_price' },
                                                                        { header: 'Total Cost', field: 'total_cost' },
                                                                        { header: 'Total Sales', field: 'total_sales' },
                                                                        { header: 'Profit', field: 'profit' },
                                                                    ]}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                                                                No item details available.
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Summary Section */}
                    <div className="p-4 mt-4 text-center bg-transparent rounded-lg shadow-lg">
                        <h2 className="mb-4 text-xl font-bold">Summary</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div className="p-4 rounded-lg bg-cyan-800">
                                <p className="text-sm text-cyan-500">Total Quantity</p>
                                <p className="text-2xl font-bold text-cyan-300">{summary.totalQuantityAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-lime-800">
                                <p className="text-sm text-lime-500">Total Cost</p>
                                <p className="text-2xl font-bold text-lime-300">LKR {summary.totalCostPriceAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-cyan-800">
                                <p className="text-sm text-cyan-500">Total Sales</p>
                                <p className="text-2xl font-bold text-cyan-300">LKR {summary.totalSellingPriceAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-rose-800">
                                <p className="text-sm text-pink-500">Total Profit</p>
                                <p className="text-2xl font-bold text-pink-300">LKR {summary.totalProfitAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-fuchsia-800">
                                <p className="text-sm text-fuchsia-500">Profit Margin</p>
                                <p className="text-2xl font-bold text-fuchsia-300">{summary.totalProfitPercentage || '0.00%'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                !loading && error && <p className="text-center text-gray-500">{error}</p>
            )}
        </div>
    );
};

export default SupplierWiseProfit;