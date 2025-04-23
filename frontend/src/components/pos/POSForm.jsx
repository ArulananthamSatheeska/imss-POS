import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import CloseRegisterModal from "../models/CloseRegisterModal";
import {
  ClipboardList,
  Trash2,
  LogOut,
  Maximize,
  Minimize,
  Calculator,
  LayoutDashboard,
  PauseCircle,
  RefreshCw,
  Printer,
} from "lucide-react";
import BillPrintModal from "../models/BillPrintModel.jsx";
import Notification from "../notification/Notification.jsx";
import { formatNumberWithCommas } from "../../utils/numberformat";
import CalculatorModal from "../models/calculator/CalculatorModal.jsx";

const POSForm = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saleType, setSaleType] = useState("Retail");
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [tax, setTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const navigate = useNavigate();
  const [billNumber, setBillNumber] = useState("");
  const [spacePressCount, setSpacePressCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    mobile: "",
    bill_number: "",
    userId: "U-1",
  });
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
  const [closingDetails, setClosingDetails] = useState({
    totalSalesQty: 100,
    salesAmount: 5000,
    cashOnHand: 1000,
    inCashierAmount: 1200,
    otherAmount: 200,
  });

  useEffect(() => {
    const fetchNextBillNumber = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/next-bill-number"
        );
        setBillNumber(response.data.next_bill_number);
      } catch (error) {
        console.error("Error fetching next bill number:", error);
      }
    };
    fetchNextBillNumber();
  }, []);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:8000/api/products")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          setItems(response.data.data);
        } else {
          console.error("Unexpected data format:", response.data);
          setItems([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const debouncedSearch = debounce((query) => {
    if (!Array.isArray(items)) {
      console.error("Items is not an array:", items);
      setSearchResults([]);
      return;
    }

    const results = items.filter(
      (item) =>
        (item.product_name &&
          item.product_name.toLowerCase().includes(query.toLowerCase())) ||
        (item.item_code && item.item_code.includes(query)) ||
        (item.barcode && item.barcode.includes(query))
    );

    console.log("Search results:", results);
    setSearchResults(results);
    setSelectedSearchIndex(0);
  }, 300);

  useEffect(() => {
    if (spacePressCount === 3) {
      payButtonRef.current.focus();
      setSpacePressCount(0);
    }
  }, [spacePressCount]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
    } else {
      debouncedSearch(query);
    }
  };

  useEffect(() => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const newPrice =
          saleType === "Wholesale"
            ? parseFloat(product.wholesale_price || 0)
            : parseFloat(product.sales_price || 0);

        const discountPerUnit = Math.max(
          parseFloat(product.mrp || 0) - newPrice,
          0
        );

        return {
          ...product,
          price: newPrice,
          discount: discountPerUnit,
          total:
            newPrice * (product.qty || 1) -
            discountPerUnit * (product.qty || 1),
        };
      })
    );
  }, [saleType]);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setQuantity(parseFloat(value) || "");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedSearchIndex((prev) =>
        Math.min(prev + 1, searchResults.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setSelectedSearchIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (selectedSearchIndex >= 0 && searchResults.length > 0) {
        setSelectedProduct(searchResults[selectedSearchIndex]);
        if (isEasyMode) {
          addProductToTable();
        } else {
          quantityInputRef.current?.focus();
        }
      }
    }
  };

  const handleItemSelection = (item) => {
    setSelectedProduct(item);
    setSearchQuery(item.product_name);
    setSearchResults([]);
    quantityInputRef.current.focus();
  };

  const addProductToTable = () => {
    if (!selectedProduct || (!isEasyMode && quantity <= 0)) return;

    if (quantity > selectedProduct.stock) {
      alert(`Insufficient stock! Only ${selectedProduct.stock} available.`);
      return;
    }

    const price =
      saleType === "Wholesale"
        ? selectedProduct.wholesale_price
        : selectedProduct.sales_price;
    const discountPerUnit = Math.max(selectedProduct.mrp - price, 0);
    const totalDiscount = discountPerUnit * quantity;

    const existingProductIndex = products.findIndex(
      (product) => product.product_name === selectedProduct.product_name
    );

    if (existingProductIndex >= 0) {
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].qty += parseFloat(quantity);
      updatedProducts[existingProductIndex].total =
        updatedProducts[existingProductIndex].qty * price -
        updatedProducts[existingProductIndex].qty * discountPerUnit;
      updatedProducts[existingProductIndex].discount = discountPerUnit;

      setProducts(updatedProducts);
    } else {
      const newProduct = {
        ...selectedProduct,
        qty: parseFloat(quantity),
        price: price,
        total: price * quantity - totalDiscount,
        discount: discountPerUnit,
        serialNumber: products.length + 1,
      };

      setProducts([...products, newProduct]);
    }

    setSearchQuery("");
    setSelectedProduct(null);
    setQuantity(1);
    searchInputRef.current.focus();
  };

  const updateProductQuantity = (index, newQty) => {
    if (newQty === "" || /^[0-9]*\.?[0-9]*$/.test(newQty)) {
      setProducts((prevProducts) =>
        prevProducts.map((product, i) =>
          i === index
            ? {
              ...product,
              qty: parseFloat(newQty) || 0,
              total: parseFloat(newQty) * product.price,
            }
            : product
        )
      );
    }
  };

  const updateProductPrice = (index, newPrice) => {
    setProducts((prevProducts) =>
      prevProducts.map((product, i) =>
        i === index
          ? {
            ...product,
            price: newPrice,
            total:
              newPrice * (product.qty || 1) -
              product.discount * (product.qty || 1),
          }
          : product
      )
    );
  };

  const handleDeleteClick = (index) => {
    setPendingDeleteIndex(index);
    setShowNotification(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      setProducts((prevProducts) =>
        prevProducts.filter((_, i) => i !== pendingDeleteIndex)
      );
    }
    setShowNotification(false);
    setPendingDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowNotification(false);
    setPendingDeleteIndex(null);
  };

  const calculateTotals = () => {
    const totalQty = products.reduce(
      (acc, product) => acc + (product.qty || 0),
      0
    );
    const subTotal = products.reduce(
      (acc, product) => acc + (product.mrp || 0) * (product.qty || 0),
      0
    );
    const totalItemDiscounts = products.reduce(
      (acc, product) => acc + (product.discount || 0) * (product.qty || 0),
      0
    );
    const taxAmount = subTotal * (tax / 100) || 0;
    const totalDiscount = totalItemDiscounts + (billDiscount || 0);
    const total = subTotal + taxAmount - totalDiscount + (shipping || 0);

    return {
      totalQty,
      subTotal,
      totalItemDiscounts,
      totalDiscount,
      taxAmount,
      total,
    };
  };

  const toggleFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullScreen((prev) => !prev);
  };

  const holdSale = () => {
    const saleId = `BILL-${Date.now()}`;
    const saleData = {
      saleId,
      products,
      totals: calculateTotals(),
      tax,
      billDiscount,
      shipping,
    };
    localStorage.setItem(saleId, JSON.stringify(saleData));
    alert(`Sale held with ID: ${saleId}`);
  };

  const handelOpenBill = () => {
    setShowBillModal(true);
    const newBillNumber = generateNextBillNumber(billNumber);
    setBillNumber(newBillNumber);
    setCustomerInfo((prevState) => ({
      ...prevState,
      bill_number: newBillNumber,
    }));
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setCustomerInfo({
      name: "",
      mobile: "",
      bill_number: "",
      userId: "U-1",
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "p") {
        handelOpenBill();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handelOpenBill]);

  return (
    <div
      className={`min-h-screen w-full p-4 ${isFullScreen ? "fullscreen-mode" : ""
        }`}
    >
      <div className="p-2 rounded-lg shadow-xl">
        <div className="flex items-center justify-between w-full bg-slate-500 mt-0 mb-1 p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block font-bold">Sale Type</label>
              <select
                className="px-3 py-2 text-orange-700 border rounded-lg"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
              >
                <option value="Retail">🛒 Retail</option>
                <option value="Wholesale">📦 Wholesale</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="font-bold">Bill Number</label>
              <input
                type="text"
                className="px-3 py-2 text-orange-700 border rounded-lg"
                value={customerInfo.bill_number || billNumber}
                readOnly
              />
            </div>

            <button
              className="p-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
              title="View Hold List"
              onClick={() => alert("Feature Coming Soon")}
            >
              <ClipboardList size={30} />
            </button>

            <button
              className="p-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600"
              title="Close Register"
              onClick={() => alert("Feature Coming Soon")}
            >
              <LogOut size={30} />
            </button>

            <button
              className="p-2 text-white bg-green-500 rounded-lg shadow hover:bg-green-600"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <Minimize size={30} /> : <Maximize size={30} />}
            </button>

            <button
              className="p-2 text-white bg-purple-500 rounded-lg shadow hover:bg-purple-600"
              title="Calculator"
              onClick={() => {
                setShowCalculatorModal(true);
                setIsOpen(true);
              }}
            >
              <Calculator size={30} />
            </button>

            <button
              className="p-2 text-white bg-yellow-500 rounded-lg shadow hover:bg-yellow-600"
              title="Dashboard"
              onClick={() => navigate("/Dashboard")}
            >
              <LayoutDashboard size={30} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 p-4 rounded-lg shadow-inner">
            {/* Search Section */}
            <div className="relative flex items-center space-x-4">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full text-slate-700 px-4 py-2 border rounded-lg"
                placeholder="Search by name, code, or barcode"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {searchQuery.trim() !== "" && searchResults.length > 0 && (
                <ul className="absolute z-50 w-60 border rounded-lg top-full bg-slate-50/5 backdrop-blur-sm shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((item, index) => (
                    <li
                      key={index}
                      className={`p-2 cursor-pointer hover:bg-slate-800 ${index === selectedSearchIndex
                        ? "bg-slate-500 text-amber-400"
                        : ""
                        }`}
                      onClick={() => handleItemSelection(item)}
                    >
                      {item.product_name}
                    </li>
                  ))}
                </ul>
              )}

              <input
                type="text"
                className="w-full bg-transparent text-amber-600 px-4 py-2 border rounded-lg"
                readOnly
                value={selectedProduct ? selectedProduct.product_name : ""}
              />
              {/* Quantity input */}
              {!isEasyMode && (
                <input
                  ref={quantityInputRef}
                  type="number"
                  step="0.01"
                  className="w-20 bg-transparent px-4 py-2 border rounded-lg"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  onKeyDown={(e) => e.key === "Enter" && addProductToTable()}
                />
              )}

              {/* Add to Table Button */}
              <button
                className="px-4 py-2 text-white bg-green-500 rounded-lg shadow hover:bg-green-600"
                onClick={addProductToTable}
                disabled={!selectedProduct}
              >
                Add
              </button>
            </div>

            {/* Products Table */}
            <h2 className="mt-10 mb-2 text-lg font-bold">Selected Products</h2>
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-700 border text-amber-600 border-gray-300">
                <tr className="border border-gray-300">
                  <th className="border border-gray-500 px-2 py-1">S.No</th>
                  <th className="border border-gray-500 px-2 py-1">Name</th>
                  <th className="border border-gray-500 px-2 py-1">MRP</th>
                  <th className="border border-gray-500 px-2 py-1">Qty</th>
                  <th className="border border-gray-500 px-2 py-1">U.Price</th>
                  <th className="border border-gray-500 px-2 py-1">
                    U.Discount
                  </th>
                  <th className="border border-gray-500 px-2 py-1">Total</th>
                  <th className="px-2 py-2 flex justify-center items-center">
                    <Trash2 size={20} />
                  </th>
                </tr>
              </thead>
              <tbody className="text-center">
                {products.map((product, index) => (
                  <tr key={index} className="border border-gray-300">
                    <td className="border border-gray-500 text-center px-2 py-1">
                      {index + 1}
                    </td>
                    <td className="border border-gray-500 text-left px-2 py-1">
                      {product.product_name}
                    </td>
                    <td className="border border-gray-500 text-right px-2 py-1">
                      {formatNumberWithCommas(product.mrp)}
                    </td>
                    <td className="border border-gray-500 text-center px-2 py-1">
                      <input
                        type="number"
                        className="w-16 bg-transparent text-center py-1 border rounded-lg"
                        value={product.qty}
                        onChange={(e) =>
                          updateProductQuantity(
                            index,
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </td>
                    <td className="border border-gray-500 px-2 py-1">
                      <input
                        type="number"
                        className="w-28 bg-transparent text-right py-1 border rounded-lg"
                        value={product.price}
                        readOnly
                        onChange={(e) =>
                          updateProductPrice(
                            index,
                            parseFloat(e.target.value) || 1
                          )
                        }
                      />
                    </td>
                    <td className="border border-gray-500 text-right px-2 py-1">
                      {formatNumberWithCommas(product.discount.toFixed(2))}
                    </td>
                    <td className="border border-gray-500 text-right px-2 py-1">
                      {formatNumberWithCommas(
                        (product.qty * product.price).toFixed(2)
                      )}
                    </td>
                    <td className="border text-center border-gray-500 px-2 py-1">
                      <button
                        onClick={() => handleDeleteClick(index)}
                        className="px-2 py-1 text-red-600 bg-red-200 rounded-lg hover:bg-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Confirmation Notification */}
            {showNotification && (
              <Notification
                message="Are you sure you want to delete this product?"
                onClose={cancelDelete}
              >
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                >
                  Cancel
                </button>
              </Notification>
            )}
          </div>

          <div className="p-4 min-w-80 w-full rounded-lg shadow-lg backdrop-blur-md bg-slate-700 bg-opacity-40">
            <h2 className="mb- text-lg font-bold">Payment Details</h2>
            <div className="space-y-3">
              <div>
                <label>Tax (%)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label>Discount</label>
                <input
                  type="number"
                  value={billDiscount}
                  onChange={(e) =>
                    setBillDiscount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 mt-4 text-center bg-transparent rounded-lg shadow-lg">
              <p>
                Total Qty:{" "}
                {formatNumberWithCommas(
                  (calculateTotals().totalQty || 0).toFixed(1)
                )}
              </p>
              {/* <p>
                Item Discounts:{" "}
                {formatNumberWithCommas(
                  (calculateTotals().totalItemDiscounts || 0).toFixed(2)
                )}{" "}
                Rs.
              </p> */}
              {/* <p>
                Additional Discount:{" "}
                {formatNumberWithCommas(
                  (calculateTotals().additionalDiscount || 0).toFixed(2)
                )}{" "}
                Rs.
              </p> */}
              <p>
                Total Discount:{" "}
                {formatNumberWithCommas(
                  (calculateTotals().totalDiscount || 0).toFixed(2)
                )}{" "}
                Rs.
              </p>
              <p>
                Sub Total:{" "}
                {formatNumberWithCommas(
                  (calculateTotals().subTotal || 0).toFixed(2)
                )}{" "}
                Rs.
              </p>
              <h2 className="text-2xl font-bold text-green-500">
                Total:{" "}
                {formatNumberWithCommas(
                  (calculateTotals().total || 0).toFixed(2)
                )}{" "}
                Rs.
              </h2>
            </div>

            <div className="mt-4 justify-center flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 text-white bg-emerald-500 rounded-lg shadow hover:bg-emerald-300 hover:text-amber-600"
                onClick={holdSale}
              >
                <PauseCircle size={18} /> Hold
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-white bg-gray-500 rounded-lg shadow hover:bg-gray-300 hover:text-amber-600"
                onClick={() => {
                  setProducts([]);
                  setTax(0);
                  setBillDiscount(0);
                  setShipping(0);
                }}
              >
                <RefreshCw size={18} /> Reset
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 text-white bg-fuchsia-500 rounded-lg shadow hover:bg-fuchsia-300 hover:text-amber-600"
                onClick={handelOpenBill}
              >
                <Printer size={18} /> Pay
              </button>
            </div>
          </div>
        </div>

        {/* Bill Print Modal */}
        {showBillModal && (
          <BillPrintModal
            initialProducts={products || []}
            initialBillDiscount={billDiscount || 0}
            initialCustomerInfo={{ ...customerInfo, bill_number: billNumber }} // Pass the updated bill number
            onClose={closeBillModal}
          />
        )}
      </div>
    </div>
  );
};

export default POSForm;
