import React, { useState, useEffect } from "react";
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
  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [categories, setCategories] = useState([]);

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
        // Initialize rawMaterialsList for editing, filtering invalid IDs
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

  const handleRawMaterialChange = (e) => {
    setSelectedRawMaterialId(e.target.value);
  };

  const handleQuantityChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setQuantity(value >= 0 ? value : 0);
  };

  const handleAddRawMaterial = () => {
    if (!selectedRawMaterialId || quantity <= 0 || price < 0) {
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raw Material
                </label>
                <select
                  value={selectedRawMaterialId}
                  onChange={handleRawMaterialChange}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Material</option>
                  {rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.category?.name || "N/A"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="0"
                  step="0.01"
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
                  type="button"
                  onClick={handleAddRawMaterial}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full"
                  disabled={
                    !selectedRawMaterialId || quantity <= 0 || price < 0
                  }
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          {rawMaterialsList.length > 0 && (
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
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Price
              </label>
              <input
                type="number"
                value={salesPrice}
                onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wholesale Price
              </label>
              <input
                type="number"
                value={wholesalePrice}
                onChange={(e) =>
                  setWholesalePrice(parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                MRP Price
              </label>
              <input
                type="number"
                value={mrpPrice}
                onChange={(e) => setMrpPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
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
