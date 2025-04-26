import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PrintPreviewModal from './PrintPreviewModal';
import SupplierModal from './SupplierModal';
import ItemSearchModal from './ItemSearchModal';

const PurchaseForm = ({ existingPurchase, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    supplier: existingPurchase?.supplier || null,
    date: existingPurchase?.date || new Date().toISOString().split('T')[0],
    paymentMethod: existingPurchase?.paymentMethod || 'cash',
    items: existingPurchase?.items || [],
    notes: existingPurchase?.notes || '',
    invoiceNumber: existingPurchase?.invoiceNumber || `GRN-${Date.now()}`,
  });

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const discount = formData.items.reduce(
      (sum, item) => sum + (item.discount || 0),
      0
    );
    return {
      subtotal,
      discount,
      total: subtotal - discount,
    };
  };

  const handleAddItem = (item, quantity, price, expiryDate = null) => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...item,
          quantity,
          price,
          expiryDate,
          total: quantity * price,
        },
      ],
    }));
  };

  const handleSave = async (shouldPrint = false) => {
    setLoading(true);
    try {
      const purchaseData = {
        ...formData,
        ...calculateTotals(),
      };

      await onSave(purchaseData);
      toast.success('Purchase saved successfully');

      if (shouldPrint) {
        setShowPrintModal(true);
      } else {
        onCancel();
      }
    } catch (error) {
      toast.error(`Error saving purchase: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (index) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {existingPurchase ? 'Edit Purchase' : 'Create New Purchase'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2 font-medium">Supplier</label>
          <div className="flex">
            <select
              className="flex-1 p-2 border rounded"
              value={formData.supplier?.id || ''}
              onChange={(e) => {
                const selectedSupplier = suppliers.find(s => s.id === e.target.value);
                setFormData({ ...formData, supplier: selectedSupplier });
              }}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="ml-2 p-2 bg-blue-500 text-white rounded"
              onClick={() => setShowSupplierModal(true)}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Invoice Number</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.invoiceNumber}
            readOnly
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Payment Method</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          >
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <button
          type="button"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => setShowItemSearch(true)}
        >
          Add Items
        </button>
      </div>

      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Item</th>
              <th className="p-2 border text-center">Quantity</th>
              <th className="p-2 border text-right">Price</th>
              <th className="p-2 border text-right">Total</th>
              <th className="p-2 border text-center">Expiry</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 border">{item.name}</td>
                <td className="p-2 border text-center">{item.quantity}</td>
                <td className="p-2 border text-right">{item.price.toFixed(2)}</td>
                <td className="p-2 border text-right">{(item.quantity * item.price).toFixed(2)}</td>
                <td className="p-2 border text-center">
                  {item.expiryDate || 'N/A'}
                </td>
                <td className="p-2 border text-center">
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveItem(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 text-right">
        <div className="mb-2">
          <span className="font-medium">Subtotal:</span> {calculateTotals().subtotal.toFixed(2)}
        </div>
        <div className="mb-2">
          <span className="font-medium">Discount:</span> {calculateTotals().discount.toFixed(2)}
        </div>
        <div className="text-xl font-bold">
          <span className="font-medium">Total:</span> {calculateTotals().total.toFixed(2)}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowSavePrompt(true)}
          disabled={loading || formData.items.length === 0}
        >
          {loading ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>

      {/* Modals */}
      {showSupplierModal && (
        <SupplierModal
          onClose={() => setShowSupplierModal(false)}
          onSave={(newSupplier) => {
            setFormData({ ...formData, supplier: newSupplier });
            setShowSupplierModal(false);
          }}
        />
      )}

      {showItemSearch && (
        <ItemSearchModal
          onClose={() => setShowItemSearch(false)}
          onAddItem={handleAddItem}
        />
      )}

      {showPrintModal && (
        <PrintPreviewModal
          data={formData}
          onClose={() => {
            setShowPrintModal(false);
            onCancel();
          }}
        />
      )}

      {showSavePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4">Print Purchase Invoice?</h3>
            <p className="mb-6">Do you want to print this purchase invoice?</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded"
                onClick={() => {
                  setShowSavePrompt(false);
                  handleSave(false);
                }}
              >
                No, Just Save
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => {
                  setShowSavePrompt(false);
                  handleSave(true);
                }}
              >
                Yes, Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseForm;