import React, { useState, useEffect } from "react";
import { FiSearch, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp, FiPrinter } from "react-icons/fi";
import { FaFilter, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getData, postData } from "../../services/api";
import PrintableInvoice from './PrintableInvoice';
import SalesInvoice from './SalesInvoice';
import Quotation from './quatation';  // Import Quotation component
import axios from 'axios';

const SalesReport = () => {
  // Date range setup
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
  const [showFilters, setShowFilters] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isQuotationFormOpen, setIsQuotationFormOpen] = useState(false);  // State for Quotation form
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleGenerateInvoiceApiCall = async (invoiceData) => {
    // The endpoint needs to match your Laravel route definition
    const correctedEndpoint = '/invoices'; // Corrected from '/sales'

    console.log(`Attempting to POST to: ${correctedEndpoint}`); // Debug log
    console.log("Data for API:", invoiceData); // Debug log

    // --- Choose ONE way to make the call ---
    // Option 1: Using Axios directly
    const API_BASE_URL = 'http://localhost:8000/api'; // Use env var ideally
    const url = `${API_BASE_URL}${correctedEndpoint}`;
    try {
         const response = await axios.post(url, invoiceData, {
             headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json',
                 // Add 'Authorization': `Bearer ${token}` if using auth
             }
         });
         console.log('API Success Response:', response.data);
         return response.data; // Return data on success
     } catch (error) {
         console.error(`API Error during POST ${url}:`, error.response || error);
         // Re-throw error so SalesInvoice component can catch it and display message
         throw error;
     }
  };

  useEffect(() => {
    fetchReportData();
  }, [fromDate, toDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await getData("/sales", {
        params: { from: fromDate, to: toDate },
      });
      setReportData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = (reportData || []).filter((row) =>
    Object.values(row).some(
      (value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
    setInvoiceData({
      customer: {
        name: row.customer_name,
        address: row.customer_address || "N/A",
        phone: row.customer_phone || "N/A",
      },
      items: row.items || [],
      footerDetails: {
        approvedBy: 'Manager',
        nextApprovalTo: 'Accounts',
        dateTime: new Date().toLocaleString(),
      },
      total: row.total,
      invoice: {
        no: row.bill_number,
        date: new Date(row.date || new Date()).toLocaleDateString(),
        time: new Date(row.date || new Date()).toLocaleTimeString(),
      },
    });
  };

  const closeInvoiceModal = () => {
    setInvoiceData(null);
  };

  const handleEditSale = (row) => {
    // Placeholder for edit sale functionality
    console.log("Edit sale", row);
  };

  const handleDeleteSale = (id) => {
    // Placeholder for delete sale functionality
    console.log("Delete sale", id);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleGenerateInvoice = async (newInvoice) => {
    try {
      await postData('/sales', newInvoice);
      setIsInvoiceFormOpen(false);
      fetchReportData();
    } catch (error) {
      console.error("Failed to create invoice:", error);
      alert("Failed to create invoice. Please try again.");
    }
  };

  const handleCancelInvoice = () => {
    setIsInvoiceFormOpen(false);
    setShowInvoiceModal(false);
  };

  const handleGenerateQuotation = () => {
    // Placeholder for handling quotation save
    setIsQuotationFormOpen(false);
    fetchReportData();
  };

  const handleCancelQuotation = () => {
    setIsQuotationFormOpen(false);
  };

  if (isInvoiceFormOpen) {
    return (
      <SalesInvoice
        onGenerateInvoice={handleGenerateInvoice}
        onCancel={handleCancelInvoice}
      />
    );
  }

  if (isQuotationFormOpen) {
    return (
      <Quotation
        onGenerateQuotation={handleGenerateQuotation}
        onCancel={handleCancelQuotation}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 bg-transparent">
      {/* Header */}
      <div className="py-3 mb-6 text-center text-white rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800">
        <h1 className="text-2xl font-bold">SALES REPORT</h1>
        <p className="text-sm opacity-90">Track and analyze your sales performance</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search invoices, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full py-2 pl-10 pr-3 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Sales Entry
          </button>
          <button
            onClick={() => setIsQuotationFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create New Quotation
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

      {showInvoiceModal && (
            <SalesInvoice
                // Pass other props like selectedCustomer, cartItems if needed
                onGenerateInvoice={handleGenerateInvoiceApiCall} // Pass the corrected API call function
                onCancel={handleCancelInvoice}
            />
        )}

      {/* Filters Section */}
      {showFilters && (
        <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300">
          <h3 className="flex items-center gap-2 mb-3 font-medium">
            <FaFilter /> Report Filters
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-1 text-sm font-medium">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-4">
        {/* Total Invoices */}
        <div className="p-4 bg-white border-l-4 border-red-600 shadow-md rounded-2xl dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-900">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Total Invoices</h3>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-red-400">{filteredData.length}</p>
        </div>

        {/* Total Sales */}
        <div className="p-4 bg-white border-l-4 border-green-500 shadow-md rounded-2xl dark:bg-slate-800">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Total Sales</h3>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-green-400">
            {formatCurrency(filteredData.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0))}
          </p>
        </div>

        {/* Average Sale */}
        <div className="p-4 bg-white border-l-4 border-yellow-500 shadow-md rounded-2xl dark:bg-slate-800">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Average Sale</h3>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-yellow-400">
            {filteredData.length > 0
              ? formatCurrency(
                filteredData.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0) / filteredData.length
              )
              : formatCurrency(0)}
          </p>
        </div>

        {/* Date Range */}
        <div className="p-4 bg-white border-l-4 border-purple-500 shadow-md rounded-2xl dark:bg-slate-800">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">Date Range</h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-purple-300">
            {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-md dark:bg-slate-800 rounded-2xl dark:border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
              <thead className="text-xs tracking-wider text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 font-semibold text-left">Invoice # / Bill #</th>
                  <th className="px-6 py-3 font-semibold text-left">Customer</th>
                  <th className="px-6 py-3 font-semibold text-left">Date</th>
                  <th className="px-6 py-3 font-semibold text-left">Amount</th>
                  <th className="px-6 py-3 font-semibold text-left">Payment</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No sales data found for the selected period
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <React.Fragment key={index}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${expandedRow === index ? 'bg-blue-50 dark:bg-slate-700' : ''}`}
                        onClick={() => toggleRow(index)}
                      >
                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          #{row.bill_number} / {row.sales_invoice_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{row.customer_name || 'Walk-in Customer'}</div>
                          <div className="text-gray-500 dark:text-gray-400">{row.customer_phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {new Date(row.created_at || new Date()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white whitespace-nowrap">
                          {formatCurrency(row.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full
                      ${row.payment_type === 'Cash' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              row.payment_type === 'Card' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                            {row.payment_type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(row);
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <FiPrinter size={16} /> Reprint
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSale(row);
                              }}
                              className="flex items-center gap-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSale(row.id);
                              }}
                              className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(index);
                              }}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                              {expandedRow === index ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === index && (
                        <tr className="bg-gray-50 dark:bg-slate-700">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                              {/* Transaction Details */}
                              <div>
                                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Details</h4>
                                <div className="grid grid-cols-2 text-sm gap-y-1">
                                  <div className="text-gray-500 dark:text-gray-400">Subtotal:</div>
                                  <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(row.subtotal || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Discount:</div>
                                  <div className="font-medium text-red-600">-{formatCurrency(row.discount || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Tax:</div>
                                  <div className="font-medium text-gray-900 dark:text-white">+{formatCurrency(row.tax || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Received:</div>
                                  <div className="font-medium text-green-600">{formatCurrency(row.received_amount || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Balance:</div>
                                  <div className="font-medium text-blue-600">{formatCurrency(row.balance_amount || 0)}</div>
                                </div>
                              </div>

                              {/* Items Purchased */}
                              <div>
                                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Items Purchased</h4>
                                <div className="overflow-hidden border border-gray-200 rounded-md dark:border-slate-600">
                                  <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
                                    <thead className="text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-gray-300">
                                      <tr>
                                        <th className="px-3 py-2 font-semibold text-left">Item</th>
                                        <th className="px-3 py-2 font-semibold text-left">Qty</th>
                                        <th className="px-3 py-2 font-semibold text-left">Price</th>
                                        <th className="px-3 py-2 font-semibold text-left">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
                                      {row.items?.map((item, i) => (
                                        <tr key={i}>
                                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{formatCurrency(item.unit_price || 0)}</td>
                                          <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency((item.unit_price || 0) * (item.quantity || 0))}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
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
        )}
      </div>

      {/* Invoice Modal */}
      {invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button
                onClick={closeInvoiceModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <PrintableInvoice invoiceData={invoiceData} />
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
