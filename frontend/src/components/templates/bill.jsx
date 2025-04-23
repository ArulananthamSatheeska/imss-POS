import React, { useState } from "react";
import { formatNumberWithCommas } from "../../utils/numberformat";

const EditableBillFormat = ({
    initialProducts,
    initialTotals,
    initialTax,
    initialBillDiscount,
    initialShipping,
    initialCustomerInfo,
    onSave,
}) => {

    const [products, setProducts] = useState(initialProducts || []);
    const [totals, setTotals] = useState(initialTotals || { subTotal: 0, total: 0 });
    const [tax, setTax] = useState(initialTax || 0);
    const [billDiscount, setBillDiscount] = useState(initialBillDiscount || 0);
    const [shipping, setShipping] = useState(initialShipping || 0);
    const [customerInfo, setCustomerInfo] = useState(initialCustomerInfo || { name: "", mobile: "", billNo: "", userId: "" });

    // ✅ Define receivedAmount and balanceAmount
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [balanceAmount, setBalanceAmount] = useState(0);

    const handleProductChange = (index, field, value) => {
        const newProducts = [...products];
        newProducts[index][field] = value;
        setProducts(newProducts);
    };

    const handleReceivedAmountChange = (e) => {
        const amount = parseFloat(e.target.value) || 0;
        setReceivedAmount(amount);
        setBalanceAmount(totals.total - amount);
    };

    const handleSave = () => {
        onSave({ products, totals, tax, billDiscount, shipping, customerInfo });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4" id="bill-container">
            {/* Section 1: Logo and Shop Info */}
            <div className="text-center mb-4">
                <img src="/path/to/logo.png" alt="Logo" className="w-20 mx-auto mb-2" />
                <h1 className="text-xl font-bold">Shop Name</h1>
                <p>Address: Shop Address Here</p>
                <p>Mobile: 123-456-7890</p>
                <p>Email: info@shop.com</p>
            </div>

            {/* Section 2: Customer Info */}
            <div className="flex justify-between mb-4">
                <div>
                    <label className="block">Customer Name</label>
                    <input
                        className="w-full p-2 border"
                        value={customerInfo.name}
                        onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, name: e.target.value })
                        }
                    />
                    <label className="block">Mobile</label>
                    <input
                        className="w-full p-2 border"
                        value={customerInfo.mobile}
                        onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, mobile: e.target.value })
                        }
                    />
                </div>
                <div className="text-right">
                    <p>
                        <strong>Date:</strong> {new Date().toLocaleDateString()}
                    </p>
                    <p>
                        <strong>Bill No:</strong> {customerInfo.billNo}
                    </p>
                    <p>
                        <strong>User ID:</strong> {customerInfo.userId}
                    </p>
                    <p>
                        <strong>Bill Generated:</strong> {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Section 3: Item Table */}
            <div className="overflow-x-auto mb-4">
                <table className="w-full table-auto border-collapse">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border p-2">Item Name</th>
                            <th className="border p-2">Qty</th>
                            <th className="border p-2">Unit MRP</th>
                            <th className="border p-2">Unit Price</th>
                            <th className="border p-2">Discount</th>
                            <th className="border p-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={index}>
                                <td className="border p-2">
                                    <input
                                        className="w-full p-2 border"
                                        value={product.name}
                                        onChange={(e) =>
                                            handleProductChange(index, "name", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="border p-2 text-center">
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={product.qty}
                                        onChange={(e) =>
                                            handleProductChange(index, "qty", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="border p-2 text-right">
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={product.mrp}
                                        onChange={(e) =>
                                            handleProductChange(index, "mrp", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="border p-2 text-right">
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={product.price}
                                        onChange={(e) =>
                                            handleProductChange(index, "price", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="border p-2 text-right">
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={product.discount}
                                        onChange={(e) =>
                                            handleProductChange(index, "discount", e.target.value)
                                        }
                                    />
                                </td>
                                <td className="border p-2 text-right">
                                    {formatNumberWithCommas(
                                        (
                                            Number(product.qty) * Number(product.price) -
                                            Number(product.discount)
                                        ).toFixed(2)
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Section 4: Totals */}
            <div className="text-right mb-4">
                <p>Total Items: {products.length}</p>
                <p>
                    Total Quantity:{" "}
                    {formatNumberWithCommas(
                        products.reduce((sum, product) => sum + Number(product.qty), 0)
                    )}
                </p>
                <label className="block">Sub Total:</label>
                <input
                    type="number"
                    className="w-full p-2 border"
                    value={totals.subTotal}
                    onChange={(e) => setTotals({ ...totals, subTotal: e.target.value })}
                />
                <label className="block">Discount:</label>
                <input
                    type="number"
                    className="w-full p-2 border"
                    value={billDiscount}
                    onChange={(e) => setBillDiscount(e.target.value)}
                />
                <label className="block">Shipping:</label>
                <input
                    type="number"
                    className="w-full p-2 border"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                />
                <h3 className="text-xl font-bold mt-2">
                    Total: {formatNumberWithCommas(totals.total.toFixed(2))} Rs.
                </h3>
                <label className="block">Received:</label>
                <input
                    type="number"
                    className="w-full p-2 border"
                    value={receivedAmount}
                    onChange={handleReceivedAmountChange}
                />
                <label className="block">Balance:</label>
                <input
                    type="number"
                    className="w-full p-2 border"
                    value={balanceAmount.toFixed(2)}
                    readOnly
                />
            </div>

            {/* Footer with Save and Print Button */}
            <div className="text-center mt-6 text-sm">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                    Save and Print
                </button>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ml-4"
                >
                    Print Bill
                </button>
                <p>Thank you for shopping with us!</p>
                <p>System By: IMSS PVT(ltd)</p>
                <p>phone: 077 0802 365</p>
            </div>
        </div>
    );
};

export default EditableBillFormat;
