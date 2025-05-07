import { useState, useEffect } from "react";
import { getData, postData, deleteData } from "../../services/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
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
  const [activeField, setActiveField] = useState(null);

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
    const newErrors = {};
    if (!form.customer_name.trim()) {
      newErrors.customer_name = "Name is required";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone is required";
    }
    if (!form.nic_number.trim()) {
      newErrors.nic_number = "NIC Number is required";
    }
    return newErrors;
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
    setActiveField(null);
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
    setForm(newForm);
    setEditingCustomer(customer);
    setActiveField("customer_name");
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeField === "photo") {
        handleAddOrUpdateCustomer();
      } else {
        // Move to next field or submit
        const fieldOrder = [
          "customer_name",
          "email",
          "phone",
          "address",
          "nic_number",
          "photo",
        ];
        const currentIndex = fieldOrder.indexOf(activeField);
        if (currentIndex < fieldOrder.length - 1) {
          const nextField = fieldOrder[currentIndex + 1];
          setActiveField(nextField);
          if (nextField !== "photo") {
            document.getElementsByName(nextField)[0]?.focus();
          }
        } else {
          handleAddOrUpdateCustomer();
        }
      }
    } else if (e.key === "Escape") {
      if (editingCustomer) {
        resetForm();
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Customer Management
      </h2>

      {/* Customer Form */}
      <Card className="p-6 shadow-sm rounded-lg bg-white border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          {editingCustomer ? "Edit Customer" : "Add Customer"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="customer_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name *
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("customer_name")}
              placeholder="John Doe"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customer_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.customer_name && (
              <p className="text-red-600 text-xs mt-1">
                {errors.customer_name}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("email")}
              placeholder="john@example.com"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("phone")}
              placeholder="+1234567890"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("address")}
              placeholder="123 Main St"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.address ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          <div>
            <label
              htmlFor="nic_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              NIC Number *
            </label>
            <input
              type="text"
              id="nic_number"
              name="nic_number"
              value={form.nic_number}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("nic_number")}
              placeholder="123456789V"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nic_number ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.nic_number && (
              <p className="text-red-600 text-xs mt-1">{errors.nic_number}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo
            </label>
            <div
              className={`border-2 border-dashed rounded-md p-4 ${
                activeField === "photo" ? "ring-2 ring-blue-500" : ""
              } ${
                errors.photo ? "border-red-500" : "border-gray-300"
              } transition-colors`}
              onClick={() => setActiveField("photo")}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  JPEG, PNG (max 2MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
              {(form.photo || form.photo_url) && (
                <div className="mt-3 flex flex-col items-center">
                  <img
                    src={
                      form.photo instanceof File
                        ? URL.createObjectURL(form.photo)
                        : form.photo_url
                    }
                    alt="Preview"
                    className="w-20 h-20 rounded-md object-cover border border-gray-200"
                    onError={handleImageError}
                  />
                  <button
                    type="button"
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm({ ...form, photo: null, photo_url: null });
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {errors.photo && (
              <p className="text-red-600 text-xs mt-1">{errors.photo}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleAddOrUpdateCustomer}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {editingCustomer ? "Updating..." : "Saving..."}
              </span>
            ) : editingCustomer ? (
              "Update Customer"
            ) : (
              "Add Customer"
            )}
          </Button>
          {editingCustomer && (
            <Button
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50 px-6 py-2 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={resetForm}
            >
              Cancel
            </Button>
          )}
        </div>

        {errors.general && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{errors.general}</p>
          </div>
        )}
      </Card>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedCustomer.customer_name}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setSelectedCustomer(null)}
                  aria-label="Close modal"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.email || "-"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.phone || "-"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.address || "-"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIC Number
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.nic_number}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </h4>
                  {selectedCustomer.photo_url ? (
                    <div className="mt-2">
                      <img
                        src={selectedCustomer.photo_url}
                        alt="Customer"
                        className="rounded-md w-full max-h-48 object-contain border border-gray-200"
                        onError={handleImageError}
                      />
                      <p className="mt-1 text-xs text-gray-500 break-all">
                        {selectedCustomer.photo_url}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      No photo available
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 rounded-b-lg flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
