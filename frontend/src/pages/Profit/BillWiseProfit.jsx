import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const BillDetailsTable = ({ items }) => {
    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white dark:bg-slate-800 text-black dark:text-white">
                <thead className="bg-white dark:bg-slate-800 text-black dark:text-white">
                    <tr>
                        <th className="px-4 py-2">Product Name</th>
                        <th className="px-4 py-2">Quantity</th>
                        <th className="px-4 py-2">Cost Price</th>
                        <th className="px-4 py-2">Selling Price</th>
                        <th className="px-4 py-2">Profit</th>
                        <th className="px-4 py-2">Profit %</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="px-4 py-2">{item.product_name}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">LKR {item.costPrice}</td>
                            <td className="px-4 py-2 text-right">LKR {item.sellingPrice}</td>
                            <td className="px-4 py-2 text-right">LKR {item.profit}</td>
                            <td className="px-4 py-2 text-right">{item.profitPercentage}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BillWiseReportTable = ({ data, columns, renderCell }) => {
    const [expandedRows, setExpandedRows] = useState({});

    const toggleExpand = (billNo) => {
        setExpandedRows((prev) => ({
            ...prev,
            [billNo]: !prev[billNo],
        }));
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-slate-800 text-black dark:text-white">
                <thead className="bg-white dark:bg-slate-800 text-black dark:text-white">
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index} className="px-4 py-2">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            <tr className="border-b">
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className="px-4 py-2">
                                        {renderCell(row, column, () => toggleExpand(row.billNo), expandedRows[row.billNo], rowIndex)}
                                    </td>
                                ))}
                            </tr>
                            {expandedRows[row.billNo] && (
                                <tr>
                                    <td colSpan={columns.length}>
                                        <BillDetailsTable items={row.items} />
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BillWiseProfitReport = () => {
    // State management
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch all report data initially without filters
    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get("http://127.0.0.1:8000/api/sales/bill-wise-profit-report");
            console.log("Fetched all report data:", response.data);
            setReportData(response.data.reportData || []);
            setSummary(response.data.summary || {});
            setError('');
        } catch (error) {
            console.error("Error fetching report data:", error);
            setError('Failed to fetch report. Check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch filtered data when filters are applied
    const fetchFilteredData = async () => {
        try {
            setIsLoading(true);
            const params = {};
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;

            const response = await axios.get("http://127.0.0.1:8000/api/sales/bill-wise-profit-report", { params });
            console.log("Fetched filtered report data:", response.data);
            setReportData(response.data.reportData || []);
            setSummary(response.data.summary || {});
            setError('');
        } catch (error) {
            console.error("Error fetching filtered report data:", error);
            setError('Failed to fetch filtered report. Check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch all data on component mount
    useEffect(() => {
        fetchReportData();
    }, []);

    // Fetch filtered data when filters change
    useEffect(() => {
        if (fromDate || toDate || paymentMethodFilter) {
            fetchFilteredData();
        }
    }, [fromDate, toDate, paymentMethodFilter]);

    // Generate report data with calculated profits
    const generateReportData = () => {
        return reportData.map((bill) => ({
            billNo: bill.bill_number,
            date: bill.date,
            customerName: bill.customer_name || 'Walk-in Customer',
            paymentMethod: bill.payment_type || 'cash',
            totalCostPrice: bill.totalCostPrice,
            totalSellingPrice: bill.totalSellingPrice,
            totalProfit: bill.totalProfit,
            profitPercentage: bill.profitPercentage,
            isProfit: parseFloat(bill.totalProfit.replace(/,/g, '')) >= 0,
            items: bill.items || [],
        }));
    };

    // Filtered data based on search query
    const filteredData = generateReportData().filter((row) => {
        return Object.values(row).some((value) =>
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Flatten data for export
    const flattenDataForExport = () => {
        return filteredData.flatMap((bill) => [
            {
                'Bill No.': bill.billNo,
                Date: bill.date,
                'Customer Name': bill.customerName,
                'Payment Method': bill.paymentMethod,
                'Total Cost Price': bill.totalCostPrice,
                'Total Selling Price': bill.totalSellingPrice,
                'Total Profit': bill.totalProfit,
                'Profit %': bill.profitPercentage,
            },
            ...bill.items.map((item) => ({
                'Product Name': item.product_name,
                Quantity: item.quantity,
                'Cost Price': item.costPrice,
                'Selling Price': item.sellingPrice,
                Profit: item.profit,
                'Profit %': item.profitPercentage,
            })),
        ]);
    };

    // Export to Excel
    const exportToExcel = () => {
        const flatData = flattenDataForExport();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(flatData);
        XLSX.utils.book_append_sheet(wb, ws, "Bill Wise Profit Report");
        XLSX.writeFile(wb, "Bill_Wise_Profit_Report.xlsx");
    };

    // Export to PDF
    const exportToPDF = () => {
        const flatData = flattenDataForExport();
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Bill Wise Profit Report", 10, 10);

        const columns = [
            'Bill No.',
            'Date',
            'Customer Name',
            'Payment Method',
            'Total Cost Price',
            'Total Selling Price',
            'Total Profit',
            'Profit %',
        ];
        const rows = flatData.map((row) => [
            row['Bill No.'],
            row.Date,
            row['Customer Name'],
            row['Payment Method'],
            row['Total Cost Price'],
            row['Total Selling Price'],
            row['Total Profit'],
            row['Profit %'],
        ]);

        doc.autoTable({
            head: [columns],
            body: rows,
            startY: 20,
        });

        doc.save("Bill_Wise_Profit_Report.pdf");
    };

    // Reset filters to show all data
    const resetFilters = () => {
        setFromDate('');
        setToDate('');
        setPaymentMethodFilter('');
        setSearchQuery('');
        fetchReportData();
    };

    return (
        <div className="p-4 bg-white dark:bg-slate-800 text-black dark:text-white min-h-screen flex flex-col">
            <div className="bg-blue-600 text-white text-center p-4 rounded-t-lg">
                <h1 className="text-2xl font-bold">Bill Wise Profit Report</h1>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
                <label className="flex flex-col">
                    <span className="font-medium mb-1">From:</span>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="border text-black border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="font-medium mb-1">To:</span>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="border text-black border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="font-medium mb-1">Search:</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bills..."
                        className="border text-black border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </label>
                <label className="flex flex-col">
                    <span className="font-medium mb-1">Payment Method:</span>
                    <select
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        className="border text-black border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                        <option value="credit">Credit</option>
                    </select>
                </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mb-4">
                <button
                    onClick={resetFilters}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                    Reset Filters
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={exportToExcel}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
                    >
                        Export to Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
                    >
                        Export to PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Print
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2">Loading report data...</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                    <p>{error}</p>
                </div>
            )}

            {/* Report Table */}
            {!isLoading && (
                <>
                    <BillWiseReportTable
                        data={filteredData}
                        columns={[
                            "No.",
                            "Bill No.",
                            "Date",
                            "Customer Name",
                            "Payment Method",
                            "Total Cost Price",
                            "Total Selling Price",
                            "Total Profit",
                            "Profit %",
                            "Items",
                        ]}
                        renderCell={(row, column, toggleExpand, isExpanded, rowIndex) => {
                            if (column === "No.") return rowIndex + 1;
                            if (column === "Bill No.") return row.billNo;
                            if (column === "Date") return row.date;
                            if (column === "Customer Name") return row.customerName;
                            if (column === "Payment Method") return row.paymentMethod;
                            if (column === "Total Cost Price") return `LKR ${row.totalCostPrice}`;
                            if (column === "Total Selling Price") return `LKR ${row.totalSellingPrice}`;
                            if (column === "Total Profit") return (
                                <span className={row.isProfit ? 'text-green-600' : 'text-red-600'}>
                                    LKR {row.totalProfit}
                                </span>
                            );
                            if (column === "Profit %") return (
                                <span className={row.isProfit ? 'text-green-600' : 'text-red-600'}>
                                    {row.profitPercentage}
                                </span>
                            );
                            if (column === "Items") return (
                                <button
                                    onClick={toggleExpand}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    {isExpanded ? '▲ Hide' : '▼ Show'} Items
                                </button>
                            );
                        }}
                    />

                    {/* Summary Section */}
                    <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg p-4 mt-4">
                        <h2 className="text-xl font-bold mb-4">Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-cyan-700 p-4 text-center rounded-lg">
                                <p className="text-blue-300">Total Profit</p>
                                <p className="text-2xl font-bold text-cyan-400">
                                    LKR {summary.totalProfitAll || '0.00'}
                                </p>
                            </div>
                            <div className="bg-emerald-700 p-4 text-center rounded-lg">
                                <p className="text-green-300">Average Profit %</p>
                                <p className="text-2xl font-bold text-green-400">
                                    {summary.averageProfitPercentageAll || '0.00%'}
                                </p>
                            </div>
                            <div className="bg-fuchsia-700 p-4 text-center rounded-lg">
                                <p className="text-fuchsia-300">Total Cost Price</p>
                                <p className="text-2xl font-bold text-fuchsia-400">
                                    LKR {summary.totalCostPriceAll || '0.00'}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BillWiseProfitReport;