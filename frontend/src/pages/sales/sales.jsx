import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import { FiSearch, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp, FiPrinter, FiEdit, FiTrash2 } from "react-icons/fi"; // Added Edit/Trash
import { FaFilter, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getData, postData, putData, deleteData } from "../../services/api"; // Assuming putData and deleteData exist
import SalesInvoice from './SalesInvoice';
import Quotation from './quatation';
import axios from 'axios'; // Keep for direct use if needed
import PrintableInvoice from "./PrintableInvoice";

// Base URL for API calls (centralize it)
const API_BASE_URL = 'http://localhost:8000/api';

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
  const [invoiceDataForPreview, setInvoiceDataForPreview] = useState(null);
  const [isQuotationFormOpen, setIsQuotationFormOpen] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false); // For CREATE modal
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false); // For EDIT modal
  const [invoiceToEdit, setInvoiceToEdit] = useState(null); // Data for the invoice being edited

  // Use useCallback to memoize fetchReportData
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    // Don't clear data immediately, looks better if refresh updates existing table
    // setReportData([]);
    try {
      const response = await axios.get(`${API_BASE_URL}/invoices`, { // Use axios directly for consistency or use getData
        params: { from: fromDate, to: toDate },
         headers: { 'Accept': 'application/json' }
      });

      console.log("Fetched Report Data Response:", response); // Log the whole response

      let invoices = [];
      // Adjust based on Laravel Pagination structure (response.data.data)
      if (response.data && Array.isArray(response.data.data)) {
          invoices = response.data.data;
          // You might want pagination info: response.data.current_page, response.data.total, etc.
      } else if (Array.isArray(response.data)) { // Handle non-paginated array
          invoices = response.data;
      } else {
          console.warn("Received data is not in expected paginated or array format:", response.data);
          throw new Error("Invalid data format from API");
      }

      // Ensure items array exists
      const processedData = invoices.map(invoice => ({
          ...invoice,
          customer_name: invoice.customer_name || "Unknown Customer",
          items: Array.isArray(invoice.items) ? invoice.items : []
      }));

      setReportData(processedData);

    } catch (error) {
      console.error("Error fetching sales report data:", error.response || error);
      setReportData([]); // Set empty on error
       alert(`Error fetching data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]); // Dependencies for useCallback

  // Fetch data on mount and when dates change
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]); // Now depends on the memoized function

  // --- API Call Handlers ---

  // CREATE Invoice
  const handleGenerateInvoiceApiCall = async (newInvoiceData) => {
    const url = `${API_BASE_URL}/invoices`;
    console.log(`POST to: ${url}`, JSON.stringify(newInvoiceData, null, 2));
    try {
        // Use postData service or axios directly
        const response = await axios.post(url, newInvoiceData, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
        console.log('API Success (Invoice Creation):', response.data);
        fetchReportData(); // Refresh list
        setShowInvoiceModal(false); // Close create modal
        alert('Invoice created successfully!');
        return response.data;
    } catch (error) {
        console.error(`API Error during POST ${url}:`, error.response || error);
        // Extract validation errors
      const errorMessage = error.response?.data?.message || 'Failed to create invoice.';
      const errorDetails = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n')
        : error.message;
      alert(`Error: ${errorMessage}\nDetails: ${errorDetails}`);
      throw error; // Re-throw for SalesInvoice to handle
    }
  };

  // UPDATE Invoice
  const handleUpdateInvoiceApiCall = async (updatedInvoiceData, invoiceId) => {
    if (!invoiceId) {
        console.error("Invoice ID missing for update");
        alert("Cannot update invoice: ID is missing.");
        return; // Or throw error
    }
    const url = `${API_BASE_URL}/invoices/${invoiceId}`;
    console.log(`PUT to: ${url}`, JSON.stringify(updatedInvoiceData, null, 2)); // Pretty-print JSON
    try {
        // Use putData service or axios directly
        const response = await axios.put(url, updatedInvoiceData, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
        console.log('API Success (Invoice Update):', response.data);
        fetchReportData(); // Refresh list
        setShowEditInvoiceModal(false); // Close edit modal
        setInvoiceToEdit(null); // Clear editing state
        alert('Invoice updated successfully!');
        return response.data;
    } catch (error) {
      console.error(`API Error during PUT ${url}:`, error.response || error);
      const errorMessage = error.response?.data?.message || 'Failed to update invoice.';
      const errorDetails = error.response?.data?.error || error.message;
      alert(`Error: ${errorMessage}\nDetails: ${errorDetails}`);
      throw error;
    }
  };

  // DELETE Invoice
  const handleDeleteSale = async (id) => {
    console.log("Attempting to delete invoice ID:", id);
    if (window.confirm(`Are you sure you want to delete Invoice ID: ${id}? This action cannot be undone.`)) {
        setLoading(true); // Indicate loading during delete
        const url = `${API_BASE_URL}/invoices/${id}`;
        try {
            // Use deleteData service or axios directly
            await axios.delete(url, {
                 headers: { 'Accept': 'application/json' }
             });
            alert(`Invoice ID: ${id} deleted successfully.`);
            fetchReportData(); // Refresh the list after deletion
        } catch (error) {
            console.error(`Error deleting invoice ${id}:`, error.response || error);
            alert(`Failed to delete invoice ${id}. ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    }
  };


  // Filtering logic
  const filteredData = (reportData || []).filter((row) => {
     // Basic search across major fields - adjust as needed
    const searchableFields = [
        row.invoice_no,
        row.customer_name,
        row.customer_phone,
        row.total_amount?.toString(),
        row.payment_method,
        new Date(row.invoice_date || row.created_at).toLocaleDateString()
    ];
    // Include item descriptions in search?
    // if (Array.isArray(row.items)) {
    //     row.items.forEach(item => searchableFields.push(item.description));
    // }

    return searchableFields.some(
      (value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Export logic (ensure field names match backend response)
  const exportToExcel = () => {
    const dataToExport = filteredData.map(row => ({
        'Invoice #': row.invoice_no,
        'Bill #': row.bill_number || 'N/A', // Make sure 'bill_number' exists or remove
        'Customer': row.customer_name,
        'Phone': row.customer_phone,
        'Date': new Date(row.invoice_date || row.created_at).toLocaleDateString(),
        'Subtotal': row.subtotal,
        'Tax': row.tax_amount,
        'Total': row.total_amount,
        'Paid': row.purchase_amount,
        'Balance': row.balance,
        'Payment Method': row.payment_method,
        'Status': row.status, // Add status if available
        // Item details might make Excel file very large/complex; consider separate export or summary
    }));
    // ... (rest of XLSX export logic) ...
     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");
     XLSX.writeFile(workbook, `Sales_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Prepare data for PrintableInvoice preview modal
  const handleViewInvoice = (row) => {
    console.log("Row data for invoice preview:", row); // Debug the row object
  
    // Validate critical fields
    if (!row.customer_name) {
      console.warn("Missing customer_name in row:", row);
      alert("Cannot display invoice: Customer name is missing.");
      return;
    }
  
    setInvoiceDataForPreview({    
      customer: {
        name: row.customer_name || "N/A",
        address: row.customer_address || "N/A",
        phone: row.customer_phone || "N/A",
        email: row.customer_email || "N/A",
      },
      items: (Array.isArray(row.items) ? row.items : []).map(item => ({
        id: item.id || null,
        description: item.description || "N/A",
        quantity: item.quantity || item.qty || 0, // Support both naming conventions
        unit_price: item.unit_price || item.unitPrice || 0,
        discountAmount: item.discount_amount || 0,
        discountPercentage: item.discount_percentage || 0,
        total: item.total || 0,
        freeQty: item.free_qty || 0, // Add freeQty if needed by PrintableInvoice
      })),
      footerDetails: {
        approvedBy: row.approved_by || "System",
        nextApprovalTo: row.next_approval_to || "",
        dateTime: new Date(row.updated_at || row.created_at || Date.now()).toLocaleString(),
      },
      subtotal: Number(row.subtotal) || 0,
      tax: Number(row.tax_amount) || 0,
      total: Number(row.total_amount) || 0,
      amountPaid: Number(row.purchase_amount) || 0,
      balance: Number(row.balance) || 0,
      invoice: {
        no: row.invoice_no || "N/A",
        date: row.invoice_date
          ? new Date(row.invoice_date).toLocaleDateString()
          : new Date(row.created_at || Date.now()).toLocaleDateString(),
        time: row.invoice_time ||
          new Date(row.invoice_date || row.created_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
      paymentMethod: row.payment_method || "N/A",
      status: row.status || "N/A",
    });
  };

  // Close PrintableInvoice preview modal
  const closeInvoiceModal = () => {
    setInvoiceDataForPreview(null);
  };

  // --- Edit ---
  // Prepare data and open the Edit modal
  const handleEditSale = (row) => {
     // **Crucially:** Map the row data to the *exact* structure SalesInvoice expects as initialData
     const mappedDataForEdit = {
        invoice: {
          no: row.invoice_no,
          date: row.invoice_date?.split(" ")[0] || new Date().toISOString().split("T")[0],
          time: row.invoice_time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        },
        customer: {
            name: row.customer_name,
            address: row.customer_address || '',
            phone: row.customer_phone || '',
            email: row.customer_email || '',
        },
        items: (row.items || []).map(item => ({
            // Map backend fields to frontend field names used in SalesInvoice's state
            id: item.id, // Keep track of original item ID if needed for complex updates (not used in delete-recreate)
            productId: item.product_id || null,
            description: item.description,
            qty: item.quantity, // Map backend 'quantity' to 'qty' if needed
            unitPrice: item.unit_price, // Map backend 'unit_price' to 'unitPrice' if needed
            discountAmount: item.discount_amount || 0,
            discountPercentage: item.discount_percentage || 0,
            total: item.total || 0,
            // 'total' is usually calculated in SalesInvoice, no need to pass unless needed for display
        })),
        purchaseDetails: {
            method: row.payment_method || 'cash',
            amount: row.purchase_amount || 0,
        },
        status: row.status || 'pending',
        // Pass the main invoice ID
        id: row.id
     };
    setInvoiceToEdit(mappedDataForEdit);
    setShowEditInvoiceModal(true);
    // --- End Use existing row data ---
  };

  // --- Cancel Edit ---
  const handleCancelEditInvoice = () => {
    setShowEditInvoiceModal(false);
    setInvoiceToEdit(null);
  };


  // Currency formatter
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      return 'LKR 0.00';
    }
    return new Intl.NumberFormat('en-LK', { // Use 'en-LK' for Sri Lanka locale/currency symbol
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  };

  // --- Modal Cancel Handlers ---
  const handleCancelCreateInvoice = () => {
    setShowInvoiceModal(false);
  };

  const handleGenerateQuotation = () => {
    setIsQuotationFormOpen(false);
    // Refresh quotation list if needed
  };

  const handleCancelQuotation = () => {
    setIsQuotationFormOpen(false);
  };


  // --- Main Component Return ---
  return (
    <div className="flex flex-col min-h-screen p-4 bg-transparent">
        {/* Header */}
        {/* ... Header code ... */}
         <div className="py-3 mb-6 text-center text-white rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800">
            <h1 className="text-2xl font-bold">SALES REPORT</h1>
            <p className="text-sm opacity-90">Track and analyze your sales performance</p>
         </div>


      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
         {/* Search Input */}
         <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiSearch className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search invoices, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full py-2 pl-10 pr-3 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

         {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2"> {/* Align to end, wrap */}
            <button
                onClick={() => setShowInvoiceModal(true)} // Open CREATE modal
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                Create Sales Entry
            </button>
            <button
                onClick={() => setIsQuotationFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                Create Quotation
            </button>
             <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
             >
                <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
             </button>
              <button
                onClick={fetchReportData}
                disabled={loading}
                title="Refresh Data"
                className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={exportToExcel}
                disabled={filteredData.length === 0 || loading}
                title="Export to Excel"
                className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${filteredData.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FaFileExcel /> Export
              </button>
            </div>
      </div>


      {/* --- Modals --- */}

      {/* Sales Invoice Creation Modal */}
      {showInvoiceModal && (
            <SalesInvoice
                // No initial data for creation
                onGenerateInvoice={handleGenerateInvoiceApiCall} // CREATE handler
                onCancel={handleCancelCreateInvoice}
                isEditMode={false} // Explicitly set create mode
            />
        )}

       {/* Sales Invoice EDIT Modal */}
       {showEditInvoiceModal && invoiceToEdit && (
            <SalesInvoice
                initialData={invoiceToEdit} // Pass the data of the invoice being edited
                onUpdateInvoice={handleUpdateInvoiceApiCall} // UPDATE handler
                onCancel={handleCancelEditInvoice} // Cancel handler for edit modal
                isEditMode={true} // Explicitly set edit mode
            />
        )}

       {/* Quotation Creation Modal */}
       {isQuotationFormOpen && (
            <Quotation
                onGenerateQuotation={handleGenerateQuotation}
                onCancel={handleCancelQuotation}
            />
        )}

      {/* Filters Section */}
      {/* ... Filters code ... */}
       {showFilters && (
        <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 animate-fade-in">
          <h3 className="flex items-center gap-2 mb-3 text-base font-medium">
            <FaFilter /> Report Filters
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="fromDate" className="block mb-1 text-sm font-medium">From Date</label>
              <input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="toDate" className="block mb-1 text-sm font-medium">To Date</label>
              <input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                 max={today}
                className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReportData} // Re-fetch data with new dates
                disabled={loading}
                className={`w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Applying...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {/* ... Summary cards code ... */}
       <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
         <div className="p-4 bg-white border-l-4 border-blue-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-blue-400">
            <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</p>
         </div>
        <div className="p-4 bg-white border-l-4 border-green-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-green-400">
            <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(filteredData.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0))}
            </p>
        </div>
        <div className="p-4 bg-white border-l-4 border-yellow-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-yellow-400">
            <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Average Sale</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredData.length > 0
                ? formatCurrency(
                    filteredData.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0) / filteredData.length
                )
                : formatCurrency(0)}
            </p>
        </div>
        <div className="p-4 bg-white border-l-4 border-purple-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-purple-400">
            <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Date Range</h3>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
            </p>
        </div>
      </div>


      {/* Report Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-slate-700">
        {loading && reportData.length === 0 ? ( // Show loader only if loading initial data or full refresh
          <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-400">Loading Sales Data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
              <thead className="text-xs tracking-wider text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Inv #</th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">Payment</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                {filteredData.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      No sales data found for the selected period or filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <React.Fragment key={row.id}> {/* Use unique ID from backend */}
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${expandedRow === index ? 'bg-blue-50 dark:bg-slate-700' : ''}`}
                      >
                        {/* Invoice # */}
                        <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                           {/* Make clickable to toggle row */}
                          <button onClick={() => toggleRow(index)} className="hover:underline focus:outline-none">
                             #{row.invoice_no}
                          </button>
                        </td>
                        {/* Customer */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{row.customer_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{row.customer_phone || ''}</div>
                        </td>
                        {/* Date */}
                         <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                           {new Date(row.invoice_date || row.created_at).toLocaleDateString()}
                           <div className="text-xs text-gray-500 dark:text-gray-400">
                               {row.invoice_time || new Date(row.invoice_date || row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </td>
                        {/* Amount */}
                        <td className="px-4 py-3 font-semibold text-right text-gray-800 dark:text-white whitespace-nowrap">
                          {formatCurrency(row.total_amount || 0)}
                        </td>
                        {/* Payment Method */}
                        <td className="px-4 py-3 whitespace-nowrap">
                           {/* ... payment method badge styling ... */}
                           <span className={`px-2 py-1 inline-flex text-xs font-semibold leading-tight rounded-full
                                ${row.payment_method?.toLowerCase() === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                row.payment_method?.toLowerCase().includes('card') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                row.payment_method?.toLowerCase().includes('bank') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' :
                                row.payment_method?.toLowerCase().includes('cheque') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                            {row.payment_method || 'N/A'}
                          </span>
                        </td>                
                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-x-3"> {/* Use gap-x for horizontal spacing */}
                            {/* View/Reprint */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewInvoice(row); }}
                              title="View/Reprint Invoice"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
                            >
                              <FiPrinter size={16} />
                            </button>
                            {/* Edit */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditSale(row); }}
                              title="Edit Invoice"
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 focus:outline-none"
                            >
                               <FiEdit size={16}/> {/* Use React Icon */}
                            </button>
                             {/* Delete */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSale(row.id); }}
                              title="Delete Invoice"
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                            >
                               <FiTrash2 size={16} /> {/* Use React Icon */}
                            </button>
                            {/* Expand/Collapse */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRow(index); }}
                              title={expandedRow === index ? "Collapse Details" : "Expand Details"}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none"
                            >
                              {expandedRow === index ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* --- Expanded Row --- */}
                      {expandedRow === index && (
                        <tr className="bg-gray-50 dark:bg-slate-900/30">
                          <td colSpan={7} className="px-4 py-4 md:px-6 md:py-4"> {/* Adjusted colSpan */}
                              {/* ... Expanded row content (Invoice Summary, Customer Info, Items) ... */}
                              {/* Keep the existing expanded row structure */}
                              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                               {/* Invoice Details */}
                                <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700">
                                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">Invoice Summary</h4>
                                    <div className="grid grid-cols-2 text-sm gap-x-4 gap-y-1">
                                        <div className="text-gray-500 dark:text-gray-400">Subtotal:</div>
                                        <div className="font-medium text-right text-gray-900 dark:text-white">{formatCurrency(row.subtotal || 0)}</div>

                                        <div className="text-gray-500 dark:text-gray-400">Tax:</div>
                                        <div className="font-medium text-right text-gray-900 dark:text-white">+{formatCurrency(row.tax_amount || 0)}</div>

                                        <div className="text-gray-500 dark:text-gray-400">Total:</div>
                                        <div className="font-bold text-right text-gray-900 dark:text-white">{formatCurrency(row.total_amount || 0)}</div>

                                        <div className="col-span-2 pt-2 mt-2 border-t border-gray-200 dark:border-slate-700"></div>

                                        <div className="text-gray-500 dark:text-gray-400">Paid:</div>
                                        <div className="font-medium text-right text-green-600 dark:text-green-400">{formatCurrency(row.purchase_amount || 0)}</div>

                                        <div className="text-gray-500 dark:text-gray-400">Balance:</div>
                                         {/* Style balance based on value */}
                                        <div className={`font-medium text-right ${parseFloat(row.balance) < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {formatCurrency(row.balance || 0)}
                                        </div>

                                        <div className="text-gray-500 dark:text-gray-400">Method:</div>
                                        <div className="font-medium text-right text-gray-900 dark:text-white">{row.payment_method || 'N/A'}</div>
                                         <div className="text-gray-500 dark:text-gray-400">Status:</div>
                                        <div className="font-medium text-right text-gray-900 capitalize dark:text-white">{row.status || 'N/A'}</div>
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700">
                                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">Customer Info</h4>
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium text-gray-900 dark:text-white">{row.customer_name || 'N/A'}</p>
                                        <p className="text-gray-600 dark:text-gray-300">{row.customer_address || 'No Address'}</p>
                                        <p className="text-gray-600 dark:text-gray-300">{row.customer_phone || 'No Phone'}</p>
                                        <p className="text-gray-600 dark:text-gray-300">{row.customer_email || 'No Email'}</p>
                                    </div>
                                </div>

                                {/* Items Purchased */}
                                <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700 md:col-span-2 lg:col-span-1">
                                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">Items Purchased ({row.items?.length || 0})</h4>
                                    {Array.isArray(row.items) && row.items.length > 0 ? (
                                        <div className="overflow-x-auto max-h-60">
                                        <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-slate-600">
                                            <thead className="sticky top-0 text-gray-700 bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                            <tr>
                                                <th className="px-2 py-1 font-medium text-left">Item</th>
                                                <th className="px-2 py-1 font-medium text-center">Qty</th>
                                                <th className="px-2 py-1 font-medium text-right">Price</th>
                                                <th className="px-2 py-1 font-medium text-right">Disc</th> {/* Shorter Header */}
                                                <th className="px-2 py-1 font-medium text-right">Total</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
                                            {row.items.map((item, i) => (
                                                <tr key={item.id || i}>
                                                <td className="px-2 py-1 font-medium text-gray-900 dark:text-white">{item.description || 'N/A'}</td>
                                                <td className="px-2 py-1 text-center text-gray-600 dark:text-gray-300">{item.quantity || 0}</td>
                                                <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.unit_price || 0)}</td>
                                                <td className="px-2 py-1 text-right text-red-600 dark:text-red-400">{formatCurrency(item.discount_amount || 0)}</td>
                                                <td className="px-2 py-1 font-semibold text-right text-gray-900 dark:text-white">
                                                    {formatCurrency(item.total || 0)}
                                                </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">No item details available.</p>
                                    )}
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
      </div> {/* End Report Table Wrapper */}

      {/* Invoice Preview Modal (PrintableInvoice) */}
      {/* ... PrintableInvoice Modal code ... */}
      {invoiceDataForPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between flex-shrink-0 p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Preview ({invoiceDataForPreview?.invoice?.no})</h3>
              <button
                onClick={closeInvoiceModal}
                className="p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                aria-label="Close preview"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Modal Body (Scrollable Content) */}
             <div className="flex-grow overflow-y-auto" id="printable-invoice-area"> {/* Added ID for potential targeted printing */}
              <PrintableInvoice invoiceData={invoiceDataForPreview} />
            </div>
             {/* Modal Footer */}
            <div className="flex justify-end flex-shrink-0 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                    // Basic window print - adjust if only specific area needs printing
                    window.print();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <FiPrinter/> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div> // End Main Container
  );
};

export default SalesReport;