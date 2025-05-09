import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash } from "lucide-react";
import Notification from "../notification/Notification";

const CategoryForm = ({ category, onSuccess }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(category ? category.name : "");
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (category) {
        await axios.put(
          `https://imssposerp.com/backend/public/api/categories/${category.id}`,
          { name }
        );
        onSuccess("Category updated successfully!", "success");
      } else {
        await axios.post(
          "https://imssposerp.com/backend/public/api/categories",
          { name }
        );
        onSuccess("Category added successfully!", "success");
      }
      setName(""); // Reset form field after success
    } catch (error) {
      console.error("Error saving category:", error);
      onSuccess("Error Saving Category", "error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-transparent rounded-lg shadow-lg text-white"
    >
      <h2 className="text-2xl text-amber-600 font-bold text-center mb-4">
        {category ? "Update" : "Add"} Category
      </h2>
      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          required
          className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105"
      >
        {category ? "Update" : "Add"} Category
      </button>
    </form>
  );
};

const CategoryTable = ({ categories, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-collapse">
        <thead className="bg-gray-700 text-white">
          <tr>
            <th className="px-4 py-2 border-b-2">S.No</th>
            <th className="px-4 py-2 border-b-2">Category Name</th>
            <th className="px-4 py-2 border-b-2">Actions</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {categories.map((category, index) => (
            <tr
              key={category.id}
              className="hover:bg-gray-100 transition duration-200 ease-in-out"
            >
              <td className="px-4 py-2 border-b">{index + 1}</td>
              <td className="px-4 py-2 border-b text-left">{category.name}</td>
              <td className="px-4 py-2 border-b">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onEdit(category)}
                    className="px-2 py-1 text-blue-600 bg-blue-200 rounded-lg hover:bg-blue-300"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(category.id)}
                    className="px-2 py-1 text-red-600 bg-red-200 rounded-lg hover:bg-red-300"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
    onConfirm: null,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "https://imssposerp.com/backend/public/api/categories"
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
  };

  const handleDelete = (id) => {
    setNotification({
      message: "Are you sure you want to delete this category?",
      type: "confirm",
      visible: true,
      onConfirm: () => confirmDelete(id),
    });
  };

  const confirmDelete = async (id) => {
    try {
      const response = await axios.delete(
        `https://imssposerp.com/backend/public/api/categories/${id}`
      );
      if (response.status === 200) {
        fetchCategories();
        showNotification("Category deleted successfully!", "success");
      } else {
        showNotification(
          "Failed to delete category. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showNotification("Error deleting category!", "error");
    }
  };

  const handleSuccess = (message, type) => {
    setSelectedCategory(null);
    fetchCategories();
    showNotification(message, type);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true, onConfirm: null });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <div className="container mx-auto p-4">
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification((prev) => ({ ...prev, visible: false }))
          }
        >
          {notification.type === "confirm" && (
            <div className="flex justify-center mt-4 space-x-4">
              <button
                onClick={notification.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                onClick={() =>
                  setNotification((prev) => ({ ...prev, visible: false }))
                }
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </Notification>
      )}
      <div className="flex flex-col md:flex-row md:space-x-4">
        <div className="flex-1">
          <CategoryForm category={selectedCategory} onSuccess={handleSuccess} />
        </div>
        <div className="flex-1">
          <CategoryTable
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
