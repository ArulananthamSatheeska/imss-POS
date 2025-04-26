import React, { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import {
  createProductionCategory,
  updateProductionCategory,
} from "../../services/productionapi.js";
import { toast } from "react-toastify";

const ProductionCategoryModal = ({ onClose, onSubmit, editingCategory }) => {
  const [formData, setFormData] = useState({
    name: editingCategory?.name || "",
    batch_number: editingCategory?.batch_number || "",
    production_date: editingCategory?.production_date || "",
    is_active: editingCategory?.is_active ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const updated = await updateProductionCategory(
          editingCategory.id,
          formData
        );
        onSubmit(updated.data);
        toast.success("Production category updated successfully");
      } else {
        const created = await createProductionCategory(formData);
        onSubmit(created.data);
        toast.success("Production category created successfully");
      }
      onClose();
    } catch (error) {
      console.error("Error saving production category:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editingCategory ? "Edit" : "Add"} Production Category
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Batch Number
            </label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Production Date
            </label>
            <input
              type="date"
              name="production_date"
              value={formData.production_date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="mr-2"
              />
              Active
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProductionCategoryModal;
