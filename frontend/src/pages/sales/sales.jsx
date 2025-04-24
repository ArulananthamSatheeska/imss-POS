import React, { useState, useEffect } from "react";
import { FiSearch, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp, FiPrinter } from "react-icons/fi";
import { FaFilter, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getData, postData } from "../../services/api";
import PrintableInvoice from './PrintableInvoice';
import SalesInvoice from './SalesInvoice';
import Quotation from './quatation';  // Import Quotation component

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
    <div className="p-4 min-h-screen flex flex-col  bg-transparent">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800 text-white text-center py-3 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold">SALES REPORT</h1>
        <p className="text-sm opacity-90">Track and analyze your sales performance</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search invoices, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsInvoiceFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Sales Entry
          </button>
          <button
            onClick={() => setIsQuotationFormOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create Quotation
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300  border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white  dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FaFilter /> Report Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Invoices */}
        <div className="p-4 rounded-2xl shadow-md border-l-4 border-red-600 bg-white dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-900">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Invoices</h3>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-red-400">{filteredData.length}</p>
        </div>

        {/* Total Sales */}
        <div className="p-4 rounded-2xl shadow-md border-l-4 border-green-500 bg-white dark:bg-slate-800">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Sales</h3>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-green-400">
            {formatCurrency(filteredData.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0))}
          </p>
        </div>

        {/* Average Sale */}
        <div className="p-4 rounded-2xl shadow-md border-l-4 border-yellow-500 bg-white dark:bg-slate-800">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Average Sale</h3>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-yellow-400">
            {filteredData.length > 0
              ? formatCurrency(
                filteredData.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0) / filteredData.length
              )
              : formatCurrency(0)}
          </p>
        </div>

        {/* Date Range */}
        <div className="p-4 rounded-2xl shadow-md border-l-4 border-purple-500 bg-white dark:bg-slate-800">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Date Range</h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-purple-300">
            {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
              <thead className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Invoice # / Bill #</th>
                  <th className="px-6 py-3 text-left font-semibold">Customer</th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold">Payment</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
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
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(row);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              <FiPrinter size={16} /> Reprint
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSale(row);
                              }}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSale(row.id);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Transaction Details */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Transaction Details</h4>
                                <div className="grid grid-cols-2 gap-y-1 text-sm">
                                  <div className="text-gray-500 dark:text-gray-400">Subtotal:</div>
                                  <div className="text-gray-900 dark:text-white font-medium">{formatCurrency(row.subtotal || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Discount:</div>
                                  <div className="text-red-600 font-medium">-{formatCurrency(row.discount || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Tax:</div>
                                  <div className="text-gray-900 dark:text-white font-medium">+{formatCurrency(row.tax || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Received:</div>
                                  <div className="text-green-600 font-medium">{formatCurrency(row.received_amount || 0)}</div>

                                  <div className="text-gray-500 dark:text-gray-400">Balance:</div>
                                  <div className="text-blue-600 font-medium">{formatCurrency(row.balance_amount || 0)}</div>
                                </div>
                              </div>

                              {/* Items Purchased */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Items Purchased</h4>
                                <div className="border border-gray-200 dark:border-slate-600 rounded-md overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
                                    <thead className="bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-semibold">Item</th>
                                        <th className="px-3 py-2 text-left font-semibold">Qty</th>
                                        <th className="px-3 py-2 text-left font-semibold">Price</th>
                                        <th className="px-3 py-2 text-left font-semibold">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-4">
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
