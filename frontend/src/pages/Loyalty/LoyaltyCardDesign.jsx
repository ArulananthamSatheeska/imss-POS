import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import axios from "axios";
import { Upload, Eye, Pencil, Trash } from "lucide-react";

const API_URL = "http://localhost:8000/api/customers";
const LOYALTY_CARD_DESIGN_API_URL =
  "http://localhost:8000/api/loyalty-card-designs";

const LoyaltyCardDesign = () => {
  const initialCardDetails = {
    cardName: "",
    cardType: "",
    shopName: "Sabar Foods",
    customerId: null,
    customerName: "",
    loyaltyCardNumber: "",
    validDate: "",
    shopLogo: null,
    shopLogoUrl: null,
  };

  const [cardDetails, setCardDetails] = useState(initialCardDetails);
  const [customers, setCustomers] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [editingDesign, setEditingDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Added for success feedback

  useEffect(() => {
    fetchCustomers();
    fetchDesigns();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      const customerData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      console.log("Fetched customers:", customerData);
      setCustomers(customerData);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(LOYALTY_CARD_DESIGN_API_URL);
      const designData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      console.log("Fetched designs:", designData);
      setDesigns(
        designData.map((design) => ({
          ...design,
          shop_logo_url: design.shop_logo_url ?? null, // Ensure shop_logo_url is null if undefined
        }))
      );
    } catch (err) {
      console.error("Error fetching designs:", err);
      setError("Failed to load designs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "customerName") {
      const selectedCustomer = customers.find(
        (customer) => customer.customer_name === value
      );
      console.log("Selected customer:", selectedCustomer);
      if (selectedCustomer) {
        const cardTypes =
          selectedCustomer.card_types ||
          (selectedCustomer.card_type ? [selectedCustomer.card_type] : []);
        const formattedCardType = cardTypes
          .map((type) => {
            if (type.toLowerCase().includes("point-wise")) {
              return `${type} (${selectedCustomer.point_calculation_mode || "Threshold-wise"})`;
            }
            return type;
          })
          .join(", ");

        let rewardDetails = "";
        if (selectedCustomer.ranges && selectedCustomer.ranges.length > 0) {
          rewardDetails = selectedCustomer.ranges
            .map((range) =>
              range.minRange || range.maxRange
                ? ` - LKR ${parseFloat(range.minRange || 0).toFixed(2)}-${parseFloat(range.maxRange || 0).toFixed(2)}: ${range.points || range.discountPercentage} ${selectedCustomer.calculation_type === "Point-wise" ? "points" : "%"}`
                : ""
            )
            .filter((detail) => detail)
            .join(", ");
        } else if (
          selectedCustomer.calculation_type === "Point-wise" &&
          selectedCustomer.point_calculation_mode === "Threshold-wise" &&
          selectedCustomer.points_per_threshold &&
          selectedCustomer.points_per_threshold_value
        ) {
          rewardDetails = ` - ${selectedCustomer.points_per_threshold_value} point${
            parseInt(selectedCustomer.points_per_threshold_value) !== 1
              ? "s"
              : ""
          } per ${parseFloat(selectedCustomer.points_per_threshold).toFixed(2)} LKR`;
        }

        setCardDetails((prev) => ({
          ...prev,
          customerId: selectedCustomer.id,
          customerName: value,
          loyaltyCardNumber: selectedCustomer.loyalty_card_number || "",
          cardName: selectedCustomer.card_name || "",
          cardType: rewardDetails
            ? `${formattedCardType}${rewardDetails}`
            : formattedCardType,
          validDate: selectedCustomer.valid_date || "",
        }));
      } else {
        setCardDetails((prev) => ({
          ...prev,
          customerId: null,
          customerName: "",
          loyaltyCardNumber: "",
          cardName: "",
          cardType: "",
          validDate: "",
        }));
      }
    } else {
      setCardDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(null);
    setSuccess(null); // Clear success message on input change
  };

  const handleShopLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setError("Shop logo must be JPEG, PNG, or JPG");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Shop logo must be under 2MB");
        return;
      }
      setCardDetails((prev) => ({
        ...prev,
        shopLogo: file,
        shopLogoUrl: URL.createObjectURL(file),
      }));
      setError(null);
      setSuccess(null);
    }
  };

  const resetForm = () => {
    setCardDetails(initialCardDetails); // Use initial state for reset
    setEditingDesign(null);
    setError(null);
    setSuccess(null);
    // Clear file input manually
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleEditDesign = (design) => {
    setCardDetails({
      cardName: design.card_name || "",
      cardType: design.card_type || "",
      shopName: design.shop_name || "Sabar Foods",
      customerId: design.customer_id || null,
      customerName: design.customer?.customer_name || "",
      loyaltyCardNumber: design.loyalty_card_number || "",
      validDate: design.valid_date || "",
      shopLogo: null,
      shopLogoUrl: design.shop_logo_url || null,
    });
    setEditingDesign(design);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteDesign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this design?")) return;

    setLoading(true);
    try {
      await axios.delete(`${LOYALTY_CARD_DESIGN_API_URL}/${id}`);
      await fetchDesigns(); // Refresh designs
      setSuccess("Design deleted successfully!");
    } catch (err) {
      setError("Error deleting design");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("card_name", cardDetails.cardName);
    formData.append("card_type", cardDetails.cardType);
    formData.append("shop_name", cardDetails.shopName);
    formData.append("customer_id", cardDetails.customerId || "");
    formData.append("loyalty_card_number", cardDetails.loyaltyCardNumber);
    formData.append("valid_date", cardDetails.validDate);
    if (cardDetails.shopLogo instanceof File) {
      formData.append("shop_logo", cardDetails.shopLogo);
    }

    try {
      if (editingDesign && editingDesign.id) {
        formData.append("_method", "PUT");
        await axios.post(
          `${LOYALTY_CARD_DESIGN_API_URL}/${editingDesign.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        await axios.post(LOYALTY_CARD_DESIGN_API_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchDesigns(); // Refresh designs
      resetForm(); // Reset form
      setSuccess("Design saved successfully!");
      // Optional: Uncomment for full page refresh
      // window.location.reload();
    } catch (error) {
      console.error("Error saving design:", error);
      setError(
        error.response?.data?.message ||
          "Failed to save design. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getCardBackground = (cardName) => {
    switch (cardName?.toLowerCase()) {
      case "silver":
        return "linear-gradient(135deg, #A9A9A9, #D3D3D3)";
      case "gold":
        return "linear-gradient(135deg, #FFD700, #FFA500)";
      case "platinum":
        return "linear-gradient(135deg, #E5E4E2, #FFFFFF)";
      default:
        return "linear-gradient(135deg, #4A2C2A, #8B4513)";
    }
  };

  const handleImageError = (e) => {
    console.error("Image failed to load:", e.target.src);
    e.target.src = "https://via.placeholder.com/150?text=Logo+Not+Found"; // Show placeholder
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Loyalty Card Design
      </h2>

      <div className="mb-8 p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {editingDesign ? "Edit Design" : "Add Design"}
        </h3>
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Customer Name
            </label>
            <select
              name="customerName"
              value={cardDetails.customerName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={loading}
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.customer_name}>
                  {`${customer.customer_name} (NIC: ${customer.nic_number || "N/A"}, Phone: ${customer.phone || "N/A"})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Card Name
            </label>
            <input
              type="text"
              name="cardName"
              value={cardDetails.cardName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Card Types
            </label>
            <input
              type="text"
              name="cardType"
              value={cardDetails.cardType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              name="validDate"
              value={cardDetails.validDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Shop Name
            </label>
            <input
              type="text"
              name="shopName"
              value={cardDetails.shopName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter shop name"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Loyalty Card Number
            </label>
            <input
              type="text"
              name="loyaltyCardNumber"
              value={cardDetails.loyaltyCardNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Shop Logo
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleShopLogoUpload}
              className="w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {cardDetails.shopLogoUrl && (
              <div className="mt-3 flex flex-col items-center">
                <img
                  src={cardDetails.shopLogoUrl}
                  alt="Shop Logo Preview"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  onError={handleImageError}
                />
                <button
                  type="button"
                  className="mt-1 text-xs text-red-600 hover:text-red-800 dark:hover:text-red-500"
                  onClick={() =>
                    setCardDetails((prev) => ({
                      ...prev,
                      shopLogo: null,
                      shopLogoUrl: null,
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleSaveDesign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
            disabled={
              loading || !cardDetails.customerName || !cardDetails.shopName
            }
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
                {editingDesign ? "Updating..." : "Saving..."}
              </span>
            ) : editingDesign ? (
              "Update Design"
            ) : (
              "Save Design"
            )}
          </button>
          {editingDesign && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Saved Designs
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Card Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Card Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Shop Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Loyalty Card Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
              {designs.map((design) => (
                <tr
                  key={design.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {design.customer?.customer_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {design.card_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {design.card_type || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {design.shop_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {design.loyalty_card_number || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {design.valid_date || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log("Selected design:", design);
                          setSelectedDesign(design);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditDesign(design)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDesign(design.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
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

      <div className="flex justify-center gap-6">
        <div
          className="w-96 h-56 rounded-lg shadow-lg p-6 flex flex-col justify-between text-white relative overflow-hidden"
          style={{
            background: getCardBackground(cardDetails.cardName),
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              {cardDetails.shopLogoUrl && (
                <img
                  src={cardDetails.shopLogoUrl}
                  alt="Shop Logo"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={handleImageError}
                />
              )}
              <h3
                className="text-3xl font-bold text-yellow-300 filter drop-shadow"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {cardDetails.shopName || "Sabar Foods"}
              </h3>
            </div>
            <div className="bg-black bg-opacity-70 p-2 rounded-lg">
              <p className="text-sm">
                {cardDetails.cardName ? cardDetails.cardName : "Select a card"}
              </p>
            </div>
          </div>
          <div className="z-10">
            <p
              className="text-xl font-semibold"
              style={{ fontFamily: "Roboto" }}
            >
              Customer: {cardDetails.customerName || "Select a customer"}
            </p>
            <p className="text-sm mt-1">
              Valid Until: {cardDetails.validDate || "N/A"}
            </p>
          </div>
          <div className="flex space-x-2 opacity-80 z-10">
            <div className="w-10 h-10 bg-red-500 rounded-full"></div>
            <div className="w-10 h-10 bg-yellow-500 rounded-full"></div>
            <div className="w-10 h-10 bg-green-500 rounded-full"></div>
            <div className="w-10 h-10 bg-brown-500 rounded-full"></div>
            <div className="w-10 h-10 bg-orange-500 rounded-full"></div>
          </div>
        </div>

        <div
          className="w-96 h-56 rounded-lg shadow-lg bg-black p-6 flex flex-col items-center justify-center text-white relative"
          style={{
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
            border: "1px solid #FFD700",
          }}
        >
          <div className="absolute top-2 left-2 text-sm text-gray-500 opacity-20">
            {cardDetails.shopName || "Sabar Foods"}
          </div>
          {cardDetails.loyaltyCardNumber ? (
            <>
              <Barcode
                value={cardDetails.loyaltyCardNumber}
                format="CODE128"
                width={2}
                height={50}
                displayValue={false}
                className="mb-2"
              />
              <p className="text-sm font-mono text-white">
                {cardDetails.loyaltyCardNumber}
              </p>
              <p className="text-xs mt-1 text-gray-300">
                Scan to redeem points
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Please select a customer</p>
          )}
        </div>
      </div>

      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md max-w-3xl w-full mx-4 relative">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedDesign.customer?.customer_name || "Design Details"}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  onClick={() => setSelectedDesign(null)}
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
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Card Preview
                  </h4>
                  <div className="flex flex-col gap-4">
                    <div
                      className="w-80 h-48 rounded-lg shadow-lg p-5 flex flex-col justify-between text-white relative overflow-hidden"
                      style={{
                        background: getCardBackground(selectedDesign.card_name),
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      <div className="flex justify-between items-center z-10">
                        <div className="flex items-center gap-2">
                          {selectedDesign.shop_logo_url && (
                            <img
                              src={selectedDesign.shop_logo_url}
                              alt="Shop Logo"
                              className="w-8 h-8 rounded-full object-cover"
                              onError={handleImageError}
                            />
                          )}
                          <h3
                            className="text-2xl font-bold text-yellow-300 filter drop-shadow"
                            style={{ fontFamily: "Playfair Display, serif" }}
                          >
                            {selectedDesign.shop_name || "Sabar Foods"}
                          </h3>
                        </div>
                        <div className="bg-black bg-opacity-70 p-1 rounded-lg">
                          <p className="text-xs">
                            {selectedDesign.card_name || "Select a card"}
                          </p>
                        </div>
                      </div>
                      <div className="z-10">
                        <p
                          className="text-lg font-semibold"
                          style={{ fontFamily: "Roboto" }}
                        >
                          Customer:{" "}
                          {selectedDesign.customer?.customer_name ||
                            "Select a customer"}
                        </p>
                        <p className="text-xs mt-1">
                          Valid Until: {selectedDesign.valid_date || "N/A"}
                        </p>
                      </div>
                      <div className="flex space-x-2 opacity-80 z-10">
                        <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                        <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                        <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                        <div className="w-8 h-8 bg-brown-500 rounded-full"></div>
                        <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
                      </div>
                    </div>
                    <div
                      className="w-80 h-48 rounded-lg shadow-lg bg-black p-5 flex flex-col items-center justify-center text-white relative"
                      style={{
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
                        border: "1px solid #FFD700",
                      }}
                    >
                      <div className="absolute top-2 left-2 text-xs text-gray-500 opacity-20">
                        {selectedDesign.shop_name || "Sabar Foods"}
                      </div>
                      {selectedDesign.loyalty_card_number ? (
                        <>
                          <Barcode
                            value={selectedDesign.loyalty_card_number}
                            format="CODE128"
                            width={1.5}
                            height={40}
                            displayValue={false}
                            className="mb-2"
                          />
                          <p className="text-xs font-mono text-white">
                            {selectedDesign.loyalty_card_number}
                          </p>
                          <p className="text-xs mt-1 text-gray-300">
                            Scan to redeem points
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">No card number</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Card Details
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer Name
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDesign.customer?.customer_name || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Card Name
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDesign.card_name || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Card Type
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDesign.card_type || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Shop Name
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDesign.shop_name || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Loyalty Card Number
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDesign.loyalty_card_number || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Valid Until
                      </h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDesign.valid_date || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Shop Logo
                      </h4>
                      {selectedDesign.shop_logo_url ? (
                        <div className="mt-2">
                          <img
                            src={selectedDesign.shop_logo_url}
                            alt="Shop Logo"
                            className="rounded-md w-full max-h-32 object-contain border border-gray-200 dark:border-gray-600"
                            onError={handleImageError}
                          />
                        </div>
                      ) : (
                        <p
                          className="mt-1 text-sm text-gray-500 dark:text-gray-300"
                          style={{ display: "block" }}
                        >
                          No logo uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 rounded-b-lg flex justify-end gap-4">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                onClick={handlePrint}
              >
                Print Card
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                onClick={() => setSelectedDesign(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDesign && (
        <div id="print-card-container" className="hidden">
          <div
            className="w-[243px] h-[153px] rounded-lg shadow-lg p-4 flex flex-col justify-between text-white relative overflow-hidden print-card"
            style={{
              background: getCardBackground(selectedDesign.card_name),
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                {selectedDesign.shop_logo_url && (
                  <img
                    src={selectedDesign.shop_logo_url}
                    alt="Shop Logo"
                    className="w-6 h-6 rounded-full object-cover"
                    onError={handleImageError}
                  />
                )}
                <h3
                  className="text-xl font-bold text-yellow-300 filter drop-shadow"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {selectedDesign.shop_name || "Sabar Foods"}
                </h3>
              </div>
              <div className="bg-black bg-opacity-70 p-1 rounded-lg">
                <p className="text-xs">
                  {selectedDesign.card_name || "Select a card"}
                </p>
              </div>
            </div>
            <div className="z-10">
              <p
                className="text-sm font-semibold"
                style={{ fontFamily: "Roboto" }}
              >
                Customer:{" "}
                {selectedDesign.customer?.customer_name || "Select a customer"}
              </p>
              <p className="text-xs mt-1">
                Valid Until: {selectedDesign.valid_date || "N/A"}
              </p>
            </div>
            <div className="flex space-x-1 opacity-80 z-10">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <div className="w-6 h-6 bg-brown-500 rounded-full"></div>
              <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
            </div>
          </div>
          <div
            className="w-[243px] h-[153px] rounded-lg shadow-lg bg-black p-4 flex flex-col items-center justify-center text-white relative print-card"
            style={{
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              border: "1px solid #FFD700",
            }}
          >
            <div className="absolute top-1 left-1 text-xs text-gray-500 opacity-20">
              {selectedDesign.shop_name || "Sabar Foods"}
            </div>
            {selectedDesign.loyalty_card_number ? (
              <>
                <Barcode
                  value={selectedDesign.loyalty_card_number}
                  format="CODE128"
                  width={1}
                  height={30}
                  displayValue={false}
                  className="mb-1"
                />
                <p className="text-xs font-mono text-white">
                  {selectedDesign.loyalty_card_number}
                </p>
                <p className="text-xs mt-1 text-gray-300">
                  Scan to redeem points
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400">No card number</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyCardDesign;
