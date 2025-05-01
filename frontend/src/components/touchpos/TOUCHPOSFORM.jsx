import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import { FaPause, FaRedo, FaCreditCard } from "react-icons/fa";
import {
  ClipboardList,
  Trash2,
  LogOut,
  Maximize,
  Minimize,
  Calculator,
  LayoutDashboard,
  Plus,
  Minus,
  ArrowLeft,
  Check,
  ArrowUp,
  Edit2,
} from "lucide-react";
import BillPrintModal from "../models/BillPrintModel.jsx";
import Notification from "../notification/Notification.jsx";
import { formatNumberWithCommas } from "../../utils/numberformat";
import CalculatorModal from "../models/calculator/CalculatorModal.jsx";

// --- Helper Function to Apply Discount Schemes ---
const applyDiscountScheme = (product, saleType, schemes) => {
  if (!product || !product.id || !Array.isArray(schemes)) {
    const fallbackPrice =
      saleType === "Wholesale"
        ? parseFloat(product?.wholesale_price || product?.sales_price || 0)
        : parseFloat(product?.sales_price || 0);
    return Math.max(0, fallbackPrice);
  }

  const basePrice =
    saleType === "Wholesale"
      ? parseFloat(product.wholesale_price || product.sales_price || 0)
      : parseFloat(product.sales_price || 0);

  if (isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let bestScheme = null;
  let maxDiscountValue = -1;

  const findBestScheme = (schemeList) => {
    schemeList.forEach((scheme) => {
      if (
        !scheme.active ||
        !scheme.type ||
        scheme.value === null ||
        scheme.value === undefined
      )
        return;

      const startDate = scheme.start_date ? new Date(scheme.start_date) : null;
      const endDate = scheme.end_date ? new Date(scheme.end_date) : null;
      if (startDate && startDate > today) return;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        if (endDate < today) return;
      }

      let currentDiscountValue = 0;
      const schemeValue = parseFloat(scheme.value || 0);

      if (scheme.type === "percentage" && schemeValue > 0) {
        currentDiscountValue = (basePrice * schemeValue) / 100;
      } else if (scheme.type === "amount" && schemeValue > 0) {
        currentDiscountValue = schemeValue;
      } else {
        return;
      }

      currentDiscountValue = Math.min(currentDiscountValue, basePrice);

      if (currentDiscountValue > maxDiscountValue) {
        maxDiscountValue = currentDiscountValue;
        bestScheme = scheme;
      }
    });
  };

  const productSchemes = schemes.filter(
    (s) => s.applies_to === "product" && s.target === product.product_name
  );
  findBestScheme(productSchemes);

  if ((!bestScheme || maxDiscountValue <= 0) && product.category) {
    const categorySchemes = schemes.filter(
      (s) => s.applies_to === "category" && s.target === product.category
    );
    findBestScheme(categorySchemes);
  }

  if (bestScheme && maxDiscountValue > 0) {
    let discountedPrice = basePrice;
    const schemeValue = parseFloat(bestScheme.value || 0);

    if (bestScheme.type === "percentage") {
      discountedPrice = basePrice * (1 - schemeValue / 100);
    } else if (bestScheme.type === "amount") {
      discountedPrice = basePrice - schemeValue;
    }
    return Math.max(0, discountedPrice);
  }

  return basePrice;
};

// Virtual Keyboard Component (Unchanged)
const VirtualKeyboard = ({ value, onChange, onClose, isNumericOnly }) => {
  const [isShift, setIsShift] = useState(false);

  const alphaNumericLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
    ["space", "done"],
  ];

  const numericLayout = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["0", ".", "backspace"],
    ["done"],
  ];

  const layout = isNumericOnly ? numericLayout : alphaNumericLayout;

  const handleKeyPress = (key) => {
    if (key === "done") {
      onClose();
      return;
    }

    if (key === "backspace") {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === "shift") {
      setIsShift((prev) => !prev);
      return;
    }

    if (key === "space") {
      onChange(value + " ");
      return;
    }

    const char =
      isShift && !isNumericOnly && /[a-z]/.test(key) ? key.toUpperCase() : key;
    onChange(value + char);
    if (isShift && /[a-z]/.test(key)) {
      setIsShift(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 shadow-2xl z-50 border-t-2 border-gray-600">
      <div className="mb-2 text-center text-lg font-semibold text-white bg-gray-700 p-2 rounded-lg shadow-md">
        Typing: {value || "Start typing..."}
      </div>
      <div className="max-w-4xl mx-auto">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2 mb-2">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`
                  flex items-center justify-center rounded-lg shadow-md
                  ${key === "space" ? "flex-1" : "w-14 h-14"}
                  ${key === "done" ? "bg-green-500 text-white" : ""}
                  ${key === "backspace" ? "bg-red-500 text-white" : ""}
                  ${key === "shift"
                    ? isShift
                      ? "bg-blue-500 text-white"
                      : "bg-gray-600 text-white"
                    : ""
                  }
                  ${key !== "done" && key !== "backspace" && key !== "shift"
                    ? "bg-gray-600 text-white"
                    : ""
                  }
                  active:scale-95 transition-all duration-100 text-lg font-semibold
                `}
              >
                {key === "space" ? (
                  <span>Space</span>
                ) : key === "backspace" ? (
                  <ArrowLeft size={24} />
                ) : key === "done" ? (
                  <Check size={24} />
                ) : key === "shift" ? (
                  <ArrowUp size={24} />
                ) : isShift && !isNumericOnly && /[a-z]/.test(key) ? (
                  key.toUpperCase()
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const TOUCHPOSFORM = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saleType, setSaleType] = useState("Retail");
  const [products, setProducts] = useState([]); // Products in the bill
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [items, setItems] = useState([]); // All available products
  const [activeSchemes, setActiveSchemes] = useState([]); // Discount schemes
  const [tax, setTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [shipping, setShipping] = useState(0); // Added shipping
  const searchInputRef = useRef(null);
  const taxInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const navigate = useNavigate();
  const [billNumber, setBillNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    mobile: "",
    bill_number: "",
    userId: "U-1",
    receivedAmount: 0,
  });
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  // Virtual keyboard states
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState(null);
  const [keyboardValue, setKeyboardValue] = useState("");
  const [isNumericKeyboard, setIsNumericKeyboard] = useState(false);
  const [editingBarcodeIndex, setEditingBarcodeIndex] = useState(null);

  // Category and brand filters
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");

  // Fetch Next Bill Number
  useEffect(() => {
    const fetchNextBillNumber = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/next-bill-number"
        );
        if (response.data && response.data.next_bill_number) {
          setBillNumber(response.data.next_bill_number);
        } else {
          throw new Error("Invalid bill number format");
        }
      } catch (error) {
        console.error("Error fetching next bill number:", error);
        const timestamp = Date.now();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setBillNumber(`BILL-${timestamp}-${randomNum}`);
      }
    };
    fetchNextBillNumber();
  }, []);

  // Fetch Products
  useEffect(() => {
    setLoadingItems(true);
    axios
      .get("http://127.0.0.1:8000/api/products")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          const productsWithOpeningStock = response.data.data.map((p) => ({
            ...p,
            id: p.id || p.product_id, // Ensure consistent ID field
            stock: parseFloat(p.opening_stock_quantity || 0), // Use opening stock
            category: p.category_name || "Unknown Category",
            brand: p.brand || "Unknown Brand",
          }));
          setItems(productsWithOpeningStock);
          setSearchResults(productsWithOpeningStock); // Initialize search results
          console.log(
            "Fetched Products (using opening_stock_quantity as 'stock'):",
            productsWithOpeningStock
          );
        } else {
          console.error("Unexpected product data format:", response.data);
          setItems([]);
          setSearchResults([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setItems([]);
        setSearchResults([]);
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
          const formattedSchemes = response.data.data.map((s) => ({
            ...s,
            applies_to: s.applies_to || s.appliesTo,
            start_date: s.start_date || s.startDate,
            end_date: s.end_date || s.endDate,
          }));
          const active = formattedSchemes.filter((scheme) => scheme.active);
          setActiveSchemes(active);
          console.log("Fetched and Filtered Active Schemes:", active);
        } else {
          console.error("Unexpected scheme data format:", response.data);
          setActiveSchemes([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching discount schemes:", error);
        setActiveSchemes([]);
      })
      .finally(() => {
        setLoadingSchemes(false);
      });
  }, []);

  // Debounced Search
  const debouncedSearch = useCallback(
    debounce((query, category, brand) => {
      if (!Array.isArray(items)) {
        setSearchResults([]);
        return;
      }

      let filtered = [...items];

      if (category !== "All Categories") {
        filtered = filtered.filter((item) => item.category === category);
      }

      if (brand !== "All Brands") {
        filtered = filtered.filter((item) => item.brand === brand);
      }

      if (query.trim() !== "") {
        const lowerCaseQuery = query.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            (item.product_name &&
              item.product_name.toLowerCase().includes(lowerCaseQuery)) ||
            (item.item_code && String(item.item_code).includes(query)) ||
            (item.barcode && String(item.barcode).includes(query))
        );
      }

      setSearchResults(filtered);
    }, 300),
    [items]
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query, selectedCategory, selectedBrand);
  };

  // Recalculate prices when saleType or schemes change
  useEffect(() => {
    if (activeSchemes.length > 0 || !loadingSchemes) {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const newPrice = applyDiscountScheme(
            product,
            saleType,
            activeSchemes
          );
          const mrp = parseFloat(product.mrp || 0);
          const discountPerUnit = Math.max(0, mrp - newPrice);

          return {
            ...product,
            price: newPrice,
            discount: discountPerUnit,
            total: newPrice * (product.qty || 0),
          };
        })
      );
    }
  }, [saleType, activeSchemes, loadingSchemes]);

  // Add Product to Bill
  const addProductToTable = (item) => {
    if (!item || !item.id) {
      alert("Invalid product selected.");
      return;
    }

    const availableStock = parseFloat(item.stock || 0);
    if (isNaN(availableStock) || availableStock <= 0) {
      alert(`No opening stock available for ${item.product_name}.`);
      return;
    }

    const qtyToAdd = 1;
    const existingProductIndex = products.findIndex((p) => p.id === item.id);
    const newTotalQty =
      existingProductIndex >= 0
        ? products[existingProductIndex].qty + qtyToAdd
        : qtyToAdd;

    if (newTotalQty > availableStock) {
      alert(
        `Insufficient opening stock for ${item.product_name}! Only ${availableStock} available.`
      );
      return;
    }

    const finalUnitPrice = applyDiscountScheme(item, saleType, activeSchemes);
    const mrp = parseFloat(item.mrp || 0);
    const discountPerUnit = Math.max(0, mrp - finalUnitPrice);

    let updatedProducts = [...products];

    if (existingProductIndex >= 0) {
      updatedProducts[existingProductIndex] = {
        ...updatedProducts[existingProductIndex],
        qty: newTotalQty,
        total: finalUnitPrice * newTotalQty,
      };
    } else {
      const newProduct = {
        ...item,
        qty: qtyToAdd,
        price: finalUnitPrice,
        discount: discountPerUnit,
        total: finalUnitPrice * qtyToAdd,
        serialNumber: products.length + 1,
      };
      updatedProducts = [...products, newProduct];
    }

    setProducts(updatedProducts);

    // Update stock in items and searchResults
    const updateStock = (list) =>
      list.map((i) =>
        i.id === item.id ? { ...i, stock: i.stock - qtyToAdd } : i
      );
    setItems(updateStock);
    setSearchResults(updateStock);

    setSearchQuery("");
  };

  // Update Product Quantity
  const updateProductQuantity = (index, newQty) => {
    const parsedQty = parseFloat(newQty) || 0;
    if (parsedQty < 0) {
      return;
    }

    const product = products[index];
    const availableStock = parseFloat(product.stock || 0);

    if (parsedQty > availableStock) {
      alert(
        `Quantity exceeds opening stock! Only ${availableStock} available for ${product.product_name}.`
      );
      return;
    }

    const stockDifference = parsedQty - (product.qty || 0);

    setProducts((prevProducts) =>
      prevProducts.map((p, i) =>
        i === index
          ? {
            ...p,
            qty: parsedQty,
            total: parsedQty * p.price,
          }
          : p
      )
    );

    if (stockDifference !== 0) {
      const updateStock = (list) =>
        list.map((i) =>
          i.id === product.id ? { ...i, stock: i.stock - stockDifference } : i
        );
      setItems(updateStock);
      setSearchResults(updateStock);
    }
  };

  // Increment/Decrement Quantity
  const incrementQuantity = (index) => {
    const product = products[index];
    const newQty = (product.qty || 0) + 1;
    updateProductQuantity(index, newQty);
  };

  const decrementQuantity = (index) => {
    const product = products[index];
    const newQty = Math.max((product.qty || 0) - 1, 0);
    updateProductQuantity(index, newQty);
  };

  // Delete Product
  const handleDeleteClick = (index) => {
    setPendingDeleteIndex(index);
    setShowNotification(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      const productToDelete = products[pendingDeleteIndex];
      const qtyToRestore = productToDelete.qty || 0;

      const updateStock = (list) =>
        list.map((i) =>
          i.id === productToDelete.id
            ? { ...i, stock: i.stock + qtyToRestore }
            : i
        );
      setItems(updateStock);
      setSearchResults(updateStock);

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

  // Calculate Totals
  const calculateTotals = useCallback(() => {
    let totalQty = 0;
    let subTotalMRP = 0;
    let totalItemDiscounts = 0;
    let grandTotalBeforeAdjustments = 0;

    products.forEach((p) => {
      const qty = p.qty || 0;
      const mrp = parseFloat(p.mrp || 0);
      const unitDiscount = p.discount || 0;
      const unitPrice = p.price || 0;

      totalQty += qty;
      subTotalMRP += mrp * qty;
      totalItemDiscounts += unitDiscount * qty;
      grandTotalBeforeAdjustments += p.total;
    });

    const currentTaxRate = parseFloat(tax || 0);
    const currentBillDiscount = parseFloat(billDiscount || 0);
    const currentShipping = parseFloat(shipping || 0);
    const taxAmount = grandTotalBeforeAdjustments * (currentTaxRate / 100);
    const finalTotalDiscount = totalItemDiscounts + currentBillDiscount;
    const finalTotal =
      grandTotalBeforeAdjustments +
      taxAmount -
      currentBillDiscount +
      currentShipping;

    return {
      totalQty,
      subTotalMRP: isNaN(subTotalMRP) ? 0 : subTotalMRP,
      totalItemDiscounts: isNaN(totalItemDiscounts) ? 0 : totalItemDiscounts,
      totalBillDiscount: isNaN(currentBillDiscount) ? 0 : currentBillDiscount,
      finalTotalDiscount: isNaN(finalTotalDiscount) ? 0 : finalTotalDiscount,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      grandTotalBeforeAdjustments: isNaN(grandTotalBeforeAdjustments)
        ? 0
        : grandTotalBeforeAdjustments,
      finalTotal: isNaN(finalTotal) ? 0 : finalTotal,
    };
  }, [products, tax, billDiscount, shipping]);

  // Toggle Fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
        alert(`Could not enter full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Hold Sale
  const holdSale = useCallback(() => {
    if (products.length === 0) {
      alert("Cannot hold an empty sale.");
      return;
    }
    const currentTotals = calculateTotals();
    const saleId = `HELD-${Date.now()}`;
    const saleData = {
      saleId,
      products,
      totals: currentTotals,
      tax,
      billDiscount,
      shipping,
      saleType,
      customerInfo,
      billNumber,
      heldAt: new Date().toISOString(),
    };
    try {
      const heldSales = JSON.parse(localStorage.getItem("heldSales") || "[]");
      heldSales.push(saleData);
      localStorage.setItem("heldSales", JSON.stringify(heldSales));
      alert(`Sale held with ID: ${saleId}. Use 'View Hold List' to retrieve.`);
      resetPOS(false);
      loadHeldSales();
    } catch (error) {
      console.error("Error holding sale:", error);
      alert("Failed to hold sale. Check console for details.");
    }
  }, [
    products,
    calculateTotals,
    tax,
    billDiscount,
    shipping,
    saleType,
    customerInfo,
    billNumber,
  ]);

  // Reset POS
  const resetPOS = useCallback(
    (fetchNewBill = true) => {
      setProducts([]);
      setTax(0);
      setBillDiscount(0);
      setShipping(0);
      setSearchQuery("");
      setSearchResults(items);
      setCustomerInfo({
        name: "",
        mobile: "",
        bill_number: "",
        userId: "U-1",
        receivedAmount: 0,
      });

      if (fetchNewBill) {
        const fetchNextBillNumber = async () => {
          try {
            const response = await axios.get(
              "http://127.0.0.1:8000/api/next-bill-number"
            );
            setBillNumber(response.data.next_bill_number);
          } catch (error) {
            console.error("Error fetching next bill number post-reset:", error);
            setBillNumber("ERR-XXX");
          }
        };
        fetchNextBillNumber();
      } else {
        setCustomerInfo((prev) => ({ ...prev, bill_number: "" }));
      }
    },
    [items]
  );

  // Open Bill Modal
  const handleOpenBill = useCallback(() => {
    if (products.length === 0) {
      alert("Cannot proceed to payment with an empty bill.");
      return;
    }
    setCustomerInfo((prevState) => ({
      ...prevState,
      bill_number: billNumber,
    }));
    setShowBillModal(true);
  }, [products, billNumber]);

  // Close Bill Modal
  const closeBillModal = useCallback(
    (saleSaved = false) => {
      setShowBillModal(false);
      if (saleSaved) {
        resetPOS(true);
      }
      setCustomerInfo((prevState) => ({
        ...prevState,
        name: "",
        mobile: "",
        bill_number: "",
        receivedAmount: 0,
      }));
    },
    [resetPOS]
  );

  // Keyboard Handling
  const openKeyboard = (
    target,
    initialValue,
    isNumeric = false,
    index = null
  ) => {
    setKeyboardTarget(target);
    setKeyboardValue(initialValue);
    setIsNumericKeyboard(isNumeric);
    setEditingBarcodeIndex(index);
    setShowKeyboard(true);
  };

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setKeyboardTarget(null);
    setKeyboardValue("");
    setIsNumericKeyboard(false);
    setEditingBarcodeIndex(null);
  };

  const handleKeyboardChange = (newValue) => {
    setKeyboardValue(newValue);

    if (keyboardTarget === "search") {
      handleSearch(newValue);
    } else if (keyboardTarget === "tax") {
      setTax(parseFloat(newValue) || 0);
    } else if (keyboardTarget === "discount") {
      setBillDiscount(parseFloat(newValue) || 0);
    } else if (keyboardTarget === "barcode" && editingBarcodeIndex !== null) {
      const updatedProducts = [...products];
      updatedProducts[editingBarcodeIndex].barcode = newValue;
      setProducts(updatedProducts);

      setSearchResults((prevResults) =>
        prevResults.map((result) =>
          result.id === updatedProducts[editingBarcodeIndex].id
            ? { ...result, barcode: newValue }
            : result
        )
      );

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedProducts[editingBarcodeIndex].id
            ? { ...item, barcode: newValue }
            : item
        )
      );
    }
  };

  // Scroll active input into view
  useEffect(() => {
    if (showKeyboard && keyboardTarget) {
      let activeElement = null;
      if (keyboardTarget === "search") {
        activeElement = searchInputRef.current;
      } else if (keyboardTarget === "tax") {
        activeElement = taxInputRef.current;
      } else if (keyboardTarget === "discount") {
        activeElement = discountInputRef.current;
      }

      if (activeElement) {
        setTimeout(() => {
          activeElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    }
  }, [showKeyboard, keyboardTarget]);

  // Dynamic Categories and Brands
  const categories = [
    "All Categories",
    ...new Set(items.map((item) => item.category).filter(Boolean)),
  ];
  const brands = [
    "All Brands",
    ...new Set(items.map((item) => item.brand).filter(Boolean)),
  ];

  // Category Colors
  const categoryColors = {
    "Milk Powder": "bg-gradient-to-br from-blue-50 to-blue-100",
    Beverages: "bg-gradient-to-br from-green-50 to-green-100",
    Snacks: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    Chocolates: "bg-gradient-to-br from-pink-50 to-pink-100",
    "Instant Food": "bg-gradient-to-br from-orange-50 to-orange-100",
  };

  const totals = calculateTotals();

  return (
    <div
      className={`min-h-screen w-full p-2 sm:p-4 flex flex-col ${isFullScreen ? "fullscreen-mode" : ""
        }`}
    >
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[40%_60%] gap-2 sm:gap-4">
        {/* Left Side: Billing System */}
        <div className="p-2 sm:p-4 bg-white rounded-lg shadow-lg flex flex-col relative">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Billing</h2>
            <div className="flex gap-1 sm:gap-2">
              <button
                className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-lg ${saleType === "Retail"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
                  }`}
                onClick={() => setSaleType("Retail")}
              >
                Retail
              </button>
              <button
                className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-lg ${saleType === "Wholesale"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
                  }`}
                onClick={() => setSaleType("Wholesale")}
              >
                Wholesale
              </button>
            </div>
          </div>

          {/* Bill Table */}
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-1 sm:p-2 text-left text-xs sm:text-sm">
                    S.No
                  </th>
                  <th className="p-1 sm:p-2 text-left text-xs sm:text-sm">
                    Product
                  </th>
                  <th className="p-1 sm:p-2 text-center text-xs sm:text-sm">
                    Qty
                  </th>
                  <th className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                    Price
                  </th>
                  <th className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                    Disc
                  </th>
                  <th className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                    Total
                  </th>
                  <th className="p-1 sm:p-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">
                      No items added to the bill yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.id + "-" + index} className="border-b">
                      <td className="p-1 sm:p-2 text-xs sm:text-sm">
                        {product.serialNumber}
                      </td>
                      <td className="p-1 sm:p-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs sm:text-sm">
                            {product.product_name}
                          </span>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-500">
                              Barcode: {product.barcode}
                            </span>
                            <button
                              onClick={() =>
                                openKeyboard(
                                  "barcode",
                                  product.barcode,
                                  true,
                                  index
                                )
                              }
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit2 size={12} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-1 sm:p-2 text-center">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => decrementQuantity(index)}
                            className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                          >
                            <Minus size={16} className="sm:w-5 sm:h-5" />
                          </button>
                          <span className="text-sm sm:text-lg">
                            {product.qty}
                          </span>
                          <button
                            onClick={() => incrementQuantity(index)}
                            className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                          >
                            <Plus size={16} className="sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                        {formatNumberWithCommas(product.price.toFixed(2))}
                      </td>
                      <td className="p-1 sm:p-2 text-right text-xs sm:text-sm text-red-600">
                        {formatNumberWithCommas(
                          product.discount?.toFixed(2) ?? 0.0
                        )}
                      </td>
                      <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                        {formatNumberWithCommas(
                          product.total?.toFixed(2) ?? 0.0
                        )}
                      </td>
                      <td className="p-1 sm:p-2 text-center">
                        <button
                          onClick={() => handleDeleteClick(index)}
                          className="p-1 sm:p-2 bg-red-500 text-white rounded-lg"
                        >
                          <Trash2 size={16} className="sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm sm:text-lg font-semibold">
                <span>Total Quantity:</span>
                <span>
                  {formatNumberWithCommas(totals.totalQty.toFixed(1))}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Tax (%):
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setTax((prev) => Math.max(prev - 1, 0))}
                      className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                    >
                      <Minus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <span
                      ref={taxInputRef}
                      onClick={() => openKeyboard("tax", tax.toString(), true)}
                      className="text-sm sm:text-lg p-1 sm:p-2 border rounded-lg w-16 sm:w-20 text-center cursor-pointer"
                    >
                      {tax}
                    </span>
                    <button
                      onClick={() => setTax((prev) => prev + 1)}
                      className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Discount (Rs.):
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() =>
                        setBillDiscount((prev) => Math.max(prev - 100, 0))
                      }
                      className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                    >
                      <Minus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <span
                      ref={discountInputRef}
                      onClick={() =>
                        openKeyboard("discount", billDiscount.toString(), true)
                      }
                      className="text-sm sm:text-lg p-1 sm:p-2 border rounded-lg w-16 sm:w-20 text-center cursor-pointer"
                    >
                      {billDiscount}
                    </span>
                    <button
                      onClick={() => setBillDiscount((prev) => prev + 100)}
                      className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Sub Total (MRP):</span>
                    <span>
                      Rs.{" "}
                      {formatNumberWithCommas(totals.subTotalMRP.toFixed(2))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-red-600">
                    <span>(-) Item Discounts:</span>
                    <span>
                      Rs.{" "}
                      {formatNumberWithCommas(
                        totals.totalItemDiscounts.toFixed(2)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Net Item Total:</span>
                    <span>
                      Rs.{" "}
                      {formatNumberWithCommas(
                        totals.grandTotalBeforeAdjustments.toFixed(2)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-yellow-600">
                    <span>(+) Tax ({parseFloat(tax || 0).toFixed(1)}%):</span>
                    <span>
                      Rs. {formatNumberWithCommas(totals.taxAmount.toFixed(2))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-red-600">
                    <span>(-) Bill Discount:</span>
                    <span>
                      Rs.{" "}
                      {formatNumberWithCommas(
                        totals.totalBillDiscount.toFixed(2)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm sm:text-lg">
                    <span>Grand Total:</span>
                    <span>
                      Rs. {formatNumberWithCommas(totals.finalTotal.toFixed(2))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white pt-2 sm:pt-4">
            <div className="flex gap-1 sm:gap-2">
              <button
                className="flex-1 p-2 sm:p-4 bg-pink-500 text-white rounded-lg text-sm sm:text-lg flex items-center justify-center gap-2"
                onClick={holdSale}
                disabled={products.length === 0}
              >
                <FaPause /> Hold
              </button>
              <button
                className="flex-1 p-2 sm:p-4 bg-red-500 text-white rounded-lg text-sm sm:text-lg flex items-center justify-center gap-2"
                onClick={() => resetPOS(false)}
              >
                <FaRedo /> Reset
              </button>
              <button
                className="flex-1 p-2 sm:p-4 bg-green-500 text-white rounded-lg text-sm sm:text-lg flex items-center justify-center gap-2"
                onClick={handleOpenBill}
                disabled={products.length === 0}
              >
                <FaCreditCard /> Pay Now
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Product Selection */}
        <div className="p-2 sm:p-4 bg-white rounded-lg shadow-lg flex flex-col">
          {/* Search Bar */}
          <input
            ref={searchInputRef}
            type="text"
            className="w-full p-2 sm:p-4 border rounded-lg mb-2 sm:mb-4 text-sm sm:text-lg"
            placeholder="Scan/Search by Code/Name"
            value={searchQuery}
            onFocus={() => openKeyboard("search", searchQuery, false)}
            readOnly
            disabled={loadingItems || loadingSchemes}
          />
          {(loadingItems || loadingSchemes) && (
            <span className="text-xs text-gray-500">Loading...</span>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4">
            <button
              className="p-2 sm:p-3 bg-blue-500 text-white rounded-lg"
              onClick={() => alert("Feature Coming Soon")}
            >
              <ClipboardList size={20} className="sm:w-7 sm:h-7" />
            </button>
            <button
              className="p-2 sm:p-3 bg-red-500 text-white rounded-lg"
              onClick={() => navigate("/pos")}
            >
              <LogOut size={20} className="sm:w-7 sm:h-7" />
            </button>
            <button
              className="p-2 sm:p-3 bg-green-500 text-white rounded-lg"
              onClick={toggleFullScreen}
            >
              {isFullScreen ? (
                <Minimize size={20} className="sm:w-7 sm:h-7" />
              ) : (
                <Maximize size={20} className="sm:w-7 sm:h-7" />
              )}
            </button>
            <button
              className="p-2 sm:p-3 bg-purple-500 text-white rounded-lg"
              onClick={() => setShowCalculatorModal(true)}
            >
              <Calculator size={20} className="sm:w-7 sm:h-7" />
            </button>
            <button
              className="p-2 sm:p-3 bg-yellow-500 text-white rounded-lg"
              onClick={() => navigate("/Dashboard")}
            >
              <LayoutDashboard size={20} className="sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="mb-2 sm:mb-4">
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg ${selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                    }`}
                  onClick={() => {
                    setSelectedCategory(category);
                    debouncedSearch(searchQuery, category, selectedBrand);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-2 sm:mb-4">
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {brands.map((brand) => (
                <button
                  key={brand}
                  className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg ${selectedBrand === brand
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                    }`}
                  onClick={() => {
                    setSelectedBrand(brand);
                    debouncedSearch(searchQuery, selectedCategory, brand);
                  }}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Product Results */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 max-h-[50vh] sm:max-h-[60vh] overflow-auto">
            {searchResults.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No products found.
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  className={`
                    relative p-2 sm:p-3 rounded-xl shadow-lg cursor-pointer 
                    border-4 border-purple-600 
                    ${categoryColors[item.category] ||
                    "bg-gradient-to-br from-gray-50 to-gray-100"
                    }
                    hover:shadow-xl hover:border-purple-800 
                    active:scale-95 transition-all duration-200
                    flex flex-col justify-between min-h-[140px] sm:min-h-[160px]
                  `}
                  onClick={() => addProductToTable(item)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col">
                      <div className="text-xs sm:text-sm font-semibold text-green-700">
                        {formatNumberWithCommas(
                          applyDiscountScheme(item, saleType, activeSchemes)
                        )}{" "}
                        Rs.
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600">
                        {item.category}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-xs sm:text-sm font-semibold text-blue-700">
                        Qty: {item.stock}
                      </div>
                      {item.stock < 10 && (
                        <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full mt-0.5">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center mb-1">
                    <img
                      src={item.image || "https://via.placeholder.com/50"}
                      alt={item.product_name}
                      className="h-10 sm:h-12 rounded-lg shadow-md object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <h3
                      className="text-center font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 hover:line-clamp-none"
                      title={item.product_name}
                    >
                      {item.product_name}
                    </h3>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                      Barcode: {item.barcode}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBillModal && (
        <BillPrintModal
          initialProducts={products}
          initialBillDiscount={parseFloat(billDiscount || 0)}
          initialTax={parseFloat(tax || 0)}
          initialShipping={parseFloat(shipping || 0)}
          initialTotals={totals}
          initialCustomerInfo={{ ...customerInfo, bill_number: billNumber }}
          onClose={closeBillModal}
          openKeyboard={openKeyboard}
        />
      )}
      {showCalculatorModal && (
        <CalculatorModal
          isOpen={showCalculatorModal}
          onClose={() => setShowCalculatorModal(false)}
        />
      )}
      {showNotification && (
        <Notification
          message={`Delete item "${products[pendingDeleteIndex]?.product_name ?? "this item"
            }"?`}
          onClose={cancelDelete}
        >
          <button
            onClick={confirmDelete}
            className="p-2 sm:p-3 bg-red-600 text-white rounded-lg text-sm sm:text-lg"
          >
            Yes
          </button>
          <button
            onClick={cancelDelete}
            className="p-2 sm:p-3 bg-gray-400 text-white rounded-lg text-sm sm:text-lg"
          >
            No
          </button>
        </Notification>
      )}

      {/* Virtual Keyboard */}
      {showKeyboard && (
        <VirtualKeyboard
          value={keyboardValue}
          onChange={handleKeyboardChange}
          onClose={closeKeyboard}
          isNumericOnly={isNumericKeyboard}
        />
      )}
    </div>
  );
};

export default TOUCHPOSFORM;
