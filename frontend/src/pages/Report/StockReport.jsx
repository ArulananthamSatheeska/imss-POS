import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"; // For Pie Chart
import { saveAs } from "file-saver"; // For exporting files
import html2canvas from "html2canvas"; // For printing
import jsPDF from "jspdf"; // For PDF export

const StockReport = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10); // Default threshold for low stock
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [reportPeriod, setReportPeriod] = useState("daily"); // daily, weekly, monthly, yearly

  // Format currency as LKR
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(value);
  };

  // Function to calculate dates based on the report period
  const calculateDates = (period) => {
    const today = new Date();
    const toDate = today.toISOString().split("T")[0]; // Current date in YYYY-MM-DD format

    let fromDate;

    switch (period) {
      case "daily":
        fromDate = toDate; // Same as today
        break;
      case "weekly":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of the week (Sunday)
        fromDate = startOfWeek.toISOString().split("T")[0];
        break;
      case "monthly":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
        fromDate = startOfMonth.toISOString().split("T")[0];
        break;
      case "yearly":
        const startOfYear = new Date(today.getFullYear(), 0, 1); // First day of the year
        fromDate = startOfYear.toISOString().split("T")[0];
        break;
      default:
        fromDate = toDate; // Default to today
    }

    return { fromDate, toDate };
  };

  // Update fromDate and toDate when reportPeriod changes
  useEffect(() => {
    const { fromDate, toDate } = calculateDates(reportPeriod);
    setFromDate(fromDate);
    setToDate(toDate);
  }, [reportPeriod]);

  // Fetch stock data from backend
  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/detailed-stock-reports", {
          params: { fromDate, toDate, searchQuery, categoryFilter, supplierFilter, locationFilter, reportPeriod },
        });
        console.log("Backend Response:", response.data); // Log the response
        setStockData(response.data);
      } catch (error) {
        console.error("Error fetching stock data:", error);
        setError("Failed to fetch stock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [fromDate, toDate, searchQuery, categoryFilter, supplierFilter, locationFilter, reportPeriod]);

  // Calculate derived fields for each item
  const calculateStockDetails = (data) => {
    return data.map((item) => {
      const closingStock =
        item.openingStock + item.purchased - item.sold + (item.adjustments || 0);
      const totalPurchaseValue = (item.openingStock + item.purchased) * item.costPrice;
      const totalSalesValue = item.sold * item.sellingPrice;
      const totalAvailableValue = closingStock * item.sellingPrice;

      // Ensure location is defined
      const location = item.location || { type: "Unknown", identifier: "N/A" };

      return {
        ...item,
        closingStock,
        totalPurchaseValue,
        totalSalesValue,
        totalAvailableValue,
        location, // Add the location object
      };
    });
  };

  const processedData = calculateStockDetails(stockData);

  // Filter data based on search, category, supplier, location, and low stock
  const filteredData = processedData.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesSupplier = supplierFilter ? item.supplier === supplierFilter : true;
    const matchesLocation = locationFilter
      ? item.location.type === locationFilter || item.location.identifier === locationFilter
      : true;

    return matchesSearch && matchesCategory && matchesSupplier && matchesLocation;
  });

  // Calculate totals for the report
  const totals = filteredData.reduce(
    (acc, item) => ({
      totalClosingStock: acc.totalClosingStock + item.closingStock,
      totalPurchaseValue: acc.totalPurchaseValue + item.totalPurchaseValue,
      totalSalesValue: acc.totalSalesValue + item.totalSalesValue,
      totalAvailableValue: acc.totalAvailableValue + item.totalAvailableValue,
      lowStockItems: item.closingStock < lowStockThreshold ? acc.lowStockItems + 1 : acc.lowStockItems,
      outOfStockItems: item.closingStock === 0 ? acc.outOfStockItems + 1 : acc.outOfStockItems,
    }),
    { totalClosingStock: 0, totalPurchaseValue: 0, totalSalesValue: 0, totalAvailableValue: 0, lowStockItems: 0, outOfStockItems: 0 }
  );

  // Get top 5 fast-moving products
  const topFastMovingProducts = [...filteredData]
    .sort((a, b) => b.sold - a.sold) // Sort by sold quantity in descending order
    .slice(0, 5); // Take the top 5 products

  // Get top 5 slow-moving products
  const topSlowMovingProducts = [...filteredData]
    .filter((item) => item.sold < 10) // Adjust threshold as needed
    .sort((a, b) => a.sold - b.sold) // Sort by sold quantity in ascending order
    .slice(0, 5); // Take the top 5 products

  // Colors for Pie Chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

  // Export to Excel function
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ...filteredData.map((item) => ({
        ...item,
        location: `${item.location.type} ${item.location.identifier}`, // Combine type and identifier for Excel
      })),
      {
        itemId: "Total",
        itemName: "",
        category: "",
        supplier: "",
        closingStock: totals.totalClosingStock,
        totalPurchaseValue: totals.totalPurchaseValue,
        totalSalesValue: totals.totalSalesValue,
        totalAvailableValue: totals.totalAvailableValue,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Report");

    // Add report details to the Excel file
    const reportDetails = [
      ["Authorized By:", "[Manager Name]"],
      ["Generated By:", "[User Name]"],
      ["Date & Time:", new Date().toLocaleString()],
      ["Report Period:", `${fromDate} to ${toDate}`],
      ["Report Generated On:", new Date().toLocaleString()],
      ["Company Contact:", "[Your Business Contact Info]"],
    ];
    const detailsSheet = XLSX.utils.aoa_to_sheet(reportDetails);
    XLSX.utils.book_append_sheet(workbook, detailsSheet, "Report Details");

    XLSX.writeFile(workbook, "Stock_Report.xlsx");
  };

  // Print Report
  const printReport = () => {
    const input = document.getElementById("stock-report");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297); // A4 size
      pdf.save("Stock_Report.pdf");
    });
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center font-sans" id="stock-report">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white w-full text-center py-4 rounded-lg shadow-lg mb-6">
        <h1 className="text-2xl font-bold">Stock Report</h1>
        <div className="justify-end gap-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <p className="text-sm mt-1">Generated By: [User Name]</p>
          <p className="text-sm mt-1">Date & Time: {new Date().toLocaleString()}</p>
          <p className="text-sm mt-1">Report Period: {fromDate} to {toDate}</p>
        </div>
      </div>

      {/* Filters and Actions Section */}
      <div className="w-full max-w-6xl mb-2">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-4">
          {/* Report Period Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Report Period</label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">All Categories</option>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Supplier</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">All Suppliers</option>
              <option value="ABC Ltd">ABC Ltd</option>
              <option value="XYZ Ltd">XYZ Ltd</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">All Locations</option>
              <option value="Cabinet">Cabinet</option>
              <option value="Row">Row</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="w-full max-w-6xl mb-6">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-800 p-4 rounded-lg">
            <p className="text-sm text-cyan-500">Total Products in Stock</p>
            <p className="text-2xl text-cyan-300 font-bold">{filteredData.length}</p>
          </div>
          <div className="bg-rose-800 p-4 rounded-lg">
            <p className="text-sm text-pink-500">Total Stock Quantity</p>
            <p className="text-2xl text-pink-300 font-bold">{totals.totalClosingStock}</p>
          </div>
          <div className="bg-lime-800 p-4 rounded-lg">
            <p className="text-sm text-lime-500">Total Stock Value (Cost Price)</p>
            <p className="text-2xl text-lime-300 font-bold">{formatCurrency(totals.totalPurchaseValue)}</p>
          </div>
          <div className="bg-purple-800 p-4 rounded-lg">
            <p className="text-sm text-purple-500">Total Stock Value (Selling Price)</p>
            <p className="text-2xl text-purple-300 font-bold">{formatCurrency(totals.totalAvailableValue)}</p>
          </div>
          <div className="bg-orange-800 p-4 rounded-lg">
            <p className="text-sm text-orange-500">Out-of-Stock Items</p>
            <p className="text-2xl text-orange-300 font-bold">{totals.outOfStockItems}</p>
          </div>
          <div className="bg-yellow-800 p-4 rounded-lg">
            <p className="text-sm text-yellow-500">Low Stock Items</p>
            <p className="text-2xl text-yellow-300 font-bold">{totals.lowStockItems}</p>
          </div>
        </div>
      </div>

      {/* Detailed Stock Table */}
      <div className="w-full max-w-6xl mb-6">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Detailed Stock Table</h2>
        <div className="overflow-x-auto rounded-lg shadow-lg" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="w-full border-collapse bg-white dark:bg-gray-800">
            <thead className="bg-blue-100 dark:bg-blue-800 sticky top-0">
              <tr>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">No.</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Product Name</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Category</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Unit</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Opening Stock</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Purchased</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Sold</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Adjusted</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Closing Stock</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Cost Price</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Selling Price</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Total Value (Cost)</th>
                <th className="border-b-2 border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-800 dark:text-blue-200">Total Value (Selling)</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200 ${item.closingStock < lowStockThreshold ? "bg-red-100 dark:bg-red-800 animate-blink" : ""
                    }`}
                >
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{index + 1}</td>                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.itemName}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.category}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.unit || "N/A"}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.openingStock}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.purchased}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.sold}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.adjustments}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{item.closingStock}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(item.costPrice)}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(item.sellingPrice)}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(item.totalPurchaseValue)}</td>
                  <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(item.totalAvailableValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pie Charts Section */}
      <div className="w-full max-w-6xl mb-6">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Stock Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fast Moving Items Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Fast Moving Items (Top 5)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topFastMovingProducts}
                  dataKey="sold"
                  nameKey="itemName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                  animationDuration={1000}
                >
                  {topFastMovingProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Slow Moving Items Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Slow Moving Items (Top 5)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topSlowMovingProducts}
                  dataKey="sold"
                  nameKey="itemName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#82ca9d"
                  label
                  animationDuration={1000}
                >
                  {topSlowMovingProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="w-full max-w-6xl mt-6">
        <div className="bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg shadow-lg text-center">
          {/* Report Details */}
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold dark:text-gray-300">Authorized By:</p>
            <p className="text-sm">[Manager Name]</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold dark:text-gray-300">Generated By:</p>
            <p className="text-sm">[User Name]</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold dark:text-gray-300">Date & Time:</p>
            <p className="text-sm">{new Date().toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold dark:text-gray-300">Report Period:</p>
            <p className="text-sm">{fromDate} to {toDate}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold dark:text-gray-300">Report Generated On:</p>
            <p className="text-sm">{new Date().toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold dark:text-gray-300">Company Contact:</p>
            <p className="text-sm">[Your Business Contact Info]</p>
          </div>

          {/* Export & Print Buttons */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center space-x-4 mt-4">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
            >
              Export to Excel
            </button>
            <button
              onClick={printReport}
              className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-md hover:bg-green-600 transition duration-300"
            >
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockReport;