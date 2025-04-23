import React from "react";

const PrintableQuotation = ({ customer, items, footerDetails, total, invoice }) => {
    return (
        <div className="p-8 bg-white text-gray-900">
            {/* Header */}
            <div className="flex justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-blue-900">IMSS</h2>
                    <p className="text-gray-600">Infinity Marketing Services and Solutions</p>
                </div>
                <h1 className="text-5xl font-bold text-cyan-900">QUOTATION</h1>
            </div>

            {/* Invoice & Customer Details */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold text-blue-900 mb-4">Customer Details</h4>
                    <p className="text-gray-700"><strong>Name:</strong> {customer.name}</p>
                    <p className="text-gray-700"><strong>Address:</strong> {customer.address}</p>
                    <p className="text-gray-700"><strong>Phone:</strong> {customer.phone}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-blue-900 mb-4">Invoice Details</h4>
                    <p className="text-gray-700"><strong>Invoice No:</strong> {invoice.no}</p>
                    <p className="text-gray-700"><strong>Date:</strong> {invoice.date}</p>
                    <p className="text-gray-700"><strong>Time:</strong> {invoice.time}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
                <table className="w-full mb-8 border border-gray-300 border-collapse">
                    <thead>
                        <tr className="bg-blue-900 text-white border border-gray-300">
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
                        {items.map((item, index) => (
                            <tr key={index} className="border border-gray-300">
                                <td className="p-2 text-center border border-gray-300">{index + 1}</td>
                                <td className="p-3 text-gray-700 text-left border border-gray-300">{item.description}</td>
                                <td className="p-3 text-center text-gray-700 border border-gray-300">{item.qty}</td>
                                <td className="p-3 text-right text-gray-700 border border-gray-300">LKR {(Number(item.unitPrice) || 0).toFixed(2)}</td>
                                <td className="p-3 text-center text-gray-700 border border-gray-300">{item.freeQty}</td>
                                <td className="p-3 text-right text-gray-700 border border-gray-300">LKR {(Number(item.discountAmount) || 0).toFixed(2)}</td>
                                <td className="p-3 text-right text-gray-700 border border-gray-300">{(Number(item.discountPercentage) || 0).toFixed(2)}%</td>
                                <td className="p-3 text-right text-gray-700 border border-gray-300">LKR {(Number(item.total) || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Total Amount */}
            <div className="text-right mb-8">
                <h3 className="font-semibold text-xl text-blue-900">Total Qty: LKR (Number(totalQty)</h3>
                <h3 className="font-semibold text-xl text-blue-900">Total Discount: LKR {(Number(total) || 0).toFixed(2)}</h3>
                <h3 className="font-semibold text-xl text-blue-900">Total: LKR {(Number(total) || 0).toFixed(2)}</h3>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8">
                <h4 className="font-semibold text-blue-900 mb-4">Terms and Conditions</h4>
                <ul className="list-disc list-inside text-gray-700">
                    <li>Payment is due within 30 days of the invoice date.</li>
                    <li>Late payments may incur a fee of 5% per month.</li>
                    <li>Goods sold are not returnable after 7 days.</li>
                    <li>All disputes are subject to the jurisdiction of the courts in Any City.</li>
                </ul>
            </div>

            {/* Footer Details */}
            <div className="grid pt-10 grid-cols-1 md:grid-cols-3 gap-6 text-center">
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

export default PrintableQuotation;
