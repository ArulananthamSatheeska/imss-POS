import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReportTable from '../../components/reports/ReportTable';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const DailyProfitReport = () => {
    const [date, setDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch report data from the backend
    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get("http://127.0.0.1:8000/api/sales/daily-profit-report", {
                params: { date },
            });

            if (response.data?.reportData) {
                // Process data for profit percentages
                const processedData = response.data.reportData.map(item => {
                    const sales = parseFloat(item.total_sales_amount.replace(/,/g, '')) || 0;
                    const profit = parseFloat(item.total_profit.replace(/,/g, '')) || 0;
                    const profitPercentage = sales > 0 ? (profit / sales * 100) : 0;

                    return {
                        ...item,
                        profit_percentage: `${profitPercentage.toFixed(2)}%`
                    };
                });

                // Calculate summary percentages
                const totalSales = parseFloat(response.data.summary.totalSellingPriceAll.replace(/,/g, '')) || 0;
                const totalProfit = parseFloat(response.data.summary.totalProfitAll.replace(/,/g, '')) || 0;
                const totalProfitPercentage = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;

                setReportData(processedData);
                setSummary({
                    ...response.data.summary,
                    totalProfitPercentage: `${totalProfitPercentage.toFixed(2)}%`
                });
            } else {
                setReportData([]);
                setSummary({});
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
            setError('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when the date changes
    useEffect(() => {
        if (date) fetchReportData();
    }, [date]);

    // Export to Excel
    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, "Daily Profit Report");
        XLSX.writeFile(wb, "Daily_Profit_Report.xlsx");
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Daily Profit Report", 10, 10);
        doc.autoTable({
            head: [['Product', 'Qty Sold', 'Sales Amount', 'Cost', 'Profit', 'Profit %']],
            body: reportData.map(row => [
                row.product_name,
                row.total_quantity_sold,
                row.total_sales_amount,
                row.total_cost,
                row.total_profit,
                row.profit_percentage,
            ]),
            startY: 20,
        });
        doc.save("Daily_Profit_Report.pdf");
    };

    return (
        <div className="flex flex-col min-h-screen p-4 bg-transparent">
            {/* Header */}
            <div className="p-2 text-center text-white bg-blue-600 rounded-t-lg">
                <h1 className="text-2xl font-bold">Daily Profit Report</h1>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                {/* Date Picker */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex flex-col">
                        <span className="mb-1 font-medium">Select Date:</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
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
                <>
                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                        <ReportTable
                            data={reportData}
                            columns={[
                                { header: "Product Name", field: "product_name" },
                                { header: "Qty Sold", field: "total_quantity_sold" },
                                { header: "Sales Amount", field: "total_sales_amount" },
                                { header: "Cost", field: "total_cost" },
                                { header: "Profit", field: "total_profit" },
                                { header: "Profit %", field: "profit_percentage" },
                            ]}
                        />
                    </div>

                    {/* Summary Section */}
                    <div className="p-4 mt-4 text-center bg-transparent rounded-lg shadow-lg">
                        <h2 className="mb-4 text-xl font-bold">Daily Summary</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="p-4 rounded-lg bg-cyan-800">
                                <p className="text-sm text-cyan-500">Total Sales</p>
                                <p className="text-2xl font-bold text-cyan-300">LKR {summary.totalSellingPriceAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-rose-800">
                                <p className="text-sm text-pink-500">Total Profit</p>
                                <p className="text-2xl font-bold text-pink-300">LKR {summary.totalProfitAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-lime-800">
                                <p className="text-sm text-lime-500">Total Cost</p>
                                <p className="text-2xl font-bold text-lime-300">LKR {summary.totalCostPriceAll || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-fuchsia-800">
                                <p className="text-sm text-fuchsia-500">Profit Margin</p>
                                <p className="text-2xl font-bold text-fuchsia-300">{summary.totalProfitPercentage || '0.00%'}</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                !loading && <p className="text-center text-gray-500">No data available for selected date</p>
            )}
        </div>
    );
};

export default DailyProfitReport;