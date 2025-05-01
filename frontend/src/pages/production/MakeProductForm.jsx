import React, { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import {
  createProductionItem,
  updateProductionItem,
  getRawMaterials,
  getProductionCategories,
} from "../../services/productionapi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function MakeProductForm({ onClose, onSubmit, editingProduct }) {
  const [productName, setProductName] = useState(editingProduct?.name || "");
  const [categoryId, setCategoryId] = useState(
    editingProduct?.category_id || ""
  );
  const [salesPrice, setSalesPrice] = useState(
    editingProduct?.sales_price || 0
  );
  const [wholesalePrice, setWholesalePrice] = useState(
    editingProduct?.wholesale_price || 0
  );
  const [mrpPrice, setMrpPrice] = useState(editingProduct?.mrp_price || 0);
  const [salesPricePercentage, setSalesPricePercentage] = useState("");
  const [wholesalePricePercentage, setWholesalePricePercentage] = useState("");
  const [mrpPricePercentage, setMrpPricePercentage] = useState("");
  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const addButtonRef = useRef(null);
  const suggestionsRef = useRef(null);
  const salesPriceInputRef = useRef(null);
  const salesPricePercentageRef = useRef(null);
  const wholesalePricePercentageRef = useRef(null);
  const mrpPricePercentageRef = useRef(null);

  useEffect(() => {
    if (editingProduct) {
      setProductName(editingProduct.name || "");
      setCategoryId(editingProduct.category_id || "");
      setSalesPrice(editingProduct.sales_price || 0);
      setWholesalePrice(editingProduct.wholesale_price || 0);
      setMrpPrice(editingProduct.mrp_price || 0);
      setRawMaterialsList(
        editingProduct.formulas?.map((formula) => ({
          raw_material_id: formula.raw_material_id,
          itemName: formula.rawMaterial?.name || "Unknown",
          quantity: formula.quantity,
          price: formula.price,
          total: formula.quantity * formula.price,
        })) || []
      );
    } else {
      setProductName("");
      setCategoryId("");
      setSalesPrice(0);
      setWholesalePrice(0);
      setMrpPrice(0);
      setRawMaterialsList([]);
    }
  }, [editingProduct]);

  // Calculate total raw materials cost
  const rawMaterialsTotal = rawMaterialsList.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // Calculate profit margins
  const salesMargin = salesPrice - rawMaterialsTotal;
  const wholesaleMargin = wholesalePrice - rawMaterialsTotal;
  const mrpMargin = mrpPrice - rawMaterialsTotal;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, categoriesRes] = await Promise.all([
          getRawMaterials(),
          getProductionCategories(),
        ]);
        setRawMaterials(materialsRes.data);
        setCategories(categoriesRes.data);
        if (!materialsRes.data.length)
          toast.warn("No raw materials available. Please add some.");
        if (!categoriesRes.data.length)
          toast.warn("No categories available. Please add some.");
        if (editingProduct?.formulas) {
          const validRawMaterials = editingProduct.formulas
            .filter((formula) =>
              materialsRes.data.some((m) => m.id === formula.raw_material_id)
            )
            .map((formula) => ({
              raw_material_id: formula.raw_material_id,
              itemName: formula.rawMaterial?.name || "Unknown",
              quantity: formula.quantity,
              price: formula.price,
              total: formula.quantity * formula.price,
            }));
          setRawMaterialsList(validRawMaterials);
          if (validRawMaterials.length !== editingProduct.formulas.length) {
            toast.warn(
              "Some raw materials were removed as they no longer exist."
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          "Failed to fetch data: " +
          (error.response?.data?.message || error.message)
        );
      }
    };
    fetchData();
  }, [editingProduct]);

  useEffect(() => {
    if (selectedRawMaterialId) {
      const selectedMaterial = rawMaterials.find(
        (m) => m.id === parseInt(selectedRawMaterialId)
      );
      if (selectedMaterial && selectedMaterial.cost_price != null) {
        setPrice(parseFloat(selectedMaterial.cost_price));
      } else {
        setPrice(0);
        toast.warn("Selected raw material has no cost price");
      }
    } else {
      setPrice(0);
    }
  }, [selectedRawMaterialId, rawMaterials]);

  useEffect(() => {
    setTotal(quantity * price);
  }, [quantity, price]);

  // Update prices based on percentage inputs
  useEffect(() => {
    if (rawMaterialsTotal > 0 && salesPricePercentage) {
      const percentage = parseFloat(salesPricePercentage) || 0;
      setSalesPrice(rawMaterialsTotal * (1 + percentage / 100));
    }
  }, [salesPricePercentage, rawMaterialsTotal]);

  useEffect(() => {
    if (rawMaterialsTotal > 0 && wholesalePricePercentage) {
      const percentage = parseFloat(wholesalePricePercentage) || 0;
      setWholesalePrice(rawMaterialsTotal * (1 + percentage / 100));
    }
  }, [wholesalePricePercentage, rawMaterialsTotal]);

  useEffect(() => {
    if (rawMaterialsTotal > 0 && mrpPricePercentage) {
      const percentage = parseFloat(mrpPricePercentage) || 0;
      setMrpPrice(rawMaterialsTotal * (1 + percentage / 100));
    }
  }, [mrpPricePercentage, rawMaterialsTotal]);

  // Reset form after successful submission
  const resetForm = () => {
    setProductName("");
    setCategoryId("");
    setSalesPrice(0);
    setWholesalePrice(0);
    setMrpPrice(0);
    setSalesPricePercentage("");
    setWholesalePricePercentage("");
    setMrpPricePercentage("");
    setRawMaterialsList([]);
    setSelectedRawMaterialId("");
    setQuantity(1);
    setPrice(0);
    setTotal(0);
    setSearchQuery("");
    setSuggestions([]);
  };

  // Handle search input and suggestions
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = rawMaterials.filter((material) =>
        material.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (material) => {
    setSelectedRawMaterialId(material.id);
    setSearchQuery("");
    setSuggestions([]);
    setHighlightedIndex(-1);
    quantityInputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (quantity > 0 && selectedRawMaterialId && price > 0) {
        addButtonRef.current.focus();
      } else {
        toast.error(
          "Please select a raw material, specify a quantity, and ensure price is valid"
        );
      }
    }
  };

  const handleAddKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRawMaterial();
    }
  };

  const handleSalesPriceClick = () => {
    if (rawMaterialsTotal > 0) {
      salesPricePercentageRef.current.focus();
    }
  };

  const handleSalesPricePercentageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (rawMaterialsTotal > 0) {
        wholesalePricePercentageRef.current.focus();
      }
    }
  };

  const handleWholesalePricePercentageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (rawMaterialsTotal > 0) {
        mrpPricePercentageRef.current.focus();
      }
    }
  };

  const handleMrpPricePercentageKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setQuantity(value >= 0 ? value : 0);
  };

  const handleAddRawMaterial = () => {
    if (!selectedRawMaterialId || quantity <= 0 || price <= 0) {
      toast.error(
        "Please select a raw material, specify a quantity, and ensure price is valid"
      );
      return;
    }
    const selectedMaterial = rawMaterials.find(
      (m) => m.id === parseInt(selectedRawMaterialId)
    );
    if (!selectedMaterial) {
      toast.error("Selected raw material not found");
      return;
    }
    const newMaterial = {
      raw_material_id: parseInt(selectedRawMaterialId),
      itemName: selectedMaterial.name,
      quantity,
      price,
      total: quantity * price,
    };
    setRawMaterialsList([...rawMaterialsList, newMaterial]);
    setSelectedRawMaterialId("");
    setQuantity(1);
    setPrice(0);
    setTotal(0);
    searchInputRef.current.focus();
  };

  const handleRemoveRawMaterial = (index) => {
    setRawMaterialsList(rawMaterialsList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !categoryId || rawMaterialsList.length === 0) {
      toast.error(
        "Please fill all required fields: Product Name, Category, and at least one Raw Material"
      );
      return;
    }
    if (
      isNaN(parseInt(categoryId)) ||
      !categories.find((c) => c.id === parseInt(categoryId))
    ) {
      toast.error(
        "Selected category is invalid. Please select a valid category."
      );
      return;
    }
    if (
      rawMaterialsList.some(
        (item) =>
          isNaN(parseInt(item.raw_material_id)) ||
          !rawMaterials.find((m) => m.id === parseInt(item.raw_material_id))
      )
    ) {
      toast.error("One or more raw material IDs are invalid");
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        name: productName.trim(),
        category_id: parseInt(categoryId),
        sales_price: parseFloat(salesPrice) || 0,
        wholesale_price: parseFloat(wholesalePrice) || 0,
        mrp_price: parseFloat(mrpPrice) || 0,
        raw_materials: rawMaterialsList.map((item) => ({
          raw_material_id: parseInt(item.raw_material_id),
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price) || 0,
        })),
      };

      let response;
      if (editingProduct) {
        response = await updateProductionItem(editingProduct.id, productData);
      } else {
        response = await createProductionItem(productData);
      }

      onSubmit(response.data);
      toast.success(
        `Production item ${editingProduct ? "updated" : "added"} successfully`
      );
      if (!editingProduct) {
        resetForm();
      }
      window.location.reload();
      onClose();
    } catch (error) {
      console.error("Error saving production item:", {
        message: error.message,
        status: error.response?.status,
        errors: error.response?.data?.errors,
        responseData: error.response?.data,
      });
      const errorMessages = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
          .map(([key, messages]) => `${key}: ${messages.join(", ")}`)
          .join("; ")
        : error.response?.data?.message || error.message;
      toast.error(`Failed to save product: ${errorMessages}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
          aria-label="Close form"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {editingProduct ? "Edit Product" : "Create New Product"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 w-full bg-gray-50 dark:bg-gray-700 p-6 rounded-lg"
        >
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Product Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  aria-required="true"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  aria-required="true"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Raw Materials Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Raw Materials
            </h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Raw Material
                  </label>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type to search..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    aria-haspopup="listbox"
                    aria-expanded={suggestions.length > 0}
                    aria-controls="raw-material-suggestions"
                  />
                  {suggestions.length > 0 && (
                    <ul
                      ref={suggestionsRef}
                      id="raw-material-suggestions"
                      className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      role="listbox"
                    >
                      {suggestions.map((material, index) => (
                        <li
                          key={material.id}
                          onClick={() => handleSuggestionSelect(material)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`p-2 cursor-pointer text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-600 ${index === highlightedIndex
                            ? "bg-blue-100 dark:bg-blue-600"
                            : ""
                            }`}
                          role="option"
                          aria-selected={index === highlightedIndex}
                        >
                          <div className="font-medium">{material.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {material.category?.name || "No category"} | LKR
                            {typeof material.cost_price === "number" && !isNaN(material.cost_price) ? material.cost_price.toFixed(2) : "0.00"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    onKeyDown={handleQuantityKeyDown}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={price.toFixed(2)}
                    readOnly
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    value={total.toFixed(2)}
                    readOnly
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <button
                    ref={addButtonRef}
                    type="button"
                    onClick={handleAddRawMaterial}
                    onKeyDown={handleAddKeyDown}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                    disabled={
                      !selectedRawMaterialId || quantity <= 0 || price <= 0
                    }
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {rawMaterialsList.length > 0 && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          #
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {rawMaterialsList.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                            {index + 1}
                          </td>
                          <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.itemName}
                          </td>
                          <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                            LKR {typeof item.price === "number" && !isNaN(item.price) ? item.price.toFixed(2) : "0.00"}
                          </td>
                          <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                            LKR {typeof item.total === "number" && !isNaN(item.total) ? item.total.toFixed(2) : "0.00"}
                          </td>
                          <td className="p-3 text-sm">
                            <button
                              type="button"
                              onClick={() => handleRemoveRawMaterial(index)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition"
                              aria-label="Remove item"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Raw Materials Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Total Items
                        </div>
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {rawMaterialsList.length}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Total Cost
                        </div>
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          LKR {rawMaterialsTotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Avg. Cost per Unit
                        </div>
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          LKR {(rawMaterialsTotal / Math.max(1, rawMaterialsList.length)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sales Price
                </label>
                <div className="flex space-x-2">
                  <input
                    ref={salesPriceInputRef}
                    type="number"
                    value={typeof salesPrice === "number" && !isNaN(salesPrice) ? salesPrice.toFixed(2) : "0.00"}
                    onChange={(e) => {
                      setSalesPrice(parseFloat(e.target.value) || 0);
                      setSalesPricePercentage("");
                    }}
                    onClick={handleSalesPriceClick}
                    min="0"
                    step="0.01"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  <input
                    ref={salesPricePercentageRef}
                    type="number"
                    value={salesPricePercentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || "";
                      setSalesPricePercentage(value);
                    }}
                    onKeyDown={handleSalesPricePercentageKeyDown}
                    placeholder="%"
                    min="0"
                    step="0.1"
                    disabled={rawMaterialsTotal === 0}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Margin:</span>
                  <span
                    className={`ml-2 font-medium ${salesMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    LKR {salesMargin.toFixed(2)} (
                    {rawMaterialsTotal > 0
                      ? ((salesMargin / rawMaterialsTotal) * 100).toFixed(2)
                      : "0.00"}
                    %)
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wholesale Price
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={typeof wholesalePrice === "number" && !isNaN(wholesalePrice) ? wholesalePrice.toFixed(2) : "0.00"}
                    onChange={(e) => {
                      setWholesalePrice(parseFloat(e.target.value) || 0);
                      setWholesalePricePercentage("");
                    }}
                    min="0"
                    step="0.01"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  <input
                    ref={wholesalePricePercentageRef}
                    type="number"
                    value={wholesalePricePercentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || "";
                      setWholesalePricePercentage(value);
                    }}
                    onKeyDown={handleWholesalePricePercentageKeyDown}
                    placeholder="%"
                    min="0"
                    step="0.1"
                    disabled={rawMaterialsTotal === 0}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Margin:</span>
                  <span
                    className={`ml-2 font-medium ${wholesaleMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    LKR {wholesaleMargin.toFixed(2)} (
                    {rawMaterialsTotal > 0
                      ? ((wholesaleMargin / rawMaterialsTotal) * 100).toFixed(2)
                      : "0.00"}
                    %)
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MRP Price
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={typeof mrpPrice === "number" && !isNaN(mrpPrice) ? mrpPrice.toFixed(2) : "0.00"}
                    onChange={(e) => {
                      setMrpPrice(parseFloat(e.target.value) || 0);
                      setMrpPricePercentage("");
                    }}
                    min="0"
                    step="0.01"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  <input
                    ref={mrpPricePercentageRef}
                    type="number"
                    value={mrpPricePercentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || "";
                      setMrpPricePercentage(value);
                    }}
                    onKeyDown={handleMrpPricePercentageKeyDown}
                    placeholder="%"
                    min="0"
                    step="0.1"
                    disabled={rawMaterialsTotal === 0}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Margin:</span>
                  <span
                    className={`ml-2 font-medium ${mrpMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    LKR {mrpMargin.toFixed(2)} (
                    {rawMaterialsTotal > 0
                      ? ((mrpMargin / rawMaterialsTotal) * 100).toFixed(2)
                      : "0.00"}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Cost & Profit Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Cost
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  LKR {rawMaterialsTotal.toFixed(2)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Sales Profit
                </div>
                <div
                  className={`text-2xl font-bold ${salesMargin >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                    }`}
                >
                  LKR {salesMargin.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {rawMaterialsTotal > 0
                    ? ((salesMargin / rawMaterialsTotal) * 100).toFixed(2) + "%"
                    : "0%"}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Wholesale Profit
                </div>
                <div
                  className={`text-2xl font-bold ${wholesaleMargin >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                    }`}
                >
                  LKR {wholesaleMargin.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {rawMaterialsTotal > 0
                    ? ((wholesaleMargin / rawMaterialsTotal) * 100).toFixed(2) + "%"
                    : "0%"}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  MRP Profit
                </div>
                <div
                  className={`text-2xl font-bold ${mrpMargin >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                    }`}
                >
                  LKR {mrpMargin.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {rawMaterialsTotal > 0
                    ? ((mrpMargin / rawMaterialsTotal) * 100).toFixed(2) + "%"
                    : "0%"}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition flex items-center justify-center min-w-24"
              disabled={
                isSubmitting ||
                !productName.trim() ||
                !categoryId ||
                rawMaterialsList.length === 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Product"
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default MakeProductForm;
