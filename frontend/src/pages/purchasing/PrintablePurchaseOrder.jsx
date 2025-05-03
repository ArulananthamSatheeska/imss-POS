import React from 'react';

const PrintablePurchaseOrder = ({ orderData }) => {
    // Destructure from orderData with defaults
    const {
        supplier = { name: 'N/A', address: 'N/A', phone: 'N/A' },
        items = [],
        footerDetails = { approvedBy: 'N/A', nextApprovalTo: 'N/A', dateTime: 'N/A' },
        total = 0,
        order = { no: 'N/A', date: 'N/A', time: 'N/A' },
    } = orderData || {};

    return (
        <div className="p-8 text-gray-900 bg-white printable-purchase-order">
            {/* Header */}
            <div className="flex justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-blue-900">IMSS</h2>
                    <p className="text-gray-600">Infinity Marketing Services and Solutions</p>
                </div>
                <h1 className="text-5xl font-bold text-cyan-900">PURCHASE ORDER</h1>
            </div>

            {/* Order & Supplier Details */}
            <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
                <div>
                    <h4 className="mb-4 font-semibold text-blue-900">Supplier Details</h4>
                    <p className="text-gray-700">
                        <strong>Name:</strong> {supplier.name}
                    </p>
                    <p className="text-gray-700">
                        <strong>Address:</strong> {supplier.address}
                    </p>
                    <p className="text-gray-700">
                        <strong>Phone:</strong> {supplier.phone}
                    </p>
                </div>
                <div>
                    <h4 className="mb-4 font-semibold text-blue-900">Order Details</h4>
                    <p className="text-gray-700">
                        <strong>Order No:</strong> {order.no}
                    </p>
                    <p className="text-gray-700">
                        <strong>Date:</strong> {order.date}
                    </p>
                    <p className="text-gray-700">
                        <strong>Time:</strong> {order.time}
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
                            <th className="p-2 text-center border border-gray-300">Total (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <tr key={item.id || index} className="border border-gray-300">
                                    <td className="p-2 text-center border border-gray-300">{index + 1}</td>
                                    <td className="p-3 text-left text-gray-700 border border-gray-300">
                                        {item.description}
                                    </td>
                                    <td className="p-3 text-center text-gray-700 border border-gray-300">
                                        {item.qty}
                                    </td>
                                    <td className="p-3 text-right text-gray-700 border border-gray-300">
                                        LKR {(Number(item.unitPrice) || 0).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-right text-gray-700 border border-gray-300">
                                        LKR {(Number(item.total) || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-3 text-center text-gray-700">
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
                    <p className="text-gray-700">{footerDetails.approvedBy}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-blue-900">Next Approval To</h4>
                    <p className="text-gray-700">{footerDetails.nextApprovalTo}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-blue-900">Date & Time</h4>
                    <p className="text-gray-700">{footerDetails.dateTime}</p>
                </div>
            </div>
        </div>
    );
};

export default PrintablePurchaseOrder;