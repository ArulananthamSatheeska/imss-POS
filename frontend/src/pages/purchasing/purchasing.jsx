import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiX,
  FiPrinter,
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState(lastMonth);
  const [toDate, setToDate] = useState(today);
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

      console.log("Purchases API Response:", purchasesRes.data); // Debug: Check if items have discount_amount

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
      console.error("Fetch Data Error:", error);
      const errorMsg = error.response?.data?.message || "Error fetching data";
      setNotification(errorMsg);
      toast.error(errorMsg);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

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
    const totalItemDiscount = purchases.reduce(
      (acc, purchase) =>
        acc +
        (purchase.items?.reduce(
          (sum, item) => sum + (parseFloat(item.discount_amount) || 0),
          0
        ) || 0),
      0
    );
    const totalInvoiceDiscount = purchases.reduce(
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
    return {
      subtotal,
      totalItemDiscount,
      totalInvoiceDiscount,
      totalTax,
      grandTotal,
    };
  };

  const calculateTaxPercentage = (purchase) => {
    const itemSubtotal =
      purchase.items?.reduce(
        (sum, item) =>
          sum +
          (parseFloat(item.quantity) || 0) *
            (parseFloat(item.buying_cost) || 0) -
          (parseFloat(item.discount_amount) || 0),
        0
      ) || 0;
    const invoiceDiscountAmount = parseFloat(purchase.discount_amount) || 0;
    const tax = parseFloat(purchase.tax) || 0;
    const taxableAmount = itemSubtotal - invoiceDiscountAmount;
    return taxableAmount > 0 ? (tax / taxableAmount) * 100 : 0;
  };

  const exportToExcel = () => {
    try {
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
            Quantity: item.quantity - (item.free_items || 0),
            "Free Items": item.free_items || 0,
            "Buying Cost": parseFloat(item.buying_cost) || 0,
            "Item Discount Percentage":
              parseFloat(item.discount_percentage) || 0,
            "Item Discount Amount": parseFloat(item.discount_amount) || 0,
            "Item Subtotal":
              (parseFloat(item.quantity) || 0) *
              (parseFloat(item.buying_cost) || 0),
            "Item Total":
              (parseFloat(item.quantity) || 0) *
                (parseFloat(item.buying_cost) || 0) -
              (parseFloat(item.discount_amount) || 0),
            "Invoice Discount Percentage":
              parseFloat(purchase.discount_percentage) || 0,
            "Invoice Discount Amount":
              parseFloat(purchase.discount_amount) || 0,
            "Tax Percentage": calculateTaxPercentage(purchase).toFixed(2),
            Tax: parseFloat(purchase.tax) || 0,
            "Invoice Total": parseFloat(purchase.total) || 0,
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
      toast.success("Exported to Excel successfully!");
    } catch (error) {
      console.error("Export to Excel Error:", error);
      toast.error("Error exporting to Excel");
    }
  };

  const openEditInvoice = (purchase) => {
    const invoice = {
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
      discountAmountEdited: purchase.discount_amount > 0,
      taxPercentage: calculateTaxPercentage(purchase),
      tax: parseFloat(purchase.tax) || 0,
      taxEdited: purchase.tax > 0,
      items:
        purchase.items?.map((item, index) => {
          const discountAmount = parseFloat(item.discount_amount) || 0;
          const discountPercentage = parseFloat(item.discount_percentage) || 0;
          console.log(`Item ${index + 1} Discount:`, {
            discountAmount,
            discountPercentage,
          }); // Debug: Check item discounts
          return {
            id: index + 1,
            productId: item.product_id || "",
            description:
              products.find((p) => p.product_id === item.product_id)
                ?.product_name || "Unknown",
            quantity: parseInt(item.quantity - (item.free_items || 0)) || 1,
            freeItems: parseInt(item.free_items) || 0,
            buyingCost: parseFloat(item.buying_cost) || 0,
            discountPercentage,
            discountAmount,
            discountAmountEdited: discountAmount > 0,
            subtotal:
              (parseFloat(item.quantity) || 0) *
              (parseFloat(item.buying_cost) || 0),
            total:
              (parseFloat(item.quantity) || 0) *
                (parseFloat(item.buying_cost) || 0) -
              discountAmount,
          };
        }) || [],
      total: parseFloat(purchase.total) || 0,
    };
    console.log("Edit Invoice Data:", invoice); // Debug: Check full invoice data
    setEditingInvoice(invoice);
    setIsInvoiceFormOpen(true);
  };

  const openViewInvoice = (purchase) => {
    const invoice = {
      id: purchase.id,
      billNumber: purchase.bill_number || "",
      invoiceNumber: purchase.invoice_number || "",
      purchaseDate: purchase.date_of_purchase || "",
      paymentMethod: purchase.payment_method || "Cash",
      supplierName: purchase.supplier?.supplier_name || "Unknown",
      storeName: purchase.store?.store_name || "Unknown",
      paidAmount: parseFloat(purchase.paid_amount) || 0,
      status: purchase.status || "pending",
      discountPercentage: parseFloat(purchase.discount_percentage) || 0,
      discountAmount: parseFloat(purchase.discount_amount) || 0,
      taxPercentage: calculateTaxPercentage(purchase),
      tax: parseFloat(purchase.tax) || 0,
      items:
        purchase.items?.map((item, index) => {
          const discountAmount = parseFloat(item.discount_amount) || 0;
          const discountPercentage = parseFloat(item.discount_percentage) || 0;
          console.log(`View Item ${index + 1} Discount:`, {
            discountAmount,
            discountPercentage,
          }); // Debug: Check item discounts
          return {
            id: index + 1,
            productId: item.product_id || "",
            description:
              products.find((p) => p.product_id === item.product_id)
                ?.product_name || "Unknown",
            quantity: parseInt(item.quantity - (item.free_items || 0)) || 1,
            freeItems: parseInt(item.free_items) || 0,
            buyingCost: parseFloat(item.buying_cost) || 0,
            discountPercentage,
            discountAmount,
            subtotal:
              (parseFloat(item.quantity) || 0) *
              (parseFloat(item.buying_cost) || 0),
            total:
              (parseFloat(item.quantity) || 0) *
                (parseFloat(item.buying_cost) || 0) -
              discountAmount,
          };
        }) || [],
      total: parseFloat(purchase.total) || 0,
    };
    console.log("View Invoice Data:", invoice); // Debug: Check full invoice data
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

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
        items: newInvoice.items.map((item) => {
          console.log("Saving Item Discount:", {
            discountPercentage: item.discountPercentage,
            discountAmount: item.discountAmount,
          }); // Debug: Check item discounts being sent
          return {
            product_id: item.productId,
            quantity: item.quantity + (item.freeItems || 0),
            free_items: item.freeItems || 0,
            buying_cost: item.buyingCost,
            discount_percentage: item.discountPercentage || 0,
            discount_amount: item.discountAmount || 0,
          };
        }),
        total: newInvoice.total,
      };

      console.log("Sending Invoice Data:", invoiceData); // Debug: Check full payload

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
      console.error("Generate Invoice Error:", error);
      const errorMsg =
        error.response?.data?.message || "Error recording purchase invoice";
      setNotification(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase?"))
      return;
    try {
      setLoading(true);
      await deleteData(`/purchases/${purchaseId}`);
      setPurchases(purchases.filter((purchase) => purchase.id !== purchaseId));
      setNotification("Purchase invoice deleted successfully!");
      toast.success("Purchase invoice deleted successfully!");
    } catch (error) {
      console.error("Delete Invoice Error:", error);
      const errorMsg =
        error.response?.data?.message || "Error deleting purchase invoice";
      setNotification(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const formatCurrency = (amount) => {
    return isNaN(amount)
      ? "LKR 0.00"
      : new Intl.NumberFormat("en-LK", {
          style: "currency",
          currency: "LKR",
          minimumFractionDigits: 2,
        }).format(amount);
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open("", "_blank");
    const currentTime = new Date().toLocaleTimeString();

    const printableData = {
      supplier: {
        name: invoice.supplierName || "Unknown",
        address: "Not Provided",
        phone: "Not Provided",
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        qty: item.quantity,
        unitPrice: item.buyingCost,
        freeQty: item.freeItems || 0,
        discountPercentage: item.discountPercentage || 0,
        discountAmount: item.discountAmount || 0,
        total: item.total,
      })),
      invoice: {
        no: invoice.invoiceNumber,
        date: invoice.purchaseDate,
        time: currentTime,
      },
      total: invoice.total,
      footerDetails: {
        dateTime: new Date().toLocaleString(),
      },
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Purchase Invoice</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="p-8 bg-white text-gray-900">
          <!-- Header -->
          <div class="flex justify-between mb-4">
            <div>
              <h2 class="text-3xl font-bold text-blue-900">SK JEELAN</h2>
              <p class="text-gray-600">PVT(Ltd)</p>
            </div>
            <h1 class="text-4xl font-bold text-blue-900 uppercase text-right">Purchase Invoice</h1>
          </div>

          <!-- Supplier & Invoice Details -->
          <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-8 ml-12">
            <div>
              <h4 class="font-semibold text-blue-900 mb-2">Supplier Details</h4>
              <p class="text-gray-900"><strong class="uppercase">Name:</strong> ${
                printableData.supplier.name
              }</p>
              <p class="text-gray-900"><strong class="uppercase">Address:</strong> ${
                printableData.supplier.address
              }</p>
              <p class="text-gray-900"><strong class="uppercase">Phone:</strong> ${
                printableData.supplier.phone
              }</p>
              <p class="text-gray-900"><strong class="uppercase">Status:</strong> ${
                invoice.status
              }</p>
            </div>
            <div>
              <h4 class="font-semibold text-blue-900 mb-2">Invoice Details</h4>
              <p class="text-gray-900"><strong>Invoice No:</strong> ${
                printableData.invoice.no
              }</p>
              <p class="text-gray-900"><strong>Date:</strong> ${
                printableData.invoice.date
              }</p>
              <p class="text-gray-900"><strong>Time:</strong> ${
                printableData.invoice.time
              }</p>
              <p class="text-gray-900"><strong>Tax Percentage:</strong> ${invoice.taxPercentage.toFixed(
                2
              )}%</p>
              <p class="text-gray-900"><strong>Invoice Discount:</strong> ${formatCurrency(
                invoice.discountAmount
              )}</p>
            </div>
          </div>

          <!-- Items Table -->
          <div class="overflow-x-auto">
            <table class="w-full mb-4 border border-gray-300 border-collapse">
              <thead>
                <tr class="bg-blue-900 text-white border border-gray-300 uppercase">
                  <th class="p-2 text-center border border-gray-300">No</th>
                  <th class="p-2 text-center border border-gray-300">Item Description</th>
                  <th class="p-2 text-center border border-gray-300">Qty</th>
                  <th class="p-2 text-center border border-gray-300">Unit Price (LKR)</th>
                  <th class="p-2 text-center border border-gray-300">Free (Qty)</th>
                  <th class="p-2 text-center border border-gray-300">Dis (%)</th>
                  <th class="p-2 text-center border border-gray-300">Dis (LKR)</th>
                  <th class="p-2 text-center border border-gray-300">Total (LKR)</th>
                </tr>
              </thead>
              <tbody>
                ${printableData.items
                  .map(
                    (item, index) => `
                  <tr class="border border-gray-300">
                    <td class="p-2 text-center border border-gray-300 text-gray-900">${
                      index + 1
                    }</td>
                    <td class="p-3 text-left border border-gray-300 text-gray-900">${
                      item.description
                    }</td>
                    <td class="p-3 text-center border border-gray-300 text-gray-900">${
                      item.qty
                    }</td>
                    <td class="p-3 text-right border border-gray-300 text-gray-900">${formatCurrency(
                      item.unitPrice
                    )}</td>
                    <td class="p-3 text-center border border-gray-300 text-gray-900">${
                      item.freeQty
                    }</td>
                    <td class="p-3 text-right border border-gray-300 text-gray-900">${item.discountPercentage.toFixed(
                      2
                    )}%</td>
                    <td class="p-3 text-right border border-gray-300 text-gray-900">${formatCurrency(
                      item.discountAmount
                    )}</td>
                    <td class="p-3 text-right border border-gray-300 text-gray-900">${formatCurrency(
                      item.total
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Total Amount -->
          <div class="text-right mb-4">
            <h3 class="font-semibold text-xl text-blue-900 uppercase">Total: ${formatCurrency(
              printableData.total
            )}</h3>
          </div>

          <!-- Footer Details -->
          <div class="grid pt-4 grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 class="font-semibold text-blue-900">Approved By</h4>
              <p class="text-gray-900">....................</p>
            </div>
            <div>
              <h4 class="font-semibold text-blue-900">Next Approval To</h4>
              <p class="text-gray-900">....................</p>
            </div>
            <div>
              <h4 class="font-semibold text-blue-900">Date & Time</h4>
              <p class="text-gray-900">${
                printableData.footerDetails.dateTime
              }</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

const ViewInvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6 border-b border-gray-300 dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            Purchase Invoice Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            aria-label="Close modal"
          >
            <FiX size={28} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Invoice Info
            </h3>
            <ul className="space-y-1 text-gray-800 dark:text-gray-200">
              <li>
                <span className="font-semibold">Bill Number:</span> {invoice.billNumber}
              </li>
              <li>
                <span className="font-semibold">Invoice Number:</span> {invoice.invoiceNumber}
              </li>
              <li>
                <span className="font-semibold">Purchase Date:</span> {invoice.purchaseDate}
              </li>
              <li>
                <span className="font-semibold">Payment Method:</span> {invoice.paymentMethod}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Supplier & Store
            </h3>
            <ul className="space-y-1 text-gray-800 dark:text-gray-200">
              <li>
                <span className="font-semibold">Supplier:</span> {invoice.supplierName}
              </li>
              <li>
                <span className="font-semibold">Store:</span> {invoice.storeName}
              </li>
              <li>
                <span className="font-semibold">Paid Amount:</span> {formatCurrency(invoice.paidAmount)}
              </li>
              <li>
                <span className="font-semibold">Status:</span> {invoice.status}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Summary
            </h3>
            <ul className="space-y-1 text-gray-800 dark:text-gray-200">
              <li>
                <span className="font-semibold">Invoice Discount Percentage:</span> {invoice.discountPercentage.toFixed(2)}%
              </li>
              <li>
                <span className="font-semibold">Invoice Discount Amount:</span> {formatCurrency(invoice.discountAmount)}
              </li>
              <li>
                <span className="font-semibold">Tax Percentage:</span> {invoice.taxPercentage.toFixed(2)}%
              </li>
              <li>
                <span className="font-semibold">Tax Amount:</span> {formatCurrency(invoice.tax)}
              </li>
              <li className="font-bold text-lg">
                Total: {formatCurrency(invoice.total)}
              </li>
              <li>
                <span className="font-semibold">Balance:</span> {formatCurrency(invoice.total - invoice.paidAmount)}
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Items</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Free Items</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Buying Cost</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Discount (%)</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Discount (LKR)</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Subtotal</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="text-gray-900 dark:text-gray-300">
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-center">{item.freeItems}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.buyingCost)}</td>
                    <td className="px-4 py-2 text-right">{item.discountPercentage.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.discountAmount)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => handlePrint(invoice)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <FiPrinter size={20} /> Print
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
            onClick={() => {
              setEditingInvoice(null);
              setIsInvoiceFormOpen(true);
            }}
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
                max={toDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-gray-600 dark:text-gray-100"
                min={fromDate}
                max={today}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-blue-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Item Subtotal
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-blue-400">
              {formatCurrency(calculateTotals().subtotal)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-red-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Total Item Discount
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-red-400">
              {formatCurrency(calculateTotals().totalItemDiscount)}
            </p>
          </div>
          <div className="p-4 rounded-xl shadow-sm border-l-4 border-red-500 bg-white dark:bg-slate-900">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Invoice Discount
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-red-400">
              {formatCurrency(calculateTotals().totalInvoiceDiscount)}
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
            <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-slate-600 text-sm">
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
                {paginatedPurchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No purchase entries found
                    </td>
                  </tr>
                ) : (
                  paginatedPurchases.map((purchase, index) => (
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
                          {(currentPage - 1) * itemsPerPage + index + 1}
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
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {purchase.status || "Pending"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openViewInvoice(purchase);
                              }}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <FiEye size={18} title="View" />
                            </button>
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
                                    <th className="p-2 border">Discount (%)</th>
                                    <th className="p-2 border">
                                      Discount (LKR)
                                    </th>
                                    <th className="p-2 border">Subtotal</th>
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
                                        {(
                                          parseFloat(
                                            item.discount_percentage
                                          ) || 0
                                        ).toFixed(2)}
                                        %
                                      </td>
                                      <td className="p-2 border">
                                        {formatCurrency(
                                          parseFloat(item.discount_amount) || 0
                                        )}
                                      </td>
                                      <td className="p-2 border">
                                        {formatCurrency(
                                          (parseFloat(item.quantity) || 0) *
                                            (parseFloat(item.buying_cost) || 0)
                                        )}
                                      </td>
                                      <td className="p-2 border">
                                        {formatCurrency(
                                          (parseFloat(item.quantity) || 0) *
                                            (parseFloat(item.buying_cost) ||
                                              0) -
                                            (parseFloat(item.discount_amount) ||
                                              0)
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="text-right space-y-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Item Subtotal:{" "}
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
                                  Total Item Discount:{" "}
                                  {formatCurrency(
                                    purchase.items?.reduce(
                                      (sum, item) =>
                                        sum +
                                        (parseFloat(item.discount_amount) || 0),
                                      0
                                    ) || 0
                                  )}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Invoice Discount Percentage:{" "}
                                  {(
                                    parseFloat(purchase.discount_percentage) ||
                                    0
                                  ).toFixed(2)}
                                  %
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Invoice Discount Amount:{" "}
                                  {formatCurrency(
                                    parseFloat(purchase.discount_amount) || 0
                                  )}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Tax Percentage:{" "}
                                  {calculateTaxPercentage(purchase).toFixed(2)}%
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  Tax Amount:{" "}
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

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1 mx-1 bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {[...Array(totalPages).keys()].map((page) => (
            <button
              key={page + 1}
              onClick={() => handlePageChange(page + 1)}
              className={`px-3 py-1 mx-1 rounded ${
                currentPage === page + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600"
              }`}
            >
              {page + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1 mx-1 bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {isInvoiceFormOpen && (
        <PurchaseInvoiceForm
          onGenerateInvoice={handleGenerateInvoice}
          onCancel={() => {
            setIsInvoiceFormOpen(false);
            setEditingInvoice(null);
          }}
          existingInvoice={editingInvoice}
          suppliers={suppliers}
          stores={stores}
          products={products}
        />
      )}

      {isViewModalOpen && (
        <ViewInvoiceModal
          invoice={viewingInvoice}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default PurchasingEntryForm;
