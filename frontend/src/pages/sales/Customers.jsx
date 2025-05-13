import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Pencil, Trash, Eye, Upload, RefreshCw } from "lucide-react";

const API_URL = "http://localhost:8000/api/customers";
const LOYALTY_CARD_API_URL = "http://localhost:8000/api/loyalty-cards";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loyaltyCards, setLoyaltyCards] = useState([]);
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    nic_number: "",
    photo: null,
    photo_url: null,
    loyalty_card_number: "",
    card_name: "",
    card_types: [], // Array to store multiple types
    valid_date: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchLoyaltyCards();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(API_URL);
      console.log("Customers Response:", response.data);
      const customerData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setCustomers(customerData);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setErrors({ general: "Error fetching customers" });
      setCustomers([]);
    }
  };

  const fetchLoyaltyCards = async () => {
    try {
      const response = await axios.get(LOYALTY_CARD_API_URL);
      console.log("Loyalty Cards Response:", response.data);
      const uniqueLoyaltyCards = Array.from(
        new Map(
          response.data.map((card) => {
            const key =
              card.calculation_type === "Point-wise"
                ? JSON.stringify([
                    card.card_name,
                    card.calculation_type,
                    card.point_calculation_mode,
                  ])
                : JSON.stringify([card.card_name, card.calculation_type]);
            return [key, card];
          })
        ).values()
      );
      setLoyaltyCards(uniqueLoyaltyCards);
    } catch (err) {
      console.error("Error fetching loyalty cards:", err);
      setErrors({ general: "Error fetching loyalty cards" });
      setLoyaltyCards([]);
    }
  };

  const formatRewardDetails = (card) => {
    if (
      card.calculation_type === "Point-wise" &&
      card.point_calculation_mode === "Threshold-wise"
    ) {
      return `${card.points_per_threshold_value} point${
        parseInt(card.points_per_threshold_value) !== 1 ? "s" : ""
      } per ${card.points_per_threshold} LKR`;
    } else if (
      card.calculation_type === "Point-wise" &&
      card.point_calculation_mode === "Range-wise"
    ) {
      if (Array.isArray(card.ranges) && card.ranges.length > 0) {
        const firstRange = card.ranges[0];
        return `LKR ${firstRange.min_range}-${firstRange.max_range}: ${firstRange.points} points`;
      }
    } else if (card.calculation_type === "Percentage-wise") {
      if (Array.isArray(card.ranges) && card.ranges.length > 0) {
        const firstRange = card.ranges[0];
        return `LKR ${firstRange.min_range}-${firstRange.max_range}: ${firstRange.discount_percentage}%`;
      }
    }
    return "No reward details";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "card_name") {
      setForm({
        ...form,
        card_name: value,
        card_types: [], // Reset types when card name changes
      });
    } else {
      setForm({ ...form, [name]: value });
    }
    setErrors({ ...errors, [name]: "" });
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    const mode = e.target.dataset.mode;
    const combinedType = type === "Point-wise" ? `${type} (${mode})` : type;
    setForm((prev) => {
      const updatedTypes = e.target.checked
        ? [...new Set([...prev.card_types, combinedType])]
        : prev.card_types.filter((t) => t !== combinedType);
      console.log("Updated card_types:", updatedTypes);
      return {
        ...prev,
        card_types: updatedTypes,
      };
    });
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
    if (form.card_name && form.card_types.length === 0) {
      newErrors.card_types = "Please select at least one card type";
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
    formData.append("customer_name", form.customer_name.trim());
    formData.append("phone", form.phone.trim());
    if (form.email.trim()) formData.append("email", form.email.trim());
    if (form.address.trim()) formData.append("address", form.address.trim());
    if (form.nic_number.trim())
      formData.append("nic_number", form.nic_number.trim());
    if (form.card_name) formData.append("card_name", form.card_name);
    if (form.card_types.length > 0) {
      form.card_types.forEach((type, index) => {
        const baseType = type.includes("Point-wise") ? "Point-wise" : type;
        formData.append(`card_types[${index}]`, baseType);
      });
    }
    if (form.loyalty_card_number)
      formData.append("loyalty_card_number", form.loyalty_card_number);
    if (form.valid_date) formData.append("valid_date", form.valid_date);
    if (form.photo instanceof File) formData.append("photo", form.photo);

    try {
      let response;
      if (editingCustomer && editingCustomer.id) {
        formData.append("_method", "PUT");
        response = await axios.post(
          `${API_URL}/${editingCustomer.id}`,
          formData
        );
      } else {
        response = await axios.post(API_URL, formData);
      }
      fetchCustomers();
      resetForm();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const backendErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          backendErrors[key] = err.response.data.errors[key][0];
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
      loyalty_card_number: "",
      card_name: "",
      card_types: [],
      valid_date: "",
    });
    setEditingCustomer(null);
    setErrors({});
    setActiveField(null);
  };

  const handleEditCustomer = (customer) => {
    const customerTypes = customer.card_types || [];
    const uniqueTypes = [...new Set(customerTypes)]; // Ensure no duplicates
    const newForm = {
      customer_name: customer.customer_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      nic_number: customer.nic_number || "",
      photo: null,
      photo_url: customer.photo_url || null,
      loyalty_card_number: customer.loyalty_card_number || "",
      card_name: customer.card_name || "",
      card_types: loyaltyCards
        .filter((card) => card.card_name === customer.card_name)
        .filter((card) => uniqueTypes.includes(card.calculation_type))
        .reduce((acc, card) => {
          const displayType =
            card.calculation_type === "Point-wise"
              ? `${card.calculation_type} (${card.point_calculation_mode})`
              : card.calculation_type;
          if (!acc.some((t) => t.startsWith(card.calculation_type))) {
            acc.push(displayType);
          }
          return acc;
        }, []),
      valid_date: customer.valid_date || "",
    };
    console.log("Loaded card_types for edit:", newForm.card_types);
    setForm(newForm);
    setEditingCustomer(customer);
    setActiveField("customer_name");
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
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
        const fieldOrder = [
          "customer_name",
          "email",
          "phone",
          "address",
          "nic_number",
          "photo",
          "card_name",
          "valid_date",
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

  const formatCardTypeDisplay = (cardTypes, cardName) => {
    if (!cardTypes || !cardName) return "-";
    return cardTypes
      .map((type) => {
        const card = loyaltyCards.find(
          (c) => c.card_name === cardName && c.calculation_type === type
        );
        return card && card.calculation_type === "Point-wise"
          ? `${card.calculation_type} (${card.point_calculation_mode})`
          : type;
      })
      .join(", ");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Customer Management
      </h2>

      <Card className="p-6 shadow-sm rounded-lg bg-white border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {editingCustomer ? "Edit Customer" : "Add Customer"}
          </h3>
          <Button
            variant="outline"
            onClick={fetchLoyaltyCards}
            className="flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Loyalty Cards
          </Button>
        </div>
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
              NIC Number
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
            <label
              htmlFor="loyalty_card_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Loyalty Card Number
            </label>
            <input
              type="text"
              id="loyalty_card_number"
              name="loyalty_card_number"
              value={form.loyalty_card_number}
              readOnly
              className="w-full p-2 border rounded-md bg-gray-100 border-gray-300"
            />
          </div>
          <div>
            <label
              htmlFor="card_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Card Name
            </label>
            <select
              id="card_name"
              name="card_name"
              value={form.card_name}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("card_name")}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.card_name ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Card Name</option>
              {[...new Set(loyaltyCards.map((card) => card.card_name))].map(
                (cardName) => (
                  <option key={cardName} value={cardName}>
                    {cardName}
                  </option>
                )
              )}
            </select>
            {errors.card_name && (
              <p className="text-red-600 text-xs mt-1">{errors.card_name}</p>
            )}
          </div>
          {form.card_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Types (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-3">
                {loyaltyCards
                  .filter((card) => card.card_name === form.card_name)
                  .map((card, index) => {
                    console.log(
                      "Checking type:",
                      card.calculation_type,
                      "in",
                      form.card_types
                    );
                    const displayType =
                      card.calculation_type === "Point-wise"
                        ? `${card.calculation_type} (${card.point_calculation_mode})`
                        : card.calculation_type;
                    return (
                      <label
                        key={`${card.id}-${index}`}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          value={card.calculation_type}
                          data-mode={card.point_calculation_mode || ""}
                          checked={form.card_types.includes(
                            card.calculation_type === "Point-wise"
                              ? `${card.calculation_type} (${card.point_calculation_mode})`
                              : card.calculation_type
                          )}
                          onChange={handleTypeChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {displayType} - {formatRewardDetails(card)}
                        </span>
                      </label>
                    );
                  })}
              </div>
              {errors.card_types && (
                <p className="text-red-600 text-xs mt-1">{errors.card_types}</p>
              )}
            </div>
          )}
          <div>
            <label
              htmlFor="valid_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Valid Until
            </label>
            <input
              type="date"
              id="valid_date"
              name="valid_date"
              value={form.valid_date}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveField("valid_date")}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.valid_date ? "border-red-500" : "border-gray-300"
              }`}
            />
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
                  Loyalty Card Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Types
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
                    {customer.loyalty_card_number || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCardTypeDisplay(
                      customer.card_types,
                      customer.card_name
                    )}
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
                    {selectedCustomer.nic_number || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loyalty Card Number
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.loyalty_card_number || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Name
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.card_name || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Types
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatCardTypeDisplay(
                      selectedCustomer.card_types,
                      selectedCustomer.card_name
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomer.valid_date || "-"}
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
