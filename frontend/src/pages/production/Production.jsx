import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Beaker, ClipboardList, Box, Factory } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MakeProductForm from "./MakeProductForm";
import RawMaterialModal from "./RawMaterialModal";
import ProductionCategoryModal from "./ProductionCategoryModal";
import {
  getRawMaterials,
  getProductionCategories,
  getProductionItems,
  createRawMaterial,
  createProductionCategory,
  createProductionItem,
} from "../../services/productionapi";
import "./style.css";

function ProductionManagement() {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [productionCategories, setProductionCategories] = useState([]);
  const [productionItems, setProductionItems] = useState([]);
  const [showMakeProductForm, setShowMakeProductForm] = useState(false);
  const [showRawMaterialModal, setShowRawMaterialModal] = useState(false);
  const [showProductionCategoryModal, setShowProductionCategoryModal] =
    useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, categoriesRes, itemsRes] = await Promise.all([
          getRawMaterials(),
          getProductionCategories(),
          getProductionItems(),
        ]);
        setRawMaterials(materialsRes.data);
        setProductionCategories(categoriesRes.data);
        setProductionItems(itemsRes.data);
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

  // Refresh all data after adding/updating
  const refreshData = async () => {
    try {
      const [materialsRes, categoriesRes, itemsRes] = await Promise.all([
        getRawMaterials(),
        getProductionCategories(),
        getProductionItems(),
      ]);
      setRawMaterials(materialsRes.data);
      setProductionCategories(categoriesRes.data);
      setProductionItems(itemsRes.data);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error(
        "Failed to refresh data: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle adding/editing raw material
  const handleAddRawMaterial = async (material) => {
    try {
      const response = await createRawMaterial(material);
      setRawMaterials([...rawMaterials, response.data]);
      setShowRawMaterialModal(false);
      toast.success("Raw material added successfully");
      await refreshData();
    } catch (error) {
      console.error("Error adding raw material:", error);
      toast.error(
        "Failed to add raw material: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle adding/editing production category
  const handleAddProductionCategory = async (category) => {
    try {
      const response = await createProductionCategory(category);
      setProductionCategories([...productionCategories, response.data]);
      setShowProductionCategoryModal(false);
      toast.success("Production category added successfully");
      await refreshData();
    } catch (error) {
      console.error("Error adding production category:", error);
      toast.error(
        "Failed to add production category: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle adding/editing production item
  const handleAddProductionItem = async (item) => {
    try {
      const response = await createProductionItem(item);
      setProductionItems([...productionItems, response.data]);
      setShowMakeProductForm(false);
      toast.success("Production item added successfully");
      await refreshData();
    } catch (error) {
      console.error("Error adding production item:", error);
      const errorMessages = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([key, messages]) => `${key}: ${messages.join(", ")}`)
            .join("; ")
        : error.response?.data?.message || error.message;
      toast.error(`Failed to add production item: ${errorMessages}`);
    }
  };

  // Handle updating production item
  const handleUpdateProductionItem = async (item) => {
    try {
      const response = await updateProductionItem(item.id, item);
      setProductionItems(
        productionItems.map((i) => (i.id === item.id ? response.data : i))
      );
      setShowMakeProductForm(false);
      toast.success("Production item updated successfully");
      await refreshData();
    } catch (error) {
      console.error("Error updating production item:", error);
      const errorMessages = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([key, messages]) => `${key}: ${messages.join(", ")}`)
            .join("; ")
        : error.response?.data?.message || error.message;
      toast.error(`Failed to update production item: ${errorMessages}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <ToastContainer />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center items-center">
        <div className="flex justify-start">
          <h1 className="text-3xl font-bold mb-6">Production Management</h1>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowMakeProductForm(true);
            }}
            className="bg-purple-500 text-white p-3 rounded-lg flex items-center relative overflow-hidden group"
          >
            <Factory className="w-4 h-4 mr-1" />
            Make Product
            <span className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-30 animate-light group-hover:opacity-50"></span>
            <span className="absolute inset-0 border-2 border-white opacity-40 animate-outline group-hover:opacity-70"></span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showMakeProductForm && (
        <MakeProductForm
          onClose={() => {
            setShowMakeProductForm(false);
            setEditingItem(null);
          }}
          onSubmit={
            editingItem ? handleUpdateProductionItem : handleAddProductionItem
          }
          editingProduct={editingItem}
        />
      )}

      {showRawMaterialModal && (
        <RawMaterialModal
          onClose={() => setShowRawMaterialModal(false)}
          onSubmit={handleAddRawMaterial}
        />
      )}

      {showProductionCategoryModal && (
        <ProductionCategoryModal
          onClose={() => setShowProductionCategoryModal(false)}
          onSubmit={handleAddProductionCategory}
        />
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Beaker className="w-5 h-5 mr-2" />
              Raw Materials
            </h2>
            <button
              onClick={() => setShowRawMaterialModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Raw Materials: {rawMaterials.length}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              Categories
            </h2>
            <button
              onClick={() => setShowProductionCategoryModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Categories: {productionCategories.length}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Box className="w-5 h-5 mr-2" />
              Production Items
            </h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowMakeProductForm(true);
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Items: {productionItems.length}
          </div>
        </motion.section>
      </div>

      {/* Raw Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Beaker className="w-5 h-5 mr-2" />
          Raw Materials Inventory
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Name
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Category
                </th>
                <th className="p-3 text-left border-b-600">Stock</th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Unit
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Supplier
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Cost Price
                </th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((material, index) => (
                <tr
                  key={material.id}
                  className={`border-b dark:border-gray-600 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <td className="p-3 dark:text-gray-300">{material.name}</td>
                  <td className="p-3 dark:text-gray-300">
                    {material.category?.name || "N/A"}
                  </td>
                  <td className="p-3 dark:text-gray-300">{material.stock}</td>
                  <td className="p-3 dark:text-gray-300">
                    {material.unit?.unit_name || "N/A"}
                  </td>
                  <td className="p-3 dark:text-gray-300">
                    {material.supplier?.supplier_name || "N/A"}
                  </td>
                  <td className="p-3 dark:text-gray-300">
                    {material.cost_price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Box className="w-5 h-5 mr-2" />
          Production Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Product Name
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Category
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Sales Price
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Wholesale Price
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  MRP Price
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Ingredients
                </th>
              </tr>
            </thead>
            <tbody>
              {productionItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b dark:border-gray-600 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <td className="p-3 dark:text-gray-300">{item.name}</td>
                  <td className="p-3 dark:text-gray-300">
                    {item.category?.name || "N/A"}
                  </td>
                  <td className="p-3 dark:text-gray-300">{item.sales_price}</td>
                  <td className="p-3 dark:text-gray-300">
                    {item.wholesale_price}
                  </td>
                  <td className="p-3 dark:text-gray-300">{item.mrp_price}</td>
                  <td className="p-3 dark:text-gray-300">
                    {item.formulas?.length || 0} items
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductionManagement;
