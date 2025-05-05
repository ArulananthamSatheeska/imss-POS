import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash } from "lucide-react";
import Notification from "../notification/Notification"; // Assuming Notification component exists

const SupplierForm = ({ supplier, onSuccess }) => {
  const [supplierName, setSupplierName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (supplier) {
      setSupplierName(supplier.supplier_name);
      setContact(supplier.contact);
      setAddress(supplier.address);
    } else {
      setSupplierName("");
      setContact("");
      setAddress("");
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (supplier) {
        await axios.put(`http://127.0.0.1:8080/api/suppliers/${supplier.id}`, {
          supplier_name: supplierName,
          contact,
          address,
        });
        onSuccess("Supplier updated successfully!", "success");
      } else {
        await axios.post("http://127.0.0.1:8080/api/suppliers", {
          supplier_name: supplierName,
          contact,
          address,
        });
        onSuccess("Supplier added successfully!", "success");
      }

      // Reset form fields after success
      setSupplierName("");
      setContact("");
      setAddress("");

    } catch (error) {
      console.error("Error saving supplier:", error);
      onSuccess("Error saving supplier!", "error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md p-6 mx-auto mb-6 transition-transform duration-300 ease-in-out transform bg-white rounded-lg shadow-lg hover:scale-105"
    >
      <h2 className="mb-4 text-2xl font-bold text-center text-amber-600">
        {supplier ? "Update" : "Add"} Supplier
      </h2>

      <div className="mb-4">
        <input
          type="text"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          placeholder="Supplier Name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Contact"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 font-semibold text-white transition duration-200 ease-in-out transform bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105"
      >
        {supplier ? "Update" : "Add"} Supplier
      </button>
    </form>
  );
};

const SupplierTable = ({ suppliers, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-collapse">
        <thead className="bg-gray-500">
          <tr className="text-left">
            <th className="px-4 py-2 border-b-2 border-gray-300">S.No</th>
            <th className="px-4 py-2 border-b-2 border-gray-300">Supplier Name</th>
            <th className="px-4 py-2 border-b-2 border-gray-300">Contact</th>
            <th className="px-4 py-2 border-b-2 border-gray-300">Address</th>
            <th className="px-4 py-2 border-b-2 border-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {suppliers.map((supplier, index) => (
            <tr key={supplier.id} className="hover:bg-gray-100">
              <td className="px-4 py-2 border-b border-gray-300">{index + 1}</td>
              <td className="px-4 py-2 border-b border-gray-300">{supplier.supplier_name}</td>
              <td className="px-4 py-2 border-b border-gray-300">{supplier.contact}</td>
              <td className="px-4 py-2 border-b border-gray-300">{supplier.address}</td>
              <td className="px-4 py-2 border-b border-gray-300">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onEdit(supplier)}
                    className="px-2 py-1 text-blue-600 bg-blue-200 rounded-lg hover:bg-blue-300"
                    title="Edit Supplier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(supplier.id)}
                    className="px-2 py-1 text-red-600 bg-red-200 rounded-lg hover:bg-red-300"
                    title="Delete Supplier"
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

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false, onConfirm: null });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8080/api/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleDelete = (id) => {
    setNotification({
      message: "Are you sure you want to delete this supplier?",
      type: "confirm",
      visible: true,
      onConfirm: () => confirmDelete(id),
    });
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8080/api/suppliers/${id}`);
      fetchSuppliers();
      showNotification("Supplier deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      showNotification("Error deleting supplier!", "error");
    }
  };

  const handleSuccess = (message, type) => {
    setSelectedSupplier(null);
    fetchSuppliers();
    showNotification(message, type);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true, onConfirm: null });
    setTimeout(() => setNotification({ ...notification, visible: false }), 3000);
  };

  return (
    <div className="container p-4 mx-auto">
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, visible: false })}
        >
          {notification.type === "confirm" && (
            <div className="flex justify-center mt-4 space-x-4">
              <button
                onClick={() => {
                  notification.onConfirm();
                  setNotification({ ...notification, visible: false });
                }}
                className="px-4 py-2 text-white bg-red-600 rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setNotification({ ...notification, visible: false })}
                className="px-4 py-2 text-white bg-gray-400 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </Notification>
      )}
      <div className="flex flex-col md:flex-row md:space-x-4">
        <SupplierForm supplier={selectedSupplier} onSuccess={handleSuccess} />
        <SupplierTable suppliers={suppliers} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default SupplierManagement;