import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useRegister } from "../../context/RegisterContext";

const BillPrintModal = ({
  initialProducts = [],
  initialBillDiscount = 0,
  initialTax = 0,
  initialShipping = 0,
  initialTotals = {},
  initialCustomerInfo = { name: "", mobile: "", bill_number: "", userId: "" },
  saleType = "Retail",
  onClose,
}) => {
  const { getAuthHeaders } = useRegister();
  const [billNumber, setBillNumber] = useState(initialCustomerInfo.bill_number);
  const printRef = useRef(null);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomerInfo);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch customers from the backend
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8080/api/customers");
        setCustomers(response.data.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // Calculate totals aligned with POSForm.jsx
  const calculateTotals = () => {
    let totalQty = 0;
    let subTotalMRP = 0;
    let totalItemDiscounts = 0;
    let totalSpecialDiscounts = 0;
    let grandTotalBeforeAdjustments = 0;

    initialProducts.forEach((p) => {
      const qty = parseFloat(p.qty || 0);
      const mrp = parseFloat(p.mrp || 0);
      const unitDiscount = parseFloat(p.discount || 0);
      const unitPrice = parseFloat(p.price || 0);
      const specialDiscount = parseFloat(p.specialDiscount || 0);

      totalQty += qty;
      subTotalMRP += mrp * qty;
      totalItemDiscounts += unitDiscount * qty;
      totalSpecialDiscounts += specialDiscount;
      grandTotalBeforeAdjustments += unitPrice * qty - specialDiscount;
    });

    const taxRate = parseFloat(initialTax || 0);
    const billDiscount = parseFloat(initialBillDiscount || 0);
    const shipping = parseFloat(initialShipping || 0);
    const taxAmount = grandTotalBeforeAdjustments * (taxRate / 100);
    const finalTotalDiscount = totalItemDiscounts + totalSpecialDiscounts + billDiscount;
    const finalTotal = grandTotalBeforeAdjustments + taxAmount - billDiscount + shipping;

    return {
      totalQty,
      subTotalMRP,
      totalItemDiscounts,
      totalSpecialDiscounts,
      totalBillDiscount: billDiscount,
      finalTotalDiscount,
      taxAmount,
      grandTotalBeforeAdjustments,
      finalTotal,
    };
  };

  const totals = calculateTotals();

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const id = e.target.value;
    const customer = customers.find((cust) => cust.id == id);
    if (customer) {
      setSelectedCustomer({
        ...customer,
        name: customer.customer_name,
        mobile: customer.phone,
      });
    } else {
      setSelectedCustomer({
        name: "Walk-in Customer",
        mobile: "",
        bill_number: billNumber,
      });
    }
  };

  const [companyDetails, setCompanyDetails] = useState({
    company_name: "Company Name ",
    business_address: "Address",
    contact_number: "0771234567"
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8080/api/company-details");
        if (response.data) {
          setCompanyDetails({
            company_name: response.data.company_name || "",
            business_address: response.data.business_address || "",
            contact_number: response.data.contact_number || ""
          });
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
        // Fallback to default values if API fails
        setCompanyDetails({
          company_name: "SHARVAKSHA FOOD CITY",
          business_address: "Main Street Thambiluvil-01",
          contact_number: "0750296343"
        });
      }
    };

    fetchCompanyDetails();
  }, []);

  // Handle received amount change
  const handleReceivedAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setReceivedAmount(amount);
    setBalanceAmount(amount - totals.finalTotal);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle saving the bill
  const handleSave = async () => {
    const billData = {
      bill_number: billNumber,
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.name || "Walk-in Customer",
      subtotal: parseFloat(totals.subTotalMRP.toFixed(2)),
      discount: parseFloat(totals.finalTotalDiscount.toFixed(2)),
      tax: parseFloat(totals.taxAmount.toFixed(2)),
      shipping: parseFloat(initialShipping || 0),
      total: parseFloat(totals.finalTotal.toFixed(2)),
      payment_type: paymentType,
      received_amount: parseFloat(receivedAmount.toFixed(2)),
      balance_amount: parseFloat(balanceAmount.toFixed(2)),
      sale_type: saleType,
      items: initialProducts.map((product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: parseInt(product.qty, 10),
        mrp: parseFloat(product.mrp || 0),
        unit_price: parseFloat(product.price || 0),
        discount: parseFloat(product.discount || 0),
        special_discount: parseFloat(product.specialDiscount || 0),
        total: parseFloat((product.price * product.qty - (product.specialDiscount || 0)).toFixed(2)),
      })),
    };

    try {
      const response = await axios.post("http://127.0.0.1:8080/api/sales", billData, getAuthHeaders());
      console.log("Bill saved successfully:", response.data);
      setReceivedAmount(0);
      setBalanceAmount(0);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose(true); // Indicate sale was saved
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error saving bill:", error.response?.data || error.message);
      alert(`Failed to save bill: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle printing
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
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
            .shop-address, .shop-contact {
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
            }
            .bill-info div:nth-child(odd) {
              margin-left: 10px;
            }
            .bill-table {
              padding: 2px;
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .bill-table th, .bill-table td {
              font-size: 12px;
              border-bottom: 1px dashed #000;
              padding: 4px;
              text-align: right;
            }
            .bill-table th {
              background-color: #f5f5f5;
              color: #000;
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
              margin: 0;
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

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };

  // Handle confirm actions
  const handleConfirmPrint = () => {
    if (paymentType !== "credit" && receivedAmount < totals.finalTotal) {
      alert("Received amount cannot be less than the grand total.");
      return;
    }
    handleSave();
    handlePrint();
  };

  const handleConfirmSave = () => {
    setShowConfirmation(false);
    handleSave();
  };

  // Handle Enter key for UX
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.tagName === "SELECT") {
        document.getElementById("receivedAmount").focus();
      } else if (e.target.id === "receivedAmount") {
        document.getElementById("saveButton").focus();
      }
    }
  };

  const [paymentType, setPaymentType] = useState("cash");

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-90">
      <div className="bg-white p-6 mt-16 text-xs inset-1 dark:text-gray-800 rounded-lg shadow-lg w-full max-w-6xl h-[80vh] overflow-y-auto flex flex-col relative">
        <button
          onClick={() => onClose(false)}
          className="absolute text-gray-500 top-4 right-4 hover:text-black"
        >
          ✖
        </button>

        <div className="flex flex-col justify-between mt-4 md:flex-row">
          {/* Customer Information */}
          <div className="w-full pr-10 md:w-1/2">
            <label className="block mb-2 font-bold">Select Customer</label>
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

            <h2 className="pt-10 text-xl font-bold">Customer Information</h2>
            <p>
              <strong>Customer Name:</strong>{" "}
              {selectedCustomer?.name || "Walk-in Customer"}
            </p>
            <p>
              <strong>Mobile:</strong> {selectedCustomer?.mobile || ""}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
            <p>
              <strong>Bill No:</strong> {billNumber}
            </p>

            <div className="pt-4 mt-4 border-t">
              <h3 className="text-lg font-semibold">Payment Details</h3>
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

              <label className="block mt-4 font-bold">Received Amount</label>
              <input
                id="receivedAmount"
                type="number"
                step="0.01"
                className="w-full p-2 text-black border"
                value={receivedAmount}
                onChange={handleReceivedAmountChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Billing Items */}
          <div className="w-full md:w-1/2">
            <h3 className="pb-2 text-lg font-semibold border-b">Billing Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full mt-2 border border-gray-800">
                <thead className="bg-white">
                  <tr className="text-right">
                    <th className="px-2 py-2 text-left text-black border">No.</th>
                    <th className="px-2 py-2 text-left text-black border">Item Name</th>
                    <th className="px-2 py-2 text-center text-black border">Qty</th>
                    <th className="px-2 py-2 text-center text-black border">MRP</th>
                    <th className="px-2 py-2 text-center text-black border">U.Price</th>
                    <th className="px-2 py-2 text-center text-black border">U.Dis</th>
                    <th className="px-2 py-2 text-center text-black border">Sp.Dis</th>
                    <th className="px-2 py-2 text-right text-black border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {initialProducts.map((product, index) => (
                    <tr key={product.product_id + "-" + index}>
                      <td className="px-3 py-2 text-left border">{index + 1}</td>
                      <td className="px-3 py-2 text-left border">{product.product_name}</td>
                      <td className="px-3 py-2 text-center border">{product.qty}</td>
                      <td className="px-3 py-2 text-center border">{formatCurrency(product.mrp)}</td>
                      <td className="px-3 py-2 text-center border">{formatCurrency(product.price)}</td>
                      <td className="px-3 py-2 text-center border">{formatCurrency(product.discount)}</td>
                      <td className="px-3 py-2 text-center border">{formatCurrency(product.specialDiscount || 0)}</td>
                      <td className="px-3 py-2 font-bold text-right border">
                        {formatCurrency(product.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-4 mt-4 border-t">
              <h3 className="text-lg font-semibold">Billing Summary</h3>
              <p>
                <strong>Subtotal (MRP):</strong> {formatCurrency(totals.subTotalMRP)}
              </p>
              <p>
                <strong>Item Discounts:</strong> {formatCurrency(totals.totalItemDiscounts)}
              </p>
              <p className="text-lg font-bold">
                <strong>Grand Total:</strong> {formatCurrency(totals.finalTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Hidden Print Content */}
        <div className="hidden">
          <div ref={printRef} className="print-container">
            <div className="text-center bill-header">
              <div className="text-center bill-header">
                <div className="shop-name">{companyDetails.company_name}</div>
                <div className="shop-address">{companyDetails.business_address}</div>
                <div className="shop-contact">Mob: {companyDetails.contact_number}</div>
                <hr className="my-1 border-t border-black" />
              </div>
              <hr className="my-1 border-t border-black" />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-xs bill-info">
              <div>
                <strong>Bill No:</strong> {billNumber}
              </div>
              <div>
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </div>
              <div>
                <strong>Customer:</strong>{" "}
                {selectedCustomer?.name || "Walk-in Customer"}
              </div>
              <div>
                <strong>Cashier:</strong> Admin
              </div>
              <div>
                <strong>Payment:</strong> {paymentType}
              </div>
              <div>
                <strong>Time:</strong>{" "}
                {new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            <table className="w-full mt-2 border-collapse bill-table">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left border border-black">S.No</th>
                  <th className="px-2 py-1 text-left border border-black">Name</th>
                  <th className="px-2 py-1 text-center border border-black">Qty</th>
                  <th className="px-2 py-1 text-right border border-black">MRP</th>
                  <th className="px-2 py-1 text-right border border-black">U.Price</th>
                  <th className="px-2 py-1 text-right border border-black">U.Dis</th>
                  <th className="px-2 py-1 text-right border border-black">Sp.Dis</th>
                  <th className="px-2 py-1 text-right border border-black">Total</th>
                </tr>
              </thead>
              <tbody>
                {initialProducts.map((product, index) => (
                  <React.Fragment key={product.product_id + "-" + index}>
                    <tr className="tr-name">
                      <td className="px-2 py-1 text-left border border-black">{index + 1}</td>
                      <td
                        className="px-2 py-1 font-bold text-left border border-black"
                        colSpan="7"
                      >
                        {product.product_name}
                      </td>
                    </tr>
                    <tr className="tr-details">
                      <td className="px-2 py-1 text-left border border-black"></td>
                      <td className="px-2 py-1 text-left border border-black"></td>
                      <td className="px-2 py-1 text-center border border-black">{product.qty}</td>
                      <td className="px-2 py-1 text-right border border-black">{product.mrp}</td>
                      <td className="px-2 py-1 text-right border border-black">{product.price}</td>
                      <td className="px-2 py-1 text-right border border-black">{product.discount}</td>
                      <td className="px-2 py-1 text-right border border-black">{product.specialDiscount || 0}</td>
                      <td className="px-2 py-1 font-bold text-right border border-black">
                        {product.total.toFixed(2)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="mt-2 text-sm text-right bill-summary">
              <p>
                <strong>Subtotal:</strong> {totals.subTotalMRP.toFixed(2)}
              </p>
              <p>
                <strong>Item Discounts:</strong> {totals.totalItemDiscounts.toFixed(2)}
              </p>

              <p className="total-amount">
                <strong>Grand Total:</strong> {totals.finalTotal.toFixed(2)}
              </p>
              <p>
                <strong>Received:</strong> {receivedAmount.toFixed(2)}
              </p>
              <p>
                <strong>Balance:</strong> {balanceAmount.toFixed(2)}
              </p>
            </div>

            <div className="mt-2 text-xs text-left terms-conditions">
              <h4 className="font-bold text-center">Terms and Conditions</h4>
              <p>
                - Goods once sold cannot be returned. <br />
                - Please keep the bill for future reference. <br />
                - Exchange is allowed within 7 days with original bill. <br />
                - No refunds, only exchange for unused items. <br />
              </p>
            </div>

            <p className="mt-2 font-semibold text-center thanks">
              Thank You! Visit Again.
            </p>
            <p className="systemby">System by IMSS</p>
            <p className="systemby-web">visit🔗: www.imss.lk</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <button
            id="saveButton"
            onClick={() => setShowConfirmation(true)}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>

        {showConfirmation && (
          <div className="absolute inset-0 flex items-center justify-center text-center bg-black bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <p className="justify-center mb-5 text-2xl font-bold">
                <strong>Balance:</strong>
                <span className={balanceAmount >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(balanceAmount)}
                </span>
              </p>
              <p className="text-lg font-bold">Do you want to print the bill?</p>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handleConfirmSave}
                  className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-700"
                >
                  No, Just Save
                </button>
                <button
                  onClick={handleConfirmPrint}
                  className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-700"
                >
                  Yes, Print
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <p className="text-lg font-bold">Bill saved successfully!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillPrintModal;