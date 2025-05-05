import React, { useState, useEffect } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ItemForm from "../../components/item Form/ItemForm";
import ProductDetailsModal from "./ProductDetailsModal";
import ConfirmationModal from "./ConfirmationModal";
import { useAuth } from "../../context/NewAuthContext";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  paginate,
  maxVisiblePages = 5,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i >= 1 && i <= totalPages) {
        pages.push(i);
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 p-2">
      <button
        onClick={() => paginate(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${currentPage === 1
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-200"
          }`}
      >
        Prev
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => (typeof page === "number" ? paginate(page) : null)}
          className={`px-3 py-1 rounded-md min-w-[2.5rem] ${page === currentPage
            ? "bg-blue-600 text-white"
            : typeof page === "number"
              ? "text-gray-700 hover:bg-gray-200"
              : "text-gray-500 cursor-default"
            }`}
          disabled={page === "..." || page === currentPage}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md ${currentPage === totalPages
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-200"
          }`}
      >
        Next
      </button>
    </div>
  );
};

const Items = () => {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedFile, setSelectedFile] = useState(null);

  const api = axios.create({
    baseURL: "http://127.0.0.1:8080/api",
    headers: {
      Authorization: `Bearer ${currentUser?.token}`,
      "Content-Type": "application/json",
    },
  });

  useEffect(() => {
    fetchItems();
  }, [currentPage]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get("/products");
      setItems(response.data.data);
      setFilteredItems(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Error fetching items: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(items)) {
      setFilteredItems(
        items.filter((item) =>
          item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, items]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      toast.success("File selected: " + file.name);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post("/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(response.data.message);
      setSelectedFile(null);
      fetchItems();
    } catch (error) {
      console.error("Error importing items:", error);
      toast.error(
        "Error importing items: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleExport = () => {
    if (!Array.isArray(items) || items.length === 0) {
      toast.error("No items to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
    XLSX.writeFile(workbook, "items_list.xlsx");
  };

  const handleEditItem = (item) => {
    if (item && item.product_id) {
      setSelectedItem(item);
      setShowForm(true);
    } else {
      console.error("Selected item does not have a product_id:", item);
      toast.error("Invalid item selected for editing.");
    }
  };

  const handleAddItem = async (newItem) => {
    try {
      console.log("Sending update data:", newItem);
      const response = selectedItem
        ? await api.put(`/products/${selectedItem.product_id}`, newItem)
        : await api.post("/products", newItem);

      toast.success(response.data.message);
      setShowForm(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
      console.error("Response data:", error.response?.data);
      toast.error(
        "Error saving item: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteItem = async (product_id) => {
    try {
      await api.delete(`/products/${product_id}`);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      toast.error("Error deleting item: " + error.message);
    } finally {
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalItems = filteredItems.length;
  const totalOpeningQty = filteredItems.reduce(
    (sum, item) => sum + (item.opening_stock_quantity || 0),
    0
  );
  const totalOpeningCost = filteredItems.reduce(
    (sum, item) =>
      sum + (item.opening_stock_quantity || 0) * (item.buying_cost || 0),
    0
  );
  const totalSellingPrice = filteredItems.reduce(
    (sum, item) =>
      sum + (item.opening_stock_quantity || 0) * (item.sales_price || 0),
    0
  );
  const profitMargin = totalSellingPrice - totalOpeningCost;
  const profitMarginPercentage = totalOpeningCost
    ? ((profitMargin / totalOpeningCost) * 100).toFixed(2)
    : 0;

  const formatNumber = (number) => {
    return number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <Search className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="fileInput"
          />
          <button
            onClick={() => document.getElementById("fileInput").click()}
            className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg cursor-pointer hover:bg-green-700"
          >
            Select Excel File
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile}
            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg ${selectedFile
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Import Selected File
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedItem ? "Edit Item" : "Add New Item"}
            </h2>
            <ItemForm
              onSubmit={handleAddItem}
              initialData={selectedItem}
              onClose={() => {
                setShowForm(false);
                setSelectedItem(null);
              }}
            />
          </div>
        </div>
      )}

      {showDetailsModal && (
        <ProductDetailsModal
          productId={selectedItem?.product_id}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDeleteItem(selectedItem.product_id)}
          message="Are you sure you want to delete this item?"
        />
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 text-white bg-gray-700">
            <tr>
              <th className="p-2 text-xs text-center uppercase">No</th>
              <th className="p-2 text-xs text-center uppercase">Name</th>
              <th className="p-2 text-xs text-center uppercase">Category</th>
              <th className="p-2 text-xs text-center uppercase">
                Buying Price
              </th>
              <th className="p-2 text-xs text-center uppercase">
                Selling Price
              </th>
              <th className="p-2 text-xs text-center uppercase">Opening Qty</th>
              <th className="p-2 text-xs text-center uppercase">
                Opening Value
              </th>
              <th className="p-2 text-xs text-center uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((item, index) => (
                  <tr
                    key={item.product_id}
                    className="hover:bg-gray-500 hover:text-emerald-300"
                  >
                    <td className="px-4 py-2 text-xs text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-2 text-xs text-left">
                      {item.product_name}
                    </td>
                    <td className="px-4 py-2 text-xs text-center">
                      {item.category}
                    </td>
                    <td className="px-4 py-2 text-xs text-right">
                      LKR {formatNumber(item.buying_cost)}
                    </td>
                    <td className="px-4 py-2 text-xs text-right">
                      LKR {formatNumber(item.sales_price)}
                    </td>
                    <td className="px-4 py-2 text-xs text-right">
                      {item.opening_stock_quantity}
                    </td>
                    <td className="px-4 py-2 text-xs text-right">
                      LKR{" "}
                      {formatNumber(
                        item.opening_stock_quantity * item.buying_cost
                      )}
                    </td>
                    <td className="flex justify-center gap-2 p-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredItems.length}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />

      <div className="p-4 mt-4 text-center bg-transparent rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Summary</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="p-4 rounded-lg bg-cyan-800">
            <p className="text-sm text-cyan-500">Total Items</p>
            <p className="text-2xl font-bold text-cyan-300">{totalItems}</p>
          </div>
          <div className="p-4 rounded-lg bg-rose-800">
            <p className="text-sm text-pink-500">Total Opening Qty</p>
            <p className="text-2xl font-bold text-pink-300">
              {totalOpeningQty}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-lime-800">
            <p className="text-sm text-lime-500">Total Opening Cost</p>
            <p className="text-2xl font-bold text-lime-300">
              LKR {formatNumber(totalOpeningCost)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-fuchsia-800">
            <p className="text-sm text-fuchsia-500">Total Selling Price</p>
            <p className="text-2xl font-bold text-fuchsia-300">
              LKR {formatNumber(totalSellingPrice)}
            </p>
          </div>
          <div className="p-4 bg-purple-800 rounded-lg">
            <p className="text-sm text-purple-500">Profit Margin</p>
            <p className="text-2xl font-bold text-purple-300">
              {profitMarginPercentage}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Items;