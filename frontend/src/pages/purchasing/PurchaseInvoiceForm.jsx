import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import {
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiPlusCircle,
  FiTrash2,
} from "react-icons/fi";

const PurchaseInvoiceForm = ({
  onGenerateInvoice,
  onCancel,
  existingInvoice,
}) => {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(
    existingInvoice || {
      billNumber: `GRN-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}-${Date.now().toString().slice(-4)}`,
      invoiceNumber: "PINV-" + Date.now(),
      purchaseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      supplierId: "",
      storeId: "",
      paidAmount: 0,
      status: "unpaid",
      discountPercentage: 0,
      discountAmount: 0,
      discountAmountEdited: false,
      taxPercentage: 0,
      tax: 0,
      taxEdited: false,
    }
  );

  const [items, setItems] = useState(existingInvoice?.items || []);
  const [itemForm, setItemForm] = useState({
    itemId: "",
    searchQuery: "",
    quantity: 1,
    freeItems: 0,
    buyingCost: 0,
    discountPercentage: 0,
    discountAmount: 0,
    discountAmountEdited: false,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs for input fields
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const freeItemsInputRef = useRef(null);
  const buyingCostInputRef = useRef(null);
  const discountPercentageInputRef = useRef(null);
  const discountAmountInputRef = useRef(null);
  const itemDiscountPercentageInputRef = useRef(null);
  const itemDiscountAmountInputRef = useRef(null);
  const taxPercentageInputRef = useRef(null);
  const taxInputRef = useRef(null);
  const paidAmountInputRef = useRef(null);
  const supplierSelectRef = useRef(null);
  const storeSelectRef = useRef(null);
  const generateInvoiceButtonRef = useRef(null);

  const api = getApi();

  // Fetch data on mount
  useEffect(() => {
    if (user?.token) {
      fetchData();
    } else {
      toast.error("Please login to access this form");
      setErrors({ auth: "User not authenticated" });
    }
  }, [user]);

  // Update billNumber when purchaseDate changes
  useEffect(() => {
    if (!existingInvoice) {
      const datePart = invoice.purchaseDate.replace(/-/g, "");
      const uniquePart = Date.now().toString().slice(-4);
      setInvoice((prev) => ({
        ...prev,
        billNumber: `GRN-${datePart}-${uniquePart}`,
      }));
    }
  }, [invoice.purchaseDate, existingInvoice]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [suppliersRes, storesRes, productsRes] = await Promise.all([
        api.get(`/api/suppliers?_t=${timestamp}`),
        api.get(`/api/store-locations?_t=${timestamp}`),
        api.get(`/api/products?_t=${timestamp}`),
      ]);

      const suppliersData = Array.isArray(suppliersRes.data.data)
        ? suppliersRes.data.data
        : Array.isArray(suppliersRes.data)
          ? suppliersRes.data
          : [];
      const storesData = Array.isArray(storesRes.data.data)
        ? storesData.data.data
        : Array.isArray(storesRes.data)
          ? storesRes.data
          : [];
      const productsData = Array.isArray(productsRes.data.data)
        ? productsRes.data.data
        : Array.isArray(productsRes.data)
          ? productsRes.data
          : [];

      setSuppliers(suppliersData);
      setStores(storesData);
      setProducts(productsData);

      if (suppliersData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          suppliers:
            "No suppliers available. Please add suppliers in the system.",
        }));
        toast.warn("No suppliers available");
      }
      if (storesData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          stores: "No stores available. Please add stores in the system.",
        }));
        toast.warn("No stores available");
      }
      if (productsData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          products: "No products available. Please add products in the system.",
        }));
        toast.warn("No products available");
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

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (itemForm.searchQuery.trim()) {
      const query = itemForm.searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(query) ||
          p.item_code?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }, [itemForm.searchQuery, products]);

  // Prefill buyingCost when selecting a product
  useEffect(() => {
    if (itemForm.itemId) {
      const selectedProduct = products.find(
        (p) => p.product_id === parseInt(itemForm.itemId)
      );
      if (selectedProduct?.buying_cost) {
        setItemForm((prev) => ({
          ...prev,
          buyingCost: parseFloat(selectedProduct.buying_cost) || 0,
          searchQuery: selectedProduct.product_name,
        }));
      }
    }
  }, [itemForm.itemId, products]);

  // Update item discount amount based on percentage
  useEffect(() => {
    if (itemForm.discountPercentage > 0 && !itemForm.discountAmountEdited) {
      const itemSubtotal =
        (itemForm.quantity + itemForm.freeItems) * itemForm.buyingCost;
      setItemForm((prev) => ({
        ...prev,
        discountAmount: (itemSubtotal * itemForm.discountPercentage) / 100,
      }));
    }
  }, [
    itemForm.discountPercentage,
    itemForm.quantity,
    itemForm.freeItems,
    itemForm.buyingCost,
  ]);

  // Update item discount percentage based on amount
  useEffect(() => {
    if (itemForm.discountAmount > 0 && itemForm.discountAmountEdited) {
      const itemSubtotal =
        (itemForm.quantity + itemForm.freeItems) * itemForm.buyingCost;
      const calculatedPercentage =
        itemSubtotal > 0 ? (itemForm.discountAmount / itemSubtotal) * 100 : 0;
      setItemForm((prev) => ({
        ...prev,
        discountPercentage: parseFloat(calculatedPercentage.toFixed(1)),
      }));
    }
  }, [itemForm.discountAmount]);

  // Update invoice discount amount based on percentage
  useEffect(() => {
    if (invoice.discountPercentage > 0 && !invoice.discountAmountEdited) {
      const subtotal = calculateSubtotal();
      setInvoice((prev) => ({
        ...prev,
        discountAmount: (subtotal * invoice.discountPercentage) / 100,
      }));
    }
  }, [invoice.discountPercentage, items]);

  // Update invoice discount percentage based on amount
  useEffect(() => {
    if (invoice.discountAmount > 0 && invoice.discountAmountEdited) {
      const subtotal = calculateSubtotal();
      const calculatedPercentage =
        subtotal > 0 ? (invoice.discountAmount / subtotal) * 100 : 0;
      setInvoice((prev) => ({
        ...prev,
        discountPercentage: parseFloat(calculatedPercentage.toFixed(1)),
      }));
    }
  }, [invoice.discountAmount, items]);

  // Update tax amount based on percentage
  useEffect(() => {
    if (invoice.taxPercentage > 0 && !invoice.taxEdited) {
      const subtotal = calculateSubtotal();
      const taxableAmount = subtotal - invoice.discountAmount;
      setInvoice((prev) => ({
        ...prev,
        tax: (taxableAmount * invoice.taxPercentage) / 100,
      }));
    }
  }, [invoice.taxPercentage, invoice.discountAmount, items]);

  // Update tax percentage based on amount
  useEffect(() => {
    if (invoice.tax > 0 && invoice.taxEdited) {
      const subtotal = calculateSubtotal();
      const taxableAmount = subtotal - invoice.discountAmount;
      const calculatedPercentage =
        taxableAmount > 0 ? (invoice.tax / taxableAmount) * 100 : 0;
      setInvoice((prev) => ({
        ...prev,
        taxPercentage: parseFloat(calculatedPercentage.toFixed(1)),
      }));
    }
  }, [invoice.tax, invoice.discountAmount, items]);

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]:
        name === "searchQuery"
          ? value
          : name === "itemId"
            ? value
            : parseFloat(value) || 0,
      ...(name === "discountPercentage"
        ? { discountAmountEdited: false, discountAmount: 0 }
        : {}),
      ...(name === "discountAmount"
        ? { discountAmountEdited: true, discountPercentage: 0 }
        : {}),
    }));
  };

  const handleSelectProduct = (product) => {
    setItemForm({
      ...itemForm,
      itemId: product.product_id.toString(),
      searchQuery: product.product_name,
      buyingCost: parseFloat(product.buying_cost) || 0,
    });
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    quantityInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectProduct(filteredProducts[highlightedIndex]);
    } else if (e.key === "Enter" && !showSuggestions && itemForm.itemId) {
      e.preventDefault();
      quantityInputRef.current?.focus();
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      freeItemsInputRef.current?.focus();
    }
  };

  const handleFreeItemsKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buyingCostInputRef.current?.focus();
    }
  };

  const handleBuyingCostKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      itemDiscountPercentageInputRef.current?.focus();
    }
  };

  const handleDiscountPercentageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      itemDiscountAmountInputRef.current?.focus();
    }
  };

  const handleDiscountAmountKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
      searchInputRef.current?.focus();
    }
  };

  const handleInvoiceDiscountPercentageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      taxPercentageInputRef.current?.focus();
    }
  };

  const handleInvoiceDiscountAmountKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      taxPercentageInputRef.current?.focus();
    }
  };

  const handleTaxPercentageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      taxInputRef.current?.focus();
    }
  };

  const handleTaxKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      paidAmountInputRef.current?.focus();
    }
  };

  const handlePaidAmountKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateInvoiceButtonRef.current?.focus();
    }
  };
  const handleSupplierKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      storeSelectRef.current?.focus();
    }
  };
  const handleStoreKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };
  const handleGenerateInvoiceKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.form?.requestSubmit();
    }
  };

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      [name]:
        name === "paidAmount" ||
        name === "discountPercentage" ||
        name === "discountAmount" ||
        name === "taxPercentage" ||
        name === "tax"
          ? parseFloat(value) || 0
          : value,
      ...(name === "discountPercentage"
        ? { discountAmountEdited: false, discountAmount: 0 }
        : {}),
      ...(name === "discountAmount"
        ? { discountAmountEdited: true, discountPercentage: 0 }
        : {}),
      ...(name === "taxPercentage" ? { taxEdited: false, tax: 0 } : {}),
      ...(name === "tax" ? { taxEdited: true, taxPercentage: 0 } : {}),
    }));
  };

  // const addItem = () => {
  //   const selectedItem = products.find(
  //     (p) => p.product_id === parseInt(itemForm.itemId)
  //   );
  //   if (!selectedItem) {
  //     setErrors({ item: "Please select a valid item." });
  //     toast.error("Please select a valid item.");
  //     return;
  //   }

  //   const totalQuantity = itemForm.quantity + itemForm.freeItems;
  //   const subtotal = totalQuantity * itemForm.buyingCost;
  //   const total = subtotal - itemForm.discountAmount;

  //   const newItem = {
  //     id: items.length + 1,
  //     productId: selectedItem.product_id,
  //     description: selectedItem.product_name,
  //     quantity: itemForm.quantity,
  //     freeItems: itemForm.freeItems,
  //     buyingCost: itemForm.buyingCost,
  //     discountPercentage: itemForm.discountPercentage,
  //     discountAmount: itemForm.discountAmount,
  //     subtotal,
  //     total,
  //   };

  //   setItems([...items, newItem]);
  //   resetItemForm();
  //   searchInputRef.current?.focus();
  // };
  const addItem = () => {
    const selectedItem = products.find(
      (p) => p.product_id === parseInt(itemForm.itemId)
    );
    if (!selectedItem) {
      setErrors({ item: "Please select a valid item." });
      toast.error("Please select a valid item.");
      return;
    }

    const totalQuantity = itemForm.quantity + itemForm.freeItems;
    const subtotal = totalQuantity * itemForm.buyingCost;
    const total = subtotal - itemForm.discountAmount;

    const newItem = {
      id: items.length + 1,
      productId: selectedItem.product_id,
      description: selectedItem.product_name,
      quantity: itemForm.quantity,
      freeItems: itemForm.freeItems,
      buyingCost: itemForm.buyingCost,
      discountPercentage: itemForm.discountPercentage,
      discountAmount: itemForm.discountAmount,
      subtotal,
      total,
    };

    setItems([...items, newItem]);
    resetItemForm();
    searchInputRef.current?.focus();
  };
  const resetItemForm = () => {
    setItemForm({
      itemId: "",
      searchQuery: "",
      quantity: 1,
      freeItems: 0,
      buyingCost: 0,
      discountPercentage: 0,
      discountAmount: 0,
      discountAmountEdited: false,
    });
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setErrors((prev) => ({ ...prev, item: undefined }));
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateItemSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.buyingCost,
      0
    );
  };

  const calculateTotalItemDiscount = () => {
    return items.reduce((sum, item) => sum + item.discountAmount, 0);
  };

  const calculateSubtotal = () => {
    return calculateItemSubtotal() - calculateTotalItemDiscount();
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - invoice.discountAmount + invoice.tax;
  };

  const calculateBalance = () => {
    return calculateFinalTotal() - (invoice.paidAmount || 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!invoice.billNumber) newErrors.billNumber = "Bill Number is required";
    if (!invoice.invoiceNumber)
      newErrors.invoiceNumber = "Invoice Number is required";
    if (!invoice.purchaseDate)
      newErrors.purchaseDate = "Purchase Date is required";
    if (!invoice.supplierId) newErrors.supplierId = "Supplier is required";
    if (!invoice.storeId) newErrors.storeId = "Store is required";
    if (items.length === 0) newErrors.items = "At least one item is required";
    if (invoice.paidAmount < 0)
      newErrors.paidAmount = "Paid amount cannot be negative";
    if (invoice.discountPercentage < 0)
      newErrors.discountPercentage =
        "Invoice discount percentage cannot be negative";
    if (invoice.discountAmount < 0)
      newErrors.discountAmount = "Invoice discount amount cannot be negative";
    if (invoice.taxPercentage < 0)
      newErrors.taxPercentage = "Tax percentage cannot be negative";
    if (invoice.tax < 0) newErrors.tax = "Tax cannot be negative";
    items.forEach((item, index) => {
      if (item.discountPercentage < 0)
        newErrors[`item_${index}_discountPercentage`] =
          "Item discount percentage cannot be negative";
      if (item.discountAmount < 0)
        newErrors[`item_${index}_discountAmount`] =
          "Item discount amount cannot be negative";
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const newInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      billNumber: invoice.billNumber,
      purchaseDate: invoice.purchaseDate,
      paymentMethod: invoice.paymentMethod,
      supplierId: invoice.supplierId,
      storeId: invoice.storeId,
      paidAmount: invoice.paidAmount,
      status: invoice.status,
      discountPercentage: invoice.discountPercentage,
      discountAmount: invoice.discountAmount,
      taxPercentage: invoice.taxPercentage,
      tax: invoice.tax,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        freeItems: item.freeItems,
        buyingCost: item.buyingCost,
        discountPercentage: item.discountPercentage,
        discountAmount: item.discountAmount,
      })),
      total: calculateFinalTotal(),
    };
    onGenerateInvoice(newInvoice);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-slate-400 bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 w-full h-full p-6 shadow-xl overflow-y-auto">
        <button
          onClick={onCancel}
          className="absolute text-gray-500 transition top-4 right-4 hover:text-red-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {existingInvoice
            ? "Edit Purchase Invoice"
            : "Create Purchase Invoice"}
        </h2>
        <div className="max-w-full p-4 mx-auto space-y-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          {Object.keys(errors).length > 0 && (
            <div className="p-2 mb-4 text-red-800 bg-red-100 rounded dark:bg-red-900 dark:text-red-200">
              {Object.values(errors).filter(Boolean).join(", ")}
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          {!loading && (
            <form
              onSubmit={handleSubmit}
              className="w-full h-full p-6 bg-slate-100 text-slate-900 dark:text-white dark:bg-gray-800 space-y-6 overflow-y-auto"
            >
              {/* Purchase Details */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-800 dark:text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={invoice.purchaseDate}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium  text-slate-800 dark:text-gray-300 mb-1">
                    Bill Number
                  </label>
                  <input
                    type="text"
                    name="billNumber"
                    value={invoice.billNumber}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="GRN-00001"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium  text-slate-800 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={invoice.paymentMethod}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium  text-slate-800 dark:text-gray-300 mb-1">
                    Supplier
                  </label>
                  <select
                    ref={supplierSelectRef}
                    name="supplierId"
                    value={invoice.supplierId}
                    onChange={handleInvoiceChange}
                    onKeyDown={handleSupplierKeyDown}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium  text-slate-800 dark:text-gray-300 mb-1">
                    Store
                  </label>
                  <select
                    ref={storeSelectRef}
                    name="storeId"
                    value={invoice.storeId}
                    onChange={handleInvoiceChange}
                    onKeyDown={handleStoreKeyDown}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Store</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.store_name}
                      </option>
                    ))}
                  </select>
                </div>

                {existingInvoice && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      name="status"
                      value={invoice.status}
                      onChange={handleInvoiceChange}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="unopaid">unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Item Selection */}
              <div className="p-6 bg-white rounded-xl shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FiPlusCircle className="text-blue-500" />
                  Add Item
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-7">
                  {/* Search Item */}
                  <div ref={searchRef} className="relative md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Search Item
                    </label>
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        name="searchQuery"
                        value={itemForm.searchQuery}
                        onChange={handleItemFormChange}
                        onFocus={() =>
                          itemForm.searchQuery && setShowSuggestions(true)
                        }
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Type to search products..."
                        className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                        disabled={loading}
                      />
                      <FiSearch className="absolute text-gray-400 left-3 top-3.5" />
                    </div>
                    {showSuggestions && filteredProducts.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-60 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredProducts.map((p, index) => (
                          <li
                            key={p.product_id}
                            onClick={() => handleSelectProduct(p)}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors ${
                              highlightedIndex === index
                                ? "bg-blue-50 dark:bg-gray-600"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {p.product_name}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300">
                                Stock: {p.opening_stock_quantity || 0}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {showSuggestions &&
                      itemForm.searchQuery &&
                      filteredProducts.length === 0 && (
                        <div className="absolute z-10 w-full p-3 text-gray-500 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                          No products found
                        </div>
                      )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity
                    </label>
                    <input
                      ref={quantityInputRef}
                      type="number"
                      name="quantity"
                      value={itemForm.quantity}
                      onChange={handleItemFormChange}
                      onKeyDown={handleQuantityKeyDown}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                      min="1"
                      step="1"
                      disabled={loading}
                    />
                  </div>

                  {/* Free Items */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Free Items
                    </label>
                    <input
                      ref={freeItemsInputRef}
                      type="number"
                      name="freeItems"
                      value={itemForm.freeItems}
                      onChange={handleItemFormChange}
                      onKeyDown={handleFreeItemsKeyDown}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                      min="0"
                      step="1"
                      disabled={loading}
                    />
                  </div>

                  {/* Buying Cost */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Buying Cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                        $
                      </span>
                      <input
                        ref={buyingCostInputRef}
                        type="number"
                        name="buyingCost"
                        value={itemForm.buyingCost.toFixed(2)}
                        onChange={handleItemFormChange}
                        onKeyDown={handleBuyingCostKeyDown}
                        className="w-full p-2.5 pl-8 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Discount
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          ref={itemDiscountPercentageInputRef}
                          type="number"
                          name="discountPercentage"
                          value={itemForm.discountPercentage}
                          onChange={handleItemFormChange}
                          onKeyDown={handleDiscountPercentageKeyDown}
                          className="w-full p-2.5 pr-8 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                          placeholder="0%"
                          min="0"
                          max="100"
                          step="0.1"
                          disabled={loading || !itemForm.itemId}
                        />
                        <span className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
                          %
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400"></span>
                        <input
                          ref={itemDiscountAmountInputRef}
                          type="number"
                          name="discountAmount"
                          value={itemForm.discountAmount}
                          onChange={handleItemFormChange}
                          onKeyDown={handleDiscountAmountKeyDown}
                          className="w-full p-2.5 pl-8 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                          min="0"
                          step="0.01"
                          disabled={loading || !itemForm.itemId}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-end gap-3">
                    <button
                      type="button"
                      tabIndex={0}
                      onClick={addItem}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem();
                          searchInputRef.current?.focus();
                        }
                      }}
                      className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-all ${
                        loading || !itemForm.itemId || itemForm.quantity <= 0
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
                      } flex items-center justify-center gap-2`}
                      disabled={
                        loading || !itemForm.itemId || itemForm.quantity <= 0
                      }
                    >
                      <FiPlus /> Add
                    </button>
                    <button
                      type="button"
                      onClick={resetItemForm}
                      className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      <FiRefreshCw size={14} /> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Items */}
              {items.length > 0 && (
                <div className="space-y-6">
                  {/* Items Table */}
                  <div className="overflow-hidden border border-gray-200 rounded-xl dark:border-gray-700 shadow-sm">
                    <div className="overflow-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-left">
                              #
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-left">
                              Description
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">
                              Free
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                              Unit Cost
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                              Total
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                              Disc. %
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                              Disc. Amt
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                              Subtotal
                            </th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                          {items.map((item, index) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {item.description}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                                {item.freeItems}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                                LKR {item.buyingCost.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                                LKR{" "}
                                {(item.quantity * item.buyingCost).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                                {item.discountPercentage.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                                LKR {item.discountAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">
                                LKR{" "}
                                {(
                                  item.quantity * item.buyingCost -
                                  item.discountAmount
                                ).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeItem(index)}
                                  disabled={loading}
                                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-gray-600"
                                  title="Remove item"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary and Calculations */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Totals Summary */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Item Subtotal:
                          </span>
                          <span className="text-sm font-medium">
                            LKR {calculateItemSubtotal().toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Total Discount:
                          </span>
                          <span className="text-sm font-medium text-red-500">
                            - LKR {calculateTotalItemDiscount().toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
                            Subtotal:
                          </span>
                          <span className="text-base font-semibold">
                            LKR {calculateSubtotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Discount Controls */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Invoice Discount
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input
                              ref={discountPercentageInputRef}
                              type="number"
                              name="discountPercentage"
                              value={invoice.discountPercentage.toFixed(1)}
                              onChange={handleInvoiceChange}
                              onKeyDown={handleInvoiceDiscountPercentageKeyDown}
                              className="w-full p-2.5 pl-8 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                              placeholder="0%"
                              min="0"
                              max="100"
                              step="0.1"
                              disabled={calculateSubtotal() === 0}
                            />
                            <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                              %
                            </span>
                          </div>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                              LKR
                            </span>
                            <input
                              type="number"
                              name="discountAmount"
                              value={invoice.discountAmount.toFixed(2)}
                              onChange={handleInvoiceChange}
                              onKeyDown={handleInvoiceDiscountAmountKeyDown}
                              className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                              min="0"
                              step="0.01"
                              disabled={calculateSubtotal() === 0}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tax
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input
                              ref={taxPercentageInputRef}
                              type="number"
                              name="taxPercentage"
                              value={invoice.taxPercentage.toFixed(1)}
                              onChange={handleInvoiceChange}
                              onKeyDown={handleTaxPercentageKeyDown}
                              className="w-full p-2.5 pl-8 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                              placeholder="0%"
                              min="0"
                              step="0.1"
                              disabled={calculateSubtotal() === 0}
                            />
                            <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                              %
                            </span>
                          </div>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                              LKR
                            </span>
                            <input
                              ref={taxInputRef}
                              type="number"
                              name="tax"
                              value={invoice.tax.toFixed(2)}
                              onChange={handleInvoiceChange}
                              onKeyDown={handleTaxKeyDown}
                              className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                              min="0"
                              step="0.01"
                              disabled={calculateSubtotal() === 0}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment and Final Totals */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Paid Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                            LKR
                          </span>
                          <input
                            ref={paidAmountInputRef}
                            type="number"
                            name="paidAmount"
                            value={invoice.paidAmount}
                            onChange={handleInvoiceChange}
                            onKeyDown={handlePaidAmountKeyDown}
                            className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total:
                          </span>
                          <span className="text-sm font-semibold">
                            LKR {calculateFinalTotal().toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Paid:
                          </span>
                          <span className="text-sm font-semibold text-green-500">
                            LKR {invoice.paidAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                            Balance:
                          </span>
                          <span
                            className={`text-base font-semibold ${
                              calculateBalance() < 0
                                ? "text-red-500"
                                : "text-blue-500"
                            }`}
                          >
                            LKR {calculateBalance().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-white transition bg-gray-500 rounded-lg hover:bg-gray-600"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  ref={generateInvoiceButtonRef}
                  type="submit"
                  onKeyDown={handleGenerateInvoiceKeyDown}
                  className="px-4 py-2 text-white transition bg-green-500 rounded-lg hover:bg-green-600"
                  disabled={loading || items.length === 0}
                >
                  {existingInvoice ? "Update Invoice" : "Generate Invoice"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceForm;
