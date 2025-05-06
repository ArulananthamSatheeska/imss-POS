import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import { FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";

const PurchaseReturn = () => {
  const { user } = useAuth();
  const api = getApi();
  const [returnItems, setReturnItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [newReturn, setNewReturn] = useState({
    supplier_id: "",
    items: [],
    refund_method: "cash",
    remarks: "",
    status: "pending",
  });
  const [itemForm, setItemForm] = useState({
    product_id: "",
    search_query: "",
    quantity: 0,
    reason: "",
    buying_cost: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [editReturnId, setEditReturnId] = useState(null);
  const [viewReturn, setViewReturn] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const buyingCostInputRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Fetch suppliers, products, and returns on mount
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
      const [suppliersRes, productsRes, returnsRes] = await Promise.all([
        api.get(`/suppliers?_t=${timestamp}`),
        api.get(`/products?_t=${timestamp}`),
        api.get(`/purchase-returns?_t=${timestamp}`),
      ]);

      const suppliersData = Array.isArray(suppliersRes.data.data)
        ? suppliersRes.data.data
        : Array.isArray(suppliersRes.data)
        ? suppliersRes.data
        : [];
      const productsData = Array.isArray(productsRes.data.data)
        ? productsRes.data.data
        : Array.isArray(productsRes.data)
        ? productsRes.data
        : [];
      const returnsData = Array.isArray(returnsRes.data.data)
        ? returnsRes.data.data
        : Array.isArray(returnsRes.data)
        ? returnsRes.data
        : [];

      returnsData.forEach((returnItem) => {
        if (returnItem.items) {
          returnItem.items.forEach((item) => {
            item.buying_cost = parseFloat(item.buying_cost) || 0;
          });
        }
      });

      // Sort returns by invoice_number
      returnsData.sort((a, b) =>
        a.invoice_number.localeCompare(b.invoice_number)
      );

      setSuppliers(suppliersData);
      setProducts(productsData);
      setReturnItems(returnsData);

      if (suppliersData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          suppliers:
            "No suppliers available. Please add suppliers in the system.",
        }));
        toast.warn("No suppliers available");
      }
      if (productsData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          products: "No products available. Please add products in the system.",
        }));
        toast.warn("No products available");
      }
      if (returnsData.length === 0) {
        setErrors((prev) => ({
          ...prev,
          returns: "No purchase returns found.",
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

  // Filter products based on search query
  useEffect(() => {
    if (itemForm.search_query.trim()) {
      const query = itemForm.search_query.toLowerCase();
      const filtered = products.filter((p) =>
        p.product_name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }, [itemForm.search_query, products]);

  // Prefill buying cost when selecting a product
  useEffect(() => {
    if (itemForm.product_id) {
      const selectedProduct = products.find(
        (p) => p.product_id === parseInt(itemForm.product_id)
      );
      if (selectedProduct) {
        setItemForm((prev) => ({
          ...prev,
          buying_cost: parseFloat(selectedProduct.buying_cost) || 0,
          search_query: selectedProduct.product_name,
        }));
      }
    }
  }, [itemForm.product_id, products]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReturn({ ...newReturn, [name]: value });
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
          : name === "buying_cost"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSelectProduct = (product) => {
    setItemForm({
      ...itemForm,
      product_id: product.product_id.toString(),
      search_query: product.product_name,
      buying_cost: parseFloat(product.buying_cost) || 0,
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
    } else if (e.key === "Enter" && !showSuggestions && itemForm.product_id) {
      e.preventDefault();
      quantityInputRef.current?.focus();
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buyingCostInputRef.current?.focus();
    }
  };

  const handleBuyingCostKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      reasonInputRef.current?.focus();
    }
  };

  const handleReasonKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
      searchInputRef.current?.focus();
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
    if (itemForm.buying_cost < 0) {
      toast.error("Buying cost cannot be negative");
      return;
    }

    const newItem = {
      product_id: itemForm.product_id,
      product_name: selectedProduct.product_name,
      quantity: itemForm.quantity,
      buying_cost: itemForm.buying_cost,
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
      reason: "",
      buying_cost: 0,
    });
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleRemoveItem = (index) => {
    setNewReturn({
      ...newReturn,
      items: newReturn.items.filter((_, i) => i !== index),
    });
  };

  const handleEditReturn = async (returnItem) => {
    try {
      const response = await api.get(`/purchase-returns/${returnItem.id}`);
      const data = response.data.data;
      setNewReturn({
        supplier_id: data.supplier_id.toString(),
        items: data.items.map((item) => ({
          product_id: item.product_id.toString(),
          product_name: item.product_name,
          quantity: item.quantity,
          buying_cost: parseFloat(item.buying_cost),
          reason: item.reason || "",
        })),
        refund_method: data.refund_method,
        remarks: data.remarks || "",
        status: data.status,
      });
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
      const response = await api.get(`/purchase-returns/${returnItem.id}`);
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
      supplier_id: "",
      items: [],
      refund_method: "cash",
      remarks: "",
      status: "pending",
    });
    setItemForm({
      product_id: "",
      search_query: "",
      quantity: 0,
      reason: "",
      buying_cost: 0,
    });
  };

  const handleSubmitReturn = async () => {
    if (!newReturn.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (newReturn.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await api.put(
          `/purchase-returns/${editReturnId}`,
          newReturn
        );
        toast.success("Purchase return updated successfully!");
        const updatedItems = returnItems
          .map((item) => (item.id === editReturnId ? response.data.data : item))
          .sort((a, b) => a.invoice_number.localeCompare(b.invoice_number));
        setReturnItems(updatedItems);
        handleCancelEdit();
      } else {
        response = await api.post("/purchase-returns", newReturn);
        toast.success("Purchase return submitted successfully!");
        setReturnItems(
          [...returnItems, response.data.data].sort((a, b) =>
            a.invoice_number.localeCompare(b.invoice_number)
          )
        );
      }
      setNewReturn({
        supplier_id: "",
        items: [],
        refund_method: "cash",
        remarks: "",
        status: "pending",
      });
      setItemForm({
        product_id: "",
        search_query: "",
        quantity: 0,
        reason: "",
        buying_cost: 0,
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Error submitting purchase return";
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
    if (
      window.confirm("Are you sure you want to delete this purchase return?")
    ) {
      setLoading(true);
      try {
        await api.delete(`/purchase-returns/${id}`);
        setReturnItems(returnItems.filter((item) => item.id !== id));
        setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
        toast.success("Purchase return deleted successfully!");
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Error deleting purchase return";
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

  const formatBuyingCost = (cost) => {
    const parsedCost = parseFloat(cost);
    return isNaN(parsedCost) ? "0.00" : parsedCost.toFixed(2);
  };

  const calculateTotalAmount = (items) => {
    return items
      .reduce((total, item) => {
        const cost = parseFloat(item.buying_cost) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + cost * quantity;
      }, 0)
      .toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Purchase Return Form */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {editMode ? "Edit Purchase Return" : "Purchase Return Form"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Supplier
                    </label>
                    <select
                      name="supplier_id"
                      value={newReturn.supplier_id}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={loading}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Items to Return
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div ref={searchRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Search Product
                      </label>
                      <div className="relative">
                        <input
                          ref={searchInputRef}
                          type="text"
                          name="search_query"
                          value={itemForm.search_query}
                          onChange={handleItemFormChange}
                          onFocus={() =>
                            itemForm.search_query && setShowSuggestions(true)
                          }
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Search Product..."
                          className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={loading}
                        />
                        <FiSearch className="absolute left-2 top-3 text-gray-400" />
                      </div>
                      {showSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                          {filteredProducts.map((product, index) => (
                            <li
                              key={product.product_id ?? index}
                              onClick={() => handleSelectProduct(product)}
                              className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer dark:text-white ${
                                highlightedIndex === index
                                  ? "bg-gray-100 dark:bg-gray-600"
                                  : ""
                              }`}
                            >
                              {product.product_name}
                            </li>
                          ))}
                        </ul>
                      )}
                      {showSuggestions &&
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
                        Buying Cost
                      </label>
                      <input
                        ref={buyingCostInputRef}
                        type="number"
                        name="buying_cost"
                        value={itemForm.buying_cost.toFixed(2)}
                        onChange={handleItemFormChange}
                        onKeyDown={handleBuyingCostKeyDown}
                        placeholder="Buying Cost"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="0"
                        step="0.01"
                        disabled={loading || !itemForm.product_id}
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
                    <div className="flex justify-end items-end">
                      <button
                        onClick={handleAddItem}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 w-full"
                        disabled={
                          loading ||
                          !itemForm.product_id ||
                          itemForm.quantity <= 0 ||
                          itemForm.buying_cost < 0
                        }
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                  {newReturn.items.length > 0 && (
                    <table className="min-w-full border border-gray-300 rounded-md">
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
                              {formatBuyingCost(
                                item.quantity * item.buying_cost
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
                    name="refund_method"
                    value={newReturn.refund_method}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="credit">Supplier Credit</option>
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
                    disabled={
                      loading ||
                      !newReturn.supplier_id ||
                      newReturn.items.length === 0
                    }
                    className="w-full md:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 disabled:bg-gray-400"
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
                Purchase Return Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Invoice Number
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.invoice_number || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Supplier
                  </label>
                  <p className="text-gray-900 dark:text-gray-200">
                    {viewReturn.supplier?.supplier_name || "N/A"}
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
                            {formatBuyingCost(item.quantity * item.buying_cost)}
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

        {/* Purchase Return History */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Purchase Return History
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {returnItems.length === 0 && !loading && (
              <p className="text-gray-500 dark:text-gray-300">
                No purchase returns found.
              </p>
            )}
            {returnItems.length > 0 && (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-12"></th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Invoice Number
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Supplier Name
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
                          {returnItem.invoice_number || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {returnItem.supplier?.supplier_name || "N/A"}
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
                            colSpan="7"
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
                                        {formatBuyingCost(
                                          item.quantity * item.buying_cost
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

export default PurchaseReturn;
