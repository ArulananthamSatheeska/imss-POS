import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import axios from "axios";

const SalesReturn = () => {
  const { user } = useAuth();
  const api = getApi();
  const [returnItems, setReturnItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [newReturn, setNewReturn] = useState({
    salesReturnNumber: "",
    invoiceOrBillNumber: "",
    customerName: "",
    type: "",
    items: [],
    refundMethod: "cash",
    remarks: "",
    status: "pending",
  });
  const [itemForm, setItemForm] = useState({
    product_id: "",
    search_query: "",
    quantity: 0,
    selling_cost: 0,
    reason: "",
  });
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editReturnId, setEditReturnId] = useState(null);
  const [viewReturn, setViewReturn] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showInvoiceSuggestions, setShowInvoiceSuggestions] = useState(false);
  const [productHighlightedIndex, setProductHighlightedIndex] = useState(-1);
  const [invoiceHighlightedIndex, setInvoiceHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const productSearchRef = useRef(null);
  const invoiceSearchRef = useRef(null);
  const productSearchInputRef = useRef(null);
  const invoiceSearchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const sellingCostInputRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Function to generate sales return number
  const generateSalesReturnNumber = () => {
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    return `SR${dateStr}`;
  };

  // Set initial sales return number when not in edit mode
  useEffect(() => {
    if (!editMode) {
      setNewReturn((prev) => ({
        ...prev,
        salesReturnNumber: generateSalesReturnNumber(),
      }));
    }
  }, [editMode]);

  // Fetch invoices, sales, products, and sales returns on mount
  useEffect(() => {
    if (user?.token) {
      fetchData();
    } else {
      toast.error("Please login to access this form");
      setErrors({ auth: "User not authenticated" });
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [invoicesRes, salesRes, productsRes, returnsRes] =
        await Promise.all([
          api.get(`/invoices?_t=${timestamp}`, {
            headers: { Accept: "application/json" },
          }),
          api.get(`/sales?_t=${timestamp}`, {
            headers: { Accept: "application/json" },
          }),
          api.get(`/products?_t=${timestamp}`),
          api.get(`/sales-returns?_t=${timestamp}`),
        ]);

      // Process invoices
      let invoicesData = [];
      if (Array.isArray(invoicesRes.data.data)) {
        invoicesData = invoicesRes.data.data;
      } else if (Array.isArray(invoicesRes.data)) {
        invoicesData = invoicesRes.data;
      } else {
        throw new Error("Invalid invoices data format");
      }

      // Process sales
      let salesData = [];
      if (Array.isArray(salesRes.data.data)) {
        salesData = salesRes.data.data;
      } else if (Array.isArray(salesRes.data)) {
        salesData = salesRes.data;
      } else {
        throw new Error("Invalid sales data format");
      }

      // Combine and normalize invoice and bill numbers
      const normalizedInvoices = invoicesData.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_no || `INV-${inv.id}`,
        customerName: inv.customer_name || "Walk-in Customer",
        type: "invoice",
      }));

      const normalizedSales = salesData.map((sale) => ({
        id: sale.id,
        invoiceNumber: sale.bill_number || `SALE-${sale.id}`,
        customerName: sale.customer_name || "Walk-in Customer",
        type: "sale",
      }));

      // Combine invoices and sales, remove duplicates, and sort
      const combinedInvoices = [...normalizedInvoices, ...normalizedSales]
        .filter(
          (item, index, self) =>
            index ===
            self.findIndex((t) => t.invoiceNumber === item.invoiceNumber)
        )
        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));

      // Process products
      let productsData = [];
      if (Array.isArray(productsRes.data.data)) {
        productsData = productsRes.data.data;
      } else if (Array.isArray(productsRes.data)) {
        productsData = productsRes.data;
      } else {
        throw new Error("Invalid products data format");
      }

      // Process sales returns
      let returnsData = [];
      if (Array.isArray(returnsRes.data.data)) {
        returnsData = returnsRes.data.data;
      } else if (Array.isArray(returnsRes.data)) {
        returnsData = returnsRes.data;
      } else {
        throw new Error("Invalid sales returns data format");
      }

      returnsData.forEach((returnItem) => {
        if (returnItem.items) {
          returnItem.items.forEach((item) => {
            item.selling_cost = parseFloat(item.selling_cost) || 0;
          });
        }
      });

      // Sort returns by sales_return_number
      returnsData.sort((a, b) =>
        a.sales_return_number.localeCompare(b.sales_return_number)
      );

      setInvoices(combinedInvoices);
      setProducts(productsData);
      setReturnItems(returnsData);

      if (productsData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          products: "No products available. Please add products in the system.",
        }));
        toast.warn("No products available");
      }
      if (combinedInvoices.length === 0) {
        setErrors((prev) => ({
          ...prev,
          invoices: "No invoices or bills available.",
        }));
        toast.warn("No invoices or bills available");
      }
      if (returnsData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          returns: "No sales returns found.",
        }));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error fetching data";
      setErrors({ fetch: errorMsg });
      toast.error(errorMsg);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch customer name and type based on invoice/bill number
  useEffect(() => {
    if (newReturn.invoiceOrBillNumber) {
      const invoice = invoices.find(
        (inv) => inv.invoiceNumber === newReturn.invoiceOrBillNumber
      );
      if (invoice) {
        setNewReturn((prev) => ({
          ...prev,
          customerName: invoice.customerName,
          type: invoice.type,
        }));
      } else {
        setNewReturn((prev) => ({
          ...prev,
          customerName: "",
          type: "",
        }));
      }
    } else {
      setNewReturn((prev) => ({
        ...prev,
        customerName: "",
        type: "",
      }));
    }
  }, [newReturn.invoiceOrBillNumber, invoices]);

  // Filter products based on search query
  useEffect(() => {
    if (itemForm.search_query.trim()) {
      const query = itemForm.search_query.toLowerCase();
      const filtered = products.filter((p) =>
        p.product_name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
      setShowProductSuggestions(true);
      setProductHighlightedIndex(-1);
    } else {
      setFilteredProducts([]);
      setShowProductSuggestions(false);
      setProductHighlightedIndex(-1);
    }
  }, [itemForm.search_query, products]);

  // Filter invoices based on search query
  useEffect(() => {
    if (invoiceSearch.trim()) {
      const query = invoiceSearch.toLowerCase();
      const filtered = invoices.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(query)
      );
      setFilteredInvoices(filtered);
      setShowInvoiceSuggestions(true);
      setInvoiceHighlightedIndex(-1);
    } else {
      setFilteredInvoices([]);
      setShowInvoiceSuggestions(false);
      setInvoiceHighlightedIndex(-1);
    }
  }, [invoiceSearch, invoices]);

  // Fetch selling cost when selecting a product
  useEffect(() => {
    if (itemForm.product_id) {
      const fetchSellingCost = async () => {
        try {
          const response = await axios.get(
            `https://imssposerp.com/backend/public/api/products/${itemForm.product_id}`
          );
          const productData = response.data.data;
          setItemForm((prev) => ({
            ...prev,
            selling_cost: parseFloat(productData.sales_price) || 0,
            search_query: productData.product_name,
          }));
        } catch (error) {
          toast.error("Failed to fetch product selling price");
          setItemForm((prev) => ({
            ...prev,
            selling_cost: 0,
          }));
        }
      };
      fetchSellingCost();
    }
  }, [itemForm.product_id]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productSearchRef.current &&
        !productSearchRef.current.contains(event.target)
      ) {
        setShowProductSuggestions(false);
        setProductHighlightedIndex(-1);
      }
      if (
        invoiceSearchRef.current &&
        !invoiceSearchRef.current.contains(event.target)
      ) {
        setShowInvoiceSuggestions(false);
        setInvoiceHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReturn((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity"
          ? parseInt(value) >= 0
            ? parseInt(value)
            : 0
          : name === "selling_cost"
            ? parseFloat(value) || 0
            : value,
    }));
  };

  const handleSelectProduct = (product) => {
    setItemForm({
      ...itemForm,
      product_id: product.product_id.toString(),
      search_query: product.product_name,
      selling_cost: 0, // Will be updated by API call
    });
    setShowProductSuggestions(false);
    setProductHighlightedIndex(-1);
    quantityInputRef.current?.focus();
  };

  const handleSelectInvoice = (invoice) => {
    setNewReturn((prev) => ({
      ...prev,
      invoiceOrBillNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      type: invoice.type,
    }));
    setInvoiceSearch(invoice.invoiceNumber);
    setShowInvoiceSuggestions(false);
    setInvoiceHighlightedIndex(-1);
    productSearchInputRef.current?.focus();
  };

  const handleProductSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setProductHighlightedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setProductHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && productHighlightedIndex >= 0) {
      e.preventDefault();
      handleSelectProduct(filteredProducts[productHighlightedIndex]);
    } else if (
      e.key === "Enter" &&
      !showProductSuggestions &&
      itemForm.product_id
    ) {
      e.preventDefault();
      quantityInputRef.current?.focus();
    }
  };

  const handleInvoiceSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setInvoiceHighlightedIndex((prev) =>
        prev < filteredInvoices.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setInvoiceHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && invoiceHighlightedIndex >= 0) {
      e.preventDefault();
      handleSelectInvoice(filteredInvoices[invoiceHighlightedIndex]);
    } else if (
      e.key === "Enter" &&
      !showInvoiceSuggestions &&
      newReturn.invoiceOrBillNumber
    ) {
      e.preventDefault();
      productSearchInputRef.current?.focus();
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sellingCostInputRef.current?.focus();
    }
  };

  const handleSellingCostKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      reasonInputRef.current?.focus();
    }
  };

  const handleReasonKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
      productSearchInputRef.current?.focus();
    }
  };

  const handleAddItem = () => {
    const selectedProduct = products.find(
      (p) => p.product_id === parseInt(itemForm.product_id)
    );
    if (!selectedProduct) {
      toast.error("Please select a valid product");
      return;
    }
    if (itemForm.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (itemForm.selling_cost < 0) {
      toast.error("Selling cost cannot be negative");
      return;
    }

    const newItem = {
      product_id: itemForm.product_id,
      product_name: selectedProduct.product_name,
      quantity: itemForm.quantity,
      selling_cost: itemForm.selling_cost,
      reason: itemForm.reason || null,
    };

    setNewReturn({
      ...newReturn,
      items: [...newReturn.items, newItem],
    });

    setItemForm({
      product_id: "",
      search_query: "",
      quantity: 0,
      selling_cost: 0,
      reason: "",
    });
    setShowProductSuggestions(false);
    productSearchInputRef.current?.focus();
  };

  const handleRemoveItem = (index) => {
    setNewReturn({
      ...newReturn,
      items: newReturn.items.filter((_, i) => i !== index),
    });
  };

  const handleEditReturn = async (returnItem) => {
    try {
      const response = await api.get(`/sales-returns/${returnItem.id}`);
      const data = response.data.data;
      setNewReturn({
        salesReturnNumber: data.sales_return_number,
        invoiceOrBillNumber: data.invoice_no || data.bill_number,
        customerName: data.customer_name,
        type: data.invoice_no ? "invoice" : "sale",
        items: data.items.map((item) => ({
          product_id: item.product_id.toString(),
          product_name: item.product_name,
          quantity: item.quantity,
          selling_cost: parseFloat(item.selling_cost),
          reason: item.reason || "",
        })),
        refundMethod: data.refund_method,
        remarks: data.remarks || "",
        status: data.status,
      });
      setInvoiceSearch(data.invoice_no || data.bill_number);
      setEditMode(true);
      setEditReturnId(returnItem.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error fetching return";
      toast.error(errorMsg);
    }
  };

  const handleViewReturn = async (returnItem) => {
    try {
      const response = await api.get(`/sales-returns/${returnItem.id}`);
      setViewReturn(response.data.data);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error fetching return";
      toast.error(errorMsg);
    }
  };

  const handleCloseView = () => {
    setViewReturn(null);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditReturnId(null);
    setNewReturn({
      salesReturnNumber: generateSalesReturnNumber(),
      invoiceOrBillNumber: "",
      customerName: "",
      type: "",
      items: [],
      refundMethod: "cash",
      remarks: "",
      status: "pending",
    });
    setItemForm({
      product_id: "",
      search_query: "",
      quantity: 0,
      selling_cost: 0,
      reason: "",
    });
    setInvoiceSearch("");
  };

  const handleSubmitReturn = async () => {
    if (
      !newReturn.salesReturnNumber ||
      !newReturn.invoiceOrBillNumber ||
      !newReturn.customerName ||
      newReturn.items.length === 0
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const returnData = {
        sales_return_number: newReturn.salesReturnNumber,
        customer_name: newReturn.customerName,
        items: newReturn.items.map((item) => ({
          ...item,
          selling_cost: item.selling_cost,
        })),
        refund_method: newReturn.refundMethod,
        remarks: newReturn.remarks,
        status: newReturn.status,
      };

      if (newReturn.type === "invoice") {
        returnData.invoice_no = newReturn.invoiceOrBillNumber;
        returnData.bill_number = null;
      } else if (newReturn.type === "sale") {
        returnData.bill_number = newReturn.invoiceOrBillNumber;
        returnData.invoice_no = null;
      } else {
        throw new Error("Invalid type: must be 'invoice' or 'sale'");
      }

      let response;
      if (editMode) {
        response = await api.put(`/sales-returns/${editReturnId}`, returnData);
        toast.success("Sales return updated successfully!");
        const updatedItems = returnItems
          .map((item) => (item.id === editReturnId ? response.data.data : item))
          .sort((a, b) =>
            a.sales_return_number.localeCompare(b.sales_return_number)
          );
        setReturnItems(updatedItems);
        handleCancelEdit();
      } else {
        response = await api.post("/sales-returns", returnData);
        toast.success("Sales return submitted successfully!");
        const newReturnItem = {
          ...response.data.data,
          items: response.data.data.items.map((item) => ({
            ...item,
            selling_cost: parseFloat(item.selling_cost) || 0,
          })),
        };
        setReturnItems(
          [...returnItems, newReturnItem].sort((a, b) =>
            a.sales_return_number.localeCompare(b.sales_return_number)
          )
        );
        setNewReturn({
          salesReturnNumber: generateSalesReturnNumber(),
          invoiceOrBillNumber: "",
          customerName: "",
          type: "",
          items: [],
          refundMethod: "cash",
          remarks: "",
          status: "pending",
        });
        setItemForm({
          product_id: "",
          search_query: "",
          quantity: 0,
          selling_cost: 0,
          reason: "",
        });
        setInvoiceSearch("");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : "Error submitting sales return");
      toast.error(errorMsg);
      setErrors({ submit: errorMsg });
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReturn = async (id) => {
    if (window.confirm("Are you sure you want to delete this sales return?")) {
      setLoading(true);
      try {
        await api.delete(`/sales-returns/${id}`);
        setReturnItems(returnItems.filter((item) => item.id !== id));
        setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
        toast.success("Sales return deleted successfully!");
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Error deleting sales return";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const formatSellingCost = (cost) => {
    const parsedCost = parseFloat(cost);
    return isNaN(parsedCost) ? "0.00" : parsedCost.toFixed(2);
  };

  const calculateTotalAmount = (items) => {
    return items
      .reduce((total, item) => {
        const cost = parseFloat(item.selling_cost) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + cost * quantity;
      }, 0)
      .toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Sales Return Form */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {editMode ? "Edit Sales Return" : "Sales Return Form"}
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {loading && (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {Object.keys(errors).length > 0 && (
              <div className="p-2 mb-4 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                {Object.values(errors).filter(Boolean).join(", ")}
              </div>
            )}
            {!loading && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Sales Return Number
                    </label>
                    <input
                      type="text"
                      name="salesReturnNumber"
                      value={newReturn.salesReturnNumber}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled
                    />
                  </div>
                  <div ref={invoiceSearchRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Invoice/Bill Number
                    </label>
                    <div className="relative">
                      <input
                        ref={invoiceSearchInputRef}
                        type="text"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        onFocus={() =>
                          invoiceSearch && setShowInvoiceSuggestions(true)
                        }
                        onKeyDown={handleInvoiceSearchKeyDown}
                        placeholder="Search Invoice/Bill Number..."
                        className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={loading}
                      />
                      <FiSearch className="absolute left-2 top-3 text-gray-400" />
                    </div>
                    {showInvoiceSuggestions && filteredInvoices.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                        {filteredInvoices.map((invoice, index) => (
                          <li
                            key={`${invoice.type}-${invoice.id}`}
                            onClick={() => handleSelectInvoice(invoice)}
                            className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer dark:text-white ${
                              invoiceHighlightedIndex === index
                                ? "bg-gray-100 dark:bg-gray-600"
                                : ""
                            }`}
                          >
                            {invoice.invoiceNumber} (
                            {invoice.type === "invoice" ? "Invoice" : "Sale"})
                          </li>
                        ))}
                      </ul>
                    )}
                    {showInvoiceSuggestions &&
                      invoiceSearch &&
                      filteredInvoices.length === 0 && (
                        <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-4 text-gray-500 dark:text-gray-300">
                          No invoices or bills found
                        </div>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      placeholder="Customer Name"
                      value={newReturn.customerName}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Items to Return
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div ref={productSearchRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Search Product
                      </label>
                      <div className="relative">
                        <input
                          ref={productSearchInputRef}
                          type="text"
                          name="search_query"
                          value={itemForm.search_query}
                          onChange={handleItemFormChange}
                          onFocus={() =>
                            itemForm.search_query &&
                            setShowProductSuggestions(true)
                          }
                          onKeyDown={handleProductSearchKeyDown}
                          placeholder="Search Product..."
                          className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={loading}
                        />
                        <FiSearch className="absolute left-2 top-3 text-gray-400" />
                      </div>
                      {showProductSuggestions &&
                        filteredProducts.length > 0 && (
                          <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                            {filteredProducts.map((product, index) => (
                              <li
                                key={product.product_id ?? index}
                                onClick={() => handleSelectProduct(product)}
                                className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer dark:text-white ${
                                  productHighlightedIndex === index
                                    ? "bg-gray-100 dark:bg-gray-600"
                                    : ""
                                }`}
                              >
                                {product.product_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      {showProductSuggestions &&
                        itemForm.search_query &&
                        filteredProducts.length === 0 && (
                          <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-4 text-gray-500 dark:text-gray-300">
                            No products found
                          </div>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Quantity
                      </label>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        name="quantity"
                        value={itemForm.quantity}
                        onChange={handleItemFormChange}
                        onKeyDown={handleQuantityKeyDown}
                        placeholder="Quantity"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="0"
                        step="1"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Selling Cost
                      </label>
                      <input
                        ref={sellingCostInputRef}
                        type="number"
                        name="selling_cost"
                        value={itemForm.selling_cost.toFixed(2)}
                        onChange={handleItemFormChange}
                        onKeyDown={handleSellingCostKeyDown}
                        placeholder="Selling Cost"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Reason (Optional)
                      </label>
                      <input
                        ref={reasonInputRef}
                        type="text"
                        name="reason"
                        value={itemForm.reason}
                        onChange={handleItemFormChange}
                        onKeyDown={handleReasonKeyDown}
                        placeholder="Reason (Optional)"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddItem}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                        disabled={
                          loading ||
                          !itemForm.product_id ||
                          itemForm.quantity <= 0
                        }
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                  {newReturn.items.length > 0 && (
                    <table className="min-w-full border border-gray-300 rounded-md mt-4">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-300">
                            Product
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-300">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-300">
                            Total Cost
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-300">
                            Reason
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {newReturn.items.map((item, index) => (
                          <tr
                            key={item.product_id + index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                              LKR{" "}
                              {formatSellingCost(
                                item.quantity * item.selling_cost
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {item.reason || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-red-500 cursor-pointer hover:text-red-700">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                disabled={loading}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <td
                            colSpan="2"
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 text-right"
                          >
                            Subtotal:
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            LKR {calculateTotalAmount(newReturn.items)}
                          </td>
                          <td colSpan="2" className="px-4 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Refund Method
                  </label>
                  <select
                    name="refundMethod"
                    value={newReturn.refundMethod}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="store-credit">Store Credit</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={newReturn.remarks}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newReturn.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleSubmitReturn}
                    className="w-full md:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
                    disabled={
                      loading ||
                      !newReturn.salesReturnNumber ||
                      !newReturn.invoiceOrBillNumber ||
                      !newReturn.customerName ||
                      newReturn.items.length === 0
                    }
                  >
                    {editMode ? "Update Return" : "Submit Return"}
                  </button>
                  {editMode && (
                    <button
                      onClick={handleCancelEdit}
                      className="w-full md:w-auto bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Return Modal */}
        {viewReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Sales Return Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Sales Return Number
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.sales_return_number || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Invoice/Bill Number
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.invoice_no || viewReturn.bill_number || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Customer Name
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.customer_name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Items
                  </label>
                  <table className="min-w-full mt-2">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                          Product
                        </th>
                        <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                          Quantity
                        </th>
                        <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                          Total Cost
                        </th>
                        <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewReturn.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                            {item.product_name}
                          </td>
                          <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                            LKR{" "}
                            {formatSellingCost(
                              item.quantity * item.selling_cost
                            )}
                          </td>
                          <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                            {item.reason || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Total Amount
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    LKR {calculateTotalAmount(viewReturn.items)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Refund Method
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.refund_method || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Remarks
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.remarks || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Status
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.status || "N/A"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseView}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sales Return History */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Sales Return History
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {returnItems.length === 0 && !loading && (
              <p className="text-gray-500 dark:text-gray-300">
                No sales returns found.
              </p>
            )}
            {returnItems.length > 0 && (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-12"></th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Sales Return Number
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Invoice/Bill Number
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Customer Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Total Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Refund Method
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((returnItem) => (
                    <React.Fragment key={returnItem.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          <button
                            onClick={() => toggleRowExpansion(returnItem.id)}
                            className="focus:outline-none"
                            disabled={loading}
                          >
                            {expandedRows.includes(returnItem.id) ? (
                              <FiChevronUp className="text-gray-700 dark:text-gray-200" />
                            ) : (
                              <FiChevronDown className="text-gray-700 dark:text-gray-200" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {returnItem.sales_return_number || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {returnItem.invoice_no ||
                            returnItem.bill_number ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {returnItem.customer_name || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          LKR {calculateTotalAmount(returnItem.items)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {returnItem.refund_method || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {returnItem.status || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          <button
                            onClick={() => handleViewReturn(returnItem)}
                            className="text-green-500 hover:text-green-700 mr-2"
                            disabled={loading}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditReturn(returnItem)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReturn(returnItem.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedRows.includes(returnItem.id) && (
                        <tr>
                          <td
                            colSpan="8"
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-700"
                          >
                            <div className="p-4 border border-gray-300 rounded">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Item Details
                              </h4>
                              <table className="min-w-full border border-gray-300 rounded">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300">
                                    <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-r border-gray-300">
                                      Product
                                    </th>
                                    <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-r border-gray-300">
                                      Quantity
                                    </th>
                                    <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-r border-gray-300">
                                      Total Cost
                                    </th>
                                    <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                                      Reason
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {returnItem.items.map((item, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-300 last:border-b-0"
                                    >
                                      <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 border-r border-gray-300">
                                        {item.product_name}
                                      </td>
                                      <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 border-r border-gray-300">
                                        {item.quantity}
                                      </td>
                                      <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 border-r border-gray-300">
                                        LKR{" "}
                                        {formatSellingCost(
                                          item.quantity * item.selling_cost
                                        )}
                                      </td>
                                      <td className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                                        {item.reason || "N/A"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturn;
