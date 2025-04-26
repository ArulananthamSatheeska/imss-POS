import React, { useState, useEffect } from "react";
import axios from "axios";
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";
import PrintPreviewModal from "./PrintPreviewModal";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";

const PurchaseInvoice = () => {
  const { currentUser, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

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
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `http://127.0.0.1:8000/api/purchases?_t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setInvoices(response.data.data || []);
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
      toast.error(error.response?.data?.message || defaultMessage);
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

      if (newInvoice.id) {
        await axios.put(
          `http://127.0.0.1:8000/api/purchases/${newInvoice.id}`,
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
        await axios.post(`http://127.0.0.1:8000/api/purchases`, invoiceData, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
          },
        });
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
      items: invoice.items.map((item, i) => ({
        id: `${invoice.id}-${i}`,
        productId: item.product_id,
        description: item.product?.product_name || "Unknown",
        quantity: item.quantity,
        buyingCost: item.buying_cost,
        discountPercentage: item.discount_percentage,
        discountAmount: item.discount_amount,
        tax: item.tax,
        total: item.quantity * item.buying_cost - item.discount_amount + item.tax,
      })),
      total: invoice.total,
    });
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:8000/api/purchases/${id}`, {
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

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.supplier?.supplier_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            Purchase Invoice Dashboard
          </h1>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setEditingInvoice(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            + Create Invoice
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by supplier or invoice no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        </div>

        <div className="overflow-x-auto bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="p-2">Invoice No</th>
                <th className="p-2">Supplier</th>
                <th className="p-2">Date</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-gray-300 dark:border-gray-700">
                  <td className="p-2 font-bold text-blue-600 dark:text-blue-300">{invoice.invoice_number}</td>
                  <td className="p-2">{invoice.supplier?.supplier_name}</td>
                  <td className="p-2">{invoice.date_of_purchase}</td>
                  <td className="p-2 text-right">LKR {invoice.total.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === "paid"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-2 text-center space-x-2">
                    <button onClick={() => setViewingInvoice(invoice)} title="View" className="text-green-600">🔍</button>
                    <button onClick={() => handleEditInvoice(invoice)} title="Edit" className="text-blue-600">✏️</button>
                    <button onClick={() => handleDeleteInvoice(invoice.id)} title="Delete" className="text-red-600">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && !loading && (
            <p className="text-center mt-4 text-gray-500">No invoices found.</p>
          )}
        </div>

        {isModalOpen && (
          <PurchaseInvoiceForm
            existingInvoice={editingInvoice}
            onGenerateInvoice={handleGenerateInvoice}
            onCancel={handleCancel}
          />
        )}

        {viewingInvoice && (
          <PrintPreviewModal
            invoice={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoice;
