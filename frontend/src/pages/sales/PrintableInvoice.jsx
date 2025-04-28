import React from "react";

const PrintableInvoice = ({ invoiceData }) => {
  // Destructure from invoiceData with defaults
  const {
    customer = { name: "N/A", address: "N/A", phone: "N/A", email: "N/A" },
    items = [],
    footerDetails = { approvedBy: "N/A", nextApprovalTo: "N/A", dateTime: "N/A" },
    total = 0,
    invoice = { no: "N/A", date: "N/A", time: "N/A" },
  } = invoiceData || {};

  return (
    <div className="p-8 text-gray-900 bg-white printable-invoice"> {/* Added printable-invoice class */}
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-blue-900">IMSS</h2>
          <p className="text-gray-600">Infinity Marketing Services and Solutions</p>
        </div>
        <h1 className="text-5xl font-bold text-cyan-900">SALES INVOICE</h1>
      </div>

      {/* Invoice & Customer Details */}
      <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
        <div>
          <h4 className="mb-4 font-semibold text-blue-900">Customer Details</h4>
          <p className="text-gray-2 700">
            <strong>Name:</strong> {customer.name || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Address:</strong> {customer.address || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Phone:</strong> {customer.phone || "N/A"}
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-blue-900">Invoice Details</h4>
          <p className="text-gray-700">
            <strong>Invoice No:</strong> {invoice.no || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Date:</strong> {invoice.date || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Time:</strong> {invoice.time || "N/A"}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full mb-8 border border-collapse border-gray-300">
          <thead>
            <tr className="text-white bg-blue-900 border border-gray-300">
              <th className="p-2 text-center border border-gray-300">No</th>
              <th className="p-2 text-center border border-gray-300">Item Description</th>
              <th className="p-2 text-center border border-gray-300">Qty</th>
              <th className="p-2 text-center border border-gray-300">Unit Price (LKR)</th>
              <th className="p-2 text-center border border-gray-300">Free (Qty)</th>
              <th className="p-2 text-center border border-gray-300">Dis (LKR)</th>
              <th className="p-2 text-center border border-gray-300">Dis (%)</th>
              <th className="p-2 text-center border border-gray-300">Total (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={item.id || index} className="border border-gray-300">
                  <td className="p-2 text-center border border-gray-300">{index + 1}</td>
                  <td className="p-3 text-left text-gray-700 border border-gray-300">
                    {item.description || "N/A"}
                  </td>
                  <td className="p-3 text-center text-gray-700 border border-gray-300">
                    {item.quantity || item.qty || 0}
                  </td>
                  <td className="p-3 text-right text-gray-700 border border-gray-300">
                    LKR {(Number(item.unit_price || item.unitPrice || 0)).toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-gray-700 border border-gray-300">
                    {item.freeQty || 0}
                  </td>
                  <td className="p-3 text-right text-gray-700 border border-gray-300">
                    LKR {(Number(item.discountAmount || 0)).toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-gray-700 border border-gray-300">
                    {(Number(item.discountPercentage || 0)).toFixed(2)}%
                  </td>
                  <td className="p-3 text-right text-gray-700 border border-gray-300">
                    LKR {(Number(item.total || 0)).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-3 text-center text-gray-700">
                  No items available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total Amount */}
      <div className="mb-8 text-right">
        <h3 className="text-xl font-semibold text-blue-900">
          Total: LKR {(Number(total) || 0).toFixed(2)}
        </h3>
      </div>

      {/* Footer Details */}
      <div className="grid grid-cols-1 gap-6 pt-10 text-center md:grid-cols-3">
        <div>
          <h4 className="font-semibold text-blue-900">Approved By</h4>
          <p className="text-gray-700">{footerDetails.approvedBy || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Next Approval To</h4>
          <p className="text-gray-700">{footerDetails.nextApprovalTo || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Date & Time</h4>
          <p className="text-gray-700">{footerDetails.dateTime || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;