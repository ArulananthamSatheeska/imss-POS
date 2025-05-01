import { useState, useEffect } from "react";
import { getData, postData, deleteData } from "../../services/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Pencil, Trash, Eye, Upload } from "lucide-react";

const API_URL = "/customers";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    nic_number: "",
    photo: null,
    photo_url: null,
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await getData(API_URL);
      setCustomers(response.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setErrors({ general: "Error fetching customers" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, photo: "Photo must be JPEG, PNG, or JPG" });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, photo: "Photo must be under 2MB" });
        return;
      }
      setForm({ ...form, photo: file, photo_url: null });
      setErrors({ ...errors, photo: "" });
    }
  };

  const validateForm = () => {
    return {};
  };

  const handleAddOrUpdateCustomer = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const formData = new FormData();
    const requiredFields = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      nic_number: form.nic_number.trim(),
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        setErrors({ ...errors, [key]: `${key.replace("_", " ")} is required` });
        setLoading(false);
        return;
      }
      formData.append(key, value);
    }

    if (form.email.trim()) formData.append("email", form.email.trim());
    if (form.address.trim()) formData.append("address", form.address.trim());
    if (form.photo instanceof File) {
      formData.append("photo", form.photo);
    }

    try {
      let response;
      if (editingCustomer && editingCustomer.id) {
        formData.append("_method", "PUT");
        response = await postData(`${API_URL}/${editingCustomer.id}`, formData);
      } else {
        response = await postData(API_URL, formData);
      }
      fetchCustomers();
      resetForm();
    } catch (err) {
      if (err.status === 422) {
        const backendErrors = {};
        Object.keys(err.details).forEach((key) => {
          backendErrors[key] = Array.isArray(err.details[key])
            ? err.details[key][0]
            : err.details[key];
        });
        setErrors({
          ...backendErrors,
          general: "Validation failed. Check the fields below.",
        });
      } else {
        setErrors({ general: err.message || "Failed to save customer" });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      customer_name: "",
      email: "",
      phone: "",
      address: "",
      nic_number: "",
      photo: null,
      photo_url: null,
    });
    setEditingCustomer(null);
    setErrors({});
  };

  const handleEditCustomer = (customer) => {
    const newForm = {
      customer_name: customer.customer_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      nic_number: customer.nic_number || "",
      photo: null,
      photo_url: customer.photo_url || null,
    };
    if (!newForm.customer_name || !newForm.phone || !newForm.nic_number) {
      setErrors({ general: "Invalid customer data loaded for editing" });
      return;
    }
    setForm(newForm);
    setEditingCustomer(customer);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    setLoading(true);
    try {
      await deleteData(`${API_URL}/${id}`);
      fetchCustomers();
    } catch (err) {
      setErrors({ general: "Error deleting customer" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = "none";
  };

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Customer Management</h2>

      {/* Customer Form */}
      <Card className="p-6 shadow-lg rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-4">
          {editingCustomer ? "Edit Customer" : "Add Customer"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="Name *"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.customer_name && (
              <p className="text-red-600 text-sm">{errors.customer_name}</p>
            )}
          </div>
          <div>
            <Input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <Input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone *"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
          </div>
          <div>
            <Input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.address && <p className="text-red-600 text-sm">{errors.address}</p>}
          </div>
          <div>
            <Input
              name="nic_number"
              value={form.nic_number}
              onChange={handleChange}
              placeholder="NIC Number *"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.nic_number && <p className="text-red-600 text-sm">{errors.nic_number}</p>}
          </div>
          <div className="flex flex-col items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2 border p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Upload className="w-5 h-5 text-blue-600" /> Upload Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
            {(form.photo || form.photo_url) && (
              <img
                src={form.photo instanceof File ? URL.createObjectURL(form.photo) : form.photo_url}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover"
                onError={handleImageError}
              />
            )}
            {form.photo_url && <p className="text-sm text-gray-600">URL: {form.photo_url}</p>}
            {errors.photo && <p className="text-red-600 text-sm">{errors.photo}</p>}
          </div>
        </div>
        <div className="mt-4">
          {Object.keys(errors).map(
            (key) =>
              key !== "general" &&
              errors[key] && (
                <p key={key} className="text-red-600 text-sm">
                  {key.replace("_", " ")}: {errors[key]}
                </p>
              )
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            className="bg-purple-700 hover:bg-purple-800 text-white w-full md:w-auto"
            onClick={handleAddOrUpdateCustomer}
            disabled={loading}
          >
            {loading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
          </Button>
          {editingCustomer && (
            <Button className="bg-gray-500 hover:bg-gray-600 text-white w-full md:w-auto" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
        {errors.general && <p className="text-red-600 mt-2">{errors.general}</p>}
      </Card>

      {/* Customers Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-100 transition-colors">
                <td className="p-3 border text-center">{customer.customer_name}</td>
                <td className="p-3 border text-center">{customer.email || "-"}</td>
                <td className="p-3 border text-center">{customer.phone || "-"}</td>
                <td className="p-3 border text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="ghost" onClick={() => setSelectedCustomer(customer)} className="hover:bg-blue-100 p-2 rounded-full">
                      <Eye className="w-5 h-5 text-cyan-500" />
                    </Button>
                    <Button variant="ghost" onClick={() => handleEditCustomer(customer)} className="hover:bg-green-100 p-2 rounded-full">
                      <Pencil className="w-5 h-5 text-emerald-500" />
                    </Button>
                    <Button variant="ghost" onClick={() => handleDeleteCustomer(customer.id)} className="hover:bg-red-100 p-2 rounded-full">
                      <Trash className="w-5 h-5 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h3 className="text-lg font-semibold mb-4">{selectedCustomer.customer_name}</h3>
            <div className="space-y-2">
              <p>Email: {selectedCustomer.email || "-"}</p>
              <p>Phone: {selectedCustomer.phone || "-"}</p>
              <p>Address: {selectedCustomer.address || "-"}</p>
              <p>NIC Number: {selectedCustomer.nic_number}</p>
              {selectedCustomer.photo_url ? (
                <img
                  src={selectedCustomer.photo_url}
                  alt="Customer"
                  className="mt-4 rounded-lg w-full h-48 object-cover"
                  onError={handleImageError}
                />
              ) : (
                <p className="text-sm text-gray-600 mt-4">No photo available</p>
              )}
              {selectedCustomer.photo_url && <p className="text-sm text-gray-600">Photo URL: {selectedCustomer.photo_url}</p>}
            </div>
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={() => setSelectedCustomer(null)}
              aria-label="Close modal"
            >
              &#x2715;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
