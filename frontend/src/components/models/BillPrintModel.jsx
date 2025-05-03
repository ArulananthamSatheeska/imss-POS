import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useRegister } from "../../context/RegisterContext";

const BillPrintModal = ({
    initialProducts = [],
    initialBillDiscount = 0,
    initialCustomerInfo = { name: '', mobile: '', bill_number: '', userId: '' },
    onClose,
}) => {
    const { getAuthHeaders } = useRegister();
    const [billNumber, setBillNumber] = useState(initialCustomerInfo.bill_number); // Use the bill number from props
    const printRef = useRef(null);
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(initialCustomerInfo);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showBillSavedMessage, setShowBillSavedMessage] = useState(false); // Define this state
    const [paymentType, setPaymentType] = useState("cash");

    // Fetch the next bill number from the backend
    useEffect(() => {
        const fetchNextBillNumber = async () => {
            try {
                const response = await axios.get('/api/next-bill-number', getAuthHeaders());
                setBillNumber(response.data.next_bill_number);
            } catch (error) {
                console.error("Error fetching next bill number:", error);
            }
        };

        fetchNextBillNumber();
    }, [getAuthHeaders]);

    // Generate a unique bill number if not provided
    const totalItemDiscount = initialProducts.reduce((sum, product) => sum + (product.discount * product.qty), 0);

    const handleSave = async () => {
        const billData = {
            bill_number: billNumber,
            customer_id: selectedCustomer?.id || null,
            customer_name: selectedCustomer?.name || "Walk-in Customer",
            subtotal: grandTotal + initialBillDiscount,
            discount: totalItemDiscount + initialBillDiscount,
            tax: 0, // Add tax if applicable
            total: grandTotal,
            payment_type: paymentType,
            received_amount: receivedAmount,
            balance_amount: balanceAmount,
            items: initialProducts.map((product) => ({
                product_name: product.product_name,
                quantity: product.qty,
                mrp: product.mrp,
                unit_price: product.sales_price,
                discount: product.discount,
                total: (product.mrp - product.discount) * product.qty,
            })),
        };

        console.log("Sending bill data:", billData); // Log the data being sent

        try {
            const response = await axios.post('/api/sales', billData, getAuthHeaders());
            console.log('Bill saved successfully:', response.data);

            // Increment the bill number after successful save and reset relevant states
            setReceivedAmount(0);
            setBalanceAmount(0);

            const nextBillNumber = generateNextBillNumber(billNumber);
            setBillNumber(nextBillNumber);

            // Refresh the browser
            window.location.reload();
        } catch (error) {
            console.error('Error saving bill:', error);
            setBillNumber(initialCustomerInfo.bill_number); // Reset the bill number to initial state if needed
        }
    };
    // Calculate grand total
    const calculateGrandTotal = () => {
        return initialProducts.reduce((sum, product) => {
            return sum + (product.mrp - product.discount) * product.qty;
        }, 0) - initialBillDiscount;
    };

    const grandTotal = calculateGrandTotal();

    // Fetch customers from the backend
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/customers");
                setCustomers(response.data.data); // Ensure the response is in the correct format
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };

        fetchCustomers();
    }, []);

    // Handle customer selection
    const handleCustomerChange = (e) => {
        const id = e.target.value;
        const customer = customers.find((cust) => cust.id == id); // Use == for loose comparison
        if (customer) {
            setSelectedCustomer({
                ...customer,
                name: customer.customer_name, // Map customer_name to name
                mobile: customer.phone, // Map phone to mobile
            });
        } else {
            setSelectedCustomer({
                name: "Walk-in Customer",
                mobile: "",
            });
        }
    };

    // Handle received amount change
    const handleReceivedAmountChange = (e) => {
        const amount = parseFloat(e.target.value) || 0;
        setReceivedAmount(amount);
        setBalanceAmount(amount - grandTotal);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "LKR" }).format(amount);
    };

    // Handle printing
    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;

        // Create an invisible iframe to print without opening the print window
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;

        // Add the content and styles to the iframe's document
        iframeDoc.open();
        iframeDoc.write(`
        <html>
            <head>
                <style>
                    body {
                        font-family: "Arial", sans-serif;
                        font-size: 12px;
                        text-align: center;
                        margin: 1px;
                        padding: 0;
                        background-color: #fff;
                    }
                    .bill-header {
                        margin-bottom: 10px;
                    }
                    .shop-name {
                        font-size: 22px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #222;
                        margin-bottom: 0;
                    }
                    .shop-address {
                        font-size: 14px;
                        font-weight: normal;
                        color: #555;
                        margin-bottom: 2px;
                    }
                    .shop-contact {
                        font-size: 14px;
                        font-weight: normal;
                        color: #555;
                        margin-bottom: 2px;
                    }
                    .bill-info {
                        font-size: 10px;
                        color: #000;
                        margin-top: 0;
                        padding-top: 0;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    .bill-info div {
                        text-align: left;
                        gap-spacing: 10px;
                    }
                    .bill-info div:nth-child(odd) {
                        text-align: left;
                        margin-left: 10px;
                    }
                    .bill-info div:nth-child(even) {
                        text-align: left;
                    }
                    .divider {
                        margin: 0;
                    }
                    .bill-table {
                        padding: 2px;
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    .bill-table th,
                    .bill-table td {
                        font-size: 12px;
                        border-bottom: 1px dashed #000;
                        padding: 4px;
                        text-align: right;
                    }
                    .bill-table th {
                        background-color: #f5f5f5;
                        color: #000 !important;
                        font-weight: bold;
                        text-align: center;
                        border-bottom: 1px dashed #000;
                        border-top: 1px solid #000;
                    }
                    .bill-table td:nth-child(2) {
                        text-align: left;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .tr-name td {
                        border-bottom: none;
                    }
                    .tr-details td {
                        border-top: none;
                    }
                    .bill-summary {
                        text-align: right;
                        margin-top: 10px;
                        font-size: 14px;
                        padding-top: 6px;
                        border-top: 1px solid #000;
                    }
                    .bill-summary p {
                        margin: 6px 0;
                        font-weight: bold;
                    }
                    .total-amount {
                        font-size: 16px;
                        font-weight: bold;
                        color: #d32f2f;
                    }
                    .terms-conditions {
                        font-size: 11px;
                        text-align: left;
                        margin-top: 12px;
                        border-top: 1px solid #000;
                        padding-top: 2px;
                    }
                    .terms-conditions h4 {
                        font-weight: bold;
                        text-align: center;
                    }
                    .thanks {
                        font-size: 13px;
                        font-weight: bold;
                        margin:0;
                        color: #000;
                    }
                    .systemby {
                        font-size: 8px;
                        font-weight: bold;
                        margin: 0px;
                        color: #444;
                        padding: 0;
                    }
                    .systemby-web {
                        font-size: 10px;
                        font-style: italic;
                        color: #777;
                        padding: 0;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
        iframeDoc.close();

        // Trigger the print without opening the print window
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Cleanup the iframe after printing
        setTimeout(() => {
            document.body.removeChild(iframe);
            onClose(); // Close the modal after printing
        }, 500);
    };

    // Handle saving the bill


    const handleConfirmPrint = () => {
        if (paymentType !== "credit" && receivedAmount < grandTotal) {
            alert("Received amount cannot be less than the grand total.");
            return;
        }
        handleSave(); // Save the bill first
        handlePrint(); // Then print the bill

        // Show the "Bill saved successfully!" message
        setShowSuccessMessage(true);

        // Hide the message after 0.5 seconds
        setTimeout(() => {
            setShowSuccessMessage(false); // Corrected to hide the message
            window.location.reload(); // Refresh the window
        }, 500);
    };

    const handleConfirmSave = () => {
        setShowConfirmation(true); // Hide the confirmation dialog
        handleSave(); // Save the bill

        // Show the "Bill Saved" message
        // Hide the message after 0.5 seconds and close the modal
        setTimeout(() => {
            setShowBillSavedMessage(false);
            onClose(500); // Close the modal after 0.5 seconds
            window.location.reload(); // Refresh the window
        }, 500);
    };
    // Handle Enter key for better UX
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (e.target.tagName === "SELECT") {
                // Focus on the next input field after selecting a customer
                document.getElementById("receivedAmount").focus();
            } else if (e.target.id === "receivedAmount") {
                // Focus on the Save button after entering the received amount
                document.getElementById("saveButton").focus();
            }
        }
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-90">
            <div className="bg-white p-6 mt-16 text-xs inset-1 dark:text-gray-800 rounded-lg shadow-lg w-full max-w-6xl h-[80vh] overflow-y-auto flex flex-col relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                    ✖
                </button>

                <div className="flex flex-col md:flex-row justify-between mt-4">
                    {/* Customer Information */}
                    <div className="w-full md:w-1/2 pr-10">
                        {/* Select Customer */}
                        <label className="block font-bold mb-2">Select Customer</label>
                        <select
                            value={selectedCustomer?.id || ""}
                            onChange={handleCustomerChange}
                            onKeyDown={handleKeyDown}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select a customer</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.customer_name} - {customer.phone}
                                </option>
                            ))}
                        </select>

                        {/* Customer Info */}
                        <h2 className="pt-10 text-xl font-bold">Customer Information</h2>
                        <p><strong>Customer Name:</strong> {selectedCustomer?.name || "Walk-in Customer"}</p>
                        <p><strong>Mobile:</strong> {selectedCustomer?.mobile || ""}</p>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                        <p><strong>Bill No:</strong> {billNumber}</p>
                        {/* Payment Section */}
                        <div className="mt-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Payment Details</h3>

                            {/* Payment Type */}
                            <label className="block font-bold">Payment Type</label>
                            <select
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="online">Online</option>
                                <option value="cheque">Cheque</option>
                                <option value="credit">Credit</option>
                            </select>

                            {/* Received Amount */}
                            <label className="block font-bold mt-4">Received Amount</label>
                            <input
                                id="receivedAmount"
                                type="number"
                                className="w-full p-2 border text-black"
                                value={receivedAmount}
                                onChange={handleReceivedAmountChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>

                    {/* Billing Items */}
                    <div className="w-full md:w-1/2">
                        <h3 className="text-lg font-semibold border-b pb-2">Billing Items</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-800 mt-2">
                                <thead className="bg-white">
                                    <tr className="text-right">
                                        <th className="border text-black px-2 py-2 text-left">No.</th>
                                        <th className="border text-black px-2 py-2 text-left">Item Name</th>
                                        <th className="border text-black px-2 py-2 text-center">Qty</th>
                                        <th className="border text-black px-2 py-2 text-center">MRP</th>
                                        <th className="border text-black px-2 py-2 text-center">U.price</th>
                                        <th className="border text-black px-2 py-2 text-center">Dis</th>
                                        <th className="border text-black px-2 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialProducts.map((product, index) => (
                                        <tr key={index}>
                                            <td className="border px-3 py-2 text-left">{index + 1}</td>
                                            <td className="border px-3 py-2 text-left">{product.product_name}</td>
                                            <td className="border px-3 py-2 text-center">{product.qty}</td>
                                            <td className="border px-3 py-2 text-center">{product.mrp}</td>
                                            <td className="border px-3 py-2 text-center">{product.sales_price}</td>
                                            <td className="border px-3 py-2 text-center">{product.discount}</td>
                                            <td className="border px-3 py-2 text-right font-bold">
                                                {formatCurrency((product.mrp - product.discount) * product.qty)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Billing Summary */}
                        <div className="mt-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Billing Summary</h3>
                            <p><strong>Subtotal:</strong> {formatCurrency(grandTotal + initialBillDiscount)}</p>
                            <p><strong>Total Discount:</strong> {formatCurrency(totalItemDiscount + initialBillDiscount)}</p>
                            <p className="font-bold text-lg"><strong>Grand Total:</strong> {formatCurrency(grandTotal)}</p>
                        </div>
                    </div>
                </div>

                {/* Hidden Print Content */}
                <div className="hidden">
                    <div ref={printRef} className="print-container">
                        {/* Header */}
                        <div className="bill-header text-center">
                            <div className="shop-name font-bold text-xl uppercase">MUNSI TEX</div>
                            <div className="shop-address text-sm">MOSQUE BUILDING, POLICE ROAD</div>
                            <div className="shop-contact text-sm">Mob: 0769859513</div>
                            <hr className="border-t border-black my-1" />
                        </div>

                        {/* Bill Info */}
                        <div className="bill-info grid grid-cols-2 gap-2 text-xs mt-2">
                            <div><strong>Bill No:</strong> {initialCustomerInfo.bill_number}</div>                            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                            <div><strong>Customer:</strong> {selectedCustomer?.name || "Walk-in Customer"}</div>
                            <div><strong>Cashier:</strong> Admin</div>
                            <div><strong>Payment:</strong> {paymentType}</div>
                            <div>
                                <strong>Time:</strong> {new Date().toLocaleTimeString("en-IN", {
                                    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
                                })}
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="bill-table w-full border-collapse mt-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black px-2 py-1 text-left">S.No</th>
                                    <th className="border border-black px-2 py-1 text-left">Name</th>
                                    <th className="border border-black px-2 py-1 text-center">Qty</th>
                                    <th className="border border-black px-2 py-1 text-right">MRP</th>
                                    <th className="border border-black px-2 py-1 text-right">U.Price</th>
                                    <th className="border border-black px-2 py-1 text-right">U.Dis</th>
                                    <th className="border border-black px-2 py-1 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialProducts.map((product, index) => (
                                    <React.Fragment key={index}>
                                        {/* Item Name Row */}
                                        <tr className="tr-name">
                                            <td className="border border-black px-2 py-1 text-left">{index + 1}</td>
                                            <td className="border border-black px-2 py-1 text-left font-bold" colSpan="6">{product.product_name}</td>
                                        </tr>
                                        {/* Item Details Row */}
                                        <tr className="tr-details">
                                            <td className="border border-black px-2 py-1 text-left"></td>
                                            <td className="border border-black px-2 py-1 text-left"></td>
                                            <td className="border border-black px-2 py-1 text-center">{product.qty}</td>
                                            <td className="border border-black px-2 py-1 text-right">{product.mrp}</td>
                                            <td className="border border-black px--2 py-1 text-right">{product.sales_price}</td>
                                            <td className="border border-black px-2 py-1 text-right">{product.discount}</td>
                                            <td className="border border-black px-2 py-1 text-right font-bold">
                                                {((product.mrp - product.discount) * product.qty)}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>

                        {/* Summary Section */}
                        <div className="bill-summary text-right text-sm mt-2">
                            <p><strong>Subtotal:</strong> {formatCurrency(grandTotal + initialBillDiscount)}</p>
                            <p><strong>Discount:</strong> {formatCurrency(totalItemDiscount + initialBillDiscount)}</p>
                            <p className="font-bold text-lg"><strong>Grand Total:</strong> {formatCurrency(grandTotal)}</p>
                            <p><strong>Received:</strong> {formatCurrency(receivedAmount)}</p>
                            <p><strong>Balance:</strong> {formatCurrency(balanceAmount)}</p>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="terms-conditions text-left text-xs mt-2">
                            <h4 className="font-bold text-center">Terms and Conditions</h4>
                            <p>
                                - Goods once sold cannot be returned. <br />
                                - Please keep the bill for future reference. <br />
                                - Exchange is allowed within 7 days with original bill. <br />
                                - No refunds, only exchange for unused items. <br />
                            </p>
                        </div>

                        {/* Thank You Message */}
                        <p className="thanks text-center font-semibold mt-2">Thank You! Visit Again.</p>

                        {/* Branding */}
                        <p className="systemby">System by IMSS</p>
                        <p className="systemby-web ">visit🔗: www.imss.lk</p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4 mt-4">
                    <button
                        id="saveButton"
                        onClick={() => setShowConfirmation(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>

                {/* Confirmation Modal */}
                {showConfirmation && (
                    <div className="absolute inset-0 flex items-center text-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            {/* Balance Amount */}
                            <p className=" mb-5 text-2xl justify-center font-bold "><strong>Balance:</strong>
                                <span className={balanceAmount >= 0 ? "text-green-600" : "text-red-600"}>
                                    {formatCurrency(balanceAmount)}
                                </span>
                            </p>
                            <p className="text-lg font-bold">Do you want to print the bill?</p>
                            <div className="flex justify-end gap-4 mt-4">
                                <button onClick={handleConfirmSave} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-700">No, Just Save</button>
                                <button onClick={handleConfirmPrint} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700">Yes, Print</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {showSuccessMessage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p className="text-lg font-bold">Bill saved successfully!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillPrintModal;
