import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Edit, Trash } from "lucide-react";
import Notification from "../notification/Notification";

const StoreLocationForm = () => {
  const [formData, setFormData] = useState({
    store_name: "",
    phone_number: "",
    address: "",
  });
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  // Refs for input fields
  const storeNameRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const addressRef = useRef(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/store-locations"
      );
      setStores(response.data);
    } catch (error) {
      console.error("Error fetching store locations:", error);
      showNotification("Failed to fetch stores.", "error");
    }
  };

  useEffect(() => {
    if (selectedStore) {
      setFormData({
        store_name: selectedStore.store_name || "",
        phone_number: selectedStore.phone_number || "",
        address: selectedStore.address || "",
      });

      // Focus first field when editing
      if (storeNameRef.current) storeNameRef.current.focus();
    } else {
      resetForm();
    }
  }, [selectedStore]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle Enter key navigation
  const handleKeyDown = (e, fieldName) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (fieldName === "store_name") {
        phoneNumberRef.current.focus();
      } else if (fieldName === "phone_number") {
        addressRef.current.focus();
      } else if (fieldName === "address") {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedStore) {
        await axios.put(
          `http://127.0.0.1:8000/api/store-locations/${selectedStore.id}`,
          formData
        );
        showNotification("Store location updated successfully!", "success");
      } else {
        await axios.post("http://127.0.0.1:8000/api/store-locations", formData);
        showNotification("Store location added successfully!", "success");
      }
      fetchStores();
      resetForm();
    } catch (error) {
      console.error("Error saving store location:", error);
      showNotification("An error occurred. Please try again!", "error");
    }
  };

  const resetForm = () => {
    setFormData({ store_name: "", phone_number: "", address: "" });
    setSelectedStore(null);
    if (storeNameRef.current) storeNameRef.current.focus();
  };

  const handleEdit = (store) => {
    setSelectedStore(store);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/store-locations/${id}`);
      fetchStores();
      showNotification("Store deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting store:", error);
      showNotification("Error deleting store!", "error");
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ ...notification, visible: false });
    }, 3000);
  };

  return (
    <div className="container mx-auto p-4">
      {notification.visible && (
        <Notification message={notification.message} type={notification.type} />
      )}

      <div className="flex space-x-8">
        {/* Store Location Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-3/6 p-6 bg-white rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold text-center mb-4 text-amber-600">
            {selectedStore ? "Update" : "Add"} Store Location
          </h2>

          <div className="mb-4">
            <input
              type="text"
              name="store_name"
              value={formData.store_name}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "store_name")}
              placeholder="Store Name"
              required
              ref={storeNameRef}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "phone_number")}
              placeholder="Phone Number"
              ref={phoneNumberRef}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, "address")}
              placeholder="Address"
              required
              ref={addressRef}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {selectedStore ? "Update" : "Add"} Store
          </button>
        </form>

        {/* Store Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full border border-collapse">
            <thead className="bg-gray-500 text-white">
              <tr>
                <th className="px-4 py-2 border-b">S.No</th>
                <th className="px-4 py-2 border-b">Store Name</th>
                <th className="px-4 py-2 border-b">Phone</th>
                <th className="px-4 py-2 border-b">Address</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, index) => (
                <tr key={store.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">{index + 1}</td>
                  <td className="px-4 py-2 border-b">{store.store_name}</td>
                  <td className="px-4 py-2 border-b">{store.phone_number}</td>
                  <td className="px-4 py-2 border-b">{store.address}</td>
                  <td className="px-4 py-2 border-b flex space-x-2">
                    <button
                      onClick={() => handleEdit(store)}
                      className="text-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="text-red-600"
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreLocationForm;
