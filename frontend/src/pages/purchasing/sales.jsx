import React, { useState, useEffect } from "react";
import PrintableInvoice from './PrintableInvoice';

import { getData, postData } from "../../services/api";
import * as XLSX from "xlsx";

const SalesReport = () => {
  // Default date range: Last month to today
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const lastMonth = oneMonthAgo.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(lastMonth);
  const [toDate, setToDate] = useState(today);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [fromDate, toDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await getData("/sales", {
        params: { from: fromDate, to: toDate },
      });
      console.log("Sales Report Data:", response.data); // Debugging
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter report data based on search
  const filteredData = reportData.filter((row) =>
    Object.values(row).some(
      (value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Export data to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");
    XLSX.writeFile(workbook, `Sales_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleViewInvoice = (row) => {
    // Logic to open the PrintableInvoice component with the row data
    const invoiceData = {
      customer: {
        name: row.customer_name,
        address: row.customer_address, // Assuming this field exists
        phone: row.customer_phone, // Assuming this field exists
      },
      items: row.items, // Assuming this field exists
      footerDetails: {
        approvedBy: 'Your Name', // Replace with actual data
        nextApprovalTo: 'Next Approver', // Replace with actual data
        dateTime: new Date().toLocaleString(),
      },
      total: row.total,
      invoice: {
        no: row.bill_number,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
    };
    // Open the PrintableInvoice component with the invoiceData
  };

  return (
    <div className="p-4 bg-transparent min-h-screen flex flex-col">
      <div className="bg-blue-600 text-white text-center py-2 rounded mb-4">
        <h1 className="text-lg font-bold">SALES REPORT</h1>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="font-medium">
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="ml-2 border border-gray-300 rounded p-1"
          />
        </label>
        <label className="font-medium">
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="ml-2 border border-gray-300 rounded p-1"
          />
        </label>
        <button onClick={fetchReportData} className="bg-green-500 text-white px-4 py-2 rounded">
          OK
        </button>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded p-1"
        />
        <button onClick={exportToExcel} className="bg-yellow-500 text-white px-4 py-2 rounded">
          Export to Excel
        </button>
      </div>

      {/* Report Table */}
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : (
        <table className="w-full border border-gray-300 bg-white dark:bg-slate-700">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border px-4 py-2">Bill Number</th>
              <th className="border px-4 py-2">Customer Name</th>
              <th className="border px-4 py-2">Total</th>
              <th className="border px-4 py-2">Payment Type</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">No data available</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <React.Fragment key={index}>
                  <tr className="border text-center">
                    <td className="border px-4 py-2">{row.bill_number}</td>
                    <td className="border px-4 py-2">{row.customer_name}</td>
                    <td className="border px-4 py-2">
                      Rs. {Number(row.total || 0).toFixed(2)}
                    </td>
                    <td className="border px-4 py-2">{row.payment_type}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleViewInvoice(row)}
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr className="bg-gray-100">
                      <td colSpan={5} className="p-4">
                        <h3 className="font-bold text-gray-700 mb-2">Details for Bill: {row.bill_number}</h3>
                        <p><strong>Subtotal:</strong> Rs. {Number(row.subtotal || 0).toFixed(2)}</p>
                        <p><strong>Discount:</strong> Rs. {Number(row.discount || 0).toFixed(2)}</p>
                        <p><strong>Tax:</strong> Rs. {Number(row.tax || 0).toFixed(2)}</p>
                        <p><strong>Received Amount:</strong> Rs. {Number(row.received_amount || 0).toFixed(2)}</p>
                        <p><strong>Balance Amount:</strong> Rs. {Number(row.balance_amount || 0).toFixed(2)}</p>
                        <h4 className="font-bold mt-2">Items:</h4>
                        <ul className="list-disc list-inside">
                          {row.items.map((item, i) => (
                            <li key={i}>
                              {item.name} - Rs. {Number(item.price || 0).toFixed(2)} x {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalesReport;
