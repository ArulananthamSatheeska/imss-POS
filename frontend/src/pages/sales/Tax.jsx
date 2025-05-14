import React, { useState } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiPercent,
  FiDollarSign,
  FiInfo,
} from "react-icons/fi";

const Tax = () => {
  const [taxRate, setTaxRate] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalWithTax, setTotalWithTax] = useState(0);
  const [taxName, setTaxName] = useState("");
  const [taxDescription, setTaxDescription] = useState("");
  const [taxes, setTaxes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaxId, setCurrentTaxId] = useState(null);
  const [activeTab, setActiveTab] = useState("calculator");

  // Calculate tax and total when inputs change
  const calculateTax = (rate, subtotalValue) => {
    const calculatedTaxAmount = (subtotalValue * rate) / 100;
    setTaxAmount(parseFloat(calculatedTaxAmount.toFixed(2)));
    setTotalWithTax(
      parseFloat((subtotalValue + calculatedTaxAmount).toFixed(2))
    );
  };

  const handleTaxRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    setTaxRate(rate);
    calculateTax(rate, subtotal);
  };

  const handleSubtotalChange = (e) => {
    const sub = parseFloat(e.target.value) || 0;
    setSubtotal(sub);
    calculateTax(taxRate, sub);
  };

  const handleTaxAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setTaxAmount(amount);
    setTotalWithTax(parseFloat((subtotal + amount).toFixed(2)));
  };

  const handleReset = () => {
    setTaxRate(0);
    setTaxAmount(0);
    setSubtotal(0);
    setTotalWithTax(0);
    setTaxName("");
    setTaxDescription("");
    setIsEditing(false);
    setCurrentTaxId(null);
  };

  const handleSaveTax = () => {
    if (!taxName) {
      alert("Please enter a tax name");
      return;
    }

    const newTax = {
      id: currentTaxId || Date.now(),
      name: taxName,
      rate: taxRate,
      description: taxDescription,
      amount: taxAmount,
      subtotal: subtotal,
      total: totalWithTax,
      createdAt: new Date().toISOString(),
    };

    if (isEditing) {
      setTaxes(taxes.map((tax) => (tax.id === currentTaxId ? newTax : tax)));
    } else {
      setTaxes([...taxes, newTax]);
    }

    handleReset();
    setActiveTab("records");
  };

  const handleEditTax = (tax) => {
    setTaxName(tax.name);
    setTaxRate(tax.rate);
    setTaxDescription(tax.description);
    setSubtotal(tax.subtotal);
    setTaxAmount(tax.amount);
    setTotalWithTax(tax.total);
    setIsEditing(true);
    setCurrentTaxId(tax.id);
    setActiveTab("calculator");
  };

  const handleDeleteTax = (id) => {
    if (window.confirm("Are you sure you want to delete this tax record?")) {
      setTaxes(taxes.filter((tax) => tax.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Tax Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Calculate taxes and manage tax records
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === "calculator" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
          >
            <FiPercent className="mr-2" /> Tax Calculator
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === "records" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
          >
            <FiDollarSign className="mr-2" /> Tax Records
          </button>
        </div>

        {/* Calculator Tab */}
        {activeTab === "calculator" && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tax Details */}
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <FiInfo className="mr-2" /> Tax Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Name*
                    </label>
                    <input
                      type="text"
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., VAT, GST"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={taxDescription}
                      onChange={(e) => setTaxDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </div>

              {/* Calculator */}
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <FiPercent className="mr-2" /> Tax Calculator
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subtotal (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                        LKR
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={subtotal}
                        onChange={handleSubtotalChange}
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Rate (%)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                        %
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRate}
                        onChange={handleTaxRateChange}
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Amount (LKR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                        LKR
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxAmount}
                        onChange={handleTaxAmountChange}
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total with Tax (LKR)
                    </label>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      LKR {totalWithTax.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 flex items-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <FiRefreshCw className="mr-2" /> Reset
              </button>
              <button
                onClick={handleSaveTax}
                className="px-4 py-2 flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                <FiSave className="mr-2" />{" "}
                {isEditing ? "Update Tax" : "Save Tax"}
              </button>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === "records" && (
          <div className="p-6">
            {taxes.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiDollarSign className="text-3xl text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No tax records
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new tax calculation
                </p>
                <button
                  onClick={() => setActiveTab("calculator")}
                  className="mt-4 px-4 py-2 inline-flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  Create Tax Calculation
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tax Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {taxes.map((tax) => (
                      <tr
                        key={tax.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tax.name}
                          </div>
                          {tax.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {tax.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {tax.rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          LKR {tax.subtotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          LKR {tax.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          LKR {tax.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditTax(tax)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteTax(tax.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tax;
