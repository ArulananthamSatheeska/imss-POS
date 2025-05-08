import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ProductDetailsModal from "../items/ProductDetailsModal";

// --- Helper Functions ---

// Helper function to get today's date in YYYY-MM-DD format (UTC)
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, "0");
  const day = String(today.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to format date for display (consistent UTC handling)
const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) {
      console.error("Invalid date string received for display:", dateString);
      return "Invalid Date";
    }
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    };
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error("Error formatting date for display:", dateString, error);
    return dateString;
  }
};

// Helper function to determine expiry status styling and text
const getExpiryStatus = (expiryDateString) => {
  if (!expiryDateString) return { className: "text-gray-500", status: "N/A" };
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const expiryDate = new Date(expiryDateString + "T00:00:00Z");
    if (isNaN(expiryDate.getTime())) {
      console.error(
        "Invalid expiry date string for comparison:",
        expiryDateString
      );
      return { className: "text-gray-500", status: "Invalid Date" };
    }
    const timeDiff = expiryDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (dayDiff < 0) {
      return { className: "text-red-600 font-semibold", status: "Expired" };
    }
    if (dayDiff <= 30) {
      return {
        className: "text-yellow-600 font-semibold",
        status: "Upcoming Expired",
      };
    }
    return { className: "text-green-600", status: "Not Expired" };
  } catch (error) {
    console.error(
      "Error processing expiry date for status:",
      expiryDateString,
      error
    );
    return { className: "text-gray-500", status: "Error" };
  }
};

// Helper function to get filter description for display
const getFilterDescription = (filterOption) => {
  switch (filterOption) {
    case "all":
      return "All Items";
    case "30":
      return "Expiring within 30 Days";
    case "60":
      return "Expiring within 60 Days";
    case "90":
      return "Expiring within 90 Days";
    case "expired":
      return "Expired before Reference Date";
    default:
      return "Unknown Filter";
  }
};

// --- Component ---

const Expiry = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [filterOption, setFilterOption] = useState("all");
  const [referenceDate, setReferenceDate] = useState(getTodayDateString());

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          "https://sharvakshafoodcity.com.lk/backend/public/api/products"
        );
        setItems(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (e) {
        console.error("Failed to fetch items:", e);
        setError("Failed to load item data. Please try again later.");
        setItems([]);
        toast.error(
          "Error fetching items: " + (e.response?.data?.message || e.message)
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Filtering logic
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }
    let result = [...items];
    let refDateObj;
    try {
      refDateObj = new Date(referenceDate + "T00:00:00Z");
      if (isNaN(refDateObj.getTime())) {
        console.error("Invalid reference date selected:", referenceDate);
        refDateObj = null;
      } else {
        refDateObj.setUTCHours(0, 0, 0, 0);
      }
    } catch (e) {
      console.error("Error parsing reference date:", referenceDate, e);
      refDateObj = null;
    }
    if (refDateObj && filterOption !== "all") {
      result = result.filter((item) => {
        if (!item.expiry_date) return false;
        try {
          const expiryDate = new Date(item.expiry_date + "T00:00:00Z");
          if (isNaN(expiryDate.getTime())) return false;
          expiryDate.setUTCHours(0, 0, 0, 0);
          if (filterOption === "expired") {
            return expiryDate.getTime() < refDateObj.getTime();
          } else {
            const days = parseInt(filterOption);
            const thresholdDate = new Date(refDateObj);
            thresholdDate.setUTCDate(refDateObj.getUTCDate() + days);
            return (
              expiryDate.getTime() >= refDateObj.getTime() &&
              expiryDate.getTime() <= thresholdDate.getTime()
            );
          }
        } catch (e) {
          console.error(
            "Error processing item date during filtering:",
            item.expiry_date,
            e
          );
          return false;
        }
      });
    } else if (!refDateObj && filterOption !== "all") {
      console.warn("Filtering skipped due to invalid reference date.");
      result = [...items];
    }
    result.sort((a, b) => {
      const dateA = a.expiry_date
        ? new Date(a.expiry_date + "T00:00:00Z").getTime()
        : Infinity;
      const dateB = b.expiry_date
        ? new Date(b.expiry_date + "T00:00:00Z").getTime()
        : Infinity;
      const validDateA = !isNaN(dateA) && dateA !== Infinity;
      const validDateB = !isNaN(dateB) && dateB !== Infinity;
      if (validDateA && validDateB) {
        return dateA - dateB;
      } else if (validDateA) {
        return -1;
      } else if (validDateB) {
        return 1;
      } else {
        return 0;
      }
    });
    return result;
  }, [items, filterOption, referenceDate]);

  // Event Handlers
  const handleFilterOptionChange = (e) => {
    setFilterOption(e.target.value);
  };

  const handleReferenceDateChange = (e) => {
    setReferenceDate(e.target.value);
  };

  const handleOpenModal = (productId) => {
    setSelectedProductId(productId);
  };

  const handleCloseModal = () => {
    setSelectedProductId(null);
  };

  // Print function
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Unable to open print window. Please allow pop-ups.");
      return;
    }

    // Generate HTML content for the print window
    const formattedReferenceDate = formatDateForDisplay(referenceDate);
    const filterDescription = getFilterDescription(filterOption);
    const currentDate = new Date().toLocaleString();

    let tableRows = "";
    filteredItems.forEach((item) => {
      const { className, status } = getExpiryStatus(item.expiry_date);
      tableRows += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px; border-right: 1px solid #e5e7eb;">${item.product_name || "N/A"}</td>
          <td style="padding: 8px; border-right: 1px solid #e5e7eb;">${item.category || "N/A"}</td>
          <td style="padding: 8px; border-right: 1px solid #e5e7jtb; text-align: center;">${item.opening_stock_quantity ?? "N/A"}</td>
          <td style="padding: 8px; border-right: 1px solid #e5e7eb;">${formatDateForDisplay(item.expiry_date)}</td>
          <td style="padding: 8px; ${className}">${status}</td>
        </tr>
      `;
    });

    // If no items, show a message
    if (filteredItems.length === 0) {
      const refDateValid = !isNaN(
        new Date(referenceDate + "T00:00:00Z").getTime()
      );
      const message = refDateValid
        ? "No items match the current filter criteria based on the selected reference date."
        : "Invalid reference date selected.";
      tableRows = `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #6b7280;">${message}</td></tr>`;
    }

    // HTML content with embedded CSS
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Item Inventory Expiries</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #1f2937;
          }
          h1 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .header-info {
            margin-bottom: 20px;
            font-size: 14px;
          }
          .header-info p {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #e5e7eb;
          }
          th {
            background-color: #374151;
            color: white;
            text-transform: uppercase;
            font-size: 12px;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .text-center {
            text-align: center;
          }
          .text-red-600 { color: #dc2626; font-weight: 600; }
          .text-yellow-600 { color: #d97706; font-weight: 600; }
          .text-green-600 { color: #16a34a; }
          .text-gray-500 { color: #6b7280; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Item Inventory Expiries</h1>
        <div class="header-info">
          <p><strong>Generated on:</strong> ${currentDate}</p>
          <p><strong>Reference Date:</strong> ${formattedReferenceDate}</p>
          <p><strong>Filter Applied:</strong> ${filterDescription}</p>
          <p><strong>Total Items:</strong> ${filteredItems.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th class="text-center">Quantity</th>
              <th>Expiry Date</th>
              <th>Current Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 100); // Close after print dialog
          };
        </script>
      </body>
      </html>
    `;

    // Write content to the print window and focus it
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  // Render table content
  const renderTableContent = () => {
    if (filteredItems.length === 0) {
      let message = "No items found.";
      const refDateValid = !isNaN(
        new Date(referenceDate + "T00:00:00Z").getTime()
      );
      if (!refDateValid) {
        message =
          "Invalid reference date selected. Please choose a valid date.";
      } else if (filterOption !== "all") {
        message =
          "No items match the current filter criteria based on the selected reference date.";
      }
      return (
        <tr>
          <td colSpan="5" className="py-10 text-center text-gray-500">
            {message}
          </td>
        </tr>
      );
    }
    return filteredItems.map((item) => {
      const { className, status } = getExpiryStatus(item.expiry_date);
      return (
        <tr
          key={item.id}
          className="transition duration-150 ease-in-out hover:bg-blue-50"
        >
          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
            <button
              onClick={() => handleOpenModal(item.id)}
              className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              title={`View details for ${item.product_name}`}
            >
              {item.product_name}
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex px-2 text-xs font-semibold leading-5 text-blue-800 bg-blue-100 rounded-full">
              {item.category || "N/A"}
            </span>
          </td>
          <td className="px-6 py-4 text-center whitespace-nowrap">
            {item.opening_stock_quantity ?? "N/A"}
          </td>
          <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
            {formatDateForDisplay(item.expiry_date)}
          </td>
          <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
            {status}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="container min-h-screen p-4 mx-auto md:p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <h1 className="mb-6 text-3xl font-bold text-center text-gray-800 md:text-4xl md:mb-8">
        Item Inventory Expiries
      </h1>

      {/* Reference Date, Filter, and Print Section */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md md:flex md:items-end md:space-x-4">
        {/* Reference Date Input */}
        <div className="flex-shrink-0 mb-4 md:mb-0">
          <label
            htmlFor="referenceDate"
            className="block text-sm font-medium text-gray-700"
          >
            Reference Date:
          </label>
          <input
            type="date"
            id="referenceDate"
            name="referenceDate"
            value={referenceDate}
            onChange={handleReferenceDateChange}
            className="block w-40 px-3 py-2 mt-1 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex-grow mb-4 md:mb-0">
          <label
            htmlFor="filterOption"
            className="block text-sm font-medium text-gray-700"
          >
            Filter Expiry Relative to Reference Date:
          </label>
          <select
            id="filterOption"
            name="filterOption"
            value={filterOption}
            onChange={handleFilterOptionChange}
            className="block w-40 px-3 py-2 mt-1 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">Show All</option>
            <option value="30">Expiring within 30 Days</option>
            <option value="60">Expiring within 60 Days</option>
            <option value="90">Expiring within 90 Days</option>
            <option value="expired">Expired before Reference Date</option>
          </select>
        </div>

        {/* Print Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Print
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="py-10 text-center">
          <p className="text-lg text-blue-600 animate-pulse">
            Loading items...
          </p>
        </div>
      )}

      {error && (
        <div
          className="relative px-4 py-3 mb-6 text-red-700 bg-red-100 border border-red-400 rounded"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && (
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="sticky top-0 z-10 text-xs text-white uppercase bg-gray-700 md:text-sm">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wider"
                  >
                    Item Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wider text-center"
                  >
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wider"
                  >
                    Expiry Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-semibold tracking-wider"
                  >
                    Current Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {renderTableContent()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Render ProductDetailsModal */}
      {selectedProductId && (
        <ProductDetailsModal
          productId={selectedProductId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Expiry;
