import { useState, useEffect } from "react";
import { getData, postData, putData, deleteData } from "../../services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash, Eye, Upload } from "lucide-react";
import Dialog from "@/components/ui/dialog";

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
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch customers from API
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await getData(API_URL);
      setCustomers(response.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Error fetching customers");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, photo: file });
    }
  };

  const handleAddOrUpdateCustomer = async () => {
    // Client-side validation
    if (!form.customer_name.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("customer_name", form.customer_name.trim());
    formData.append("email", form.email.trim());
    formData.append("phone", form.phone.trim());
    formData.append("address", form.address.trim());
    formData.append("nic_number", form.nic_number.trim());
    if (form.photo instanceof File) {
      formData.append("photo", form.photo);
    }

    try {
      let response;
      if (editingCustomer) {
        response = await putData(`${API_URL}/${editingCustomer.id}`, formData);
      } else {
        response = await postData(API_URL, formData);
      }
      fetchCustomers();
      setForm({
        customer_name: "",
        email: "",
        phone: "",
        address: "",
        nic_number: "",
        photo: null,
      });
      setEditingCustomer(null);
    } catch (err) {
      console.error("Full error object:", err); // Debug log
      if (err.status === 422 || (err.response && err.response.status === 422)) {
        // Check err.details (from ApiError) or err.response.data.errors
        const errors =
          err.details || (err.response && err.response.data.errors) || {};
        console.error("Validation errors:", errors); // Debug log
        // Extract the first error message
        const firstError =
          Object.values(errors)[0]?.[0] || "Validation error occurred.";
        setError(firstError);
      } else {
        setError(err.message || "Failed to save customer.");
        console.error("Non-validation error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer) => {
    setForm({
      customer_name: customer.customer_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      nic_number: customer.nic_number || "",
      photo: customer.photo || null,
    });
    setEditingCustomer(customer);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      await deleteData(`${API_URL}/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError("Error deleting customer");
    }
  };

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        Customer Management
      </h2>

      {/* Customer Form */}
      <Card className="p-6 shadow-lg rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-4">
          {editingCustomer ? "Edit Customer" : "Add Customer"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            name="nic_number"
            value={form.nic_number}
            onChange={handleChange}
            placeholder="NIC Number"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-col items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2 border p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Upload className="w-5 h-5 text-blue-600" /> Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
            {form.photo &&
              (typeof form.photo === "string" ? (
                <img
                  src={`http://127.0.0.1:8000/storage/${form.photo}`}
                  alt="Preview"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <img
                  src={URL.createObjectURL(form.photo)}
                  alt="Preview"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ))}
          </div>
        </div>
        <Button
          className="mt-4 bg-purple-700 hover:bg-purple-800 text-white w-full md:w-auto"
          onClick={handleAddOrUpdateCustomer}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : editingCustomer
            ? "Update Customer"
            : "Add Customer"}
        </Button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </Card>

      {/* Customers Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Address</th>
              <th className="p-3 font-semibold">NIC Number</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-gray-100 transition-colors"
              >
                <td className="p-3 border text-center">
                  {customer.customer_name || "-"}
                </td>
                <td className="p-3 border text-center">
                  {customer.email || "-"}
                </td>
                <td className="p-3 border text-center">
                  {customer.phone || "-"}
                </td>
                <td className="p-3 border text-center">
                  {customer.address || "-"}
                </td>
                <td className="p-3 border text-center">
                  {customer.nic_number || "-"}
                </td>
                <td className="p-3 border text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedCustomer(customer)}
                      className="hover:bg-blue-100 p-2 rounded-full"
                    >
                      <Eye className="w-5 h-5 text-cyan-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleEditCustomer(customer)}
                      className="hover:bg-green-100 p-2 rounded-full"
                    >
                      <Pencil className="w-5 h-5 text-emerald-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="hover:bg-red-100 p-2 rounded-full"
                    >
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
        <Dialog
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
        >
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="p-6 bg-white border rounded-lg shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4">
                {selectedCustomer.customer_name || "N/A"}
              </h3>
              <p className="text-gray-700">
                habib Email: {selectedCustomer.email || "N/A"}
              </p>
              <p className="text-gray-700">
                Phone: {selectedCustomer.phone || "N/A"}
              </p>
              <p className="text-gray-700">
                Address: {selectedCustomer.address || "N/A"}
              </p>
              <p className="text-gray-700">
                NIC Number: {selectedCustomer.nic_number || "N/A"}
              </p>
              {selectedCustomer.photo && (
                <img
                  src={`http://127.0.0.1:8000/storage/${selectedCustomer.photo}`}
                  alt="Customer"
                  className="mt-4 rounded-lg w-full h-48 object-cover"
                />
              )}
              <Button
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerManagement;
