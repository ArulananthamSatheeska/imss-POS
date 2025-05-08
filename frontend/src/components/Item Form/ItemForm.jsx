import React, { useState, useEffect } from "react";
import "./itemform.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ItemForm = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    product_name: initialData?.product_name || "",
    item_code: initialData?.item_code || "",
    batch_number: initialData?.batch_number || "",
    expiry_date: initialData?.expiry_date || "",
    buying_cost: initialData?.buying_cost || "",
    sales_price: initialData?.sales_price || "",
    minimum_price: initialData?.minimum_price || "",
    wholesale_price: initialData?.wholesale_price || "",
    barcode: initialData?.barcode || "",
    mrp: initialData?.mrp || "",
    minimum_stock_quantity: initialData?.minimum_stock_quantity || "",
    opening_stock_quantity: initialData?.opening_stock_quantity || "",
    opening_stock_value: initialData?.opening_stock_value || "",
    category: initialData?.category || "",
    supplier: initialData?.supplier || "",
    unit_type: initialData?.unit_type || "",
    store_location: initialData?.store_location || "",
    cabinet: initialData?.cabinet || "",
    row: initialData?.row || "",
    extra_fields: initialData?.extra_fields
      ? (() => {
          try {
            const parsed =
              typeof initialData.extra_fields === "string"
                ? JSON.parse(initialData.extra_fields)
                : initialData.extra_fields;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [],
  });

  // New state variables for showing add forms and new classification names
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState("");
  const [showAddUnitType, setShowAddUnitType] = useState(false);
  const [newUnitType, setNewUnitType] = useState("");

  // Function to add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    try {
      const response = await axios.post(
        "https://sharvakshafoodcity.com.lk/backend/public/api/categories",
        {
          name: newCategory.trim(),
        }
      );
      setCategories((prev) => [...prev, response.data]);
      setFormData((prev) => ({ ...prev, category: response.data.name }));
      setNewCategory("");
      setShowAddCategory(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  // Function to add new store location
  const handleAddStore = async () => {
    if (!newStore.trim()) {
      toast.error("Store location cannot be empty");
      return;
    }
    try {
      const response = await axios.post(
        "https://sharvakshafoodcity.com.lk/backend/public/api/store-locations",
        {
          store_name: newStore.trim(),
          phone_number: formData.phone_number || "",
          address: formData.address || "",
        }
      );
      setStores((prev) => [...prev, response.data]);
      setFormData((prev) => ({
        ...prev,
        store_location: response.data.store_name,
        phone_number: response.data.phone_number || "",
        address: response.data.address || "",
      }));
      setNewStore("");
      setShowAddStore(false);
      toast.success("Store location added successfully");
    } catch (error) {
      console.error("Error adding store location:", error);
      toast.error("Failed to add store location");
    }
  };

  // Function to add new supplier
  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) {
      toast.error("Supplier name cannot be empty");
      return;
    }
    try {
      const response = await axios.post("https://sharvakshafoodcity.com.lk/backend/public/api/suppliers", {
        supplier_name: newSupplier.trim(),
        contact: formData.contact || "",
        address: formData.address || "",
      });
      setSuppliers((prev) => [...prev, response.data]);
      setFormData((prev) => ({
        ...prev,
        supplier: response.data.supplier_name,
        contact: response.data.contact || "",
        address: response.data.address || "",
      }));
      setNewSupplier("");
      setShowAddSupplier(false);
      toast.success("Supplier added successfully");
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast.error("Failed to add supplier");
    }
  };

  // Function to add new unit type
  const handleAddUnitType = async () => {
    if (!newUnitType.trim()) {
      toast.error("Unit type name cannot be empty");
      return;
    }
    try {
      const response = await axios.post("https://sharvakshafoodcity.com.lk/backend/public/api/units", {
        unit_name: newUnitType.trim(),
      });
      setUnitTypes((prev) => [...prev, response.data]);
      setFormData((prev) => ({ ...prev, unit_type: response.data.unit_name }));
      setNewUnitType("");
      setShowAddUnitType(false);
      toast.success("Unit type added successfully");
    } catch (error) {
      console.error("Error adding unit type:", error);
      toast.error("Failed to add unit type");
    }
  };

  const [salesPricePercentage, setSalesPricePercentage] = useState();
  const [wholesalePricePercentage, setWholesalePricePercentage] = useState();
  const [minimumPricePercentage, setMinimumPricePercentage] = useState();

  const [categories, setCategories] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStore, setNewStore] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, unitTypesRes, suppliersRes, storesRes] =
          await Promise.all([
            axios.get("https://sharvakshafoodcity.com.lk/backend/public/api/categories"),
            axios.get("https://sharvakshafoodcity.com.lk/backend/public/api/units"),
            axios.get("https://sharvakshafoodcity.com.lk/backend/public/api/suppliers"),
            axios.get("https://sharvakshafoodcity.com.lk/backend/public/api/store-locations"),
          ]);

        setCategories(categoriesRes.data);
        setUnitTypes(unitTypesRes.data);
        setSuppliers(suppliersRes.data);
        setStores(storesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching form data: " + error.message);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Helper to parse float or zero
    const parseOrZero = (val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Update formData
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    // Update percentages and amounts for prices
    if (name === "buying_cost") {
      const buyingCost = parseOrZero(value);

      // Recalculate amounts based on percentages (price = buying_cost + profit)
      setFormData((prevData) => ({
        ...prevData,
        sales_price: (
          buyingCost +
          buyingCost * (salesPricePercentage / 100)
        ).toFixed(2),
        wholesale_price: (
          buyingCost +
          buyingCost * (wholesalePricePercentage / 100)
        ).toFixed(2),
        minimum_price: (
          buyingCost +
          buyingCost * (minimumPricePercentage / 100)
        ).toFixed(2),
      }));
    } else if (name === "sales_price") {
      const buyingCost = parseOrZero(formData.buying_cost);
      const salesPrice = parseOrZero(value);
      const percentage =
        buyingCost === 0 ? 0 : ((salesPrice - buyingCost) / buyingCost) * 100;
      setSalesPricePercentage(percentage.toFixed(2));
    } else if (name === "wholesale_price") {
      const buyingCost = parseOrZero(formData.buying_cost);
      const wholesalePrice = parseOrZero(value);
      const percentage =
        buyingCost === 0
          ? 0
          : ((wholesalePrice - buyingCost) / buyingCost) * 100;
      setWholesalePricePercentage(percentage.toFixed(2));
    } else if (name === "minimum_price") {
      const buyingCost = parseOrZero(formData.buying_cost);
      const minimumPrice = parseOrZero(value);
      const percentage =
        buyingCost === 0 ? 0 : ((minimumPrice - buyingCost) / buyingCost) * 100;
      setMinimumPricePercentage(percentage.toFixed(2));
    }

    if (name === "opening_stock_quantity" || name === "buying_cost") {
      const opening_stock_value =
        (parseFloat(formData.opening_stock_quantity) || 0) *
        (parseFloat(formData.buying_cost) || 0);
      setFormData((prevData) => ({
        ...prevData,
        opening_stock_value: opening_stock_value.toFixed(2),
      }));
    }
  };

  const handleExtraFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedExtraFields = [...formData.extra_fields];
    updatedExtraFields[index][name] = value;
    setFormData({ ...formData, extra_fields: updatedExtraFields });
  };

  const addExtraField = () => {
    setFormData((prevData) => ({
      ...prevData,
      extra_fields: [...prevData.extra_fields, { name: "", value: "" }],
    }));
  };

  const removeExtraField = (index) => {
    const updatedExtraFields = formData.extra_fields.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, extra_fields: updatedExtraFields });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Remove the check that blocks submission if initialData exists but no product_id
    // if (initialData && !initialData.product_id) {
    //   toast.error("Invalid product ID. Cannot update product.");
    //   return;
    // }

    const itemData = {
      ...formData,
      buying_cost: parseFloat(formData.buying_cost) || 0,
      sales_price: parseFloat(formData.sales_price) || 0,
      minimum_price: parseFloat(formData.minimum_price) || 0,
      wholesale_price: parseFloat(formData.wholesale_price) || 0,
      mrp: parseFloat(formData.mrp) || 0,
      minimum_stock_quantity: parseFloat(formData.minimum_stock_quantity) || 0,
      opening_stock_quantity: parseFloat(formData.opening_stock_quantity) || 0,
      opening_stock_value: parseFloat(formData.opening_stock_value) || 0,
      extra_fields: JSON.stringify(formData.extra_fields || []),
    };

    console.log("Sending data to backend:", itemData);

    try {
      onSubmit(itemData);
      setFormData({
        product_name: "",
        item_code: "",
        batch_number: "",
        expiry_date: "",
        buying_cost: "",
        sales_price: "",
        minimum_price: "",
        wholesale_price: "",
        barcode: "",
        mrp: "",
        minimum_stock_quantity: "",
        opening_stock_quantity: "",
        opening_stock_value: "",
        category: "",
        supplier: "",
        unit_type: "",
        store_location: "",
        cabinet: "",
        row: "",
        extra_fields: [],
      });
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to save product. Please try again."
      );
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    if (
      window.confirm(
        "Are you sure you want to close? Any unsaved changes will be lost."
      )
    ) {
      onClose();
    }
  };

  const handleBlur = (fieldName) => {
    setFormData((prevData) => {
      const updatedData = { ...prevData };

      if (fieldName === "item_code" && !updatedData.item_code) {
        updatedData.item_code = `ITM ${Math.floor(
          1000 + Math.random() * 9000
        )}`;
      }

      if (fieldName === "barcode" && !updatedData.barcode) {
        updatedData.barcode = `BAR ${Math.floor(1000 + Math.random() * 9000)}`;
      }

      if (
        fieldName === "opening_stock_quantity" ||
        fieldName === "buying_cost"
      ) {
        const openingStockValue =
          (parseFloat(updatedData.opening_stock_quantity) || 0) *
          (parseFloat(updatedData.buying_cost) || 0);
        updatedData.opening_stock_value = openingStockValue.toFixed(2);
      }

      return updatedData;
    });
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = document.querySelector(`[name="${nextField}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-100 dark:bg-slate-800 w-full min-w-max h-screen overflow-y-auto"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                {initialData ? "Edit Product" : "Create New Product"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {initialData
                  ? "Update product details"
                  : "Add a new product to inventory"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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

          {/* Main Form Content */}
          <div className="mt-8 space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-full mx-auto">
              <h3 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-8">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "item_code")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter the Item Name"
                    required
                  />
                </div>

                {/* Item Code */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Item Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleChange}
                    onBlur={() => handleBlur("item_code")}
                    onKeyDown={(e) => handleKeyDown(e, "batch_number")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. ITM-0001"
                  />
                </div>

                {/* Batch Number */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "expiry_date")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. BT0001"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "barcode")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Barcode */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Barcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    onBlur={() => handleBlur("barcode")}
                    onKeyDown={(e) => handleKeyDown(e, "mrp")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. BAR-0001"
                    required
                  />
                </div>

                {/* MRP */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "buying_cost")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. 199.99"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-full mx-auto">
              <h3 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-8">
                Pricing Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Buying Cost */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Buying Cost
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-300 dark:text-gray-400 sm:text-sm">
                        LKR
                      </span>
                    </div>
                    <input
                      type="number"
                      name="buying_cost"
                      value={formData.buying_cost}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, "sales_price")}
                      onBlur={() => handleBlur("buying_cost")}
                      className="block w-full text-right py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Sales Price */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sales Price <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-300 dark:text-gray-400 sm:text-sm">
                          LKR
                        </span>
                      </div>
                      <input
                        type="number"
                        name="sales_price"
                        value={formData.sales_price}
                        onChange={handleChange}
                        onKeyDown={(e) =>
                          handleKeyDown(e, "sales_price_percentage")
                        }
                        className="block w-full text-right   py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        name="sales_price_percentage"
                        value={salesPricePercentage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSalesPricePercentage(val);
                          const buyingCost =
                            parseFloat(formData.buying_cost) || 0;
                          const amount = (
                            (buyingCost * (parseFloat(val) || 0)) /
                            100
                          ).toFixed(2);
                          setFormData((prevData) => ({
                            ...prevData,
                            sales_price: amount,
                          }));
                        }}
                        onKeyDown={(e) => handleKeyDown(e, "wholesale_price")}
                        className="block w-full text-right py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="%"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-300 dark:text-gray-400 sm:text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wholesale Price */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Wholesale Price
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-300 dark:text-gray-400 sm:text-sm">
                          LKR
                        </span>
                      </div>
                      <input
                        type="number"
                        name="wholesale_price"
                        value={formData.wholesale_price}
                        onChange={handleChange}
                        onKeyDown={(e) =>
                          handleKeyDown(e, "wholesale_price_percentage")
                        }
                        className="block w-full text-right py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        name="wholesale_price_percentage"
                        value={wholesalePricePercentage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWholesalePricePercentage(val);
                          const buyingCost =
                            parseFloat(formData.buying_cost) || 0;
                          const amount = (
                            (buyingCost * (parseFloat(val) || 0)) /
                            100
                          ).toFixed(2);
                          setFormData((prevData) => ({
                            ...prevData,
                            wholesale_price: amount,
                          }));
                        }}
                        onKeyDown={(e) => handleKeyDown(e, "minimum_price")}
                        className="block w-full text-right py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="%"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-300 dark:text-gray-400 sm:text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimum Price */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Price
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-300 dark:text-gray-400 sm:text-sm">
                          LKR
                        </span>
                      </div>
                      <input
                        type="number"
                        name="minimum_price"
                        value={formData.minimum_price}
                        onChange={handleChange}
                        onKeyDown={(e) =>
                          handleKeyDown(e, "minimum_price_percentage")
                        }
                        className="block w-full text-right py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        name="minimum_price_percentage"
                        value={minimumPricePercentage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMinimumPricePercentage(val);
                          const buyingCost =
                            parseFloat(formData.buying_cost) || 0;
                          const amount = (
                            (buyingCost * (parseFloat(val) || 0)) /
                            100
                          ).toFixed(2);
                          setFormData((prevData) => ({
                            ...prevData,
                            minimum_price: amount,
                          }));
                        }}
                        onKeyDown={(e) =>
                          handleKeyDown(e, "minimum_stock_quantity")
                        }
                        className="block w-full text-right py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="%"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-full mx-auto">
              <h3 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-8">
                Inventory Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Minimum Stock Quantity */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="minimum_stock_quantity"
                    value={formData.minimum_stock_quantity}
                    onChange={handleChange}
                    onKeyDown={(e) =>
                      handleKeyDown(e, "opening_stock_quantity")
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. 10"
                  />
                </div>

                {/* Opening Stock Quantity */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Opening Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="opening_stock_quantity"
                    value={formData.opening_stock_quantity}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "opening_stock_value")}
                    onBlur={() => handleBlur("opening_stock_quantity")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. 50"
                  />
                </div>

                {/* Opening Stock Value */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Opening Stock Value
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                        LKR
                      </span>
                    </div>
                    <input
                      type="number"
                      name="opening_stock_value"
                      value={formData.opening_stock_value}
                      onKeyDown={(e) => handleKeyDown(e, "category")}
                      readOnly
                      className="block w-full text-right py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none dark:text-gray-300"
                      placeholder="Calculated automatically"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-full mx-auto">
              <h3 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-8">
                Classification
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs font-normal"
                    >
                      + Add New
                    </button>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "supplier")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {showAddCategory && (
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "category_button")}
                        placeholder="New category name"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        name="category_button"
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategory("");
                        }}
                        className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                    Supplier
                    <button
                      type="button"
                      onClick={() => setShowAddSupplier(true)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs font-normal"
                    >
                      + Add New
                    </button>
                  </label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "unit_type")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.supplier_name}>
                        {supplier.supplier_name}
                      </option>
                    ))}
                  </select>
                  {showAddSupplier && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={newSupplier}
                        onChange={(e) => setNewSupplier(e.target.value)}
                        placeholder="New supplier name"
                        onKeyDown={(e) => handleKeyDown(e, "contact")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, "address")}
                        placeholder="Contact"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, "Supplier_button")}
                        placeholder="Address"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <div className="flex space-x-2">
                        <button
                          name="Supplier_button"
                          type="button"
                          onClick={handleAddSupplier}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddSupplier(false);
                            setNewSupplier("");
                            setFormData((prev) => ({
                              ...prev,
                              contact: "",
                              address: "",
                            }));
                          }}
                          className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unit Type */}
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit Type
                    <button
                      type="button"
                      onClick={() => setShowAddUnitType(true)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs font-normal"
                    >
                      + Add New
                    </button>
                  </label>
                  <select
                    name="unit_type"
                    value={formData.unit_type}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "store_location")}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Unit Type</option>
                    {unitTypes.map((unit) => (
                      <option key={unit.id} value={unit.unit_name}>
                        {unit.unit_name}
                      </option>
                    ))}
                  </select>
                  {showAddUnitType && (
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="text"
                        value={newUnitType}
                        onChange={(e) => setNewUnitType(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "unit_button")}
                        placeholder="New unit type name"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        name="unit_button"
                        type="button"
                        onClick={handleAddUnitType}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUnitType(false);
                          setNewUnitType("");
                        }}
                        className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-full mx-auto">
              <h3 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-8">
                Storage Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {/* Store Location */}
                <div className="w-full max-w-xs flex flex-col gap-2">
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                    Store Location
                    <button
                      type="button"
                      onClick={() => setShowAddStore(true)}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      + Add New
                    </button>
                  </label>
                  <select
                    name="store_location"
                    value={formData.store_location}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "cabinet")}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.store_name}>
                        {store.store_name}
                      </option>
                    ))}
                  </select>

                  {showAddStore && (
                    <div className="mt-3 flex flex-col gap-3">
                      <input
                        type="text"
                        value={newStore}
                        onChange={(e) => setNewStore(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "phone_number")}
                        placeholder="New store location"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                      />
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone_number: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, "address")}
                        placeholder="Phone Number"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                      />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, "store_button")}
                        placeholder="Address"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                      />
                      <div className="flex gap-2">
                        <button
                          name="store_button"
                          type="button"
                          onClick={handleAddStore}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddStore(false);
                            setNewStore("");
                            setFormData((prev) => ({
                              ...prev,
                              phone_number: "",
                              address: "",
                            }));
                          }}
                          className="w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white text-sm font-medium py-2 px-4 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cabinet */}
                <div className="w-full max-w-xs flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cabinet
                  </label>
                  <input
                    type="text"
                    name="cabinet"
                    value={formData.cabinet}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, "row")}
                    placeholder="e.g. CAB-01"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                {/* Row */}
                <div className="w-full max-w-xs flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Row
                  </label>
                  <input
                    type="text"
                    name="row"
                    value={formData.row}
                    onChange={handleChange}
                    placeholder="e.g. ROW-01"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Extra Fields Section */}
            {formData.extra_fields?.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Additional Fields
                </h3>
                <div className="space-y-6">
                  {formData.extra_fields?.map((field, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2"
                    >
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Field Name
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            name="name"
                            value={field.name}
                            onChange={(e) => handleExtraFieldChange(index, e)}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            placeholder={`Field ${index + 1} name`}
                          />
                          <button
                            type="button"
                            onClick={() => removeExtraField(index)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Field Value
                        </label>
                        <input
                          type="text"
                          name="value"
                          value={field.value}
                          onChange={(e) => handleExtraFieldChange(index, e)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder={`Field ${index + 1} value`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={addExtraField}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Custom Field
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {initialData ? "Update Product" : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
