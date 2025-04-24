import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Discount Scheme Application Logic
const applyDiscountScheme = (product, saleType, schemes, customerGroup = null) => {
  if (!product || !schemes || !Array.isArray(schemes) || schemes.length === 0) {
    return {
      price: saleType === "Wholesale"
        ? parseFloat(product?.wholesale_price || product?.sales_price || 0)
        : parseFloat(product?.sales_price || 0),
      appliedSchemeName: null,
    };
  }

  const basePrice = saleType === "Wholesale"
    ? parseFloat(product.wholesale_price || product.sales_price || 0)
    : parseFloat(product.sales_price || 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let bestScheme = null;
  let maxDiscountValue = -1;

  // Filter schemes by type and validity
  const productSchemes = schemes.filter(
    (s) =>
      s.active &&
      s.applies_to === "product" &&
      s.target === product.product_name &&
      (!s.start_date || new Date(s.start_date) <= today) &&
      (!s.end_date || new Date(s.end_date) >= today)
  );

  const categorySchemes = schemes.filter(
    (s) =>
      s.active &&
      s.applies_to === "category" &&
      s.target === product.category_name &&
      (!s.start_date || new Date(s.start_date) <= today) &&
      (!s.end_date || new Date(s.end_date) >= today)
  );

  const customerGroupSchemes = customerGroup
    ? schemes.filter(
      (s) =>
        s.active &&
        s.applies_to === "customerGroup" &&
        s.target === customerGroup &&
        (!s.start_date || new Date(s.start_date) <= today) &&
        (!s.end_date || new Date(s.end_date) >= today)
    )
    : [];

  const findBestScheme = (schemeList) => {
    schemeList.forEach((scheme) => {
      let currentDiscountValue = 0;
      if (scheme.type === "percentage") {
        currentDiscountValue = (basePrice * parseFloat(scheme.value || 0)) / 100;
      } else if (scheme.type === "amount") {
        currentDiscountValue = parseFloat(scheme.value || 0);
      }

      currentDiscountValue = Math.min(currentDiscountValue, basePrice);

      if (currentDiscountValue > maxDiscountValue) {
        maxDiscountValue = currentDiscountValue;
        bestScheme = scheme;
      }
    });
  };

  findBestScheme(productSchemes);
  if (!bestScheme || maxDiscountValue <= 0) {
    findBestScheme(categorySchemes);
  }
  if (!bestScheme || maxDiscountValue <= 0) {
    findBestScheme(customerGroupSchemes);
  }

  if (bestScheme) {
    let discountedPrice = basePrice;
    if (bestScheme.type === "percentage") {
      discountedPrice = basePrice * (1 - parseFloat(bestScheme.value || 0) / 100);
    } else if (bestScheme.type === "amount") {
      discountedPrice = basePrice - parseFloat(bestScheme.value || 0);
    }
    return {
      price: Math.max(0, discountedPrice),
      appliedSchemeName: bestScheme.name || null,
    };
  }

  return { price: basePrice, appliedSchemeName: null };
};

const POSForm = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saleType, setSaleType] = useState("Retail");
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [activeSchemes, setActiveSchemes] = useState([]);
  const [tax, setTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const payButtonRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const navigate = useNavigate();
  const [billNumber, setBillNumber] = useState("");
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Customer Info with customerGroup
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    mobile: "",
    bill_number: "",
    userId: "U-1",
    customerGroup: null, // Add customerGroup field
  });

  // Fetch Next Bill Number
  useEffect(() => {
    const fetchNextBillNumber = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/next-bill-number");
        setBillNumber(response.data.next_bill_number);
      } catch (error) {
        console.error("Error fetching next bill number:", error);
        setErrorMessage("Failed to fetch bill number. Please try again.");
      }
    };
    fetchNextBillNumber();
  }, []);

  // Fetch All Products
  useEffect(() => {
    setLoadingItems(true);
    axios
      .get("http://127.0.0.1:8000/api/products")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          setItems(response.data.data);
        } else {
          console.error("Unexpected product data format:", response.data);
          setItems([]);
          setErrorMessage("Invalid product data received.");
        }
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setItems([]);
        setErrorMessage("Failed to fetch products. Please try again.");
      })
      .finally(() => {
        setLoadingItems(false);
      });
  }, []);

  // Fetch Active Discount Schemes
  useEffect(() => {
    setLoadingSchemes(true);
    axios
      .get("http://127.0.0.1:8000/api/discount-schemes")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          setActiveSchemes(response.data.data);
        } else {
          console.error("Unexpected scheme data format:", response.data);
          setActiveSchemes([]);
          setErrorMessage("Invalid discount scheme data received.");
        }
      })
      .catch((error) => {
        console.error("Error fetching discount schemes:", error);
        setActiveSchemes([]);
        setErrorMessage("Failed to fetch discount schemes. Please try again.");
      })
      .finally(() => {
        setLoadingSchemes(false);
      });
  }, []);

  // Debounced Search
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (!Array.isArray(items)) {
        setSearchResults([]);
        return;
      }
      if (query.trim() === "") {
        setSearchResults([]);
        return;
      }
      const lowerCaseQuery = query.toLowerCase();
      const results = items.filter(
        (item) =>
          (item.product_name && item.product_name.toLowerCase().includes(lowerCaseQuery)) ||
          (item.item_code && item.item_code.includes(query)) ||
          (item.barcode && item.barcode.includes(query))
      );
      setSearchResults(results);
      setSelectedSearchIndex(0);
    }, 300),
    [items]
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Recalculate prices when saleType or activeSchemes change
  useEffect(() => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const { price, appliedSchemeName } = applyDiscountScheme(
          product,
          saleType,
          activeSchemes,
          customerInfo.customerGroup
        );
        const discountPerUnit = Math.max(parseFloat(product.mrp || 0) - price, 0);

        return {
          ...product,
          price,
          discount: discountPerUnit,
          total: price * (product.qty || 1),
          appliedSchemeName,
        };
      })
    );
  }, [saleType, activeSchemes, customerInfo.customerGroup]);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setQuantity(value === "" ? "" : parseFloat(value));
    }
  };

  const handleKeyDown = (e) => {
    if (searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSearchIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSearchIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedSearchIndex >= 0) {
          handleItemSelection(searchResults[selectedSearchIndex]);
        }
      }
    } else if (e.key === "Enter" && selectedProduct && quantity > 0) {
      if (document.activeElement === quantityInputRef.current) {
        addProductToTable();
      }
    }
    // If in search input
    if (e.target === searchInputRef.current) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSearchIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSearchIndex >= 0 && searchResults.length > 0) {
          const selectedItem = searchResults[selectedSearchIndex];
          setSelectedProduct(selectedItem);
          setSearchQuery(selectedItem.product_name);
          setSearchResults([]);
          quantityInputRef.current?.focus();
          setQuantity(1);
        }
      }
    }
    // If in quantity input
    else if (e.target === quantityInputRef.current) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedProduct && quantity > 0) {
          addProductToTable();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setQuantity(prev => (parseFloat(prev) || 0) + 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setQuantity(prev => Math.max((parseFloat(prev) || 0) - 1, 0));
      }
    }
  };

  const handleItemSelection = (item) => {
    setSelectedProduct(item);
    setSearchQuery(item.product_name);
    setSearchResults([]);
    setQuantity(1);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  const addProductToTable = () => {
    const currentQuantity = parseFloat(quantity || 0);
    if (!selectedProduct || currentQuantity <= 0) {
      setErrorMessage("Please select a product and enter a valid quantity.");
      return;
    }

    if (currentQuantity > selectedProduct.stock) {
      setErrorMessage(
        `Insufficient stock! Only ${selectedProduct.stock} available for ${selectedProduct.product_name}.`
      );
      return;
    }

    const { price: finalUnitPrice, appliedSchemeName } = applyDiscountScheme(
      selectedProduct,
      saleType,
      activeSchemes,
      customerInfo.customerGroup
    );
    const discountPerUnit = Math.max(parseFloat(selectedProduct.mrp || 0) - finalUnitPrice, 0);

    const existingProductIndex = products.findIndex(
      (p) => p.product_id === selectedProduct.product_id
    );

    if (existingProductIndex >= 0) {
      const updatedProducts = [...products];
      const existingProduct = updatedProducts[existingProductIndex];
      const newQuantity = existingProduct.qty + currentQuantity;

      if (newQuantity > selectedProduct.stock) {
        setErrorMessage(
          `Insufficient stock! Only ${selectedProduct.stock} available for ${selectedProduct.product_name}.`
        );
        return;
      }

      existingProduct.qty = newQuantity;
      existingProduct.total = finalUnitPrice * newQuantity;
      existingProduct.price = finalUnitPrice;
      existingProduct.discount = discountPerUnit;
      existingProduct.appliedSchemeName = appliedSchemeName;

      setProducts(updatedProducts);
    } else {
      const newProduct = {
        ...selectedProduct,
        qty: currentQuantity,
        price: finalUnitPrice,
        discount: discountPerUnit,
        total: finalUnitPrice * currentQuantity,
        serialNumber: products.length + 1,
        appliedSchemeName,
      };
      setProducts([...products, newProduct]);
    }

    setSearchQuery("");
    setSelectedProduct(null);
    setQuantity(1);
    setSearchResults([]);
    setErrorMessage(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const updateProductQuantity = (index, newQtyStr) => {
    const newQty = parseFloat(newQtyStr);
    if (isNaN(newQty) || newQty < 0) {
      return;
    }

    setProducts((prevProducts) => {
      const productToUpdate = prevProducts[index];
      if (newQty > productToUpdate.stock) {
        setErrorMessage(
          `Insufficient stock! Only ${productToUpdate.stock} available for ${productToUpdate.product_name}.`
        );
        return prevProducts;
      }

      return prevProducts.map((product, i) =>
        i === index
          ? {
            ...product,
            qty: newQty,
            total: newQty * product.price,
          }
          : product
      );
    });
  };

  const handleDeleteClick = (index) => {
    setPendingDeleteIndex(index);
    setShowNotification(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      setProducts((prevProducts) =>
        prevProducts
          .filter((_, i) => i !== pendingDeleteIndex)
          .map((p, idx) => ({ ...p, serialNumber: idx + 1 }))
      );
    }
    setShowNotification(false);
    setPendingDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowNotification(false);
    setPendingDeleteIndex(null);
  };

  const calculateTotals = useCallback(() => {
    const totalQty = products.reduce((acc, p) => acc + (p.qty || 0), 0);
    const subTotalMRP = products.reduce((acc, p) => acc + (p.mrp || 0) * (p.qty || 0), 0);
    const totalItemDiscounts = products.reduce(
      (acc, p) => acc + (p.discount || 0) * (p.qty || 0),
      0
    );
    const grandTotalBeforeAdjustments = products.reduce((acc, p) => acc + p.total, 0);
    const taxAmount = grandTotalBeforeAdjustments * (parseFloat(tax || 0) / 100);
    const finalTotalDiscount = totalItemDiscounts + parseFloat(billDiscount || 0);
    const finalTotal =
      grandTotalBeforeAdjustments + taxAmount - parseFloat(billDiscount || 0) + parseFloat(shipping || 0);

    return {
      totalQty,
      subTotalMRP,
      totalItemDiscounts,
      totalBillDiscount: parseFloat(billDiscount || 0),
      finalTotalDiscount,
      taxAmount,
      grandTotalBeforeAdjustments,
      finalTotal,
    };
  }, [products, tax, billDiscount, shipping]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling full-screen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const holdSale = () => {
    if (products.length === 0) {
      setErrorMessage("Cannot hold an empty sale.");
      return;
    }
    const saleId = `HELD-${Date.now()}`;
    const saleData = {
      saleId,
      products,
      totals: calculateTotals(),
      tax,
      billDiscount,
      shipping,
      saleType,
      customerInfo,
      billNumber,
    };
    try {
      const heldSales = JSON.parse(localStorage.getItem("heldSales") || "[]");
      heldSales.push(saleData);
      localStorage.setItem("heldSales", JSON.stringify(heldSales));
      setErrorMessage(`Sale held with ID: ${saleId}`);
      resetPOS();
    } catch (error) {
      console.error("Error holding sale:", error);
      setErrorMessage("Failed to hold sale.");
    }
  };

  const resetPOS = () => {
    setProducts([]);
    setTax(0);
    setBillDiscount(0);
    setShipping(0);
    setSearchQuery("");
    setSelectedProduct(null);
    setQuantity(1);
    setSearchResults([]);
    setCustomerInfo({ name: "", mobile: "", bill_number: "", userId: "U-1", customerGroup: null });
    setErrorMessage(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleOpenBill = () => {
    if (products.length === 0) {
      setErrorMessage("Cannot proceed with an empty bill.");
      return;
    }
    setCustomerInfo((prevState) => ({
      ...prevState,
      bill_number: billNumber,
    }));
    setShowBillModal(true);
  };

  const closeBillModal = (saleSaved = false) => {
    setShowBillModal(false);
    if (saleSaved) {
      resetPOS();
      const fetchNextBillNumber = async () => {
        try {
          const response = await axios.get("http://127.0.0.1:8000/api/next-bill-number");
          setBillNumber(response.data.next_bill_number);
        } catch (error) {
          console.error("Error fetching next bill number:", error);
          setErrorMessage("Failed to fetch next bill number.");
        }
      };
      fetchNextBillNumber();
    }
    setCustomerInfo((prevState) => ({
      ...prevState,
      name: "",
      mobile: "",
      bill_number: "",
      customerGroup: null,
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleOpenBill();
      }
      if (e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        holdSale();
      }
      if (e.altKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        resetPOS();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totals = calculateTotals();

  return (
    <div className={`min-h-screen w-full p-4 ${isFullScreen ? "fullscreen-mode" : ""}`}>
      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 mb-4 text-white bg-red-600 rounded-lg">
          {errorMessage}
          <button
            className="ml-4 text-white underline"
            onClick={() => setErrorMessage(null)}
          >
            Close
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="p-2 mb-4 rounded-lg shadow-xl bg-slate-600">
        <div className="flex flex-wrap items-center justify-between w-full gap-4 p-2 rounded-lg shadow-md md:p-4 bg-slate-500">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block font-bold text-white">Sale Type</label>
              <select
                className="px-3 py-2 text-orange-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
              >
                <option value="Retail">🛒 Retail</option>
                <option value="Wholesale">📦 Wholesale</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="flex items-center space-x-2">
              <label className="font-bold text-white">Bill No:</label>
              <input
                type="text"
                className="w-24 px-3 py-2 font-bold text-center text-orange-700 bg-white border rounded-lg md:w-32"
                value={billNumber}
                readOnly
              />
            </div>
            <button
              className="p-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
              title="View Hold List (Alt+L)"
              onClick={() => setErrorMessage("Feature: Load Held Sales - Coming Soon")}
            >
              <ClipboardList size={28} />
            </button>
            <button
              className="p-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600"
              title="Close Register"
              onClick={() => setIsCloseRegisterOpen(true)}
            >
              <LogOut size={28} />
            </button>
            <button
              className="p-2 text-white bg-green-500 rounded-lg shadow hover:bg-green-600"
              title={isFullScreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <Minimize size={28} /> : <Maximize size={28} />}
            </button>
            <button
              className="p-2 text-white bg-purple-500 rounded-lg shadow hover:bg-purple-600"
              title="Calculator (Alt+C)"
              onClick={() => setShowCalculatorModal(true)}
            >
              <Calculator size={28} />
            </button>
            <button
              className="p-2 text-white bg-yellow-500 rounded-lg shadow hover:bg-yellow-600"
              title="Dashboard"
              onClick={() => navigate("/Dashboard")}
            >
              <LayoutDashboard size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="p-4 rounded-lg shadow-inner lg:col-span-2 bg-slate-200 dark:bg-gray-700">
          <div className="relative flex flex-col items-stretch gap-2 mb-4 md:flex-row md:items-center">
            <div className="relative flex-grow">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-slate-700 dark:text-white dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search Product (Name, Code, Barcode)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loadingItems || loadingSchemes}
              />
              {(loadingItems || loadingSchemes) && (
                <span className="absolute text-xs text-gray-500 right-2 top-2">Loading...</span>
              )}
              {searchResults.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 overflow-auto bg-white border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-60">
                  {searchResults.map((item, index) => (
                    <li
                      key={item.product_id || index}
                      className={`p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 ${index === selectedSearchIndex
                        ? "bg-blue-200 dark:bg-blue-600 text-black dark:text-white"
                        : "text-black dark:text-gray-200"
                        }`}
                      onClick={() => handleItemSelection(item)}
                      onMouseEnter={() => setSelectedSearchIndex(index)}
                    >
                      {item.product_name} ({item.item_code}) - Stock: {item.stock}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="text"
              className="w-full px-4 py-2 font-medium bg-gray-100 border rounded-lg md:w-48 dark:bg-gray-500 text-amber-700 dark:text-amber-400"
              readOnly
              value={selectedProduct ? selectedProduct.product_name : "No product selected"}
              title={selectedProduct ? selectedProduct.product_name : ""}
            />
            <input
              ref={quantityInputRef}
              type="number"
              step="1"
              min="0"
              className="w-full px-3 py-2 text-center bg-white border rounded-lg md:w-24 dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="Qty"
              value={quantity}
              onChange={handleQuantityChange}
              onKeyDown={handleKeyDown}
              disabled={!selectedProduct}
            />
            <button
              className="w-full px-5 py-2 text-white bg-green-600 rounded-lg shadow md:w-auto hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addProductToTable}
              disabled={!selectedProduct || parseFloat(quantity || 0) <= 0 || loadingItems || loadingSchemes}
            >
              Add
            </button>
          </div>

          <h2 className="my-4 text-lg font-bold text-gray-800 dark:text-gray-200">
            Current Bill Items
          </h2>
          <div className="overflow-x-auto max-h-[55vh]">
            <table className="w-full text-sm border border-gray-400 dark:border-gray-600">
              <thead className="top-0 z-10 bg-gray-700 text-amber-500">
                <tr>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">S.No</th>
                  <th className="px-2 py-2 text-left border border-gray-500 dark:border-gray-600">Name</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">MRP</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">Qty</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">U.Price</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">U.Disc</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">Total</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">Discount Scheme</th>
                  <th className="px-2 py-2 text-center border border-gray-500 dark:border-gray-600">
                    <Trash2 size={18} />
                  </th>
                </tr>
              </thead>
              <tbody className="text-center bg-white divide-y divide-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:divide-gray-600">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-6 italic text-center text-gray-500 dark:text-gray-400">
                      No items added to the bill yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.product_id || index} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                      <td className="px-2 py-1 border border-gray-300 dark:border-gray-600">
                        {product.serialNumber}
                      </td>
                      <td className="px-2 py-1 text-left border border-gray-300 dark:border-gray-600">
                        {product.product_name}
                      </td>
                      <td className="px-2 py-1 text-right border border-gray-300 dark:border-gray-600">
                        {formatNumberWithCommas(product.mrp || 0)}
                      </td>
                      <td className="px-2 py-1 border border-gray-300 dark:border-gray-600">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-16 py-1 text-center bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={product.qty}
                          onChange={(e) => updateProductQuantity(index, e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1 text-right border border-gray-300 dark:border-gray-600">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 py-1 text-right bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 read-only:bg-gray-200 dark:read-only:bg-gray-600"
                          value={product.price.toFixed(2)}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-1 text-right border border-gray-300 dark:border-gray-600">
                        {formatNumberWithCommas(product.discount.toFixed(2))}
                      </td>
                      <td className="px-2 py-1 font-medium text-right border border-gray-300 dark:border-gray-600">
                        {formatNumberWithCommas(product.total.toFixed(2))}
                      </td>
                      <td className="px-2 py-1 text-left border border-gray-300 dark:border-gray-600">
                        {product.appliedSchemeName || "-"}
                      </td>
                      <td className="px-2 py-1 text-center border border-gray-300 dark:border-gray-600">
                        <button
                          onClick={() => handleDeleteClick(index)}
                          className="p-1 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-700"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showNotification && (
            <Notification message="Are you sure you want to delete this product?" onClose={cancelDelete}>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </Notification>
          )}
        </div>

        <div className="w-full p-4 rounded-lg shadow-lg backdrop-blur-md bg-slate-700 bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-70">
          <h2 className="mb-4 text-xl font-bold text-white">Payment Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-200">Tax (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-black bg-white border rounded-lg dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5 for 5%"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-200">Bill Discount (Amount)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={billDiscount}
                onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-black bg-white border rounded-lg dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Discount amount"
              />
            </div>
          </div>

          <div className="p-4 mt-6 text-sm text-gray-100 bg-transparent border border-gray-500 rounded-lg shadow-inner space-y-1.5">
            <div className="flex justify-between">
              <span>Total Quantity:</span>
              <span className="font-medium">{formatNumberWithCommas(totals.totalQty.toFixed(1))}</span>
            </div>
            <div className="flex justify-between">
              <span>Sub Total (MRP):</span>
              <span className="font-medium">Rs. {formatNumberWithCommas(totals.subTotalMRP.toFixed(2))}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Item Discounts:</span>
              <span className="font-medium">(-) Rs. {formatNumberWithCommas(totals.totalItemDiscounts.toFixed(2))}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Bill Discount:</span>
              <span className="font-medium">(-) Rs. {formatNumberWithCommas(totals.totalBillDiscount.toFixed(2))}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({tax}%):</span>
              <span className="font-medium">(+) Rs. {formatNumberWithCommas(totals.taxAmount.toFixed(2))}</span>
            </div>
            <hr className="my-2 border-gray-500" />
            <div className="flex justify-between text-xl font-bold text-green-400">
              <span>Grand Total:</span>
              <span>Rs. {formatNumberWithCommas(totals.finalTotal.toFixed(2))}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg shadow bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              onClick={holdSale}
              title="Hold Bill (Alt+H)"
              disabled={products.length === 0}
            >
              <PauseCircle size={18} /> Hold
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-white bg-gray-500 rounded-lg shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={resetPOS}
              title="Reset Bill (Alt+R)"
            >
              <RefreshCw size={18} /> Reset
            </button>
            <button
              ref={payButtonRef}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg shadow bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
              onClick={handleOpenBill}
              title="Proceed to Pay (Alt+P)"
              disabled={products.length === 0}
            >
              <Printer size={18} /> Pay
            </button>
          </div>
        </div>
      </div>

      {showBillModal && (
        <BillPrintModal
          initialProducts={products}
          initialBillDiscount={parseFloat(billDiscount || 0)}
          initialTax={parseFloat(tax || 0)}
          initialShipping={parseFloat(shipping || 0)}
          initialTotals={totals}
          initialCustomerInfo={customerInfo}
          onClose={closeBillModal}
        />
      )}

      {showCalculatorModal && (
        <CalculatorModal isOpen={showCalculatorModal} onClose={() => setShowCalculatorModal(false)} />
      )}

      {isCloseRegisterOpen && (
        <CloseRegisterModal isOpen={isCloseRegisterOpen} onClose={() => setIsCloseRegisterOpen(false)} />
      )}
    </div>
  );
};

export default POSForm;