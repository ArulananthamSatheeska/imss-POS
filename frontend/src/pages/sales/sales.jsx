import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiPrinter,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { FaFilter, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import axios from "axios";
import SalesInvoice from "./SalesInvoice";
// import Quotation from './Quotation';
import PrintableInvoice from "./PrintableInvoice";

const API_BASE_URL = "http://localhost:8000/api";

const SalesReport = () => {
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const invoiceResponse = await axios.get(`${API_BASE_URL}/invoices`, {
        params: { from: fromDate, to: toDate },
        headers: { Accept: "application/json" },
      });

      // Fetch sales (POS)
      const salesResponse = await axios.get(`${API_BASE_URL}/sales`, {
        params: { from: fromDate, to: toDate },
        headers: { Accept: "application/json" },
      });

      console.log("Fetched Invoices Response:", invoiceResponse);
      console.log("Fetched Sales Response:", salesResponse);

      // Process invoices
      let invoices = [];
      if (invoiceResponse.data && Array.isArray(invoiceResponse.data.data)) {
        invoices = invoiceResponse.data.data;
      } else if (Array.isArray(invoiceResponse.data)) {
        invoices = invoiceResponse.data;
      } else {
        console.warn(
          "Received invoice data is not in expected format:",
          invoiceResponse.data
        );
        throw new Error("Invalid invoice data format from API");
      }

      const processedInvoices = invoices.map((invoice) => ({
        ...invoice,
        type: "invoice",
        bill_number: invoice.invoice_no || `INV-${invoice.id}`,
        customer_name: invoice.customer_name || "Unknown Customer",
        customer_phone: invoice.customer_phone || "",
        customer_address: invoice.customer_address || "",
        customer_email: invoice.customer_email || "",
        items: Array.isArray(invoice.items) ? invoice.items : [],
        total_amount: parseFloat(invoice.total_amount) || 0,
        subtotal: parseFloat(invoice.subtotal) || 0,
        tax_amount: parseFloat(invoice.tax_amount) || 0,
        discount: parseFloat(invoice.discount_amount) || 0,
        payment_method: invoice.payment_method || "Cash",
        balance: parseFloat(invoice.balance) || 0,
        purchase_amount: parseFloat(invoice.purchase_amount) || 0,
        invoice_date:
          invoice.invoice_date ||
          invoice.created_at ||
          new Date().toISOString(),
        status: invoice.status || "Pending",
      }));

      // Process sales
      let sales = [];
      if (salesResponse.data && Array.isArray(salesResponse.data.data)) {
        sales = salesResponse.data.data;
      } else if (Array.isArray(salesResponse.data)) {
        sales = salesResponse.data;
      } else {
        console.warn(
          "Received sales data is not in expected format:",
          salesResponse.data
        );
        throw new Error("Invalid sales data format from API");
      }

      const processedSales = sales.map((sale) => ({
        ...sale,
        type: "sale",
        bill_number: sale.bill_number || `SALE-${sale.id}`,
        customer_name: sale.customer_name || "Walk-in Customer",
        customer_phone: sale.customer_phone || "",
        customer_address: sale.customer_address || "",
        customer_email: sale.customer_email || "",
        items: Array.isArray(sale.items) ? sale.items : [],
        total_amount: parseFloat(sale.total) || 0,
        subtotal: parseFloat(sale.subtotal) || 0,
        tax_amount: parseFloat(sale.tax) || 0,
        discount: parseFloat(sale.discount) || 0,
        payment_method: sale.payment_type || "Cash",
        balance: parseFloat(sale.balance_amount) || 0,
        purchase_amount: parseFloat(sale.received_amount) || 0,
        invoice_date: sale.created_at || new Date().toISOString(),
        status: sale.status || "Completed",
      }));

      // Combine and sort by date
      const combinedData = [...processedInvoices, ...processedSales].sort(
        (a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)
      );

      setReportData(combinedData);
    } catch (error) {
      console.error(
        "Error fetching sales report data:",
        error.response || error
      );
      setReportData([]);
      alert(
        `Error fetching data: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleGenerateInvoiceApiCall = async (
    newInvoiceData,
    type = "invoice"
  ) => {
    const url = `${API_BASE_URL}/${type === "invoice" ? "invoices" : "sales"}`;
    console.log(`POST to: ${url}`, JSON.stringify(newInvoiceData, null, 2));
    try {
      const response = await axios.post(url, newInvoiceData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      console.log(
        `API Success (${type === "invoice" ? "Invoice" : "Sale"} Creation):`,
        response.data
      );
      fetchReportData();
      setShowInvoiceModal(false);
      alert(`${type === "invoice" ? "Invoice" : "Sale"} created successfully!`);
      return response.data;
    } catch (error) {
      console.error(`API Error during POST ${url}:`, error.response || error);
      const errorMessage =
        error.response?.data?.message || `Failed to create ${type}.`;
      const errorDetails = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
        : error.message;
      alert(`Error: ${errorMessage}\nDetails: ${errorDetails}`);
      throw error;
    }
  };

  const handleUpdateInvoiceApiCall = async (
    updatedInvoiceData,
    id,
    type = "invoice"
  ) => {
    if (!id) {
      console.error(`${type} ID missing for update`);
      alert(`Cannot update ${type}: ID is missing.`);
      return;
    }
    const url = `${API_BASE_URL}/${
      type === "invoice" ? "invoices" : "sales"
    }/${id}`;
    console.log(`PUT to: ${url}`, JSON.stringify(updatedInvoiceData, null, 2));
    try {
      const response = await axios.put(url, updatedInvoiceData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      console.log(
        `API Success (${type === "invoice" ? "Invoice" : "Sale"} Update):`,
        response.data
      );
      fetchReportData();
      setShowEditInvoiceModal(false);
      setInvoiceToEdit(null);
      alert(`${type === "invoice" ? "Invoice" : "Sale"} updated successfully!`);
      return response.data;
    } catch (error) {
      console.error(`API Error during PUT ${url}:`, error.response || error);
      const errorMessage =
        error.response?.data?.message || `Failed to update ${type}.`;
      const errorDetails = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
        : error.message;
      alert(`Error: ${errorMessage}\nDetails: ${errorDetails}`);
      throw error;
    }
  };

  const handleDeleteSale = async (id, type = "invoice") => {
    console.log(`Attempting to delete ${type} ID:`, id);
    if (
      window.confirm(
        `Are you sure you want to delete ${type} ID: ${id}? This action cannot be undone.`
      )
    ) {
      setLoading(true);
      const url = `${API_BASE_URL}/${
        type === "invoice" ? "invoices" : "sales"
      }/${id}`;
      try {
        await axios.delete(url, {
          headers: { Accept: "application/json" },
        });
        alert(
          `${
            type === "invoice" ? "Invoice" : "Sale"
          } ID: ${id} deleted successfully.`
        );
        fetchReportData();
      } catch (error) {
        console.error(`Error deleting ${type} ${id}:`, error.response || error);
        alert(
          `Failed to delete ${type} ${id}. ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredData = (reportData || []).filter((row) => {
    const searchableFields = [
      row.bill_number,
      row.customer_name,
      row.customer_phone,
      row.total_amount?.toString(),
      row.payment_method,
      new Date(row.invoice_date || row.created_at).toLocaleDateString(),
    ];
    return searchableFields.some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const exportToExcel = () => {
    const dataToExport = filteredData.map((row) => ({
      Type: row.type === "invoice" ? "Invoice" : "Sale",
      "Bill/Invoice #": row.bill_number,
      Customer: row.customer_name,
      Phone: row.customer_phone,
      Date: new Date(row.invoice_date || row.created_at).toLocaleDateString(),
      Subtotal: row.subtotal,
      Tax: row.tax_amount,
      Discount: row.discount,
      Total: row.total_amount,
      Paid: row.purchase_amount,
      Balance: row.balance,
      "Payment Method": row.payment_method,
      Status: row.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");
    XLSX.writeFile(workbook, `Sales_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleViewInvoice = (row) => {
    console.log("Row data for invoice preview:", row);

    if (!row.customer_name) {
      row.customer_name =
        row.type === "sale" ? "Walk-in Customer" : "Unknown Customer";
    }

    setInvoiceDataForPreview({
      customer: {
        name: row.customer_name,
        address: row.customer_address || "N/A",
        phone: row.customer_phone || "N/A",
        email: row.customer_email || "N/A",
      },
      items: (Array.isArray(row.items) ? row.items : []).map((item) => ({
        id: item.id || null,
        description:
          row.type === "sale"
            ? item.product_name || "N/A"
            : item.description || "N/A",
        quantity: item.quantity || item.qty || 0,
        unit_price: item.unit_price || item.sales_price || 0,
        discountAmount: item.discount || item.discount_amount || 0,
        discountPercentage: item.discount_percentage || 0,
        total:
          item.total ||
          item.quantity * (item.unit_price || item.sales_price) ||
          0,
        totalBuyingCost: item.total_buying_cost || 0,
        freeQty: item.free_qty || 0,
      })),
      footerDetails: {
        approvedBy: row.approved_by || "System",
        nextApprovalTo: row.next_approval_to || "",
        dateTime: new Date(
          row.updated_at || row.created_at || Date.now()
        ).toLocaleString(),
      },
      subtotal: Number(row.subtotal) || 0,
      tax: Number(row.tax_amount) || 0,
      discount: Number(row.discount) || 0,
      total: Number(row.total_amount) || 0,
      amountPaid: Number(row.purchase_amount) || 0,
      balance: Number(row.balance) || 0,
      invoice: {
        no: row.bill_number,
        date: row.invoice_date
          ? new Date(row.invoice_date).toLocaleDateString()
          : new Date(row.created_at || Date.now()).toLocaleDateString(),
        time:
          row.invoice_time ||
          new Date(
            row.invoice_date || row.created_at || Date.now()
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
      paymentMethod: row.payment_method || "Cash",
      status: row.status || (row.type === "sale" ? "Completed" : "Pending"),
    });
  };

  const closeInvoiceModal = () => {
    setInvoiceDataForPreview(null);
  };

  const handleEditSale = (row) => {
    const mappedDataForEdit = {
      id: row.id,
      type: row.type,
      invoice: {
        no: row.bill_number,
        date:
          row.invoice_date?.split(" ")[0] ||
          new Date().toISOString().split("T")[0],
        time:
          row.invoice_time ||
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
      },
      customer: {
        id: row.customer_id || null,
        name:
          row.customer_name ||
          (row.type === "sale" ? "Walk-in Customer" : "Unknown Customer"),
        address: row.customer_address || "",
        phone: row.customer_phone || "",
        email: row.customer_email || "",
      },
      items: (Array.isArray(row.items) ? row.items : []).map((item) => {
        const qty = parseFloat(item.quantity || item.qty || 1);
        const unitPrice = parseFloat(item.unit_price || item.sales_price || 0);
        return {
          id: item.id || null,
          productId: item.product_id || null,
          description:
            row.type === "sale"
              ? item.product_name || ""
              : item.description || "",
          qty,
          unitPrice,
          salesPrice: unitPrice,
          buyingCost: parseFloat(
            item.buying_cost || item.total_buying_cost / qty || 0
          ),
          discountAmount: parseFloat(
            item.discount || item.discount_amount || 0
          ),
          discountPercentage: parseFloat(item.discount_percentage || 0),
          total: parseFloat(item.total || qty * unitPrice) || 0,
          totalBuyingCost: parseFloat(item.total_buying_cost || 0),
        };
      }),
      purchaseDetails: {
        method: row.payment_method || "cash",
        amount: row.purchase_amount || 0,
        taxPercentage:
          row.tax_amount && row.subtotal
            ? (row.tax_amount / row.subtotal) * 100
            : 0,
      },
      status: row.status || (row.type === "sale" ? "Completed" : "Pending"),
    };
    console.log(
      "Mapped Data for Edit:",
      JSON.stringify(mappedDataForEdit, null, 2)
    );
    setInvoiceToEdit(mappedDataForEdit);
    setShowEditInvoiceModal(true);
  };

  const handleCancelEditInvoice = () => {
    setShowEditInvoiceModal(false);
    setInvoiceToEdit(null);
  };

  const handleCancelCreateInvoice = () => {
    setShowInvoiceModal(false);
  };

  const handleGenerateQuotation = () => {
    setIsQuotationFormOpen(false);
  };

  const handleCancelQuotation = () => {
    setIsQuotationFormOpen(false);
  };

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      return "LKR 0.00";
    }
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 bg-transparent">
      <div className="py-3 mb-6 text-center text-white rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800">
        <h1 className="text-2xl font-bold">SALES REPORT</h1>
        <p className="text-sm opacity-90">
          Track and analyze your sales performance
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by bill/invoice number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full py-2 pl-10 pr-3 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => setShowInvoiceModal(true)}
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
            <FaFilter /> {showFilters ? "Hide" : "Show"} Filters
          </button>
          <button
            onClick={fetchReportData}
            disabled={loading}
            title="Refresh Data"
            className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            disabled={filteredData.length === 0 || loading}
            title="Export to Excel"
            className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              filteredData.length === 0 || loading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

      {showInvoiceModal && (
        <SalesInvoice
          onGenerateInvoice={handleGenerateInvoiceApiCall}
          onCancel={handleCancelCreateInvoice}
          isEditMode={false}
        />
      )}

      {showEditInvoiceModal && invoiceToEdit && (
        <SalesInvoice
          initialData={invoiceToEdit}
          onUpdateInvoice={(data, id) =>
            handleUpdateInvoiceApiCall(data, id, invoiceToEdit.type)
          }
          onCancel={handleCancelEditInvoice}
          isEditMode={true}
        />
      )}

      {isQuotationFormOpen && (
        <Quotation
          onGenerateQuotation={handleGenerateQuotation}
          onCancel={handleCancelQuotation}
        />
      )}

      {showFilters && (
        <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 animate-fade-in">
          <h3 className="flex items-center gap-2 mb-3 text-base font-medium">
            <FaFilter /> Report Filters
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="fromDate"
                className="block mb-1 text-sm font-medium"
              >
                From Date
              </label>
              <input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="toDate"
                className="block mb-1 text-sm font-medium"
              >
                To Date
              </label>
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
                onClick={fetchReportData}
                disabled={loading}
                className={`w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Applying..." : "Apply Filters"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 bg-white border-l-4 border-blue-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-blue-400">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Entries
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredData.length}
          </p>
        </div>
        <div className="p-4 bg-white border-l-4 border-green-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-green-400">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Revenue
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(
              filteredData.reduce(
                (sum, row) => sum + (parseFloat(row.total_amount) || 0),
                0
              )
            )}
          </p>
        </div>
        <div className="p-4 bg-white border-l-4 border-yellow-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-yellow-400">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            Average Sale
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredData.length > 0
              ? formatCurrency(
                  filteredData.reduce(
                    (sum, row) => sum + (parseFloat(row.total_amount) || 0),
                    0
                  ) / filteredData.length
                )
              : formatCurrency(0)}
          </p>
        </div>
        <div className="p-4 bg-white border-l-4 border-purple-500 rounded-lg shadow-md dark:bg-slate-800 dark:border-purple-400">
          <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            Date Range
          </h3>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {new Date(fromDate).toLocaleDateString()} -{" "}
            {new Date(toDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-slate-700">
        {loading && reportData.length === 0 ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-400">
              Loading Sales Data...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
              <thead className="text-xs tracking-wider text-gray-700 uppercase bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    Bill/Inv #
                  </th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    Payment
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-600">
                {filteredData.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                    >
                      No sales or invoice data found for the selected period or
                      filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <React.Fragment key={`${row.type}-${row.id}`}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                          expandedRow === index
                            ? "bg-blue-50 dark:bg-slate-700"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {row.type === "invoice" ? "Invoice" : "Sale"}
                        </td>
                        <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <button
                            onClick={() => toggleRow(index)}
                            className="hover:underline focus:outline-none"
                          >
                            #{row.bill_number}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {row.customer_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.customer_phone}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {new Date(
                            row.invoice_date || row.created_at
                          ).toLocaleDateString()}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.invoice_time ||
                              new Date(
                                row.invoice_date || row.created_at
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-right text-gray-800 dark:text-white whitespace-nowrap">
                          {formatCurrency(row.total_amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-semibold leading-tight rounded-full
                            ${
                              row.payment_method.toLowerCase() === "cash"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                : row.payment_method
                                    .toLowerCase()
                                    .includes("card")
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                : row.payment_method
                                    .toLowerCase()
                                    .includes("online")
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                                : row.payment_method
                                    .toLowerCase()
                                    .includes("cheque")
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                                : row.payment_method
                                    .toLowerCase()
                                    .includes("credit")
                                ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                            }`}
                          >
                            {row.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(row);
                              }}
                              title="View/Reprint"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
                            >
                              <FiPrinter size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSale(row);
                              }}
                              title={`Edit ${
                                row.type === "invoice" ? "Invoice" : "Sale"
                              }`}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 focus:outline-none"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSale(row.id, row.type);
                              }}
                              title={`Delete ${
                                row.type === "invoice" ? "Invoice" : "Sale"
                              }`}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                            >
                              <FiTrash2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(index);
                              }}
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
                          </div>
                        </td>
                      </tr>

                      {expandedRow === index && (
                        <tr className="bg-gray-50 dark:bg-slate-900/30">
                          <td colSpan={7} className="px-4 py-4 md:px-6 md:py-4">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                              <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700">
                                <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                  {row.type === "invoice" ? "Invoice" : "Sale"}{" "}
                                  Summary
                                </h4>
                                <div className="grid grid-cols-2 text-sm gap-x-4 gap-y-1">
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Subtotal:
                                  </div>
                                  <div className="font-medium text-right text-gray-900 dark:text-white">
                                    {formatCurrency(row.subtotal)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Tax:
                                  </div>
                                  <div className="font-medium text-right text-gray-900 dark:text-white">
                                    +{formatCurrency(row.tax_amount)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Discount:
                                  </div>
                                  <div className="font-medium text-right text-red-600 dark:text-red-400">
                                    -{formatCurrency(row.discount)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Total:
                                  </div>
                                  <div className="font-bold text-right text-gray-900 dark:text-white">
                                    {formatCurrency(row.total_amount)}
                                  </div>
                                  <div className="col-span-2 pt-2 mt-2 border-t border-gray-200 dark:border-slate-700"></div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Paid:
                                  </div>
                                  <div className="font-medium text-right text-green-600 dark:text-green-400">
                                    {formatCurrency(row.purchase_amount)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Balance:
                                  </div>
                                  <div
                                    className={`font-medium text-right ${
                                      parseFloat(row.balance) < 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    {formatCurrency(row.balance)}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Method:
                                  </div>
                                  <div className="font-medium text-right text-gray-900 dark:text-white">
                                    {row.payment_method}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    Status:
                                  </div>
                                  <div className="font-medium text-right text-gray-900 capitalize dark:text-white">
                                    {row.status}
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700">
                                <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                  Customer Info
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {row.customer_name}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-300">
                                    {row.customer_address || "No Address"}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-300">
                                    {row.customer_phone || "No Phone"}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-300">
                                    {row.customer_email || "No Email"}
                                  </p>
                                </div>
                              </div>

                              <div className="p-3 border border-gray-200 rounded-md dark:border-slate-700 md:col-span-2 lg:col-span-1">
                                <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                  Items Purchased ({row.items?.length || 0})
                                </h4>
                                {Array.isArray(row.items) &&
                                row.items.length > 0 ? (
                                  <div className="overflow-x-auto max-h-60">
                                    <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-slate-600">
                                      <thead className="sticky top-0 text-gray-700 bg-gray-100 dark:bg-slate-700 dark:text-gray-300">
                                        <tr>
                                          <th className="px-2 py-1 font-medium text-left">
                                            Item
                                          </th>
                                          <th className="px-2 py-1 font-medium text-center">
                                            Qty
                                          </th>
                                          <th className="px-2 py-1 font-medium text-right">
                                            Price
                                          </th>
                                          <th className="px-2 py-1 font-medium text-right">
                                            Disc
                                          </th>
                                          <th className="px-2 py-1 font-medium text-right">
                                            Total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
                                        {row.items.map((item, i) => (
                                          <tr key={item.id || i}>
                                            <td className="px-2 py-1 font-medium text-gray-900 dark:text-white">
                                              {row.type === "sale"
                                                ? item.product_name || "N/A"
                                                : item.description || "N/A"}
                                            </td>
                                            <td className="px-2 py-1 text-center text-gray-600 dark:text-gray-300">
                                              {item.quantity || 0}
                                            </td>
                                            <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-300">
                                              {formatCurrency(
                                                item.unit_price ||
                                                  item.sales_price ||
                                                  0
                                              )}
                                            </td>
                                            <td className="px-2 py-1 text-right text-red-600 dark:text-red-400">
                                              {formatCurrency(
                                                item.discount ||
                                                  item.discount_amount ||
                                                  0
                                              )}
                                            </td>
                                            <td className="px-2 py-1 font-semibold text-right text-gray-900 dark:text-white">
                                              {formatCurrency(item.total || 0)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                                    No item details available.
                                  </p>
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
      </div>

      {invoiceDataForPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800 flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0 p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {invoiceDataForPreview?.invoice?.no.includes("INV")
                  ? "Invoice"
                  : "Sale"}{" "}
                Preview (#{invoiceDataForPreview?.invoice?.no})
              </h3>
              <button
                onClick={closeInvoiceModal}
                className="p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                aria-label="Close preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div
              className="flex-grow overflow-y-auto"
              id="printable-invoice-area"
            >
              <PrintableInvoice invoiceData={invoiceDataForPreview} />
            </div>
            <div className="flex justify-end flex-shrink-0 p-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <FiPrinter /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
