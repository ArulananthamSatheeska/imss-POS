import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Beaker,
  ClipboardList,
  Box,
  Factory,
  Filter,
  ChevronsUpDown, // Correct import name
  Pencil,
  Trash2
} from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MakeProductForm from "./MakeProductForm";
import RawMaterialModal from "./RawMaterialModal";
import ProductionCategoryModal from "./ProductionCategoryModal";
import ItemForm from "../../components/item Form/ItemForm";
import axios from "axios";
import { useAuth } from "../../context/NewAuthContext";
import {
  getRawMaterials,
  getProductionCategories,
  getProductionItems,
  createRawMaterial,
  createProductionCategory,
  createProductionItem,
  updateProductionItem,
} from "../../services/productionapi";
import "./style.css";

function ProductionManagement() {
  const { currentUser } = useAuth();
  const [rawMaterials, setRawMaterials] = useState([]);
  const [productionCategories, setProductionCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productionItems, setProductionItems] = useState([]);
  const [existingItems, setExistingItems] = useState([]);
  const [showMakeProductForm, setShowMakeProductForm] = useState(false);
  const [showRawMaterialModal, setShowRawMaterialModal] = useState(false);
  const [showProductionCategoryModal, setShowProductionCategoryModal] =
    useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedProductionItem, setSelectedProductionItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Axios instance for products API
  const api = axios.create({
    baseURL: "https://imssposerp.com/backend/public/api",
    headers: {
      Authorization: `Bearer ${currentUser?.token}`,
      "Content-Type": "application/json",
    },
  });

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
        setCategories(categoriesRes.data);
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

  // Check existing products when productionItems change
  useEffect(() => {
    const checkExistingItems = async () => {
      try {
        const names = productionItems
          .map((item) => item.name)
          .filter((name) => name.trim());
        if (names.length > 0) {
          const response = await api.get("/products/check-names", {
            params: { names },
            paramsSerializer: (params) => {
              return Object.entries(params)
                .map(([key, value]) =>
                  Array.isArray(value)
                    ? value
                      .map((v) => `${key}[]=${encodeURIComponent(v)}`)
                      .join("&")
                    : `${key}=${encodeURIComponent(value)}`
                )
                .join("&");
            },
          });
          setExistingItems(response.data.existing);
        } else {
          setExistingItems([]);
        }
      } catch (error) {
        console.error("Error checking existing items:", {
          message: error.message,
          status: error.response?.status,
          response: error.response?.data,
        });
        if (error.response?.status === 404) {
          setExistingItems([]);
          toast.warn(
            "Product check endpoint not found, all items shown as addable."
          );
        } else {
          toast.error("Failed to check existing items: " + error.message);
        }
      }
    };
    checkExistingItems();
  }, [productionItems]);

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

  // Refresh only categories
  const refreshCategories = async () => {
    try {
      const categoriesRes = await getProductionCategories();
      setProductionCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error refreshing categories:", error);
      toast.error(
        "Failed to refresh categories: " +
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

  // Handle deleting raw material
  const handleDeleteRawMaterial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this raw material?")) {
      return;
    }
    try {
      await api.delete(`/raw-materials/${id}`);
      toast.success("Raw material deleted successfully");
      await refreshData();
    } catch (error) {
      console.error("Error deleting raw material:", error);
      toast.error(
        "Failed to delete raw material: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle adding/editing production category
  const handleAddProductionCategory = async (category) => {
    try {
      let response;
      if (editingCategory) {
        // Assuming updateProductionCategory API exists
        response = await api.put(`/production-categories/${editingCategory.id}`, category);
      } else {
        response = await createProductionCategory(category);
      }
      setShowProductionCategoryModal(false);
      setEditingCategory(null);
      toast.success(`Production category ${editingCategory ? "updated" : "added"} successfully`);
      await refreshCategories();
    } catch (error) {
      console.error("Error adding/editing production category:", error);
      toast.error(
        "Failed to add/edit production category: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle deleting production category
  const handleDeleteProductionCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this production category?")) {
      return;
    }
    try {
      await api.delete(`/production-categories/${id}`);
      toast.success("Production category deleted successfully");
      await refreshCategories();
    } catch (error) {
      console.error("Error deleting production category:", error);
      toast.error(
        "Failed to delete production category: " +
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

  // Open category modal for add or edit
  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setShowProductionCategoryModal(true);
  };

  // Handle deleting production item
  const handleDeleteProductionItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this production item?")) {
      return;
    }
    try {
      await api.delete(`/production-items/${id}`);
      toast.success("Production item deleted successfully");
      await refreshData();
    } catch (error) {
      console.error("Error deleting production item:", error);
      toast.error(
        "Failed to delete production item: " +
        (error.response?.data?.message || error.message)
      );
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


  // Handle adding to items
  const handleAddToItems = (item) => {
    console.log("Preparing ItemForm for:", item);
    const totalCost = item.formulas
      ? item.formulas.reduce(
        (sum, formula) => sum + (formula.quantity * formula.price || 0),
        0
      )
      : 0;
    setSelectedProductionItem({
      product_id: null,
      product_name: item.name,
      item_code: item.item_code || "",
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || null,
      buying_cost: totalCost,
      sales_price: parseFloat(item.sales_price) || 0,
      minimum_price: 0,
      wholesale_price: parseFloat(item.wholesale_price) || 0,
      barcode: item.barcode || "",
      mrp: parseFloat(item.mrp_price) || 0,
      minimum_stock_quantity: 0,
      opening_stock_quantity: 0,
      opening_stock_value: 0,
      category: item.category?.name || "",
      supplier: "",
      unit_type: "",
      store_location: "",
      cabinet: "",
      row: "",
      extra_fields: "",
    });
    setShowItemForm(true);
  };

  // Handle ItemForm submission
  const handleItemFormSubmit = async (itemData) => {
    try {
      console.log("Original itemData:", itemData);
      const cleanedData = { ...itemData };
      // Always create new product, ignore product_id
      delete cleanedData.product_id;
      delete cleanedData.id;

      const response = await api.post("/products", cleanedData);

      toast.success(response.data.message);
      setShowItemForm(false);
      setSelectedProductionItem(null);
      const names = productionItems
        .map((item) => item.name)
        .filter((name) => name.trim());
      if (names.length > 0) {
        const res = await api.get("/products/check-names", {
          params: { names },
          paramsSerializer: (params) => {
            return Object.entries(params)
              .map(([key, value]) =>
                Array.isArray(value)
                  ? value
                    .map((v) => `${key}[]=${encodeURIComponent(v)}`)
                    .join("&")
                  : `${key}=${encodeURIComponent(value)}`
              )
              .join("&");
          },
        });
        setExistingItems(res.data.existing);
      }
    } catch (error) {
      console.error("Error adding item:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(
        "Error adding item: " + (error.response?.data?.message || error.message)
      );
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
          categories={productionCategories}
        />
      )}

      {showRawMaterialModal && (
        <RawMaterialModal
          onClose={() => setShowRawMaterialModal(false)}
          onSubmit={handleAddRawMaterial}
        />
      )}


      {showItemForm && (
        <ItemForm
          onSubmit={handleItemFormSubmit}
          initialData={selectedProductionItem}
          onClose={() => {
            setShowItemForm(false);
            setSelectedProductionItem(null);
          }}
          isEdit={false} // Explicitly set to add mode
        />
      )}


      {/* Raw Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <Beaker className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Raw Materials Inventory
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
              onClick={() => setShowRawMaterialModal(true)}>
              <Plus className="w-4 h-4 mr-1" />

              Add Material
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium">
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Name
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Category
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Stock
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Unit
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Supplier
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Unit Cost
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  <div className="flex items-center">
                    Total Value
                    <ChevronsUpDown className="w-4 h-4 ml-1 opacity-70" />
                  </div>
                </th>
                <th className="p-3 text-right border-b dark:border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rawMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">
                    {material.name}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    <span className={`px-2 py-1 text-xs rounded-full ${material.category_id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'}`}>
                      {(() => {
                        const categoryId = material.category_id ?? material.category?.id;
                        const category = categories.find(
                          (cat) => cat.id === categoryId
                        );
                        return category ? category.name : "N/A";
                      })()}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <span className={`font-medium ${material.stock < 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {material.stock || 0}
                      </span>
                      {material.stock < 10 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {material.unit?.unit_name || "N/A"}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {material.supplier?.supplier_name || "N/A"}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-gray-300">
                    LKR {material.cost_price ? Number(material.cost_price).toFixed(2) : '0.00'}
                  </td>
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                    LKR {(material.cost_price && material.stock ?
                      (Number(material.cost_price) * Number(material.stock)).toFixed(2) :
                      '0.00')}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(material);
                          setShowRawMaterialModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                        title="Edit Raw Material"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRawMaterial(material.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                        title="Delete Raw Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{rawMaterials.length}</span> of{' '}
            <span className="font-medium">{rawMaterials.length}</span> results
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50">
              Next
            </button>
          </div>
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
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Total Cost
                </th>
                <th className="p-3 text-left border-b dark:border-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {productionItems.map((item, index) => {
                const totalCost = item.formulas
                  ? item.formulas.reduce(
                    (sum, formula) => sum + (formula.quantity * formula.price || 0),
                    0
                  )
                  : 0;
                return (
                  <tr
                    key={item.id}
                    className={`border-b dark:border-gray-600 ${index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700"
                      }`}
                  >
                    <td className="p-3 dark:text-gray-300">{item.name}</td>
                    <td className="p-3 dark:text-gray-300">
                      {(() => {
                        const categoryId = item.category_id ?? item.category?.id;
                        const category = categories.find(
                          (cat) => cat.id === categoryId
                        );
                        return category ? category.name : "N/A";
                      })()}
                    </td>
                    <td className="p-3 dark:text-gray-300">{item.sales_price}</td>
                    <td className="p-3 dark:text-gray-300">
                      {item.wholesale_price}
                    </td>
                    <td className="p-3 dark:text-gray-300">{item.mrp_price}</td>
                    <td className="p-3 dark:text-gray-300">
                      {item.formulas?.length || 0} items
                    </td>
                    <td className="p-3 dark:text-gray-300">{totalCost.toFixed(2)}</td>
                    <td className="p-3 dark:text-gray-300">
                      {existingItems.includes(item.name) ? (
                        <span className="text-green-500">In Items</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAddToItems(item)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            title="Add to Items"
                          >
                            Add to Items
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowMakeProductForm(true);
                            }}
                            className="text-yellow-500 hover:text-yellow-700 mr-2"
                            title="Edit Production Item"
                          >
                            <Pencil className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteProductionItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Production Item"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductionManagement;
