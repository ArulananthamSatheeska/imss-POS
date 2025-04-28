import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaFilter, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";
import { getApi, postData, putData, deleteData } from "../../services/api";
import { useAuth } from "../../context/NewAuthContext";

const PurchasingEntryForm = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const lastMonth = oneMonthAgo.toISOString().split("T")[0];

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState("");
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState(lastMonth);
  const [toDate, setToDate] = useState(today);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchData();
    } else {
      setNotification("Please login to access purchase entries");
      toast.error("Please login to access purchase entries");
    }
  }, [user, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [suppliersRes, storesRes, productsRes, purchasesRes] =
        await Promise.all([
          getApi().get(`/suppliers?_t=${timestamp}`),
          getApi().get(`/store-locations?_t=${timestamp}`),
          getApi().get(`/products?_t=${timestamp}`),
          getApi().get(`/purchases?_t=${timestamp}`, {
            params: { fromDate, toDate },
          }),
        ]);

      const suppliersData = Array.isArray(suppliersRes.data.data)
        ? suppliersRes.data.data
        : Array.isArray(suppliersRes.data)
        ? suppliersRes.data
        : [];
      const storesData = Array.isArray(storesRes.data.data)
        ? storesRes.data.data
        : Array.isArray(storesRes.data)
        ? storesRes.data
        : [];
      const productsData = Array.isArray(productsRes.data.data)
        ? productsRes.data.data
        : Array.isArray(productsRes.data)
        ? productsRes.data
        : [];
      const purchasesData = Array.isArray(purchasesRes.data.data)
        ? purchasesRes.data.data
        : Array.isArray(purchasesRes.data)
        ? purchasesRes.data
        : [];

      console.log("Fetched data:", {
        suppliers: suppliersData,
        stores: storesData,
        products: productsData,
        purchases: purchasesData,
      });

      setSuppliers(suppliersData);
      setStores(storesData);
      setProducts(productsData);
      setPurchases(purchasesData);

      if (suppliersData.length === 0) toast.warn("No suppliers available");
      if (storesData.length === 0) toast.warn("No stores available");
      if (productsData.length === 0) toast.warn("No products available");
      if (purchasesData.length === 0)
        toast.warn("No purchases found for the selected date range");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error fetching data";
      setNotification(errorMsg);
      toast.error(errorMsg);
      console.error("Fetch error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter purchases based on search term
  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.supplier_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.store?.store_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.items?.some((item) =>
        products
          .find((p) => p.product_id === item.product_id)
          ?.product_name?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  // Calculate totals for summary
  const calculateTotals = () => {
    const subtotal = purchases.reduce(
      (acc, purchase) =>
        acc +
        (purchase.items?.reduce(
          (sum, item) =>
            sum +
            (parseFloat(item.quantity) || 0) *
              (parseFloat(item.buying_cost) || 0),
          0
        ) || 0),
      0
    );
    const totalDiscount = purchases.reduce(
      (acc, purchase) => acc + (parseFloat(purchase.discount_amount) || 0),
      0
    );
    const totalTax = purchases.reduce(
      (acc, purchase) => acc + (parseFloat(purchase.tax) || 0),
      0
    );
    const grandTotal = purchases.reduce(
      (acc, purchase) => acc + (parseFloat(purchase.total) || 0),
      0
    );
    return { subtotal, totalDiscount, totalTax, grandTotal };
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPurchases.flatMap((purchase, purchaseIndex) =>
        purchase.items.map((item, itemIndex) => ({
          "S.No": purchaseIndex + 1,
          "Bill Number": purchase.bill_number,
          "Invoice Number": purchase.invoice_number,
          Supplier: purchase.supplier?.supplier_name || "Unknown",
          Store: purchase.store?.store_name || "Unknown",
          Item:
            products.find((p) => p.product_id === item.product_id)
              ?.product_name || "Unknown",
          Quantity: item.quantity,
          "Free Items": item.free_items || 0,
          "Buying Cost": item.buying_cost,
          Discount: purchase.discount_amount,
          Tax: purchase.tax,
          Total: purchase.total / purchase.items.length, // Distribute total across items
          Date: purchase.date_of_purchase,
          Status: purchase.status,
        }))
      )
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PurchaseEntries");
    XLSX.writeFile(
      workbook,
      `Purchase_Entries_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Open PurchaseInvoiceForm for editing an invoice
  const openEditInvoice = (purchase) => {
    setEditingInvoice({
      id: purchase.id,
      billNumber: purchase.bill_number || "",
      invoiceNumber: purchase.invoice_number || "",
      purchaseDate: purchase.date_of_purchase || "",
      paymentMethod: purchase.payment_method || "Cash",
      supplierId: purchase.supplier_id || "",
      storeId: purchase.store_id || "",
      paidAmount: parseFloat(purchase.paid_amount) || 0,
      status: purchase.status || "pending",
      discountPercentage: parseFloat(purchase.discount_percentage) || 0,
      discountAmount: parseFloat(purchase.discount_amount) || 0,
      tax: parseFloat(purchase.tax) || 0,
      items:
        purchase.items?.map((item, index) => ({
          id: index + 1,
          productId: item.product_id || "",
          description:
            products.find((p) => p.product_id === item.product_id)
              ?.product_name || "Unknown",
          quantity: parseInt(item.quantity - (item.free_items || 0)) || 1,
          freeItems: parseInt(item.free_items) || 0,
          buyingCost: parseFloat(item.buying_cost) || 0,
          total:
            (parseFloat(item.quantity) || 0) *
            (parseFloat(item.buying_cost) || 0),
        })) || [],
      total: parseFloat(purchase.total) || 0, // Use purchase.total directly
    });
    setIsInvoiceFormOpen(true);
  };

  // Handle invoice submission (create or update)
  const handleGenerateInvoice = async (newInvoice) => {
    try {
      setLoading(true);
      const invoiceData = {
        date_of_purchase: newInvoice.purchaseDate,
        bill_number: newInvoice.billNumber,
        invoice_number: newInvoice.invoiceNumber,
        payment_method: newInvoice.paymentMethod,
        supplier_id: parseInt(newInvoice.supplierId),
        store_id: parseInt(newInvoice.storeId),
        paid_amount: newInvoice.paidAmount || 0,
        discount_percentage: newInvoice.discountPercentage || 0,
        discount_amount: newInvoice.discountAmount || 0,
        tax: newInvoice.tax || 0,
        status: newInvoice.status || "pending",
        items: newInvoice.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          free_items: item.freeItems || 0,
          buying_cost: item.buyingCost,
        })),
        total: newInvoice.total,
      };

      if (newInvoice.id) {
        await putData(`/purchases/${newInvoice.id}`, invoiceData);
        setNotification("Purchase invoice updated successfully!");
        toast.success("Purchase invoice updated successfully!");
      } else {
        await postData("/purchases", invoiceData);
        setNotification("Purchase invoice recorded successfully!");
        toast.success("Purchase invoice recorded successfully!");
      }
      fetchData();
      setIsInvoiceFormOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      setNotification("Error recording purchase invoice: " + error.message);
      toast.error("Error recording purchase invoice: " + error.message);
      console.error("Error recording purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete an invoice
  const deleteInvoice = async (purchaseId) => {
    try {
      setLoading(true);
      await deleteData(`/purchases/${purchaseId}`);
      setPurchases(purchases.filter((purchase) => purchase.id !== purchaseId));
      setNotification("Purchase invoice deleted successfully!");
      toast.success("Purchase invoice deleted successfully!");
    } catch (error) {
      setNotification("Error deleting purchase invoice: " + error.message);
      toast.error("Error deleting purchase invoice: " + error.message);
      console.error("Error deleting purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return isNaN(amount)
      ? "LKR 0.00"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "LKR",
          minimumFractionDigits: 2,
        }).format(amount);
  };

  return (
    <div className="p-4 min-h-screen flex flex-col bg-transparent">
      <div className="bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800 text-white text-center py-3 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold">PURCHASE ENTRY DASHBOARD</h1>
        <p className="text-sm opacity-90">
          View and manage your purchase entries
        </p>
      </div>

      {notification && (
        <div className="p-2 mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
          {notification}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search bill number, invoice number, supplier, store, or item..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsInvoiceFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Purchase Entry
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800 dark:border-gray-600 dark:text-gray-300 p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FaFilter /> Purchase Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Purchase Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-blue-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Subtotal
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-blue-400">
              {formatCurrency(calculateTotals().subtotal)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-red-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Total Discount
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-red-400">
              {formatCurrency(calculateTotals().totalDiscount)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-yellow-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Total Tax
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-yellow-400">
              {formatCurrency(calculateTotals().totalTax)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-green-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Grand Total
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-green-400">
              {formatCurrency(calculateTotals().grandTotal)}
            </p>
          </div>
        </div>
      </div>

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
                  <th className="px-6 py-3 text-left font-semibold">S.No</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Store</th>
                  <th className="px-6 py-3 text-left font-semibold">Items</th>
                  <th className="px-6 py-3 text-left font-semibold">Total</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No purchase entries found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase, index) => (
                    <React.Fragment key={purchase.id}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                          expandedRow === index
                            ? "bg-blue-50 dark:bg-slate-700"
                            : ""
                        }`}
                        onClick={() => toggleRow(index)}
                      >
                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.bill_number}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.date_of_purchase}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.supplier?.supplier_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.store?.store_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                          {formatCurrency(parseFloat(purchase.total) || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              purchase.status === "paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : purchase.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditInvoice(purchase);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit Invoice
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteInvoice(purchase.id);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                        <tr className="bg-gray-50 dark:bg-slate-700">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Invoice Items
                              </h4>
                              <table className="w-full border-collapse border rounded-lg">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                                    <th className="p-2 border">Item</th>
                                    <th className="p-2 border">Quantity</th>
                                    <th className="p-2 border">Free Items</th>
                                    <th className="p-2 border">Buying Cost</th>
                                    <th className="p-2 border">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {purchase.items?.map((item, itemIndex) => (
                                    <tr
                                      key={itemIndex}
                                      className="border text-center dark:text-gray-300"
                                    >
                                      <td className="p-2 border">
                                        {products.find(
                                          (p) =>
                                            p.product_id === item.product_id
                                        )?.product_name || "Unknown"}
                                      </td>
                                      <td className="p-2 border">
                                        {parseInt(
                                          item.quantity - (item.free_items || 0)
                                        ) || 0}
                                      </td>
                                      <td className="p-2 border">
                                        {parseInt(item.free_items) || 0}
                                      </td>
                                      <td className="p-2 border">
                                        {formatCurrency(
                                          parseFloat(item.buying_cost) || 0
                                        )}
                                      </td>
                                      <td className="p-2 border">
                                        {formatCurrency(
                                          (parseFloat(item.quantity) || 0) *
                                            (parseFloat(item.buying_cost) || 0)
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="text-right space-y-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Subtotal:{" "}
                                  {formatCurrency(
                                    purchase.items?.reduce(
                                      (sum, item) =>
                                        sum +
                                        (parseFloat(item.quantity) || 0) *
                                          (parseFloat(item.buying_cost) || 0),
                                      0
                                    ) || 0
                                  )}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Discount:{" "}
                                  {formatCurrency(
                                    parseFloat(purchase.discount_amount) || 0
                                  )}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Tax:{" "}
                                  {formatCurrency(
                                    parseFloat(purchase.tax) || 0
                                  )}
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  Total:{" "}
                                  {formatCurrency(
                                    parseFloat(purchase.total) || 0
                                  )}
                                </p>
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

      {isInvoiceFormOpen && (
        <PurchaseInvoiceForm
          onGenerateInvoice={handleGenerateInvoice}
          onCancel={() => {
            setIsInvoiceFormOpen(false);
            setEditingInvoice(null);
          }}
          existingInvoice={editingInvoice}
        />
      )}
    </div>
  );
};

export default PurchasingEntryForm;
