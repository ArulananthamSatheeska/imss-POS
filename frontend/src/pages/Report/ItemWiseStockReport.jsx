import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatNumberWithCommas } from "../../utils/numberformat";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { ExportToExcel, ExportToPDF } from "@/components/ui/export";

const ItemWiseStockReportForm = () => {
  const [filters, setFilters] = useState({
    itemCode: "",
    itemName: "",
    category: "",
    supplier: "",
  });
  const [stockReports, setStockReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Fetch categories and suppliers from backend
  useEffect(() => {
    const fetchCategoriesAndSuppliers = async () => {
      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          axios.get(
            "https://sharvakshafoodcity.com.lk/backend/public/api/categories"
          ),
          axios.get(
            "https://sharvakshafoodcity.com.lk/backend/public/api/suppliers"
          ),
        ]);
        setCategories(categoriesResponse.data);
        setSuppliers(suppliersResponse.data);
      } catch (error) {
        console.error("Error fetching categories or suppliers:", error);
        setError("Failed to fetch categories or suppliers.");
      }
    };

    fetchCategoriesAndSuppliers();
  }, []);

  const fetchStockReports = async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching stock reports with filters:", filters); // Log filters
    try {
      const response = await axios.get(
        "https://sharvakshafoodcity.com.lk/backend/public/api/stock-reports",
        { params: filters }
      );
      console.log("Stock reports fetched:", response.data); // Log response data
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setStockReports(response.data);
      }
    } catch (error) {
      console.error("Error fetching stock reports:", error);
      setError("Failed to fetch stock reports.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals and low stock items
  const { totalItems, totalStockQuantity, totalStockValue, lowStockItems } =
    stockReports.reduce(
      (acc, report) => ({
        totalItems: acc.totalItems + 1,
        totalStockQuantity: acc.totalStockQuantity + report.stockQuantity,
        totalStockValue: acc.totalStockValue + report.stockValue,
        lowStockItems:
          report.stockQuantity < 10 ? acc.lowStockItems + 1 : acc.lowStockItems,
      }),
      {
        totalItems: 0,
        totalStockQuantity: 0,
        totalStockValue: 0,
        lowStockItems: 0,
      }
    );

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 min-h-screen w-full relative bg-gray-50 dark:bg-gray-900">
      {/* Report Form */}
      <Card className="mb-6 shadow-lg dark:bg-gray-800">
        <CardContent>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
            Item Wise Stock Report
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input
              type="text"
              name="itemCode"
              placeholder="Item Code"
              value={filters.itemCode}
              onChange={handleInputChange}
              className="dark:bg-gray-700 dark:text-gray-200"
            />
            <Input
              type="text"
              name="itemName"
              placeholder="Item Name"
              value={filters.itemName}
              onChange={handleInputChange}
              className="dark:bg-gray-700 dark:text-gray-200"
            />
            <Select
              name="category"
              value={filters.category}
              onChange={handleInputChange}
              className="dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              name="supplier"
              value={filters.supplier}
              onChange={handleInputChange}
              className="dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.supplier_name}>
                  {supplier.supplier_name}
                </option>
              ))}
            </Select>
          </div>
          {/* Export and Print Options */}
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              onClick={fetchStockReports}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? "Generating Report..." : "Generate Report"}
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <ExportToExcel data={stockReports} fileName="StockReport" />
            <ExportToPDF data={stockReports} fileName="StockReport" />
            <Button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Container */}
      <div className="relative overflow-hidden border border-gray-300 rounded-lg shadow-md bg-white dark:bg-gray-800 mt-6">
        <div className="max-h-[60vh] overflow-auto">
          <Table className="w-full">
            <Thead className="sticky top-0 bg-blue-500 text-white border radius-b-none">
              <Tr>
                <Th className="px-4 py-2 text-left">Item Code</Th>
                <Th className="px-4 py-2 text-left">Item Name</Th>
                <Th className="px-4 py-2 text-left">Category</Th>
                <Th className="px-4 py-2 text-left">Supplier</Th>
                <Th className="px-4 py-2 text-right">Stock Quantity</Th>
                <Th className="px-4 py-2 text-right">Stock Value</Th>
                <Th className="px-4 py-2 text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {stockReports.length > 0 ? (
                stockReports.map((report, index) => (
                  <Tr
                    key={index}
                    className={`border text-gray-700 dark:text-gray-200 odd:bg-gray-100 dark:odd:bg-gray-700 ${
                      report.stockQuantity < 10
                        ? "text-red-800 dark:text-red-400 animate-blink"
                        : ""
                    }`}
                  >
                    <Td className="px-4 py-2 text-left">{report.itemCode}</Td>
                    <Td className="px-4 py-2 text-left">{report.itemName}</Td>
                    <Td className="px-4 py-2 text-left">{report.category}</Td>
                    <Td className="px-4 py-2 text-left">{report.supplier}</Td>
                    <Td className="px-4 py-2 text-right">
                      {report.stockQuantity}
                    </Td>
                    <Td className="px-4 py-2 text-right">
                      Rs. {formatNumberWithCommas(report.stockValue.toFixed(2))}
                    </Td>
                    <Td className="px-4 py-2 text-right">
                      <Button
                        onClick={() => handleViewDetails(report)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td
                    colSpan="7"
                    className="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>
      </div>

      {/* Summary Section at the Bottom */}
      <div className="mt-6 bg-transparent rounded-lg shadow-lg text-center p-4">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
          Item Wise Stock Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-cyan-800 p-4 rounded-lg">
            <p className="text-sm text-cyan-500">Total Items</p>
            <p className="text-2xl text-cyan-300 font-bold">{totalItems}</p>
          </div>
          <div className="bg-rose-800 p-4 rounded-lg">
            <p className="text-sm text-pink-500">Total Stock Quantity</p>
            <p className="text-2xl text-pink-300 font-bold">
              {totalStockQuantity}
            </p>
          </div>
          <div className="bg-lime-800 p-4 rounded-lg">
            <p className="text-sm text-lime-500">Total Stock Value</p>
            <p className="text-2xl text-lime-300 font-bold">
              Rs. {formatNumberWithCommas(totalStockValue.toFixed(2))}
            </p>
          </div>
          <div className="bg-fuchsia-800 p-4 rounded-lg">
            <p className="text-sm text-fuchsia-500">Low Stock Items</p>
            <p className="text-2xl text-fuchsia-300 font-bold">
              {lowStockItems}
            </p>
          </div>
        </div>
      </div>

      {/* Detail View Popup */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-2xl relative max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
              Item Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedItem).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key}
                    </label>
                    <p className="mt-1 text-lg font-semibold dark:text-gray-200">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setShowDetails(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemWiseStockReportForm;
