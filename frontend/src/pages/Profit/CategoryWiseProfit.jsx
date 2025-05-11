import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import ReportTable from "../../components/reports/ReportTable";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export const CategoryWiseProfit = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [itemDetails, setItemDetails] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch categories from the backend
  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/categories");
      const categoryOptions = response.data.map((category) => ({
        value: category.name,
        label: category.name,
      }));
      setCategories(categoryOptions);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories. Please try again.");
    }
  };

  // Fetch report data and items based on selected category and date range
  const fetchReportData = async () => {
    if (!selectedCategory) {
      setReportData([]);
      setItemDetails([]);
      setSummary({});
      setError("Please select a category.");
      return;
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be later than To date.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        "http://127.0.0.1:8000/api/sales/category-wise-profit-report",
        {
          params: {
            categoryName: selectedCategory.value,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          },
        }
      );

      if (response.data?.reportData) {
        const processedData = response.data.reportData.map((item) => ({
          ...item,
          profit_percentage: item.profitPercentage,
          totalQuantity: item.totalQuantity,
        }));

        const items = response.data.reportData.flatMap(
          (item) => item.items || []
        );

        setReportData(processedData);
        setItemDetails(items);
        setSummary({
          ...response.data.summary,
          totalProfitPercentage:
            response.data.summary.averageProfitPercentageAll,
          totalQuantityAll: response.data.summary.totalQuantityAll,
        });

        if (processedData.length === 0) {
          setError(
            `No data found for category "${selectedCategory.label}"${fromDate && toDate ? ` between ${fromDate} and ${toDate}` : ""}.`
          );
        }
      } else {
        setReportData([]);
        setItemDetails([]);
        setSummary({});
        setError(
          `No data found for category "${selectedCategory.label}"${fromDate && toDate ? ` between ${fromDate} and ${toDate}` : ""}.`
        );
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to load report data. Please try again.";
      setError(errorMessage);
      setReportData([]);
      setItemDetails([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch report data when the selected category or date range changes
  useEffect(() => {
    if (selectedCategory) {
      fetchReportData();
    }
  }, [selectedCategory, fromDate, toDate]);

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = reportData.map((row) => ({
      Category: row.categoryName,
      "Total Quantity": row.totalQuantity,
      "Total Cost": row.totalCostPrice,
      "Total Sales": row.totalSellingPrice,
      "Total Profit": row.totalProfit,
      "Profit %": row.profit_percentage,
    }));
    const summaryWs = XLSX.utils.json_to_sheet([
      {
        Report: `Category Wise Profit Report${fromDate && toDate ? ` (${fromDate} to ${toDate})` : ""}`,
      },
      {},
      ...summaryData,
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Category Summary");
    const itemsWs = XLSX.utils.json_to_sheet(itemDetails);
    XLSX.utils.book_append_sheet(wb, itemsWs, "Item Details");
    XLSX.writeFile(
      wb,
      `Category_Wise_Profit_Report${fromDate && toDate ? `_${fromDate}_to_${toDate}` : ""}.xlsx`
    );
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(
      `Category Wise Profit Report${fromDate && toDate ? ` (${fromDate} to ${toDate})` : ""}`,
      10,
      10
    );
    doc.autoTable({
      head: [
        [
          "Category",
          "Total Quantity",
          "Total Cost",
          "Total Sales",
          "Total Profit",
          "Profit %",
        ],
      ],
      body: reportData.map((row) => [
        row.categoryName,
        row.totalQuantity,
        row.totalCostPrice,
        row.totalSellingPrice,
        row.totalProfit,
        row.profit_percentage,
      ]),
      startY: 20,
    });
    doc.text("Item Details", 10, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
      head: [
        [
          "Product Name",
          "Quantity",
          "Unit Price",
          "Total Cost",
          "Total Sales",
          "Profit",
        ],
      ],
      body: itemDetails.map((item) => [
        item.product_name,
        item.quantity,
        item.unit_price,
        item.total_cost,
        item.total_sales,
        item.profit,
      ]),
      startY: doc.lastAutoTable.finalY + 20,
    });
    doc.save(
      `Category_Wise_Profit_Report${fromDate && toDate ? `_${fromDate}_to_${toDate}` : ""}.pdf`
    );
  };

  return (
    <div className="flex flex-col min-h-screen p-4 bg-transparent">
      {/* Header */}
      <div className="p-2 text-center text-white bg-blue-600 rounded-t-lg">
        <h1 className="text-2xl font-bold">Category Wise Profit Report</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Category Dropdown with react-select */}
        <div className="flex-1 min-w-[200px]">
          <label className="flex flex-col">
            <span className="mb-1 font-medium">Select Category:</span>
            <Select
              options={categories}
              value={selectedCategory}
              onChange={(option) => setSelectedCategory(option)}
              placeholder="Type to search categories..."
              isClearable
              className="text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#d1d5db",
                  borderRadius: "0.375rem",
                  padding: "0.25rem",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: "#3b82f6",
                  },
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  borderRadius: "0.375rem",
                  marginTop: "0.25rem",
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected
                    ? "#3b82f6"
                    : isFocused
                      ? "#e5e7eb"
                      : "white",
                  color: isSelected ? "white" : "#1f2937",
                  padding: "0.5rem 1rem",
                }),
              }}
            />
          </label>
        </div>

        {/* Date Range Inputs */}
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
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    Category Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Total Quantity
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Total Sales
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Total Profit
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Profit %
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                {reportData.map((row, index) => (
                  <React.Fragment key={row.categoryName}>
                    <tr
                      className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                        expandedRow === index
                          ? "bg-blue-50 dark:bg-slate-700"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        <button
                          onClick={() => toggleRow(index)}
                          className="hover:underline focus:outline-none"
                        >
                          {row.categoryName}
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
                          title={
                            expandedRow === index
                              ? "Collapse Details"
                              : "Expand Details"
                          }
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
                                    {
                                      header: "Product Name",
                                      field: "product_name",
                                    },
                                    { header: "Quantity", field: "quantity" },
                                    {
                                      header: "Unit Price",
                                      field: "unit_price",
                                    },
                                    {
                                      header: "Total Cost",
                                      field: "total_cost",
                                    },
                                    {
                                      header: "Total Sales",
                                      field: "total_sales",
                                    },
                                    { header: "Profit", field: "profit" },
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
                <p className="text-2xl font-bold text-cyan-300">
                  {summary.totalQuantityAll || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-lime-800">
                <p className="text-sm text-lime-500">Total Cost</p>
                <p className="text-2xl font-bold text-lime-300">
                  LKR {summary.totalCostPriceAll || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-800">
                <p className="text-sm text-cyan-500">Total Sales</p>
                <p className="text-2xl font-bold text-cyan-300">
                  LKR {summary.totalSellingPriceAll || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-rose-800">
                <p className="text-sm text-pink-500">Total Profit</p>
                <p className="text-2xl font-bold text-pink-300">
                  LKR {summary.totalProfitAll || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-fuchsia-800">
                <p className="text-sm text-fuchsia-500">Profit Margin</p>
                <p className="text-2xl font-bold text-fuchsia-300">
                  {summary.totalProfitPercentage || "0.00%"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !loading &&
        error && <p className="text-center text-gray-500">{error}</p>
      )}
    </div>
  );
};

export default CategoryWiseProfit;
