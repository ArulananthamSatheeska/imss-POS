import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";

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
    }
  );

  const [items, setItems] = useState(existingInvoice?.items || []);
  const [itemForm, setItemForm] = useState({
    itemId: "",
    quantity: 1,
    freeItems: 0,
    buyingCost: 0,
    discountPercentage: 0,
    discountAmount: 0,
    tax: 0,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const api = getApi();

  console.log("PurchaseInvoiceForm rendering", {
    user,
    existingInvoice,
  });

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
      console.log("Fetching data with token:", user.token);
      const [suppliersRes, storesRes, productsRes] = await Promise.all([
        api.get(`/suppliers?_t=${timestamp}`).catch((err) => {
          console.error(
            "Suppliers fetch error:",
            err.response?.data || err.message
          );
          throw err;
        }),
        api.get(`/store-locations?_t=${timestamp}`).catch((err) => {
          console.error(
            "Stores fetch error:",
            err.response?.data || err.message
          );
          throw err;
        }),
        api.get(`/products?_t=${timestamp}`).catch((err) => {
          console.error(
            "Products fetch error:",
            err.response?.data || err.message
          );
          throw err;
        }),
      ]);

      console.log("API responses:", {
        suppliers: suppliersRes.data,
        stores: storesRes.data,
        products: productsRes.data,
      });

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
      console.error("Fetch data error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
        }));
      }
    }
  }, [itemForm.itemId, products]);

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm({
      ...itemForm,
      [name]: name === "itemId" ? value : parseFloat(value) || 0,
    });
  };

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      [name]: name === "paidAmount" ? parseFloat(value) || 0 : value,
    });
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
    const totalBeforeDiscount = totalQuantity * itemForm.buyingCost;
    const discountAmount =
      itemForm.discountAmount ||
      (totalBeforeDiscount * itemForm.discountPercentage) / 100;
    const total = totalBeforeDiscount - discountAmount + itemForm.tax;

    const newItem = {
      id: items.length + 1,
      productId: selectedItem.product_id,
      description: selectedItem.product_name,
      quantity: itemForm.quantity,
      freeItems: itemForm.freeItems,
      buyingCost: itemForm.buyingCost,
      discountPercentage: itemForm.discountPercentage,
      discountAmount,
      tax: itemForm.tax,
      total,
    };

    setItems([...items, newItem]);
    resetItemForm();
  };

  const resetItemForm = () => {
    setItemForm({
      itemId: "",
      quantity: 1,
      freeItems: 0,
      buyingCost: 0,
      discountPercentage: 0,
      discountAmount: 0,
      tax: 0,
    });
    setErrors((prev) => ({ ...prev, item: undefined }));
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.buyingCost,
      0
    );
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    const totalDiscount = items.reduce(
      (sum, item) => sum + item.discountAmount,
      0
    );
    const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
    return subtotal - totalDiscount + totalTax;
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
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", { invoice, items });
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
      items,
      total: calculateFinalTotal(),
    };
    onGenerateInvoice(newInvoice);
  };

  return (
    <div className="fixed inset-0 bg-slate-200 dark:bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-screen-xl max-h-[100vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 text-blue-400">
          {existingInvoice
            ? "Edit Purchase Invoice"
            : "Fill Purchase Invoice Details"}
        </h3>

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
          <form onSubmit={handleSubmit}>
            {/* Purchase Details */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
                Purchase Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Purchase Date:
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={invoice.purchaseDate}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bill Number:
                  </label>
                  <input
                    type="text"
                    name="billNumber"
                    value={invoice.billNumber}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="GRN-00001"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Invoice Number:
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="PINV-001"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Payment Method:
                  </label>
                  <select
                    name="paymentMethod"
                    value={invoice.paymentMethod}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    disabled={loading}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Supplier:
                  </label>
                  <select
                    name="supplierId"
                    value={invoice.supplierId}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Store:
                  </label>
                  <select
                    name="storeId"
                    value={invoice.storeId}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Paid Amount:
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={invoice.paidAmount}
                    onChange={handleInvoiceChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
                {existingInvoice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Status:
                    </label>
                    <select
                      name="status"
                      value={invoice.status}
                      onChange={handleInvoiceChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      disabled={loading}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Item Selection */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
                Item Selection
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Select Item:
                  </label>
                  <select
                    name="itemId"
                    value={itemForm.itemId}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    disabled={loading}
                  >
                    <option value="">Select Item</option>
                    {products.length === 0 ? (
                      <option disabled>No products available</option>
                    ) : (
                      products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={itemForm.quantity}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="1"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Free Items:
                  </label>
                  <input
                    type="number"
                    name="freeItems"
                    value={itemForm.freeItems}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Buying Cost:
                  </label>
                  <input
                    type="number"
                    name="buyingCost"
                    value={itemForm.buyingCost}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount %:
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={itemForm.discountPercentage}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount Amount:
                  </label>
                  <input
                    type="number"
                    name="discountAmount"
                    value={itemForm.discountAmount}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tax:
                  </label>
                  <input
                    type="number"
                    name="tax"
                    value={itemForm.tax}
                    onChange={handleItemFormChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full p-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={resetItemForm}
                    className="w-full p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-700 pb-2">
                Selected Items
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr className="bg-gray-700 text-gray-300">
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-center">Free Items</th>
                      <th className="p-3 text-right">Cost</th>
                      <th className="p-3 text-right">Discount (%)</th>
                      <th className="p-3 text-right">Discount (LKR)</th>
                      <th className="p-3 text-right">Tax</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-3 text-center text-gray-400"
                        >
                          No items added
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-700 hover:bg-gray-700/50"
                        >
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-center">{item.freeItems}</td>
                          <td className="p-3 text-right">
                            {item.buyingCost.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            {item.discountPercentage.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            {item.discountAmount.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            {item.tax.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            {item.total.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                              disabled={loading}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <div className="bg-gray-700 p-4 rounded-lg w-64">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="text-white">
                      {calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Total Discount:</span>
                    <span className="text-white">
                      {items
                        .reduce((sum, item) => sum + item.discountAmount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Total Tax:</span>
                    <span className="text-white">
                      {items
                        .reduce((sum, item) => sum + item.tax, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-blue-400">
                      {calculateFinalTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Paid Amount:</span>
                    <span className="text-green-400">
                      {invoice.paidAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-600 pt-2">
                    <span className="text-gray-300">Balance:</span>
                    <span
                      className={
                        calculateBalance() < 0
                          ? "text-red-400"
                          : "text-yellow-400"
                      }
                    >
                      {calculateBalance().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6 border-t border-gray-700 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-300 flex items-center"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 flex items-center"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {existingInvoice ? "Update Invoice" : "Generate Invoice"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoiceForm;
