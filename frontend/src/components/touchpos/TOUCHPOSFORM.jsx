import React, { useState, useEffect, useRef } from "react";
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
  PauseCircle,
  RefreshCw,
  Printer,
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

// Default products for demo purposes (expanded for demo)
const defaultProducts = [
  {
    id: 1,
    product_name: "Anchor 400g",
    barcode: "12345",
    sales_price: 10000,
    wholesale_price: 9500,
    mrp: 10500,
    stock: 17,
    category: "Milk Powder",
    brand: "Anchor",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 2,
    product_name: "Nestle Milk 500g",
    barcode: "67890",
    sales_price: 12000,
    wholesale_price: 11000,
    mrp: 12500,
    stock: 25,
    category: "Milk Powder",
    brand: "Nestle",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 3,
    product_name: "Pepsi 1L",
    barcode: "54321",
    sales_price: 5000,
    wholesale_price: 4500,
    mrp: 5500,
    stock: 50,
    category: "Beverages",
    brand: "Pepsi",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 4,
    product_name: "Coca-Cola 1L",
    barcode: "98765",
    sales_price: 5200,
    wholesale_price: 4700,
    mrp: 5600,
    stock: 40,
    category: "Beverages",
    brand: "Coca-Cola",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 5,
    product_name: "Lays Chips 50g",
    barcode: "11223",
    sales_price: 2000,
    wholesale_price: 1800,
    mrp: 2200,
    stock: 60,
    category: "Snacks",
    brand: "Lays",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 6,
    product_name: "KitKat 40g",
    barcode: "44556",
    sales_price: 3000,
    wholesale_price: 2800,
    mrp: 3200,
    stock: 30,
    category: "Chocolates",
    brand: "Nestle",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 7,
    product_name: "Maggi Noodles 70g",
    barcode: "55667",
    sales_price: 1500,
    wholesale_price: 1300,
    mrp: 1600,
    stock: 70,
    category: "Instant Food",
    brand: "Nestle",
    image: "https://via.placeholder.com/50",
  },
  {
    id: 8,
    product_name: "Sprite 1L",
    barcode: "22334",
    sales_price: 5100,
    wholesale_price: 4600,
    mrp: 5400,
    stock: 35,
    category: "Beverages",
    brand: "Sprite",
    image: "https://via.placeholder.com/50",
  },
];

// Virtual Keyboard Component
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
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(defaultProducts);
  const [items, setItems] = useState([]);
  const [tax, setTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
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

  // State for virtual keyboard
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState(null);
  const [keyboardValue, setKeyboardValue] = useState("");
  const [isNumericKeyboard, setIsNumericKeyboard] = useState(false);
  const [editingBarcodeIndex, setEditingBarcodeIndex] = useState(null);

  // State for category and brand filters
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");

  // Scroll the active input into view when the keyboard opens
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

  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Fetch bill number and setup customer search
  useEffect(() => {
    // Fetch and search customers
    const fetchCustomers = async (searchTerm = '') => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/customers",
          { params: { search: searchTerm } }
        );
        return response.data.data || [];
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    };

    // Debounced customer search
    const debouncedCustomerSearch = debounce(async (query) => {
      if (query.trim() === "") {
        setCustomerSearchResults([]);
        return;
      }
      const results = await fetchCustomers(query);
      setCustomerSearchResults(results);
    }, 300);

    const handleCustomerSearch = (query) => {
      setCustomerSearchQuery(query);
      debouncedCustomerSearch(query);
    };

    const selectCustomer = (customer) => {
      setCustomerInfo({
        ...customerInfo,
        name: customer.name,
        mobile: customer.phone,
      });
      setCustomerSearchQuery("");
      setCustomerSearchResults([]);
      setShowCustomerSearch(false);
    };

    // Enhanced bill number generation with better error handling
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
        // Fallback to local bill number generation with timestamp
        const timestamp = Date.now();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setBillNumber(`BILL-${timestamp}-${randomNum}`);
      }
    };

    fetchNextBillNumber();
  }, []);

  // Fetch products
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

  // Debounced search
  const debouncedSearch = debounce((query, category, brand) => {
    let filtered = items.length > 0 ? items : defaultProducts;

    if (category !== "All Categories") {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (brand !== "All Brands") {
      filtered = filtered.filter((item) => item.brand === brand);
    }

    if (query.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          (item.product_name &&
            item.product_name.toLowerCase().includes(query.toLowerCase())) ||
          (item.item_code && item.item_code.includes(query)) ||
          (item.barcode && item.barcode.includes(query))
      );
    }

    setSearchResults(filtered);
  }, 300);

  const handleSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query, selectedCategory, selectedBrand);
  };

  // Update product prices based on sale type
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

  // Add product to bill and decrease stock
  const addProductToTable = (item) => {
    const price =
      saleType === "Wholesale" ? item.wholesale_price : item.sales_price;
    const discountPerUnit = Math.max(item.mrp - price, 0);

    if (1 > item.stock) {
      alert(`Insufficient stock! Only ${item.stock} available.`);
      return;
    }

    const existingProductIndex = products.findIndex(
      (product) => product.product_name === item.product_name
    );

    const qtyToAdd = 1;

    if (existingProductIndex >= 0) {
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].qty += qtyToAdd;
      updatedProducts[existingProductIndex].total =
        updatedProducts[existingProductIndex].qty * price -
        updatedProducts[existingProductIndex].qty * discountPerUnit;
      updatedProducts[existingProductIndex].discount = discountPerUnit;

      setProducts(updatedProducts);
    } else {
      const newProduct = {
        ...item,
        qty: qtyToAdd,
        price: price,
        total: price * qtyToAdd - discountPerUnit,
        discount: discountPerUnit,
        serialNumber: products.length + 1,
      };

      setProducts([...products, newProduct]);
    }

    setSearchResults((prevResults) =>
      prevResults.map((result) =>
        result.id === item.id
          ? { ...result, stock: result.stock - qtyToAdd }
          : result
      )
    );

    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === item.id ? { ...i, stock: i.stock - qtyToAdd } : i
      )
    );

    setSearchQuery("");
  };

  // Update product quantity with touch-friendly buttons
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

  const updateProductQuantity = (index, newQty) => {
    const parsedQty = parseFloat(newQty) || 0;
    const product = products[index];
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
      setSearchResults((prevResults) =>
        prevResults.map((result) =>
          result.id === product.id
            ? { ...result, stock: result.stock - stockDifference }
            : result
        )
      );

      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === product.id ? { ...i, stock: i.stock - stockDifference } : i
        )
      );
    }
  };

  // Delete product and restore stock
  const handleDeleteClick = (index) => {
    setPendingDeleteIndex(index);
    setShowNotification(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      const productToDelete = products[pendingDeleteIndex];
      const qtyToRestore = productToDelete.qty || 0;

      setSearchResults((prevResults) =>
        prevResults.map((result) =>
          result.id === productToDelete.id
            ? { ...result, stock: result.stock + qtyToRestore }
            : result
        )
      );

      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === productToDelete.id
            ? { ...i, stock: i.stock + qtyToRestore }
            : i
        )
      );

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

  // Calculate totals
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
    const total = subTotal + taxAmount - totalDiscount;

    return {
      totalQty,
      subTotal,
      totalItemDiscounts,
      totalDiscount,
      taxAmount,
      total,
    };
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullScreen((prev) => !prev);
  };

  // Hold sale
  const holdSale = () => {
    const saleId = `BILL-${Date.now()}`;
    const saleData = {
      saleId,
      products,
      totals: calculateTotals(),
      tax,
      billDiscount,
    };
    localStorage.setItem(saleId, JSON.stringify(saleData));
    alert(`Sale held with ID: ${saleId}`);
  };

  // Open bill modal
  const handelOpenBill = () => {
    setShowBillModal(true);
    const newBillNumber = generateNextBillNumber(billNumber);
    setBillNumber(newBillNumber);
    setCustomerInfo((prevState) => ({
      ...prevState,
      bill_number: newBillNumber,
      receivedAmount: 0,
    }));
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setCustomerInfo({
      name: "",
      mobile: "",
      bill_number: "",
      userId: "U-1",
      receivedAmount: 0,
    });
  };

  const generateNextBillNumber = (currentBill) => {
    const num = parseInt(currentBill.replace(/\D/g, "")) + 1;
    return `BILL-${num.toString().padStart(4, "0")}`;
  };

  // Touch-friendly increment/decrement for tax and discount
  const incrementTax = () => setTax((prev) => prev + 1);
  const decrementTax = () => setTax((prev) => Math.max(prev - 1, 0));
  const incrementDiscount = () => setBillDiscount((prev) => prev + 100);
  const decrementDiscount = () =>
    setBillDiscount((prev) => Math.max(prev - 100, 0));

  // Handle keyboard open/close
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
    } else if (keyboardTarget === "customerName") {
      setCustomerInfo((prev) => ({ ...prev, name: newValue }));
    } else if (keyboardTarget === "customerMobile") {
      setCustomerInfo((prev) => ({ ...prev, mobile: newValue }));
    } else if (keyboardTarget === "receivedAmount") {
      setCustomerInfo((prev) => ({
        ...prev,
        receivedAmount: parseFloat(newValue) || 0,
      }));
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

  // Sample categories and brands
  const categories = [
    "All Categories",
    "Milk Powder",
    "Beverages",
    "Snacks",
    "Chocolates",
    "Instant Food",
  ];
  const brands = [
    "All Brands",
    "Anchor",
    "Nestle",
    "Pepsi",
    "Coca-Cola",
    "Lays",
    "Sprite",
  ];

  // Define category-based background colors
  const categoryColors = {
    "Milk Powder": "bg-gradient-to-br from-blue-50 to-blue-100",
    Beverages: "bg-gradient-to-br from-green-50 to-green-100",
    Snacks: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    Chocolates: "bg-gradient-to-br from-pink-50 to-pink-100",
    "Instant Food": "bg-gradient-to-br from-orange-50 to-orange-100",
  };

  return (
    <div
      className={`min-h-screen w-full p-2 sm:p-4 flex flex-col ${isFullScreen ? "fullscreen-mode" : ""
        }`}
    >
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[40%_60%] gap-2 sm:gap-4">
        {/* Left Side: Billing System (40%) */}
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
                    Product
                  </th>
                  <th className="p-1 sm:p-2 text-center text-xs sm:text-sm">
                    Qty
                  </th>
                  <th className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                    Price
                  </th>
                  <th className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                    Sub Total
                  </th>
                  <th className="p-1 sm:p-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-b">
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
                      {formatNumberWithCommas(product.price)}
                    </td>
                    <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">
                      {formatNumberWithCommas(
                        (product.qty * product.price).toFixed(2)
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Spacer to create a smaller blank gap */}
          <div className="min-h-[100px] sm:min-h-[150px]"></div>

          {/* Totals Section (Left-Right Structure) */}
          <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Left: Total Quantity */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm sm:text-lg font-semibold">
                <span>Total Quantity:</span>
                <span>
                  {formatNumberWithCommas(
                    calculateTotals().totalQty.toFixed(1)
                  )}
                </span>
              </div>
            </div>

            {/* Right: Tax, Discount Inputs and Totals */}
            <div className="flex-1 space-y-2 sm:space-y-3">
              {/* Tax and Discount Inputs */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Tax (%):
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={decrementTax}
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
                      onClick={incrementTax}
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
                      onClick={decrementDiscount}
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
                      onClick={incrementDiscount}
                      className="p-1 sm:p-2 bg-gray-300 rounded-lg"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="p-2 sm:p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Sub Total:</span>
                    <span>
                      {formatNumberWithCommas(
                        calculateTotals().subTotal.toFixed(2)
                      )}{" "}
                      Rs.
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Discount:</span>
                    <span>
                      {formatNumberWithCommas(
                        calculateTotals().totalDiscount.toFixed(2)
                      )}{" "}
                      Rs.
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Tax:</span>
                    <span>
                      {formatNumberWithCommas(
                        calculateTotals().taxAmount.toFixed(2)
                      )}{" "}
                      Rs.
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm sm:text-lg">
                    <span>Grand Total:</span>
                    <span>
                      {formatNumberWithCommas(
                        calculateTotals().total.toFixed(2)
                      )}{" "}
                      Rs.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer to ensure buttons stay at the bottom */}
          <div className="flex-1"></div>

          {/* Action Buttons at Bottom of Left Side */}
          {/* <div className="sticky bottom-0 bg-white pt-2 sm:pt-4">
            <div className="flex gap-1 sm:gap-2">
              <button
                className="flex-1 p-2 sm:p-4 bg-pink-500 text-white rounded-lg text-sm sm:text-lg"
                onClick={holdSale}
              >
                Hold
              </button>
              <button
                className="flex-1 p-2 sm:p-4 bg-red-500 text-white rounded-lg text-sm sm:text-lg"
                onClick={() => {
                  setProducts([]);
                  setTax(0);
                  setBillDiscount(0);
                }}
              >
                Reset
              </button>
              <button
                className="flex-1 p-2 sm:p-4 bg-green-500 text-white rounded-lg text-sm sm:text-lg"
                onClick={handelOpenBill}
              >
                Pay Now
              </button>
            </div>
          </div> */}

          <div className="sticky bottom-0 bg-white pt-2 sm:pt-4">
            <div className="flex gap-1 sm:gap-2">
              <button
                className="flex-1 p-2 sm:p-4 bg-pink-500 text-white rounded-lg text-sm sm:text-lg flex items-center justify-center gap-2"
                onClick={holdSale}
              >
                <FaPause /> Hold
              </button>
              <button
                className="flex-1 p-2 sm:p-4 bg-red-500 text-white rounded-lg text-sm sm:text-lg flex items-center justify-center gap-2"
                onClick={() => {
                  setProducts([]);
                  setTax(0);
                  setBillDiscount(0);
                }}
              >
                <FaRedo /> Reset
              </button>
              <button
                className="flex-1 p-2 sm:p-4 bg-green-500 text-white rounded-lg text-sm sm:text-lg flex items-center justify-center gap-2"
                onClick={handelOpenBill}
              >
                <FaCreditCard /> Pay Now
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Product Selection (60%) */}
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
          />

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
            {searchResults.map((item) => (
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
                {/* Top Section: Price, Stock, and Category */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col">
                    <div className="text-xs sm:text-sm font-semibold text-green-700">
                      {formatNumberWithCommas(item.sales_price)} Rs.
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

                {/* Middle Section: Image */}
                <div className="flex justify-center mb-1">
                  <img
                    src={item.image}
                    alt={item.product_name}
                    className="h-10 sm:h-12 rounded-lg shadow-md object-cover"
                  />
                </div>

                {/* Bottom Section: Product Name and Barcode */}
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
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBillModal && (
        <BillPrintModal
          initialProducts={products || []}
          initialBillDiscount={billDiscount || 0}
          initialCustomerInfo={{ ...customerInfo, bill_number: billNumber }}
          total={calculateTotals().total}
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
          message="Are you sure you want to delete this product?"
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
