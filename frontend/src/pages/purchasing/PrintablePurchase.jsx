import React from 'react';

const PrintablePurchase = ({ data }) => {
    const calculateTotals = () => {
        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const discount = data.items.reduce((sum, item) => sum + (item.discount || 0), 0);
        return {
            subtotal,
            discount,
            total: subtotal - discount
        };
    };

    return (
        <div className="p-8 bg-white" style={{ minWidth: '210mm' }}>
            <div className="flex justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold">Your Business Name</h2>
                    <p>123 Business Address, City, Country</p>
                    <p>Phone: (123) 456-7890 | Email: info@business.com</p>
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-bold">PURCHASE INVOICE</h1>
                    <p className="text-lg">Invoice #: {data.invoiceNumber}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold mb-2">Supplier Information</h3>
                    <p><strong>Name:</strong> {data.supplier?.name || 'N/A'}</p>
                    <p><strong>Address:</strong> {data.supplier?.address || 'N/A'}</p>
                    <p><strong>Phone:</strong> {data.supplier?.phone || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="font-bold mb-2">Invoice Details</h3>
                    <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString()}</p>
                    <p><strong>Payment Method:</strong> {data.paymentMethod}</p>
                </div>
            </div>

            <div className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Item</th>
                            <th className="p-2 border text-right">Qty</th>
                            <th className="p-2 border text-right">Price</th>
                            <th className="p-2 border text-right">Total</th>
                            <th className="p-2 border">Expiry</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index}>
                                <td className="p-2 border">{item.name}</td>
                                <td className="p-2 border text-right">{item.quantity}</td>
                                <td className="p-2 border text-right">{item.price.toFixed(2)}</td>
                                <td className="p-2 border text-right">{(item.quantity * item.price).toFixed(2)}</td>
                                <td className="p-2 border">{item.expiryDate || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-right mb-8">
                <p><strong>Subtotal:</strong> {calculateTotals().subtotal.toFixed(2)}</p>
                <p><strong>Discount:</strong> {calculateTotals().discount.toFixed(2)}</p>
                <p className="text-xl font-bold">Total: {calculateTotals().total.toFixed(2)}</p>
            </div>

            <div className="mt-12 pt-4 border-t">
                <p>Thank you for your business!</p>
                <div className="mt-8 flex justify-between">
                    <div>
                        <p className="font-bold">Received By:</p>
                        <p className="mt-12">________________________</p>
                    </div>
                    <div>
                        <p className="font-bold">Authorized Signature:</p>
                        <p className="mt-12">________________________</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintablePurchase;