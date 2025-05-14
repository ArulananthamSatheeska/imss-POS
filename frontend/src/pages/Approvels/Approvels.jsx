import React, { useState, useEffect } from "react";

const mockData = {
  invoices: [
    {
      id: 1,
      title: "Invoice #101",
      amount: 2500,
      status: "Pending",
      createdAt: "2025-04-13 10:20 AM",
    },
    {
      id: 2,
      title: "Invoice #102",
      amount: 8900,
      status: "Approved",
      createdAt: "2025-04-12 9:45 AM",
    },
  ],
  quotations: [
    {
      id: 1,
      title: "Quotation #A01",
      amount: 1500,
      status: "Pending",
      createdAt: "2025-04-14 11:00 AM",
    },
    {
      id: 2,
      title: "Quotation #A02",
      amount: 7800,
      status: "Rejected",
      createdAt: "2025-04-11 4:15 PM",
    },
  ],
};

const Approvels = () => {
  const [selectedTab, setSelectedTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [alertVisible, setAlertVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleApprove = (type, id) => {
    alert(`✅ ${type.toUpperCase()} with ID ${id} has been approved!`);
    // backend call here
  };

  const filterAndSearch = (data) => {
    return data.filter((item) => {
      const matchSearch = item.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const renderStatusTag = (status) => {
    const base = "px-2 py-1 rounded text-xs font-bold";
    switch (status) {
      case "Pending":
        return (
          <span className={`${base} bg-yellow-200 text-yellow-800`}>
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className={`${base} bg-green-200 text-green-800`}>
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className={`${base} bg-red-200 text-red-800`}>Rejected</span>
        );
      default:
        return <span className={base}>{status}</span>;
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderItems = (type, data) => {
    const filteredData = filterAndSearch(data);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-white rounded shadow-md hover:shadow-lg transition"
          >
            <div className="text-lg font-semibold text-gray-800 mb-1">
              {item.title}
            </div>
            <div className="text-gray-600 mb-1">
              Amount:{" "}
              <span className="font-medium">
                LKR {item.amount.toLocaleString()}
              </span>
            </div>
            <div className="mb-1">Status: {renderStatusTag(item.status)}</div>
            <div className="text-xs text-gray-400">
              Created at: {item.createdAt}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => handleApprove(type, item.id)}
              >
                Approve
              </button>
              <button
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => openModal(item)}
              >
                View
              </button>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No records found.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Approvals</h1>
        {alertVisible && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded animate-pulse font-semibold shadow-sm">
            ⚠️ You have pending approvals!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-4">
        {["invoices", "quotations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
              selectedTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter/Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          className="px-4 py-2 border rounded shadow-sm w-full md:w-1/3"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded shadow-sm w-full md:w-1/5"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="unpaid">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Cards */}
      {selectedTab === "invoices" && renderItems("invoice", mockData.invoices)}
      {selectedTab === "quotations" &&
        renderItems("quotation", mockData.quotations)}

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedItem.title}</h2>
            <p>
              <strong>Amount:</strong> LKR{" "}
              {selectedItem.amount.toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong> {renderStatusTag(selectedItem.status)}
            </p>
            <p>
              <strong>Created At:</strong> {selectedItem.createdAt}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              More details could be shown here based on backend data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvels;
