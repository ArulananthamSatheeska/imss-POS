import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import { FiSearch } from "react-icons/fi";

const PurchaseInvoiceForm = ({
  onGenerateInvoice,
  onCancel,
  existingInvoice,
}) => {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(
    existingInvoice || {
      billNumber: "GRN-" + Date.now(),
      invoiceNumber: "PINV-" + Date.now(),
      purchaseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      supplierId: "",
      storeId: "",
      paidAmount: 0,
      status: "pending",
      discountPercentage: 0,
      discountAmount: 0,
      taxPercentage: 0, // New field for tax percentage
      tax: 0,
    }
  );

  const [items, setItems] = useState(existingInvoice?.items || []);
  const [itemForm, setItemForm] = useState({
    itemId: "",
    searchQuery: "",
    quantity: 1,
    freeItems: 0,
    buyingCost: 0,
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
  const taxPercentageInputRef = useRef(null);
  const taxInputRef = useRef(null);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [suppliersRes, storesRes, productsRes] = await Promise.all([
        api.get(`/suppliers?_t=${timestamp}`),
        api.get(`/store-locations?_t=${timestamp}`),
        api.get(`/products?_t=${timestamp}`),
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

  // Update discount amount based on percentage
  useEffect(() => {
    if (invoice.discountPercentage > 0) {
      const subtotal = calculateSubtotal();
      setInvoice((prev) => ({
        ...prev,
        discountAmount: (subtotal * invoice.discountPercentage) / 100,
      }));
    } else {
      setInvoice((prev) => ({
        ...prev,
        discountAmount: 0,
      }));
    }
  }, [invoice.discountPercentage, items]);

  // Update tax amount based on tax percentage
  useEffect(() => {
    if (invoice.taxPercentage > 0) {
      const subtotal = calculateSubtotal();
      const taxableAmount = subtotal - invoice.discountAmount;
      setInvoice((prev) => ({
        ...prev,
        tax: (taxableAmount * invoice.taxPercentage) / 100,
      }));
    } else {
      setInvoice((prev) => ({
        ...prev,
        tax: 0,
      }));
    }
  }, [invoice.taxPercentage, invoice.discountAmount, items]);

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm({
      ...itemForm,
      [name]:
        name === "searchQuery"
          ? value
          : name === "itemId"
          ? value
          : parseFloat(value) || 0,
    });
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
      addItem();
      searchInputRef.current?.focus();
    }
  };

  const handleDiscountPercentageKeyDown = (e) => {
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
      // Reset taxPercentage if tax is manually edited
      ...(name === "tax" && value !== prev.tax ? { taxPercentage: 0 } : {}),
      // Reset discountPercentage if discountAmount is manually edited
      ...(name === "discountAmount" && value !== prev.discountAmount
        ? { discountPercentage: 0 }
        : {}),
    }));
  };

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
    const total = totalQuantity * itemForm.buyingCost;

    const newItem = {
      id: items.length + 1,
      productId: selectedItem.product_id,
      description: selectedItem.product_name,
      quantity: itemForm.quantity,
      freeItems: itemForm.freeItems,
      buyingCost: itemForm.buyingCost,
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
    });
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setErrors((prev) => ({ ...prev, item: undefined }));
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + (item.quantity + item.freeItems) * item.buyingCost,
      0
    );
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
    if (invoice.paidAmount > calculateFinalTotal())
      newErrors.paidAmount = "Paid amount cannot exceed total";
    if (invoice.discountPercentage < 0)
      newErrors.discountPercentage = "Discount percentage cannot be negative";
    if (invoice.discountAmount < 0)
      newErrors.discountAmount = "Discount amount cannot be negative";
    if (invoice.taxPercentage < 0)
      newErrors.taxPercentage = "Tax percentage cannot be negative";
    if (invoice.tax < 0) newErrors.tax = "Tax cannot be negative";
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
        quantity: item.quantity + item.freeItems,
        freeItems: item.freeItems,
        buyingCost: item.buyingCost,
      })),
      total: calculateFinalTotal(),
    };
    onGenerateInvoice(newInvoice);
  };

  return (
    <div className="fixed inset-0 w-full flex items-center justify-center bg-slate-400 bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl relative my-8">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
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
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          {existingInvoice
            ? "Edit Purchase Invoice"
            : "Create Purchase Invoice"}
        </h2>
        <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-w-full mx-auto">
          {Object.keys(errors).length > 0 && (
            <div className="p-2 mb-4 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
              {Object.values(errors).filter(Boolean).join(", ")}
            </div>
          )}
          {loading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {!loading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Purchase Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="PINV-001"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier
                  </label>
                  <select
                    name="supplierId"
                    value={invoice.supplierId}
                    onChange={handleInvoiceChange}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Store
                  </label>
                  <select
                    name="storeId"
                    value={invoice.storeId}
                    onChange={handleInvoiceChange}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={invoice.paidAmount}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
                {existingInvoice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={invoice.status}
                      onChange={handleInvoiceChange}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Item Selection */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Add Item
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div ref={searchRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full p-2 pl-8 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <FiSearch className="absolute left-2 top-3 text-gray-400" />
                    </div>
                    {showSuggestions && filteredProducts.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                        {filteredProducts.map((p, index) => (
                          <li
                            key={p.product_id}
                            onClick={() => handleSelectProduct(p)}
                            className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer dark:text-white flex justify-between items-center ${
                              highlightedIndex === index
                                ? "bg-gray-100 dark:bg-gray-600"
                                : ""
                            }`}
                          >
                            <span>{p.product_name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-300">
                              Stock: {p.opening_stock_quantity || 0}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {showSuggestions &&
                      itemForm.searchQuery &&
                      filteredProducts.length === 0 && (
                        <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-4 text-gray-500 dark:text-gray-300">
                          No products found
                        </div>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      ref={quantityInputRef}
                      type="number"
                      name="quantity"
                      value={itemForm.quantity}
                      onChange={handleItemFormChange}
                      onKeyDown={handleQuantityKeyDown}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                      min="1"
                      step="1"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Free Items
                    </label>
                    <input
                      ref={freeItemsInputRef}
                      type="number"
                      name="freeItems"
                      value={itemForm.freeItems}
                      onChange={handleItemFormChange}
                      onKeyDown={handleFreeItemsKeyDown}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="1"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Buying Cost
                    </label>
                    <input
                      ref={buyingCostInputRef}
                      type="number"
                      name="buyingCost"
                      value={itemForm.buyingCost.toFixed(2)}
                      onChange={handleItemFormChange}
                      onKeyDown={handleBuyingCostKeyDown}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                      disabled={
                        loading || !itemForm.itemId || itemForm.quantity <= 0
                      }
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={resetItemForm}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md w-full"
                      disabled={loading}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Items */}
              {items.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-auto max-h-64">
                    <table className="w-full border-collapse border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                          <th className="p-2 border">#</th>
                          <th className="p-2 border">Description</th>
                          <th className="p-2 border">Quantity</th>
                          <th className="p-2 border">Free Items</th>
                          <th className="p-2 border">Buying Cost</th>
                          <th className="p-2 border">Total</th>
                          <th className="p-2 border">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr
                            key={item.id}
                            className="border text-center dark:text-white"
                          >
                            <td className="p-2 border">{index + 1}</td>
                            <td className="p-2 border">{item.description}</td>
                            <td className="p-2 border">{item.quantity}</td>
                            <td className="p-2 border">{item.freeItems}</td>
                            <td className="p-2 border">
                              {item.buyingCost.toFixed(2)}
                            </td>
                            <td className="p-2 border">
                              {item.total.toFixed(2)}
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700"
                                disabled={loading}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-right pr-4">
                      <span className="text-lg font-semibold text-yellow-600 dark:text-gray-200">
                        Subtotal: ${calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Discount
                      </label>
                      <div className="flex space-x-2">
                        <input
                          ref={discountPercentageInputRef}
                          type="number"
                          name="discountPercentage"
                          value={invoice.discountPercentage}
                          onChange={handleInvoiceChange}
                          onKeyDown={handleDiscountPercentageKeyDown}
                          className="w-1/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="%"
                          min="0"
                          step="0.1"
                          disabled={calculateSubtotal() === 0}
                        />
                        <input
                          type="number"
                          name="discountAmount"
                          value={invoice.discountAmount.toFixed(2)}
                          onChange={handleInvoiceChange}
                          className="w-2/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                          disabled={calculateSubtotal() === 0}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tax
                      </label>
                      <div className="flex space-x-2">
                        <input
                          ref={taxPercentageInputRef}
                          type="number"
                          name="taxPercentage"
                          value={invoice.taxPercentage}
                          onChange={handleInvoiceChange}
                          onKeyDown={handleTaxPercentageKeyDown}
                          className="w-1/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="%"
                          min="0"
                          step="0.1"
                        />
                        <input
                          ref={taxInputRef}
                          type="number"
                          name="tax"
                          value={invoice.tax.toFixed(2)}
                          onChange={handleInvoiceChange}
                          className="w-2/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right pr-4 space-y-2">
                    <div>
                      <span className="text-lg font-semibold text-blue-800 dark:text-gray-200">
                        Total: ${calculateFinalTotal().toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-green-800 dark:text-gray-200">
                        Paid Amount: ${invoice.paidAmount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-green-800 dark:text-gray-200">
                        Balance: $
                        <span
                          className={
                            calculateBalance() < 0
                              ? "text-red-500"
                              : "text-yellow-500"
                          }
                        >
                          {calculateBalance().toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
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
