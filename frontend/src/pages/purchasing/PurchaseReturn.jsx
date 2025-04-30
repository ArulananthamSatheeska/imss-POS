import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import { FiSearch } from "react-icons/fi";

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
  });
  const [itemForm, setItemForm] = useState({
    product_id: "",
    search_query: "",
    quantity: 1,
    reason: "",
    buying_cost: 0,
  });
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

      // Log raw response for debugging
      console.log(
        "Raw purchase-returns response:",
        JSON.stringify(returnsRes.data, null, 2)
      );

      // Handle suppliers response
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

      // Parse buying_cost to ensure it's a number
      returnsData.forEach((returnItem, index) => {
        if (returnItem.items) {
          returnItem.items.forEach((item, itemIndex) => {
            const rawBuyingCost = item.buying_cost;
            item.buying_cost = parseFloat(rawBuyingCost);
            if (isNaN(item.buying_cost)) {
              console.warn(
                `Invalid buying_cost at returnItems[${index}].items[${itemIndex}]:`,
                rawBuyingCost,
                "Defaulting to 0"
              );
              item.buying_cost = 0;
            } else {
              console.log(
                `Parsed buying_cost at returnItems[${index}].items[${itemIndex}]:`,
                item.buying_cost
              );
            }
          });
        }
      });

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
          ? parseInt(value) || 1
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
    if (!itemForm.reason.trim()) {
      toast.error("Reason is required");
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
      reason: itemForm.reason,
    };

    setNewReturn({
      ...newReturn,
      items: [...newReturn.items, newItem],
    });

    setItemForm({
      product_id: "",
      search_query: "",
      quantity: 1,
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

  const handleSubmitReturn = async () => {
    if (!newReturn.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (newReturn.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    console.log("Submitting newReturn:", JSON.stringify(newReturn, null, 2));

    setLoading(true);
    try {
      const response = await api.post("/purchase-returns", newReturn);
      console.log("Response:", JSON.stringify(response.data, null, 2));
      setReturnItems([...returnItems, response.data.data]);
      setNewReturn({
        supplier_id: "",
        items: [],
        refund_method: "cash",
        remarks: "",
      });
      setItemForm({
        product_id: "",
        search_query: "",
        quantity: 1,
        reason: "",
        buying_cost: 0,
      });
      toast.success("Purchase return submitted successfully!");
    } catch (error) {
      console.error("Error response:", error.response?.data);
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

  // Helper function to format buying_cost safely
  const formatBuyingCost = (cost) => {
    const parsedCost = parseFloat(cost);
    return isNaN(parsedCost) ? "0.00" : parsedCost.toFixed(2);
  };

  // Calculate total amount for a return (sum of quantity * buying_cost for all items)
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
        {/* Purchase Return Dashboard */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            Purchase Return Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Total Returns Today
              </h2>
              <p className="text-2xl font-bold text-blue-500">5</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Total Returns This Month
              </h2>
              <p className="text-2xl font-bold text-green-500">25</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Total Returns This Year
              </h2>
              <p className="text-2xl font-bold text-purple-500">120</p>
            </div>
          </div>
        </div>

        {/* Purchase Return Form */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Purchase Return Form
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
                        min="1"
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
                        Reason
                      </label>
                      <input
                        ref={reasonInputRef}
                        type="text"
                        name="reason"
                        value={itemForm.reason}
                        onChange={handleItemFormChange}
                        onKeyDown={handleReasonKeyDown}
                        placeholder="Reason"
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
                          !itemForm.reason.trim() ||
                          itemForm.buying_cost < 0
                        }
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                  {newReturn.items.map((item, index) => (
                    <div
                      key={item.product_id + index}
                      className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2"
                    >
                      <div>{item.product_name}</div>
                      <div>Qty: {item.quantity}</div>
                      <div>Cost: ${formatBuyingCost(item.buying_cost)}</div>
                      <div>Reason: {item.reason}</div>
                      <div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
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
                <button
                  onClick={handleSubmitReturn}
                  disabled={
                    loading ||
                    !newReturn.supplier_id ||
                    newReturn.items.length === 0
                  }
                  className="mt-4 w-full md:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 disabled:bg-gray-400"
                >
                  Submit Return
                </button>
              </div>
            )}
          </div>
        </div>

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
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Invoice Number
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Supplier Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Item
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Buying Cost
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
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((returnItem) => (
                    <tr
                      key={returnItem.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
                    >
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {returnItem.invoice_number || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {returnItem.supplier?.supplier_name || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {returnItem.items
                          .map((item) => item.product_name)
                          .join(", ") || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {returnItem.items
                          .map(
                            (item) => `$${formatBuyingCost(item.buying_cost)}`
                          )
                          .join(", ") || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        ${calculateTotalAmount(returnItem.items)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {returnItem.refund_method || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {returnItem.status || "N/A"}
                      </td>
                    </tr>
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
