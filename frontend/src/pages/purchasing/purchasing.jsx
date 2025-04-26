// src/pages/purchasing/PurchasingEntryForm.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";
import PurchaseFilters from "./components/PurchaseFilters";
import PurchaseSummary from "./components/PurchaseSummary";
import PurchaseTable from "./components/PurchaseTable";
import { formatCurrency, calculateTotals } from "./components/helpers";

const PurchasingEntryForm = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const lastMonth = oneMonthAgo.toISOString().split("T")[0];

  const [state, setState] = useState({
    purchasedItems: [],
    suppliers: [],
    stores: [],
    items: [],
    searchTerm: "",
    fromDate: lastMonth,
    toDate: today,
    loading: false,
    showFilters: false,
    expandedRow: null,
    isInvoiceFormOpen: false,
    editingInvoice: null,
    isModalOpen: false,
    editingItem: null
  });

  useEffect(() => {
    if (user?.token) {
      fetchData();
    } else {
      toast.error("Please login to access purchase entries");
    }
  }, [user, state.fromDate, state.toDate]);

  const fetchData = async () => {
    // Fetch data implementation...
  };

  const handleSearchChange = (e) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleFilterChange = (name, value) => {
    setState(prev => ({ ...prev, [name]: value }));
  };

  const toggleRow = (index) => {
    setState(prev => ({
      ...prev,
      expandedRow: prev.expandedRow === index ? null : index
    }));
  };

  const openEditModal = (item) => {
    setState(prev => ({
      ...prev,
      editingItem: item,
      isModalOpen: true
    }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      editingItem: null
    }));
  };

  const handleGenerateInvoice = async (newInvoice) => {
    // Invoice generation logic...
  };

  const deleteInvoice = async (purchaseId) => {
    // Delete invoice logic...
  };

  const totals = calculateTotals(state.purchasedItems);

  return (
    <div className="p-4 min-h-screen flex flex-col bg-transparent">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-800 dark:bg-gradient-to-r dark:from-blue-900 dark:to-slate-800 text-white text-center py-3 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold">PURCHASE ENTRY DASHBOARD</h1>
        <p className="text-sm opacity-90">View and manage your purchase entries</p>
      </div>

      {/* Filters */}
      <PurchaseFilters
        showFilters={state.showFilters}
        fromDate={state.fromDate}
        toDate={state.toDate}
        searchTerm={state.searchTerm}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => handleFilterChange('showFilters', !state.showFilters)}
        onRefresh={fetchData}
        onExport={() => exportToExcel(state.filteredItems)}
        onCreateEntry={() => handleFilterChange('isInvoiceFormOpen', true)}
      />

      {/* Summary */}
      <PurchaseSummary totals={totals} formatCurrency={formatCurrency} />

      {/* Table */}
      <PurchaseTable
        items={state.purchasedItems}
        searchTerm={state.searchTerm}
        loading={state.loading}
        expandedRow={state.expandedRow}
        onEditItem={openEditModal}
        onEditInvoice={(item) => setState(prev => ({
          ...prev,
          editingInvoice: mapToInvoice(item, state.purchasedItems, state.items),
          isInvoiceFormOpen: true
        }))}
        onDeleteInvoice={deleteInvoice}
        onToggleRow={toggleRow}
        formatCurrency={formatCurrency}
      />

      {/* Modals */}
      {state.isInvoiceFormOpen && (
        <PurchaseInvoiceForm
          onGenerateInvoice={handleGenerateInvoice}
          onCancel={() => handleFilterChange('isInvoiceFormOpen', false)}
          existingInvoice={state.editingInvoice}
        />
      )}

      {state.isModalOpen && (
        <EditItemModal
          item={state.editingItem}
          onClose={closeModal}
          onSave={updateItem}
        />
      )}
    </div>
  );
};

export default PurchasingEntryForm;