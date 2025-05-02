import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
} from "lucide-react";
import BillPrintModal from "../models/BillPrintModel.jsx";
import Notification from "../notification/Notification.jsx";
import { formatNumberWithCommas } from "../../utils/numberformat";
import CalculatorModal from "../models/calculator/CalculatorModal.jsx";
import HeldSalesList from "../pos/HeldSalesList";  // Import HeldSalesList component
import { useRegister } from "../../hooks/useRegister";
import RegisterModal from "../models/registerModel.jsx";

// Helper Function to Apply Discount Schemes
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

  if (!bestScheme || maxDiscountValue <= 0) {
    const categorySchemes = schemes.filter(
      (s) => s.applies_to === "category" && s.target === product.category_name
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

const TOUCHPOSFORM = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saleType, setSaleType] = useState("Retail");
  const [products, setProducts] = useState([]); // Products in the bill
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [items, setItems] = useState([]); // All available products
  const [activeSchemes, setActiveSchemes] = useState([]);
  const [tax, setTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
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
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [filterError, setFilterError] = useState(null); // For filter error messages
  const [user, setUser] = useState(null); // User state for authentication
  const terminalId = "T-1"; // Default terminal ID
  const userId = 1; // Default user ID

  const {
    isRegisterOpen,
    showRegisterModal,
    isClosingRegister,
    setShowRegisterModal,
    openRegister,
    closeRegister,
    handleLogoutClick,
    cashOnHand,
    setCashOnHand
  } = useRegister(user);

  const handleLogout = () => {
    const canLogout = handleLogoutClick();
    if (canLogout) {
      // Perform actual logout
      navigate("/login");
    }
  };

  // Load held sales from backend API
  const loadHeldSales = useCallback(async () => {
    setLoadingHeldSales(true);
    try {
      const response = await axios.get("/api/holds", {
        params: { terminal_id: terminalId, status: "held" },
      });
      if (response.data.status === "success") {
        setHeldSales(response.data.data);
      } else {
        alert("Failed to load held sales: " + (response.data.message || "Unknown error"));
        setHeldSales([]);
      }
    } catch (error) {
      console.error("Error loading held sales:", error);
      setHeldSales([]);
    } finally {
      setLoadingHeldSales(false);
    }
  }, [terminalId]);

  // Open held sales list modal
  const openHeldSalesList = () => {
    loadHeldSales();
    setShowHeldSalesList(true);
  };

  // Close held sales list modal
  const closeHeldSalesList = () => {
    setShowHeldSalesList(false);
  };

  // Recall a held sale by hold_id
  const recallHeldSale = async (hold_id) => {
    try {
      const response = await axios.post(`/api/holds/${hold_id}/recall`);
      if (response.data.status === "success") {
        const sale = response.data.data;
        setProducts(sale.products || []);
        setTax(sale.tax || 0);
        setBillDiscount(sale.billDiscount || 0);
        setShipping(sale.shipping || 0);
        setSaleType(sale.saleType || "Retail");
        setCustomerInfo(sale.customerInfo || { name: "", mobile: "", bill_number: "", userId: "U-1", receivedAmount: 0 });
        setBillNumber(sale.billNumber || "");
        // Remove recalled sale from heldSales list immediately
        setHeldSales((prevHeldSales) => prevHeldSales.filter(s => s.hold_id !== hold_id));
        setShowHeldSalesList(false);
        alert(`Recalled sale with ID: ${hold_id}`);
      } else {
        alert("Failed to recall sale: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error recalling sale:", error);
      alert("Failed to recall sale. Check console for details.");
    }
  };

  // Delete a held sale by hold_id
  const deleteHeldSale = async (hold_id) => {
    try {
      const response = await axios.delete(`/api/holds/${hold_id}`);
      if (response.data.status === "success") {
        alert("Held sale deleted successfully");
        loadHeldSales();
      } else {
        alert("Failed to delete held sale: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting held sale:", error);
      alert("Failed to delete held sale. Check console for details.");
    }
  };

  // New states for held sales
  const [heldSales, setHeldSales] = useState([]);
  const [loadingHeldSales, setLoadingHeldSales] = useState(false);
  const [showHeldSalesList, setShowHeldSalesList] = useState(false);

  // Category and brand states
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories"); // Use name for filtering
  const [selectedBrand, setSelectedBrand] = useState("All Brands"); // Use name for filtering

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

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await axios.get(
          "http://127.0.0.1:8000/api/categories"
        );
        const fetchedCategories = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        console.log("Fetched Categories:", fetchedCategories);
        setCategories([
          { id: 0, name: "All Categories" },
          ...fetchedCategories,
        ]);
        if (fetchedCategories.length === 0) {
          setFilterError("No categories available.");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setFilterError("Failed to load categories.");
        setCategories([{ id: 0, name: "All Categories" }]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Products and Derive Brands
  useEffect(() => {
    setLoadingItems(true);
    setLoadingBrands(true);
    axios
      .get("http://127.0.0.1:8000/api/products")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          const productsWithOpeningStock = response.data.data.map((p) => ({
            ...p,
            id: p.product_id,
            stock: parseFloat(p.opening_stock_quantity || 0),
            category_name: p.category || "Unknown Category", // Map category to category_name
            brand_name: p.supplier || "Unknown Brand", // Use supplier as brand_name
          }));
          console.log("Fetched Products:", productsWithOpeningStock);
          setItems(productsWithOpeningStock);
          setSearchResults(productsWithOpeningStock);

          // Derive categories and brands from products
          const uniqueCategories = [
            { id: 0, name: "All Categories" },
            ...[
              ...new Set(productsWithOpeningStock.map((p) => p.category_name)),
            ]
              .filter((name) => name && name !== "Unknown Category")
              .map((name, index) => ({
                id: index + 1,
                name,
              })),
          ];
          const uniqueBrands = [
            { id: 0, name: "All Brands" },
            ...[...new Set(productsWithOpeningStock.map((p) => p.brand_name))]
              .filter((name) => name && name !== "Unknown Brand")
              .map((name, index) => ({
                id: index + 1,
                name,
              })),
          ];
          console.log("Derived Categories:", uniqueCategories);
          console.log("Derived Brands:", uniqueBrands);
          setCategories(uniqueCategories);
          setBrands(uniqueBrands);
          if (uniqueCategories.length === 1) {
            setFilterError("No categories available.");
          }
          if (uniqueBrands.length === 1) {
            setFilterError((prev) =>
              prev ? `${prev} No brands available.` : "No brands available."
            );
          }
        } else {
          console.error("Unexpected product data format:", response.data);
          setFilterError("Invalid product data format.");
          setItems([]);
          setSearchResults([]);
          setCategories([{ id: 0, name: "All Categories" }]);
          setBrands([{ id: 0, name: "All Brands" }]);
        }
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setFilterError("Failed to load products.");
        setItems([]);
        setSearchResults([]);
        setCategories([{ id: 0, name: "All Categories" }]);
        setBrands([{ id: 0, name: "All Brands" }]);
      })
      .finally(() => {
        setLoadingItems(false);
        setLoadingBrands(false);
      });
  }, []);

  const calculateClosingDetails = () => {
    const totals = calculateTotals();
    return {
      salesAmount: totals.finalTotal,
      totalSalesQty: totals.totalQty,
      cashOnHand: cashOnHand,
      inCashierAmount: 0, // Will be filled by user
      otherAmount: 0 // Will be filled by user
    };
  };

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

  // Debounced Search with Name-based Filtering
  const debouncedSearch = useMemo(
    () =>
      debounce((query, categoryName, brandName) => {
        console.log("Filtering with:", { query, categoryName, brandName });
        if (!Array.isArray(items)) {
          console.warn("Items array is invalid:", items);
          setSearchResults([]);
          setFilterError("No products available to filter.");
          return;
        }

        let filtered = [...items];

        // Filter by category_name
        if (categoryName !== "All Categories") {
          filtered = filtered.filter(
            (item) => item.category_name === categoryName
          );
        }

        // Filter by brand_name
        if (brandName !== "All Brands") {
          filtered = filtered.filter((item) => item.brand_name === brandName);
        }

        // Apply search query
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

        console.log("Filtered Results:", filtered);
        setSearchResults(filtered);
        setFilterError(
          filtered.length === 0 ? "No products match the filters." : null
        );
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

  // First declare resetPOS before holdSale
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
      setSelectedCategory("All Categories");
      setSelectedBrand("All Brands");
      setFilterError(null);

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
  const holdSale = useCallback(async () => {
    if (products.length === 0) {
      alert("Cannot hold an empty sale.");
      return;
    }
    const currentTotals = calculateTotals();
    const saleData = {
      products,
      totals: currentTotals,
      tax,
      billDiscount,
      shipping,
      saleType,
      customerInfo,
      billNumber,
    };
    try {
      const response = await axios.post("/api/holds", {
        terminal_id: "T-1",
        user_id: 1,
        sale_data: saleData,
      });
      if (response.data.status === "success") {
        alert(`Sale held successfully with ID: ${response.data.data.hold_id}`);
        resetPOS(false);
        loadHeldSales();
      } else {
        alert("Failed to hold sale: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error holding sale:", error);
      alert("Failed to hold sale. Check console for details.");
    }
  }, [products, calculateTotals, tax, billDiscount, shipping, saleType, customerInfo, billNumber, resetPOS, loadHeldSales]);

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

  // Category Colors
  const categoryColors = {
    Milk: "bg-gradient-to-br from-blue-50 to-blue-100",
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
            {/* Add HeldSalesList modal here */}
            {showHeldSalesList && (
              <HeldSalesList
                heldSales={heldSales}
                loading={loadingHeldSales}
                onRecall={recallHeldSale}
                onDelete={deleteHeldSale}
                onClose={closeHeldSalesList}
              />
            )}
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
                          <span className="text-xs text-gray-500">
                            Barcode: {product.barcode}
                          </span>
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
          <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm sm:text-lg font-semibold">
                <span>Total Quantity:</span>
                <span>
                  {formatNumberWithCommas(totals.totalQty.toFixed(1))}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 min-w-fit">
                <div className="flex-shrink-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 whitespace-normal">
                    Tax (%):
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setTax((prev) => Math.max(prev - 1, 0))}
                      className="p-2 sm:p-3 bg-gray-300 rounded-lg"
                    >
                      <Minus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <input
                      ref={taxInputRef}
                      type="number"
                      value={tax}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTax(value === "" ? 0 : parseFloat(value) || 0);
                      }}
                      className="text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg bg-white w-20 sm:w-24 text-center focus:ring-2 focus:ring-blue-500 transition-colors placeholder-gray-400 placeholder-opacity-75 placeholder-italic"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 5.0%"
                      aria-label="Tax percentage"
                    />
                    <button
                      onClick={() => setTax((prev) => prev + 1)}
                      className="p-2 sm:p-3 bg-gray-300 rounded-lg"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 whitespace-normal">
                    Discount (Rs.):
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() =>
                        setBillDiscount((prev) => Math.max(prev - 100, 0))
                      }
                      className="p-2 sm:p-3 bg-gray-300 rounded-lg"
                    >
                      <Minus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <input
                      ref={discountInputRef}
                      type="number"
                      value={billDiscount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBillDiscount(
                          value === "" ? 0 : parseFloat(value) || 0
                        );
                      }}
                      className="text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-lg bg-white w-20 sm:w-24 text-center focus:ring-2 focus:ring-blue-500 transition-colors placeholder-gray-400 placeholder-opacity-75 placeholder-italic"
                      min="0"
                      step="1"
                      placeholder="e.g., 100 Rs."
                      aria-label="Bill discount amount"
                    />
                    <button
                      onClick={() => setBillDiscount((prev) => prev + 100)}
                      className="p-2 sm:p-3 bg-gray-300 rounded-lg"
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
            className="w-full p-2 sm:p-4 border rounded-lg mb-2 sm:mb-4 text-sm sm:text-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Scan/Search by Code/Name"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={
              loadingItems ||
              loadingSchemes ||
              loadingCategories ||
              loadingBrands
            }
          />
          {(loadingItems ||
            loadingSchemes ||
            loadingCategories ||
            loadingBrands) && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}

          {/* Action Buttons */}
          <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4">
            <button
              className="p-2 sm:p-3 bg-blue-500 text-white rounded-lg"
              onClick={openHeldSalesList}
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
                  key={category.id}
                  className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg ${selectedCategory === category.name
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                    }`}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    debouncedSearch(searchQuery, category.name, selectedBrand);
                  }}
                  disabled={loadingCategories}
                >
                  {category.name}
                </button>
              ))}
            </div>
            {loadingCategories && (
              <span className="text-xs text-gray-500">
                Loading categories...
              </span>
            )}
          </div>

          {/* Brand Filter */}
          <div className="mb-2 sm:mb-4">
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg ${selectedBrand === brand.name
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                    }`}
                  onClick={() => {
                    setSelectedBrand(brand.name);
                    debouncedSearch(searchQuery, selectedCategory, brand.name);
                  }}
                  disabled={loadingBrands}
                >
                  {brand.name}
                </button>
              ))}
            </div>
            {loadingBrands && (
              <span className="text-xs text-gray-500">Loading brands...</span>
            )}
          </div>

          {/* Reset Filters Button */}
          <div className="mb-2 sm:mb-4">
            <button
              className="p-2 sm:p-3 bg-gray-500 text-white rounded-lg text-sm sm:text-lg"
              onClick={() => {
                setSelectedCategory("All Categories");
                setSelectedBrand("All Brands");
                setSearchQuery("");
                debouncedSearch("", "All Categories", "All Brands");
              }}
            >
              Reset Filters
            </button>
          </div>

          {/* Error Message */}
          {filterError && (
            <div className="text-red-500 text-sm mb-2">{filterError}</div>
          )}

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
                    border-4 border-black
                    ${categoryColors[item.category_name] ||
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
                        {item.category_name}
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
                  {/* <div className="flex justify-center mb-1">
                    <img
                      src={item.image || "https://via.placeholder.com/50"}
                      alt={item.product_name}
                      className="h-10 sm:h-12 rounded-lg shadow-md object-cover"
                    />
                  </div> */}
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

    // Fix the register modal rendering
      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onConfirm={isClosingRegister ? closeRegister : openRegister}
          cashOnHand={cashOnHand}
          setCashOnHand={setCashOnHand}
          user={user}
          isClosing={isClosingRegister}
          closingDetails={calculateClosingDetails()} // Add this function
        />
      )}

    </div>
  );
};

export default TOUCHPOSFORM;
