import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const CompanyWiseProfit = () => {
  // Helper functions for default dates
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD format
  };
  const getOneMonthBeforeDate = () => {
    const today = new Date();
    const oneMonthBefore = new Date(today.setMonth(today.getMonth() - 1));
    return oneMonthBefore.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  // State management
  const [fromDate, setFromDate] = useState(getOneMonthBeforeDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("cash"); // Default to 'cash'
  const [searchQuery, setSearchQuery] = useState("");
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch report data from the backend
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://imssposerp.com/backend/public/api/sales/company-wise-profit-report",
        {
          params: { fromDate, toDate, paymentMethod: paymentMethodFilter },
        }
      );
      setReportData(response.data.reportData || []);
      setSummary(response.data.summary || {});
      setError("");
    } catch (error) {
      console.error("Error fetching company wise profit report:", error);
      setError("Failed to fetch report. Check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchReportData();
  }, [fromDate, toDate, paymentMethodFilter]);

  // Filtered data based on search query
  const filteredData = reportData.filter((row) => {
    return Object.values(row).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Flatten data for export
  const flattenDataForExport = () => {
    return filteredData.map((row) => ({
      "Company Name": row.companyName,
      "Total Cost Price": row.totalCostPrice,
      "Total Selling Price": row.totalSellingPrice,
      "Total Profit": row.totalProfit,
      "Profit %": row.profitPercentage,
    }));
  };

  // Export to Excel
  const exportToExcel = () => {
    const flatData = flattenDataForExport();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);
    XLSX.utils.book_append_sheet(wb, ws, "Company Wise Profit Report");
    XLSX.writeFile(wb, "Company_Wise_Profit_Report.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const flatData = flattenDataForExport();
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Company Wise Profit Report", 10, 10);

    // Define table columns and rows
    const columns = [
      "Company Name",
      "Total Cost Price",
      "Total Selling Price",
      "Total Profit",
      "Profit %",
    ];
    const rows = flatData.map((row) => [
      row["Company Name"],
      row["Total Cost Price"],
      row["Total Selling Price"],
      row["Total Profit"],
      row["Profit %"],
    ]);

    // Add table
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 20,
    });

    // Save the PDF
    doc.save("Company_Wise_Profit_Report.pdf");
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 text-black dark:text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white text-center p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold">Company Wise Profit Report</h1>
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
            placeholder="Search companies..."
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
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
            <option value="credit">Credit</option>
          </select>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mb-4">
        <button
          onClick={exportToExcel}
          className="bg-green-500 text-white dark:text-slate-600 px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading report data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-4 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Report Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-slate-800 text-black dark:text-white">
            <thead className="bg-white dark:bg-slate-800 text-black dark:text-white">
              <tr>
                <th className="px-4 py-2">Company Name</th>
                <th className="px-4 py-2">Total Cost Price</th>
                <th className="px-4 py-2">Total Selling Price</th>
                <th className="px-4 py-2">Total Profit</th>
                <th className="px-4 py-2">Profit %</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{row.companyName}</td>
                  <td className="px-4 py-2 text-right">{row.totalCostPrice}</td>
                  <td className="px-4 py-2 text-right">
                    {row.totalSellingPrice}
                  </td>
                  <td className="px-4 py-2 text-right">{row.totalProfit}</td>
                  <td className="px-4 py-2 text-right">
                    {row.profitPercentage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg p-4 mt-4">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-cyan-700 p-4 text-center rounded-lg">
              <p className="text-blue-300">Total Profit</p>
              <p className="text-2xl font-bold text-cyan-400">
                LKR {summary.totalProfitAll || 0}
              </p>
            </div>
            <div className="bg-emerald-700 p-4 text-center rounded-lg">
              <p className="text-green-300">Average Profit %</p>
              <p className="text-2xl font-bold text-green-400">
                {summary.averageProfitPercentageAll || "0.00%"}
              </p>
            </div>
            <div className="bg-fuchsia-700 p-4 text-center rounded-lg">
              <p className="text-fuchsia-300">Total Cost Price</p>
              <p className="text-2xl font-bold text-fuchsia-400">
                LKR {summary.totalCostPriceAll || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyWiseProfit;
