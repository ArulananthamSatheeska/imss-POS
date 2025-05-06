import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useRegister } from "../../context/RegisterContext";

const BillPrintModal = ({
  initialProducts = [],
  initialBillDiscount = 0,
  initialTax = 0,
  initialShipping = 0,
  initialTotals = {},
  grandTotal = 0,
  totalItemDiscount = 0,
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
  const [paymentType, setPaymentType] = useState("cash");
  const [companyDetails, setCompanyDetails] = useState({
    company_name: "SHARVAKSHA FOOD CITY",
    business_address: "Main Street Thambiluvil-01",
    contact_number: "0750296343",
  });

  // Customer creation state
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    nic_number: "",
    is_credit_customer: false,
  });
  const [customerErrors, setCustomerErrors] = useState({});

  // Refs for focus management
  const customerSelectRef = useRef(null);
  const receivedAmountRef = useRef(null);
  const saveButtonRef = useRef(null);
  const printButtonRef = useRef(null);
  const saveOnlyButtonRef = useRef(null);
  const newCustomerNameRef = useRef(null);

  // Fetch customers and company details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersResponse = await axios.get(
          "http://127.0.0.1:8000/api/customers"
        );
        setCustomers(customersResponse.data.data);

        // Fetch company details
        const companyResponse = await axios.get(
          "http://127.0.0.1:8000/api/company-details"
        );
        if (companyResponse.data) {
          setCompanyDetails({
            company_name:
              companyResponse.data.company_name || companyDetails.company_name,
            business_address:
              companyResponse.data.business_address ||
              companyDetails.business_address,
            contact_number:
              companyResponse.data.contact_number ||
              companyDetails.contact_number,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Focus customer select on modal open
  useEffect(() => {
    if (customerSelectRef.current) {
      customerSelectRef.current.focus();
    }
  }, []);

  // Focus print button when confirmation shows
  useEffect(() => {
    if (showConfirmation && printButtonRef.current) {
      printButtonRef.current.focus();
    }
  }, [showConfirmation]);

  // Calculate totals
  // Commented out to use passed initialTotals prop instead
  // const calculateTotals = () => {
  //   let totalQty = 0;
  //   let subTotalMRP = 0;
  //   let totalItemDiscounts = 0;
  //   let totalSpecialDiscounts = 0;
  //   let grandTotalBeforeAdjustments = 0;

  //   initialProducts.forEach((p) => {
  //     const qty = parseFloat(p.qty || 0);
  //     const mrp = parseFloat(p.mrp || 0);
  //     const unitDiscount = parseFloat(p.discount || 0);
  //     const unitPrice = parseFloat(p.price || 0);
  //     const specialDiscount = parseFloat(p.specialDiscount || 0);

  //     totalQty += qty;
  //     subTotalMRP += mrp * qty;
  //     totalItemDiscounts += unitDiscount * qty;
  //     totalSpecialDiscounts += specialDiscount;
  //     grandTotalBeforeAdjustments += unitPrice * qty - specialDiscount;
  //   });

  //   const taxRate = parseFloat(initialTax || 0);
  //   const billDiscount = parseFloat(initialBillDiscount || 0);
  //   const shipping = parseFloat(initialShipping || 0);
  //   const taxAmount = grandTotalBeforeAdjustments * (taxRate / 100);
  //   const finalTotalDiscount =
  //     totalItemDiscounts + totalSpecialDiscounts + billDiscount;
  //   const finalTotal =
  //     grandTotalBeforeAdjustments + taxAmount - billDiscount + shipping;

  //   return {
  //     totalQty,
  //     subTotalMRP,
  //     totalItemDiscounts,
  //     totalSpecialDiscounts,
  //     totalBillDiscount: billDiscount,
  //     finalTotalDiscount,
  //     taxAmount,
  //     grandTotalBeforeAdjustments,
  //     finalTotal,
  //   };
  // };

  const totals = initialTotals || {};

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const id = e.target.value;
    const customer = customers.find((cust) => cust.id == id);
    if (customer) {
      setSelectedCustomer({
        ...customer,
        name: customer.customer_name,
        mobile: customer.phone,
        is_credit_customer: customer.is_credit_customer,
      });
    } else {
      setSelectedCustomer({
        name: "Walk-in Customer",
        mobile: "",
        bill_number: billNumber,
        is_credit_customer: false,
      });
    }
  };

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
    // Validate credit customer requirement
    if (paymentType === "credit") {
      if (!selectedCustomer?.id) {
        alert("Please select a customer for credit sales.");
        return;
      }
      // Removed check for is_credit_customer to allow all customers
      // if (!selectedCustomer.is_credit_customer) {
      //   alert("The selected customer is not approved for credit purchases.");
      //   return;
      // }
    }

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
        quantity: parseFloat(product.qty),
        mrp: parseFloat(product.mrp || 0),
        unit_price: parseFloat(product.price || 0),
        discount: parseFloat(product.discount || 0),
        special_discount: parseFloat(product.specialDiscount || 0),
        total: parseFloat(
          (
            product.price * product.qty -
            (product.specialDiscount || 0)
          ).toFixed(2)
        ),
      })),
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/sales",
        billData,
        getAuthHeaders()
      );
      console.log("Bill saved successfully:", response.data);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose(true);
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(
        "Error saving bill:",
        error.response?.data || error.message
      );
      alert(
        `Failed to save bill: ${error.response?.data?.message || error.message}`
      );
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
    if (paymentType === "credit") {
      if (!selectedCustomer?.id) {
        alert("Please select a customer for credit sales.");
        return;
      }
      // Removed check for is_credit_customer to allow all customers
      // if (!selectedCustomer.is_credit_customer) {
      //   alert("The selected customer is not approved for credit purchases.");
      //   return;
      // }
    }

    if (paymentType !== "credit" && receivedAmount < totals.finalTotal) {
      alert("Received amount cannot be less than the grand total.");
      return;
    }

    handleSave();
    handlePrint();
  };

  const handleConfirmSave = () => {
    if (paymentType === "credit") {
      if (!selectedCustomer?.id) {
        alert("Please select a customer for credit sales.");
        return;
      }
      // Removed check for is_credit_customer to allow all customers
      // if (!selectedCustomer.is_credit_customer) {
      //   alert("The selected customer is not approved for credit purchases.");
      //   return;
      // }
    }

    setShowConfirmation(false);
    handleSave();
  };

  // Handle new customer form
  const handleNewCustomerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCustomer({
      ...newCustomer,
      [name]: type === "checkbox" ? checked : value,
    });
    setCustomerErrors({ ...customerErrors, [name]: "" });
  };

  const validateNewCustomer = () => {
    const errors = {};
    if (!newCustomer.name.trim()) {
      errors.name = "Customer name is required";
    }
    if (!newCustomer.mobile.trim()) {
      errors.mobile = "Phone number is required";
    }
    if (!newCustomer.nic_number.trim()) {
      errors.nic_number = "NIC number is required";
    }
    return errors;
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const validationErrors = validateNewCustomer();
    if (Object.keys(validationErrors).length > 0) {
      setCustomerErrors(validationErrors);
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/customers",
        {
          customer_name: newCustomer.name,
          phone: newCustomer.mobile,
          nic_number: newCustomer.nic_number,
          is_credit_customer: newCustomer.is_credit_customer,
        },
        getAuthHeaders()
      );

      // Refresh customers list
      const customersResponse = await axios.get(
        "http://127.0.0.1:8000/api/customers"
      );
      setCustomers(customersResponse.data.data);

      // Select the new customer
      setSelectedCustomer({
        id: response.data.id,
        name: response.data.customer_name,
        mobile: response.data.phone,
        is_credit_customer: response.data.is_credit_customer,
      });

      // Reset form
      setNewCustomer({
        name: "",
        mobile: "",
        nic_number: "",
        is_credit_customer: false,
      });
      setShowAddCustomerForm(false);
      setCustomerErrors({});
    } catch (error) {
      console.error("Error adding customer:", error);
      alert(
        `Failed to add customer: ${error.response?.data?.message || error.message}`
      );
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
        if (e.target.tagName === "SELECT" && e.target.id === "customerSelect") {
          receivedAmountRef.current?.focus();
        } else if (e.target.id === "receivedAmount") {
          if (!receivedAmount || receivedAmount === 0) {
            setShowConfirmation(true);
          } else {
            saveButtonRef.current?.focus();
          }
        }
        break;
      case "ArrowLeft":
        if (
          showConfirmation &&
          document.activeElement === printButtonRef.current
        ) {
          saveOnlyButtonRef.current?.focus();
        }
        break;
      case "ArrowRight":
        if (
          showConfirmation &&
          document.activeElement === saveOnlyButtonRef.current
        ) {
          printButtonRef.current?.focus();
        }
        break;
      case "Escape":
        if (showConfirmation) {
          setShowConfirmation(false);
        } else if (showAddCustomerForm) {
          setShowAddCustomerForm(false);
        }
        break;
      default:
        break;
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-y-auto flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <button
          onClick={() => onClose(false)}
          className="absolute p-2 text-gray-500 rounded-full top-4 right-4 hover:bg-gray-100 hover:text-black"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex flex-col justify-between p-6 md:flex-row gap-6">
          {/* Left Column - Customer Info */}
          <div className="w-full space-y-6 md:w-1/2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Select Customer
                </label>
                <button
                  onClick={() => {
                    setShowAddCustomerForm(!showAddCustomerForm);
                    if (!showAddCustomerForm && newCustomerNameRef.current) {
                      setTimeout(() => newCustomerNameRef.current.focus(), 100);
                    }
                  }}
                  className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {showAddCustomerForm ? "Cancel" : "+ Add Customer"}
                </button>
              </div>

              {showAddCustomerForm ? (
                <form
                  onSubmit={handleAddCustomer}
                  className="p-4 space-y-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      ref={newCustomerNameRef}
                      type="text"
                      name="name"
                      value={newCustomer.name}
                      onChange={handleNewCustomerChange}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={newCustomer.mobile}
                      onChange={handleNewCustomerChange}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      NIC Number
                    </label>
                    <input
                      type="text"
                      name="nic_number"
                      value={newCustomer.nic_number}
                      onChange={handleNewCustomerChange}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Save Customer
                  </button>
                </form>
              ) : (
                <select
                  ref={customerSelectRef}
                  id="customerSelect"
                  value={selectedCustomer?.id || ""}
                  onChange={handleCustomerChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_name} - {customer.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="p-4 space-y-2 bg-gray-50 rounded-md">
              <h2 className="text-xl font-bold text-gray-800">
                Customer Information
              </h2>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Name:</span>{" "}
                  <span className="text-gray-700">
                    {selectedCustomer?.name || "Walk-in Customer"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Mobile:</span>{" "}
                  <span className="text-gray-700">
                    {selectedCustomer?.mobile || "N/A"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date:</span>{" "}
                  <span className="text-gray-700">
                    {new Date().toLocaleDateString()}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Bill No:</span>{" "}
                  <span className="text-gray-700">{billNumber}</span>
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 bg-gray-50 rounded-md">
              <h3 className="text-lg font-semibold text-gray-800">
                Payment Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Received Amount
                </label>
                <input
                  id="receivedAmount"
                  ref={receivedAmountRef}
                  type="number"
                  step="0.01"
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={receivedAmount}
                  onChange={handleReceivedAmountChange}
                />
              </div>

              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="text-sm">
                  <span className="font-medium">Balance:</span>{" "}
                  <span
                    className={
                      balanceAmount >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {formatCurrency(balanceAmount)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Billing Items */}
          <div className="w-full space-y-6 md:w-1/2">
            <div className="p-4 space-y-3 bg-gray-50 rounded-md">
              <h3 className="text-lg font-semibold text-gray-800">
                Billing Items
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                        No.
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                        Item Name
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        MRP
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        U.Price
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        U.Dis
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        Sp.Dis
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-700 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {initialProducts.map((product, index) => (
                      <tr key={product.product_id + "-" + index}>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {product.product_name}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                          {product.qty}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                          {formatCurrency(product.mrp)}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                          {formatCurrency(product.discount)}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                          {formatCurrency(product.specialDiscount || 0)}
                        </td>
                        <td className="px-3 py-2 text-sm font-semibold text-right text-gray-700 whitespace-nowrap">
                          {formatCurrency(product.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 space-y-2 bg-gray-50 rounded-md">
              <h3 className="text-lg font-semibold text-gray-800">
                Billing Summary
              </h3>
              <div className="space-y-1">
                <p className="flex justify-between text-sm">
                  <span>Subtotal (MRP):</span>
                  <span>{formatCurrency(totals.subTotalMRP)}</span>
                </p>
                <p className="flex justify-between text-sm">
                  <span>Item Discounts:</span>
                  <span>{formatCurrency(totals.totalItemDiscounts)}</span>
                </p>
                <p className="flex justify-between pt-2 mt-2 text-base font-bold border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">
                    {formatCurrency(totals.finalTotal)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 flex justify-end p-4 bg-white border-t border-gray-200">
          <button
            ref={saveButtonRef}
            onClick={() => setShowConfirmation(true)}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Bill
          </button>
        </div>

        {/* Hidden Print Content */}

        {/* Hidden Print Content */}
        <div className="hidden">
          <div ref={printRef} className="print-container">
            {/* Header */}
            <div className="bill-header text-center">
              <div className="shop-name font-bold text-xl uppercase">
                MUNSI TEX
              </div>
              <div className="shop-address text-sm">
                MOSQUE BUILDING, POLICE ROAD
              </div>
              <div className="shop-contact text-sm">Mob: 0769859513</div>
              <hr className="border-t border-black my-1" />
            </div>

            {/* Bill Info */}
            <div className="bill-info grid grid-cols-2 gap-2 text-xs mt-2">
              <div>
                <strong>Bill No:</strong> {initialCustomerInfo.bill_number}
              </div>{" "}
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

            {/* Items Table */}
            <table className="bill-table w-full border-collapse mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1 text-left">
                    S.No
                  </th>
                  <th className="border border-black px-2 py-1 text-left">
                    Name
                  </th>
                  <th className="border border-black px-2 py-1 text-center">
                    Qty
                  </th>
                  <th className="border border-black px-2 py-1 text-right">
                    MRP
                  </th>
                  <th className="border border-black px-2 py-1 text-right">
                    U.Price
                  </th>
                  <th className="border border-black px-2 py-1 text-right">
                    U.Dis
                  </th>
                  <th className="border border-black px-2 py-1 text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialProducts.map((product, index) => (
                  <React.Fragment key={index}>
                    {/* Item Name Row */}
                    <tr className="tr-name">
                      <td className="border border-black px-2 py-1 text-left">
                        {index + 1}
                      </td>
                      <td
                        className="border border-black px-2 py-1 text-left font-bold"
                        colSpan="6"
                      >
                        {product.product_name}
                      </td>
                    </tr>
                    {/* Item Details Row */}
                    <tr className="tr-details">
                      <td className="border border-black px-2 py-1 text-left"></td>
                      <td className="border border-black px-2 py-1 text-left"></td>
                      <td className="border border-black px-2 py-1 text-center">
                        {product.qty}
                      </td>
                      <td className="border border-black px-2 py-1 text-right">
                        {product.mrp}
                      </td>
                      <td className="border border-black px-2 py-1 text-right">
                        {product.price}
                      </td>
                      <td className="border border-black px-2 py-1 text-right">
                        {product.discount}
                      </td>
                      <td className="border border-black px-2 py-1 text-right font-bold">
                        {(product.mrp - product.discount) * product.qty}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Summary Section */}
            <div className="bill-summary text-right text-sm mt-2">
              <p>
                <strong>Subtotal:</strong>{" "}
                {formatCurrency(totals.subTotalMRP || 0)}
              </p>
              <p>
                <strong>Discount:</strong>{" "}
                {formatCurrency(
                  (totals.totalItemDiscounts || 0) +
                    (totals.totalSpecialDiscounts || 0) +
                    (initialBillDiscount || 0)
                )}
              </p>
              <p className="font-bold text-lg">
                <strong>Grand Total:</strong>{" "}
                {formatCurrency(totals.finalTotal || 0)}
              </p>
              <p>
                <strong>Received:</strong> {formatCurrency(receivedAmount)}
              </p>
              <p>
                <strong>Balance:</strong> {formatCurrency(balanceAmount)}
              </p>
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
            <p className="thanks text-center font-semibold mt-2">
              Thank You! Visit Again.
            </p>

            {/* Branding */}
            <p className="systemby">System by IMSS</p>
            <p className="systemby-web ">visit🔗: www.imss.lk</p>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Confirm Bill
              </h3>

              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  The bill total is{" "}
                  <span className="font-bold">
                    {formatCurrency(totals.finalTotal)}
                  </span>
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Balance:</span>{" "}
                  <span
                    className={
                      balanceAmount >= 0
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {formatCurrency(balanceAmount)}
                  </span>
                </p>
                <p className="mt-4 text-sm font-medium text-gray-700">
                  Do you want to print the bill?
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  ref={saveOnlyButtonRef}
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  No, Just Save
                </button>
                <button
                  ref={printButtonRef}
                  type="button"
                  onClick={handleConfirmPrint}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Yes, Print
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Bill Saved Successfully!
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    The bill has been saved to the database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillPrintModal;
