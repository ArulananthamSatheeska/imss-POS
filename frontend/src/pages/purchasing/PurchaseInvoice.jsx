import React, { useState, useEffect } from "react";
import axios from "axios"; // Direct axios import
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";

const PurchaseInvoice = () => {
  const { currentUser, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch invoices on mount
  useEffect(() => {
    if (currentUser?.token) {
      fetchInvoices();
    } else {
      toast.error("Please login to access invoices");
    }
  }, [currentUser]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime(); // Cache-busting
      const response = await axios.get(
        `https://imssposerp.com/backend/public/api/purchases?_t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      const data = response.data.data || [];
      setInvoices(data);
    } catch (error) {
      handleApiError(error, "Error fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      logout();
    } else {
      const errorMsg = error.response?.data?.message || defaultMessage;
      toast.error(errorMsg);
      console.error(defaultMessage, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
  };

  const handleGenerateInvoice = async (newInvoice) => {
    try {
      setLoading(true);
      const invoiceData = {
        date_of_purchase: newInvoice.purchaseDate,
        bill_number: newInvoice.billNumber,
        invoice_number: newInvoice.invoiceNumber,
        payment_method: newInvoice.paymentMethod,
        supplier_id: parseInt(newInvoice.supplierId),
        store_id: parseInt(newInvoice.storeId),
        items: newInvoice.items.map((item) => ({
          product_id: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          buying_cost: parseFloat(item.buyingCost),
          discount_percentage: parseFloat(item.discountPercentage) || 0,
          discount_amount: parseFloat(item.discountAmount) || 0,
          tax: parseFloat(item.tax) || 0,
        })),
        total: parseFloat(newInvoice.total),
        paid_amount: parseFloat(newInvoice.paidAmount) || 0,
        status: newInvoice.status || "pending",
      };

      let response;
      if (newInvoice.id) {
        // Update existing invoice
        response = await axios.put(
          `https://imssposerp.com/backend/public/api/purchases/${newInvoice.id}`,
          invoiceData,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Purchase invoice updated successfully!");
      } else {
        // Create new invoice
        response = await axios.post(
          "https://imssposerp.com/backend/public/api/purchases",
          invoiceData,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Purchase invoice recorded successfully!");
      }
      fetchInvoices();
      setIsModalOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      handleApiError(error, "Error saving invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice({
      id: invoice.id,
      billNumber: invoice.bill_number,
      invoiceNumber: invoice.invoice_number,
      purchaseDate: invoice.date_of_purchase,
      paymentMethod: invoice.payment_method,
      supplierId: invoice.supplier_id,
      storeId: invoice.store_id,
      paidAmount: invoice.paid_amount,
      status: invoice.status,
      items: invoice.items.map((item, index) => ({
        id: `${invoice.id}-${index}`,
        productId: item.product_id,
        description: item.product?.product_name || "Unknown",
        quantity: item.quantity,
        freeItems: 0, // Not stored in backend
        buyingCost: item.buying_cost,
        discountPercentage: item.discount_percentage,
        discountAmount: item.discount_amount,
        tax: item.tax,
        total:
          item.quantity * item.buying_cost - item.discount_amount + item.tax,
      })),
      total: invoice.total,
    });
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;
    try {
      setLoading(true);
      await axios.delete(`https://imssposerp.com/backend/public/api/purchases/${id}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
      });
      setInvoices(invoices.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted successfully!");
    } catch (error) {
      handleApiError(error, "Error deleting invoice");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.supplier?.supplier_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
            Purchase Invoice Dashboard
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow transition duration-300"
            disabled={loading || !currentUser}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create Purchase Invoice
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500 dark:text-gray-400 absolute left-3 top-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
              Recent Invoices
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                No invoices found. Create your first invoice!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                    <th className="p-3 text-left">Invoice No</th>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-3 text-blue-700 dark:text-blue-300 font-semibold">
                        {invoice.invoice_number}
                      </td>
                      <td className="p-3">
                        {invoice.supplier?.supplier_name || "N/A"}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {invoice.date_of_purchase}
                      </td>
                      <td className="p-3 text-right font-mono">
                        LKR {invoice.total.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${invoice.status === "paid"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : invoice.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-3 text-center flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="Edit"
                          disabled={loading}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                          title="Delete"
                          disabled={loading}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Creating/Editing Invoice */}
        {isModalOpen && (
          <PurchaseInvoiceForm
            onGenerateInvoice={handleGenerateInvoice}
            onCancel={handleCancel}
            existingInvoice={editingInvoice}
          />
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoice;
