import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import {
  createRawMaterial,
  updateRawMaterial,
  getProductionCategories,
  getSuppliers,
  getUnits,
} from "../../services/productionapi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RawMaterialModal({ onClose, onSubmit, editingMaterial }) {
  // Function to generate a unique barcode
  const generateBarcode = () => {
    const prefix = "RM";
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `${prefix}${timestamp}${random}`;
  };

  const [formData, setFormData] = useState({
    name: editingMaterial?.name || "",
    category_id: editingMaterial?.category_id || "",
    stock: editingMaterial?.stock || 0,
    unit_id: editingMaterial?.unit_id || "",
    barcode: editingMaterial?.barcode || generateBarcode(),
    supplier_id: editingMaterial?.supplier_id || "",
    cost_price: editingMaterial?.cost_price || "",
    selling_price: editingMaterial?.selling_price || "",
    expiry_date: editingMaterial?.expiry_date || "",
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, suppliersRes, unitsRes] = await Promise.all([
          getProductionCategories(),
          getSuppliers(),
          getUnits(),
        ]);
        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);
        setUnits(unitsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          "Failed to fetch data: " +
            (error.response?.data?.message || error.message)
        );
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.category_id ||
      !formData.stock ||
      !formData.unit_id ||
      !formData.supplier_id ||
      !formData.cost_price ||
      !formData.selling_price
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editingMaterial) {
        const updated = await updateRawMaterial(editingMaterial.id, formData);
        onSubmit(updated.data);
        toast.success("Raw material updated successfully");
      } else {
        const created = await createRawMaterial(formData);
        onSubmit(created.data);
        toast.success("Raw material created successfully");
      }
      onClose();
    } catch (error) {
      console.error("Error saving raw material:", error);
      const errorMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(", ")
        : error.response?.data?.message || error.message;
      toast.error(`Failed to save raw material: ${errorMessage}`);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-xl z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ToastContainer />
      <motion.div
        className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col border border-gray-300 dark:border-gray-700"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {editingMaterial ? "Edit Raw Material" : "Add Raw Material"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Form (Scrollable) */}
        <div className="overflow-y-auto flex-grow p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Material Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
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
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                required
                min="0"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit *
              </label>
              <select
                name="unit_id"
                value={formData.unit_id}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Barcode
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier *
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cost Price *
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selling Price *
              </label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 dark:text-white"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-2 border-t pt-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-lg transition"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default RawMaterialModal;
