import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useRegister } from "../../context/RegisterContext";
import logo from "./MUNSI.png";

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
    company_name: "MUNSI TEX",
    business_address: "MOSQUE BUILDING, POLICE ROAD, KALMUNAI",
    contact_number: "076 731 78 51, 074 301 43 57",
  });

  // Added products state to allow editing discounts
  const [products, setProducts] = useState(() =>
    initialProducts.map((p) => ({
      ...p,
    }))
  );

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
          "https://imssposerp.com/backend/public/api/customers"
        );
        setCustomers(customersResponse.data.data);

        // Fetch company details
        const companyResponse = await axios.get(
          "https://imssposerp.com/backend/public/api/company-details"
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
  // Removed internal totals calculation to rely on passed initialTotals prop
  // const calculateTotals = () => {
  //   // Removed
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
    if (paymentType === "credit") {
      if (!selectedCustomer?.id) {
        alert("Please select a customer for credit sales.");
        return;
      }
    }

    // Use the existing totals object instead of calculateTotals function
    const currentTotals = totals;

    const billData = {
      bill_number: billNumber,
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.name || "Walk-in Customer",
      subtotal: parseFloat((currentTotals.subTotal || 0).toFixed(2)),
      discount: parseFloat(
        (
          (currentTotals.totalItemDiscounts || 0) +
          (currentTotals.totalSpecialDiscounts || 0) +
          (currentTotals.totalBillDiscount || 0)
        ).toFixed(2)
      ),
      tax: parseFloat((currentTotals.taxAmount || 0).toFixed(2)),
      shipping: parseFloat(initialShipping || 0),
      total: parseFloat((currentTotals.finalTotal || 0).toFixed(2)),
      payment_type: paymentType,
      received_amount: parseFloat(receivedAmount.toFixed(2)),
      balance_amount: parseFloat(
        (receivedAmount - (currentTotals.finalTotal || 0)).toFixed(2)
      ),
      sale_type: saleType,
      items: products.map((product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: parseFloat(product.qty),
        mrp: parseFloat(product.mrp || 0),
        unit_price: parseFloat(product.price || 0),
        discount: parseFloat(product.discount || 0),
        special_discount: parseFloat(product.specialDiscount || 0),
        total: parseFloat(product.total || 0),
        supplier: product.supplier || "N/A",
        category: product.category_name || "N/A",
        store_location: product.store_location || "N/A",
      })),
    };

    try {
      const response = await axios.post(
        "https://imssposerp.com/backend/public/api/sales",
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
    iframe.style.left = "-1000px"; // Move off-screen
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <html>
  <head>
    <title>Receipt Print</title>
    <style>
      /* Reset and base styles */
      * {
        marginright: 2px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: "calibri", sans-serif;
        font-size: 12px;
        width: 95%; /* Thermal printer width */
        margin: 0;
        padding: 2mm; /* Reduced from auto to 2mm */
        color: #000;
        background: white;
      }
      
      /* Header styles */
      .bill-header {
        margin-bottom: 3px;
        text-align: center;
      }
      .bill-header img {
        max-width: 60mm; /* Reduced from 70mm */
        height: auto;
        margin: 0 auto 3px auto;
      }
      .shop-name {
        font-size: 20px; 
        font-weight: bold;
        margin-bottom: 2px;
        font-family: "Cressida", Elephant, cursive;
      }
      .shop-name-tamil {
        font-size: 16px; /* Reduced from 18px */
        font-weight: bold;
        margin-bottom: 2px;
        font-family: "BAMINI-Tamil18", Elephant;
      }
      .shop-address {
        font-size: 13px; /* Reduced from 15px */
        margin-bottom: 2px;
      }
      .shop-contact {
        font-size: 12px; /* Reduced from 14px */
        margin-bottom: 3px;
      }
      
      /* Bill info grid */
      .bill-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px; /* Reduced from 2px */
        font-size: 12px;
        margin-bottom: 3px; /* Reduced from 5px */
        padding: 0; /* Added slight side padding */
      }
      .bill-info div:nth-child(even) {
        text-align: right;
      }
      
      /* Table styles */
      table {
        width: 100%;
        margin: 5px 0; /* Reduced from 5px */
        font-size: 12px; /* Reduced from 14px */
      }
      th, td {
        padding: 1px 0.5px; /* Reduced padding */
      }
      th {
        border-bottom: 1px solid #000;
        border-top: 1px solid #000;
        background-color: #f0f0f0;
        text-align: center;
        font-size: 13px; /* Added for consistency */
      }
      .tr-name td {
        border-bottom: none;
        font-weight:lighter;
        font-size: 14px;
      }
      .tr-details td {
        border-top: none;
        font-size: 13px; /* Reduced from 12px */

      }
      td:nth-child(1) { width: 8%; text-align: center; }
      td:nth-child(2) { width: 32%; text-align: left; padding-left: 1px; }
      td:nth-child(3) { width: 10%; text-align: center; }
      td:nth-child(4),
      td:nth-child(5),
      td:nth-child(6),
      td:nth-child(7) { width: 15%; text-align: right; padding-right: 1px; }
      
      /* Summary section */
      .billing-summary {
        margin-top: 5px; /* Reduced from 8px */
        font-size: 13px; /* Reduced from 16px */
        padding: 0 1mm; /* Added side padding */
      }
      .billing-summary h3 {
        font-size: 12px;
        margin-bottom: 2px; /* Reduced from 3px */
        text-decoration: underline;
      }
      .billing-summary p {
        margin: 1px 0; /* Reduced from 2px */
      }
      .billing-summary .grand-total {
        font-size: 13px;
        font-weight: bold;
        margin-top: 2px; /* Reduced from 3px */
      }
      
      /* Footer sections */
      .terms-conditions {
        font-size: 9px;
        margin-top: 5px; /* Reduced from 8px */
        padding: 2px 1mm 0 1mm; /* Added side padding */
        border-top: 1px dashed #000;
      }
      .terms-conditions h4 {
        text-align: center;
        margin-bottom: 1px; /* Reduced from 2px */
        font-size: 10px; /* Reduced from 11px */
      }
      .terms-tamil{
      font-family: "Bamini", bamini;
      }
      .thanks {
        font-size: 12px;
        font-weight: bold;
        margin: 3px 0; /* Reduced from 5px */
        text-align: center;
      }
      .systemby {
        font-size: 8px;
        text-align: center;
        margin-top: 2px; /* Reduced from 3px */
      }
      .systemby-web {
        font-size: 9px;
        text-align: center;
        font-style: italic;
        margin-bottom: 2px; /* Added for bottom spacing */
      }
      
      /* Utility classes */
      .text-left { text-align: left; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
    </style>
  </head>
  <body>
    ${printContent}
  </body>
</html>
    `);
    iframeDoc.close();

    // Wait for content to load before printing
    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }, 100);
    };
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
        "https://imssposerp.com/backend/public/api/customers",
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
        "https://imssposerp.com/backend/public/api/customers"
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

        <div className="flex flex-col justify-between gap-6 p-6 md:flex-row">
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
                  className="p-4 space-y-3 rounded-md bg-gray-50"
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

            <div className="p-4 space-y-2 rounded-md bg-gray-50">
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

            <div className="p-4 space-y-3 rounded-md bg-gray-50">
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
            <div className="p-4 space-y-3 rounded-md bg-gray-50">
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
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">
                        Item Name
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        MRP
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        Discount
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-700 uppercase">
                        Price
                      </th>
                      <th className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-700 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product, index) => {
                      const unitSpecialDiscount =
                        (product.specialDiscount || 0) / (product.qty || 1);
                      const totalDiscountPerUnit =
                        product.discountPerUnit + unitSpecialDiscount;
                      const price = (product.mrp || 0) - totalDiscountPerUnit;
                      const total = (product.qty || 0) * price;

                      return (
                        <tr key={product.product_id + "-" + index}>
                          <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                            {product.qty}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                            {product.product_name}
                          </td>
                          <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                            {formatCurrency(product.mrp)}
                          </td>
                          <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                            {formatCurrency(
                              product.discountPerUnit + unitSpecialDiscount
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-center text-gray-700 whitespace-nowrap">
                            {formatCurrency(price)}
                          </td>
                          <td className="px-3 py-2 text-sm font-semibold text-right text-gray-700 whitespace-nowrap">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 space-y-2 rounded-md bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Billing Summary
              </h3>
              <div className="pt-4 mt-4 border-t">
                <p>
                  <strong>Subtotal (MRP):</strong>{" "}
                  {formatCurrency(totals.subTotalMRP)}
                </p>
                <p>
                  <strong>Item Discounts:</strong>{" "}
                  {formatCurrency(totals.totalItemDiscounts)}
                </p>
                <p className="text-lg font-bold">
                  <strong>Grand Total:</strong>{" "}
                  {formatCurrency(totals.finalTotal)}
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
        <div className="hidden">
          <div ref={printRef} className="print-container">
            {/* Header */}
            <div className="text-center bill-header">
              <img
                src={logo}
                alt="Logo"
                className="mx-auto my-0 mb-2 p-0"
                style={{ width: "140px", height: "auto", objectFit: "contain" }}
              />
              {/* <div className="text-xl font-bold uppercase shop-name">
                Munsi Tex
              </div>
              <div className="text-xl font-bold uppercase shop-name-Tamil">
                Kd;]p nlf;];
              </div> */}
              <div className="text-lg shop-address">
                Mosque Building, Police Road, Kalmunai{" "}
              </div>
              <div className="text-sm shop-contact">
                Mob: 0767317851, 0743014357, 0773754234{" "}
              </div>
              <hr className="my-1 border-t border-black" />
            </div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm bill-info">
              <div>
                <strong>Customer:</strong>{" "}
                {selectedCustomer?.name || "Walk-in Customer"}
              </div>
              <div>
                <strong>Bill No:</strong> {initialCustomerInfo.bill_number}
              </div>
              <div>
                <strong>Cashier:</strong>{" "}
                {(() => {
                  try {
                    const storedUser =
                      localStorage.getItem("user") ||
                      sessionStorage.getItem("user");
                    if (storedUser) {
                      const user = JSON.parse(storedUser);
                      return user.name || user.username || "Admin";
                    }
                    return "Admin";
                  } catch {
                    return "Admin";
                  }
                })()}
              </div>
              <div>
                <strong>Date:</strong> {new Date().toLocaleDateString()}
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
            <table className="w-full text-sm mt-2 border-collapse bill-table">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left border border-black">
                    No
                  </th>
                  <th className="px-2 py-1 text-left border border-black">
                    Name
                  </th>
                  <th className="px-2 py-1 text-center border border-black">
                    Qty
                  </th>
                  <th className="px-2 py-1 text-right border border-black">
                    MRP
                  </th>
                  <th className="px-2 py-1 text-right border border-black">
                    Price
                  </th>
                  <th className="px-2 py-1 text-right border border-black">
                    Dis
                  </th>
                  <th className="px-2 py-1 text-right border border-black">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialProducts.map((product, index) => (
                  <React.Fragment key={index}>
                    {/* Item Name Row */}
                    <tr className="tr-name">
                      <td className="px-2 py-1 text-left border border-black">
                        {index + 1}
                      </td>
                      <td
                        className="px-2 py-1 font-bold text-left border border-black"
                        colSpan="6"
                      >
                        {product.product_name}
                      </td>
                    </tr>
                    {/* Item Details Row */}
                    <tr className="tr-details">
                      <td className="px-2 py-1 text-left border border-black"></td>
                      <td className="px-2 py-1 text-left border border-black"></td>
                      <td className="px-2 py-1 text-center border border-black">
                        {product.qty}x
                      </td>
                      <td className="px-2 py-1 text-right border border-black">
                        {product.mrp.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-right border border-black">
                        {product.price.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-right border border-black">
                        {(
                          product.discount + (product.specialDiscount || 0)
                        ).toFixed(2)}
                      </td>
                      <td className="px-2 py-1 font-bold text-right border border-black">
                        {product.total.toFixed(2)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="p-4 space-y-2 rounded-md bg-gray-50">
              <h3 className="billing-summary  text-lg font-semibold text-gray-800">
                Billing Summary
              </h3>
              <div className="pt-4 mt-4 border-t text-right">
                <p className="text-right">
                  <strong>Subtotal:</strong>{" "}
                  {formatCurrency(totals.subTotalMRP.toFixed(2))}
                </p>
                <p className="text-right">
                  <strong>Total Discounts:</strong>{" "}
                  {formatCurrency(totals.totalItemDiscounts)}
                </p>
                {totals.totalBillDiscount > 0 && (
                  <p>
                    <strong>Bill Discount:</strong>{" "}
                    {formatCurrency(totals.totalBillDiscount)}
                  </p>
                )}
                <p className="text-lg text-right font-bold">
                  <strong>Grand Total:</strong>{" "}
                  {formatCurrency(totals.finalTotal.toFixed(2))}
                </p>
                <p className="text-lg text-right font-bold">
                  <strong>Paid:</strong>{" "}
                  {formatCurrency(receivedAmount.toFixed(2))}
                </p>
                <p className="text-lg text-right font-bold">
                  <strong>Balance:</strong>{" "}
                  {formatCurrency(balanceAmount.toFixed(2))}
                </p>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mt-2 text-xs text-left terms-conditions">
              <h4 className="font-bold text-center">Terms and Conditions</h4>
              <p className="terms-tamil">
                tpw;f;fg;gLk; nghUl;fs; xU thuj;jpw;Fs;
                <br />
                khj;jpuk; khw;wpf; nfhLf;fg;gLk;
              </p>

              <p className="terms-english">
                Exchange is allowed within 7 days with original bill. <br />
              </p>
            </div>

            {/* Thank You Message */}
            <p className="mt-2 font-semibold text-center thanks">
              Thank You! Visit Again.
            </p>

            {/* Branding */}
            <p className="systemby">System by IMSS</p>
            <p className="systemby-web">visit🔗: www.imss.lk</p>
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
