import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
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
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const addButtonRef = useRef(null);
  const suggestionsRef = useRef(null);
  const salesPriceInputRef = useRef(null);
  const salesPricePercentageRef = useRef(null);
  const wholesalePricePercentageRef = useRef(null);
  const mrpPricePercentageRef = useRef(null);

  // Calculate total raw materials cost
  const rawMaterialsTotal = rawMaterialsList.reduce(
    (sum, item) => sum + item.total,
    0
  );

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
      console.log("Submitting payload:", JSON.stringify(productData, null, 2));
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
    }
  };

  return (
    <div className="fixed inset-0 w-full flex items-center justify-center bg-slate-400 bg-opacity-50 z-50 overflow-y-auto">
      <ToastContainer />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-6xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          {editingProduct ? "Edit Product" : "Make Product"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-w-full mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
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
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Add Raw Material
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raw Material
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search materials..."
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                {suggestions.length > 0 && (
                  <ul
                    ref={suggestionsRef}
                    className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"
                  >
                    {suggestions.map((material, index) => (
                      <li
                        key={material.id}
                        onClick={() => handleSuggestionSelect(material)}
                        className={`p-2 cursor-pointer text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-600 ${
                          index === highlightedIndex
                            ? "bg-blue-100 dark:bg-blue-600"
                            : ""
                        }`}
                      >
                        {material.name} ({material.category?.name || "N/A"})
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
                  step="1"
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
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
                  className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex items-end h-full">
                <button
                  ref={addButtonRef}
                  type="button"
                  onClick={handleAddRawMaterial}
                  onKeyDown={handleAddKeyDown}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                  disabled={
                    !selectedRawMaterialId || quantity <= 0 || price <= 0
                  }
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          {rawMaterialsList.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-auto max-h-64">
                <table className="w-full border-collapse border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">Item Name</th>
                      <th className="p-2 border">Quantity</th>
                      <th className="p-2 border">Price</th>
                      <th className="p-2 border">Total</th>
                      <th className="p-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterialsList.map((item, index) => (
                      <tr
                        key={index}
                        className="border text-center dark:text-white"
                      >
                        <td className="p-2 border">{index + 1}</td>
                        <td className="p-2 border">{item.itemName}</td>
                        <td className="p-2 border">{item.quantity}</td>
                        <td className="p-2 border">{item.price.toFixed(2)}</td>
                        <td className="p-2 border">{item.total.toFixed(2)}</td>
                        <td className="p-2 border">
                          <button
                            type="button"
                            onClick={() => handleRemoveRawMaterial(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right pr-4">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Total Raw Materials Cost: ${rawMaterialsTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Price
              </label>
              <div className="flex space-x-2">
                <input
                  ref={salesPriceInputRef}
                  type="number"
                  value={salesPrice.toFixed(2)}
                  onChange={(e) => {
                    setSalesPrice(parseFloat(e.target.value) || 0);
                    setSalesPricePercentage("");
                  }}
                  onClick={handleSalesPriceClick}
                  min="0"
                  step="0.01"
                  className="w-2/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-1/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wholesale Price
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={wholesalePrice.toFixed(2)}
                  onChange={(e) => {
                    setWholesalePrice(parseFloat(e.target.value) || 0);
                    setWholesalePricePercentage("");
                  }}
                  min="0"
                  step="0.01"
                  className="w-2/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-1/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                MRP Price
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={mrpPrice.toFixed(2)}
                  onChange={(e) => {
                    setMrpPrice(parseFloat(e.target.value) || 0);
                    setMrpPricePercentage("");
                  }}
                  min="0"
                  step="0.01"
                  className="w-2/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-1/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
              disabled={
                !productName.trim() ||
                !categoryId ||
                rawMaterialsList.length === 0
              }
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MakeProductForm;
