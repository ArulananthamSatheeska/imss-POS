import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import CloseRegisterModal from "../models/CloseRegisterModal.jsx";
import HeldSalesList from "./HeldSalesList.jsx";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import RegisterModal from "../models/registerModel.jsx";
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
import { formatNumberWithCommas } from "../../utils/numberformat.jsx";
import CalculatorModal from "../models/calculator/CalculatorModal.jsx";
import { useRegister } from "../../context/RegisterContext.jsx";
import { useAuth } from "../../context/NewAuthContext.jsx";
import ProductDetailsModal from "../../pages/items/ProductDetailsModal.jsx";

// Helper function to check if date is within discount scheme period
const isDateWithinScheme = (invoiceDate, startDate, endDate) => {
  try {
    const invDate = new Date(invoiceDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return (!start || invDate >= start) && (!end || invDate <= end);
  } catch (e) {
    console.error("Error checking date within scheme:", e);
    return false;
  }
};

// Function to apply discount schemes for products or categories
const applyDiscountScheme = (product, saleType, schemes) => {
  if (!product || !product.product_id || !Array.isArray(schemes)) {
    const fallbackPrice =
      saleType === "Wholesale"
        ? parseFloat(product?.wholesale_price || product?.sales_price || 0)
        : parseFloat(product?.sales_price || 0);
    return { price: Math.max(0, fallbackPrice), schemeName: null };
  }

  const basePrice =
    saleType === "Wholesale"
      ? parseFloat(product.wholesale_price || product.sales_price || 0)
      : parseFloat(product.sales_price || 0);

  if (isNaN(basePrice) || basePrice <= 0) {
    return { price: 0, schemeName: null };
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

  if ((!bestScheme || maxDiscountValue <= 0) && product.category_name) {
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
    return {
      price: Math.max(0, discountedPrice),
      schemeName: bestScheme.name || "Unnamed Scheme",
    };
  }

  return { price: basePrice, schemeName: null };
};

const TOUCHPOSFORM = ({
  initialProducts = [],
  initialBillDiscount = 0,
  initialTax = 0,
  initialShipping = 0,
  initialCustomerInfo = {
    name: "",
    mobile: "",
    bill_number: "",
    userId: "U-1",
  },
  isEditMode = false,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const { registerStatus, openRegister, closeRegister, refreshRegisterStatus } =
    useRegister();
  const terminalId = registerStatus.terminalId || "T-1";
  const userId = user?.id || 1;
  const navigate = useNavigate();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saleType, setSaleType] = useState("Retail");
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [items, setItems] = useState([]);
  const [activeSchemes, setActiveSchemes] = useState([]);
  const [tax, setTax] = useState(initialTax);
  const [billDiscount, setBillDiscount] = useState(initialBillDiscount);
  const [shipping, setShipping] = useState(initialShipping);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState(initialCustomerInfo);
  const [billNumber, setBillNumber] = useState(
    initialCustomerInfo.bill_number || ""
  );
  const [showNotification, setShowNotification] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showHeldSalesList, setShowHeldSalesList] = useState(false);
  const [heldSales, setHeldSales] = useState([]);
  const [loadingHeldSales, setLoadingHeldSales] = useState(false);
  const [holdingSale, setHoldingSale] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isClosingRegister, setIsClosingRegister] = useState(false);
  const [checkedRegisterModal, setCheckedRegisterModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [stockWarning, setStockWarning] = useState("");
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const payButtonRef = useRef(null);

  // Fetch next bill number on component mount if not in edit mode
  useEffect(() => {
    if (!isEditMode) {
      const fetchNextBillNumber = async () => {
        try {
          const token = user?.token;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.get(
            "http://127.0.0.1:8000/api/next-bill-number",
            { headers }
          );
          setBillNumber(response.data.next_bill_number);
          setCustomerInfo((prev) => ({
            ...prev,
            bill_number: response.data.next_bill_number,
          }));
        } catch (error) {
          console.error("Error fetching next bill number:", error);
          setBillNumber("ERR-001");
        }
      };
      fetchNextBillNumber();
    }
  }, [isEditMode, user]);

  // Fetch products
  useEffect(() => {
    setLoadingItems(true);
    axios
      .get("http://127.0.0.1:8000/api/products")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          const productsWithOpeningStock = response.data.data.map((p) => {
            const categoryName = p.category || p.category_name || "Unknown";
            if (categoryName === "Unknown") {
              console.warn(
                `Missing category_name for product: ${p.product_name} (category_id: ${p.category_id})`
              );
            }
            return {
              ...p,
              stock: parseFloat(p.opening_stock_quantity || 0),
              category_name: categoryName,
              sales_price: parseFloat(p.sales_price || 0),
              mrp: parseFloat(p.mrp || 0),
              supplier: p.supplier || "N/A",
              store_location: p.store_location || "N/A",
            };
          });
          setItems(productsWithOpeningStock);
          console.log("Fetched Products:", productsWithOpeningStock);
        } else {
          console.error("Unexpected product data format:", response.data);
          setItems([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setItems([]);
      })
      .finally(() => {
        setLoadingItems(false);
      });
  }, []);

  // Fetch discount schemes
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
          console.log("Fetched Active Schemes:", active);
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

  // Apply discounts to products (only for special discounts)
  useEffect(() => {
    if (activeSchemes.length > 0 || !loadingSchemes) {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const { schemeName } = applyDiscountScheme(
            product,
            saleType,
            activeSchemes
          );
          const productWithQty = { ...product, qty: product.qty || 1 };
          const specialDiscount = calculateSpecialDiscount(
            productWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          const unitPrice = parseFloat(product.price || 0);
          const unitDiscount = Math.max(0, (product.mrp || 0) - unitPrice);
          const total =
            salesPrice * product.qty - (unitDiscount + specialDiscount);

          return {
            ...product,
            schemeName: schemeName,
            discount: unitDiscount,
            specialDiscount: specialDiscount,
            total: total >= 0 ? total : 0,
          };
        })
      );
    }
  }, [saleType, activeSchemes, loadingSchemes]);

  // Calculate special discounts
  const calculateSpecialDiscount = useCallback(
    (item, saleType, billDate) => {
      if (!item || !item.product_id) {
        console.warn("No product_id provided for discount calculation");
        return 0;
      }

      const product = items.find((p) => p.product_id === item.product_id);
      if (!product) {
        console.warn(`Product not found for product_id: ${item.product_id}`);
        return 0;
      }

      const categoryName = product.category_name || "Unknown";
      if (categoryName === "Unknown") {
        console.warn(
          `No valid category_name for product: ${product.product_name} (category_id: ${product.category_id})`
        );
      }

      const basePrice =
        saleType === "Wholesale"
          ? parseFloat(product.wholesale_price || product.sales_price || 0)
          : parseFloat(product.sales_price || 0);
      const qty = parseFloat(item.qty) || 1;
      const totalAmount = basePrice * qty;

      const applicableScheme = activeSchemes.find((scheme) => {
        if (
          !scheme.active ||
          !isDateWithinScheme(billDate, scheme.start_date, scheme.end_date)
        ) {
          return false;
        }
        const target = scheme.target?.trim().toLowerCase();
        const productMatch =
          scheme.applies_to === "product" &&
          target ===
            (product.product_name?.trim().toLowerCase() ||
              product.description?.trim().toLowerCase());
        const categoryMatch =
          scheme.applies_to === "category" &&
          categoryName &&
          target === categoryName?.trim().toLowerCase();
        if (productMatch) {
          console.log(
            `Product discount match for ${product.product_name}: Target=${target}, Value=${scheme.value} ${scheme.type}`
          );
        }
        if (categoryMatch) {
          console.log(
            `Category discount match for ${product.product_name} (Category: ${categoryName}): Target=${target}, Value=${scheme.value} ${scheme.type}`
          );
        }
        return productMatch || categoryMatch;
      });

      if (!applicableScheme) {
        console.log(
          `No discount scheme found for ${product.product_name} (Category: ${categoryName})`
        );
        return 0;
      }

      let discount = 0;
      if (applicableScheme.type === "percentage") {
        discount = (totalAmount * parseFloat(applicableScheme.value)) / 100;
      } else if (applicableScheme.type === "amount") {
        discount = parseFloat(applicableScheme.value) * qty;
      }

      console.log(
        `Applied ${applicableScheme.applies_to} discount for ${product.product_name}: Target=${applicableScheme.target}, Discount=${discount.toFixed(2)}`
      );
      return discount >= 0 ? discount : 0;
    },
    [items, activeSchemes]
  );

  // Debounced search for products
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (!Array.isArray(items)) {
        setSearchResults([]);
        return;
      }
      if (query.trim() === "") {
        setSearchResults([]);
        setSelectedProduct(null);
        return;
      }
      const lowerCaseQuery = query.toLowerCase();
      const results = items.filter(
        (item) =>
          item &&
          ((item.product_name &&
            item.product_name.toLowerCase().includes(lowerCaseQuery)) ||
            (item.item_code && String(item.item_code).includes(query)) ||
            (item.barcode && String(item.barcode).includes(query)))
      );
      setSearchResults(results);
      setSelectedSearchIndex(results.length > 0 ? 0 : -1);
    }, 300),
    [items]
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedProduct(null);
    debouncedSearch(query);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setQuantity(value);
    }
  };

  const handleKeyDown = (e) => {
    const numSearchResults = searchResults.length;

    if (e.key === "ArrowDown") {
      if (numSearchResults > 0) {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (prev + 1) % numSearchResults);
      }
    } else if (e.key === "ArrowUp") {
      if (numSearchResults > 0) {
        e.preventDefault();
        setSelectedSearchIndex(
          (prev) => (prev - 1 + numSearchResults) % numSearchResults
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (document.activeElement === searchInputRef.current) {
        if (numSearchResults > 0 && selectedSearchIndex >= 0) {
          handleItemSelection(searchResults[selectedSearchIndex]);
        } else if (selectedProduct) {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        } else {
          console.log("Product not found or not selected.");
        }
      } else if (document.activeElement === quantityInputRef.current) {
        const currentQuantity = parseFloat(quantity || 0);
        if (currentQuantity > 0) {
          addProductToTable();
        } else {
          alert("Please enter a valid quantity.");
        }
      }
    }
  };

  const handleItemSelection = (item) => {
    if (!item || !item.product_id) {
      console.error("Invalid item selected:", item);
      return;
    }
    setSelectedProduct({
      ...item,
      supplier: item.supplier || "N/A",
      category: item.category_name || "N/A",
      store_location: item.store_location || "N/A",
    });
    setSearchQuery(item.product_name);
    setSearchResults([]);
    setQuantity(1);
    setSelectedSearchIndex(-1);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  const addProductToTable = () => {
    const currentQuantity = parseFloat(quantity || 0);

    if (!selectedProduct || !selectedProduct.product_id) {
      alert("Please select a valid product first.");
      searchInputRef.current?.focus();
      return;
    }
    if (isNaN(currentQuantity) || currentQuantity <= 0) {
      alert("Please enter a valid quantity greater than 0.");
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
      return;
    }

    const availableStock = parseFloat(selectedProduct.stock || 0);
    if (isNaN(availableStock)) {
      alert(
        `Stock information missing or invalid for ${selectedProduct.product_name}. Cannot add.`
      );
      return;
    }

    const salesPrice = parseFloat(selectedProduct.sales_price || 0);
    const { schemeName } = applyDiscountScheme(
      selectedProduct,
      saleType,
      activeSchemes
    );

    const productWithQty = { ...selectedProduct, qty: currentQuantity };
    const specialDiscount = calculateSpecialDiscount(
      productWithQty,
      saleType,
      new Date().toISOString().split("T")[0]
    );

    const existingProductIndex = products.findIndex(
      (p) => p.product_id === selectedProduct.product_id
    );

    let updatedProducts = [...products];

    if (existingProductIndex >= 0) {
      const existingProduct = updatedProducts[existingProductIndex];
      const newQuantity = (existingProduct.qty || 0) + currentQuantity;

      // Show warning but don't block the sale
      if (newQuantity > availableStock) {
        setStockWarning(
          `Warning: Insufficient stock for ${selectedProduct.product_name}! Only ${availableStock} available. You're adding ${newQuantity} (including ${existingProduct.qty || 0} already in bill).`
        );
      } else {
        setStockWarning("");
      }

      const updatedProductWithQty = { ...existingProduct, qty: newQuantity };
      const newSpecialDiscount = calculateSpecialDiscount(
        updatedProductWithQty,
        saleType,
        new Date().toISOString().split("T")[0]
      );

      updatedProducts[existingProductIndex] = {
        ...existingProduct,
        qty: newQuantity,
        price: existingProduct.price || 0,
        discount: existingProduct.discount || 0,
        discount_percentage: existingProduct.discount_percentage || 0,
        schemeName: schemeName,
        specialDiscount: newSpecialDiscount,
        total:
          (existingProduct.price || 0) * newQuantity -
          ((existingProduct.discount || 0) + newSpecialDiscount),
        supplier: selectedProduct.supplier,
        category: selectedProduct.category,
        store_location: selectedProduct.store_location,
      };
      setProducts(updatedProducts);
    } else {
      // Show warning for new product but don't block the sale
      if (currentQuantity > availableStock) {
        setStockWarning(
          `Warning: Insufficient stock for ${selectedProduct.product_name}! Only ${availableStock} available. You're adding ${currentQuantity}.`
        );
      } else {
        setStockWarning("");
      }

      const newProduct = {
        ...selectedProduct,
        qty: currentQuantity,
        price: selectedProduct.sales_price || 0,
        discount: Math.max(
          0,
          (selectedProduct.mrp || 0) - (selectedProduct.sales_price || 0)
        ),
        discount_percentage:
          selectedProduct.mrp && selectedProduct.sales_price
            ? (Math.max(
                0,
                (selectedProduct.mrp || 0) - (selectedProduct.sales_price || 0)
              ) /
                selectedProduct.mrp) *
              100
            : 0,
        schemeName: schemeName,
        specialDiscount: specialDiscount,
        total:
          (selectedProduct.sales_price || 0) * currentQuantity -
          specialDiscount,
        serialNumber: products.length + 1,
        supplier: selectedProduct.supplier,
        category: selectedProduct.category,
        store_location: selectedProduct.store_location,
      };
      setProducts([...products, newProduct]);
    }

    setSearchQuery("");
    setSelectedProduct(null);
    setQuantity(1);
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const updateProductQuantity = (index, newQtyStr) => {
    const newQty = parseFloat(newQtyStr);

    if (isNaN(newQty) || newQty < 0) {
      console.warn("Invalid quantity input:", newQtyStr);
      return;
    }

    setProducts((prevProducts) => {
      const productToUpdate = prevProducts[index];
      if (!productToUpdate) return prevProducts;

      const availableStock = parseFloat(productToUpdate.stock || 0);

      if (!isNaN(availableStock) && newQty > availableStock) {
        setStockWarning(
          `Warning: Insufficient stock for ${productToUpdate.product_name}! Only ${availableStock} available. You're setting quantity to ${newQty}.`
        );
      } else {
        setStockWarning("");
      }

      const updatedProductWithQty = { ...productToUpdate, qty: newQty };
      const newSpecialDiscount = calculateSpecialDiscount(
        updatedProductWithQty,
        saleType,
        new Date().toISOString().split("T")[0]
      );
      const newDiscount = Math.max(
        0,
        (productToUpdate.mrp || 0) - (productToUpdate.price || 0)
      );

      return prevProducts.map((product, i) => {
        if (i === index) {
          const newTotal =
            product.price * newQty - (newDiscount + newSpecialDiscount);
          return {
            ...product,
            qty: newQty,
            discount: newDiscount,
            specialDiscount: newSpecialDiscount,
            total: newTotal >= 0 ? newTotal : 0,
          };
        }
        return product;
      });
    });
  };

  const updateProductPrice = (index, newPriceStr) => {
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice < 0) {
      console.warn("Invalid price input:", newPriceStr);
      return;
    }
    setProducts((prevProducts) =>
      prevProducts.map((product, i) => {
        if (i === index) {
          const updatedProductWithQty = { ...product, qty: product.qty || 1 };
          const newSpecialDiscount = calculateSpecialDiscount(
            updatedProductWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          const newDiscount = Math.max(0, (product.mrp || 0) - newPrice);
          // Recalculate discount percentage based on current discount
          const newDiscountPercentage =
            newPrice > 0 ? (newDiscount / newPrice) * 100 : 0;
          const newTotal =
            newPrice * product.qty - (newDiscount + newSpecialDiscount);
          return {
            ...product,
            price: newPrice,
            discount: newDiscount,
            discount_percentage: newDiscountPercentage,
            schemeName: null,
            specialDiscount: newSpecialDiscount,
            total: newTotal >= 0 ? newTotal : 0,
          };
        }
        return product;
      })
    );
  };

  const updateProductDiscount = (index, newDiscountStr) => {
    const newDiscount = parseFloat(newDiscountStr);
    if (isNaN(newDiscount) || newDiscount < 0) {
      console.warn("Invalid discount input:", newDiscountStr);
      return;
    }
    setProducts((prevProducts) =>
      prevProducts.map((product, i) => {
        if (i === index) {
          const updatedProductWithQty = { ...product, qty: product.qty || 1 };
          const newSpecialDiscount = calculateSpecialDiscount(
            updatedProductWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          // Calculate discount percentage
          const newDiscountPercentage =
            product.price > 0 ? (newDiscount / product.price) * 100 : 0;
          const newTotal =
            product.price * product.qty - (newDiscount + newSpecialDiscount);
          return {
            ...product,
            discount: newDiscount,
            discount_percentage: newDiscountPercentage,
            schemeName: null,
            specialDiscount: newSpecialDiscount,
            total: newTotal >= 0 ? newTotal : 0,
          };
        }
        return product;
      })
    );
  };

  const updateProductDiscountPercentage = (index, newPercentageStr) => {
    const newPercentage = parseFloat(newPercentageStr);
    if (isNaN(newPercentage) || newPercentage < 0) {
      console.warn("Invalid discount percentage input:", newPercentageStr);
      return;
    }
    setProducts((prevProducts) =>
      prevProducts.map((product, i) => {
        if (i === index) {
          const updatedProductWithQty = { ...product, qty: product.qty || 1 };
          const newSpecialDiscount = calculateSpecialDiscount(
            updatedProductWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          // Calculate discount amount from percentage
          const newDiscount = (product.price * newPercentage) / 100;
          const newTotal =
            product.price * product.qty - (newDiscount + newSpecialDiscount);
          return {
            ...product,
            discount: newDiscount,
            discount_percentage: newPercentage,
            schemeName: null,
            specialDiscount: newSpecialDiscount,
            total: newTotal >= 0 ? newTotal : 0,
          };
        }
        return product;
      })
    );
  };

  const handleDeleteClick = (index) => {
    setPendingDeleteIndex(index);
    setShowNotification(true);
  };

  const confirmDelete = () => {
    if (
      pendingDeleteIndex !== null &&
      pendingDeleteIndex >= 0 &&
      pendingDeleteIndex < products.length
    ) {
      setProducts((prevProducts) => {
        const updated = prevProducts.filter((_, i) => i !== pendingDeleteIndex);
        return updated.map((p, idx) => ({ ...p, serialNumber: idx + 1 }));
      });
    }
    setShowNotification(false);
    setPendingDeleteIndex(null);
    searchInputRef.current?.focus();
  };

  const cancelDelete = () => {
    setShowNotification(false);
    setPendingDeleteIndex(null);
    searchInputRef.current?.focus();
  };

  const calculateTotals = useCallback(() => {
    let totalQty = 0;
    let subTotalMRP = 0;
    let totalItemDiscounts = 0;
    let totalSpecialDiscounts = 0;
    let grandTotalBeforeAdjustments = 0;

    products.forEach((p) => {
      const qty = p.qty || 0;
      const mrp = parseFloat(p.mrp || 0);
      const unitPrice = p.price || 0;
      const unitDiscount = p.discount || 0;
      const specialDiscount = p.specialDiscount || 0;

      totalQty += qty;
      subTotalMRP += mrp * qty;
      totalItemDiscounts += unitDiscount * qty;
      totalSpecialDiscounts += specialDiscount;
      grandTotalBeforeAdjustments += p.total;
    });

    const currentTaxRate = parseFloat(tax || 0);
    const currentBillDiscount = parseFloat(billDiscount || 0);
    const currentShipping = parseFloat(shipping || 0);
    const taxAmount = grandTotalBeforeAdjustments * (currentTaxRate / 100);
    const finalTotalDiscount =
      totalItemDiscounts + totalSpecialDiscounts + currentBillDiscount;
    const finalTotal =
      grandTotalBeforeAdjustments +
      taxAmount -
      currentBillDiscount +
      currentShipping;

    return {
      totalQty,
      subTotalMRP: isNaN(subTotalMRP) ? 0 : subTotalMRP,
      totalItemDiscounts: isNaN(totalItemDiscounts) ? 0 : totalItemDiscounts,
      totalSpecialDiscounts: isNaN(totalSpecialDiscounts)
        ? 0
        : totalSpecialDiscounts,
      totalBillDiscount: isNaN(currentBillDiscount) ? 0 : currentBillDiscount,
      finalTotalDiscount: isNaN(finalTotalDiscount) ? 0 : finalTotalDiscount,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      grandTotalBeforeAdjustments: isNaN(grandTotalBeforeAdjustments)
        ? 0
        : grandTotalBeforeAdjustments,
      finalTotal: isNaN(finalTotal) ? 0 : finalTotal,
    };
  }, [products, tax, billDiscount, shipping]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling full-screen: ${err.message}`);
        alert(`Could not enter full-screen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const holdSale = useCallback(async () => {
    if (products.length === 0) {
      alert("Cannot hold an empty sale.");
      return;
    }
    setHoldingSale(true);
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
        terminal_id: terminalId,
        user_id: userId,
        sale_data: saleData,
      });
      if (response.data.status === "success") {
        alert(`Sale held successfully with ID: ${response.data.data.hold_id}`);
        resetPOS(false);
        loadHeldSales();
      } else {
        alert(
          "Failed to hold sale: " + (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error holding sale:", error);
      alert("Failed to hold sale.");
    } finally {
      setHoldingSale(false);
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
    terminalId,
    userId,
  ]);

  const loadHeldSales = useCallback(async () => {
    setLoadingHeldSales(true);
    try {
      const response = await axios.get("/api/holds", {
        params: { terminal_id: terminalId, status: "held" },
      });
      if (response.data.status === "success") {
        setHeldSales(response.data.data);
      } else {
        alert(
          "Failed to load held sales: " +
            (response.data.message || "Unknown error")
        );
        setHeldSales([]);
      }
    } catch (error) {
      console.error("Error loading held sales:", error);
      setHeldSales([]);
    } finally {
      setLoadingHeldSales(false);
    }
  }, [terminalId]);

  const openHeldSalesList = () => {
    loadHeldSales();
    setShowHeldSalesList(true);
  };

  const closeHeldSalesList = () => {
    setShowHeldSalesList(false);
  };

  const recallHeldSale = async (holdId) => {
    try {
      const response = await axios.post(`/api/holds/${holdId}/recall`);
      if (response.data.status === "success") {
        const sale = response.data.data;
        setProducts(sale.products || []);
        setTax(sale.tax || 0);
        setBillDiscount(sale.billDiscount || 0);
        setShipping(sale.shipping || 0);
        setSaleType(sale.saleType || "Retail");
        setCustomerInfo(
          sale.customerInfo || {
            name: "",
            mobile: "",
            bill_number: "",
            userId: "U-1",
          }
        );
        setBillNumber(sale.billNumber || "");
        setHeldSales((prev) => prev.filter((s) => s.hold_id !== holdId));
        setShowHeldSalesList(false);
        alert(`Recalled sale with ID: ${holdId}`);
      } else {
        alert(
          "Failed to recall sale: " + (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error recalling sale:", error);
      alert("Failed to recall sale.");
    }
  };

  const deleteHeldSale = async (holdId) => {
    try {
      const response = await axios.delete(`/api/holds/${holdId}`);
      if (response.data.status === "success") {
        alert("Held sale deleted successfully");
        loadHeldSales();
      } else {
        alert(
          "Failed to delete held sale: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error deleting held sale:", error);
      alert("Failed to delete held sale.");
    }
  };

  const resetPOS = useCallback(
    (fetchNewBill = true) => {
      setProducts([]);
      setTax(0);
      setBillDiscount(0);
      setShipping(0);
      setSearchQuery("");
      setSelectedProduct(null);
      setQuantity(1);
      setSearchResults([]);
      setSelectedSearchIndex(-1);
      setCustomerInfo({ name: "", mobile: "", bill_number: "", userId: "U-1" });

      if (fetchNewBill && !isEditMode) {
        const fetchNextBillNumber = async () => {
          try {
            const token = user?.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(
              "http://127.0.0.1:8000/api/next-bill-number",
              { headers }
            );
            setBillNumber(response.data.next_bill_number);
            setCustomerInfo((prev) => ({
              ...prev,
              bill_number: response.data.next_bill_number,
            }));
          } catch (error) {
            console.error("Error fetching next bill number:", error);
            setBillNumber("ERR-XXX");
          }
        };
        fetchNextBillNumber();
      } else {
        setCustomerInfo((prev) => ({
          ...prev,
          bill_number: isEditMode ? billNumber : "",
        }));
      }

      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    [isEditMode, billNumber, user]
  );

  // Handle Alt+L for opening held sales list
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        openHeldSalesList();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenBill = useCallback(() => {
    if (products.length === 0) {
      alert("Cannot proceed to payment with an empty bill.");
      return;
    }
    if (!registerStatus.isOpen) {
      // If register is closed, show register modal to prompt opening
      setShowRegisterModal(true);
      return;
    }
    setCustomerInfo((prevState) => ({
      ...prevState,
      bill_number: billNumber,
    }));
    setShowBillModal(true);
  }, [products, billNumber, registerStatus.isOpen]);

  const closeBillModal = useCallback(
    (saleSaved = false) => {
      setShowBillModal(false);
      if (saleSaved) {
        resetPOS(true);
      } else {
        searchInputRef.current?.focus();
      }
      setCustomerInfo((prevState) => ({
        ...prevState,
        name: "",
        mobile: "",
        bill_number: isEditMode ? billNumber : "",
      }));
    },
    [resetPOS, isEditMode, billNumber]
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
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
        resetPOS(false);
      }
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setShowCalculatorModal(true);
      }
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleOpenBill, holdSale, resetPOS]);

  const totals = calculateTotals();

  const handleSubmit = () => {
    if (isEditMode && onSubmit) {
      onSubmit({
        products,
        billDiscount,
        tax,
        shipping,
        totals,
        customerInfo,
        saleType,
        payment_type: "Cash",
        received_amount: totals.finalTotal,
        balance_amount: 0,
      });
    }
  };

  // Check register status on mount
  useEffect(() => {
    const registerModalDismissed = localStorage.getItem(
      "registerModalDismissed"
    );
    if (!registerStatus.isOpen && !registerModalDismissed) {
      setShowRegisterModal(true);
    } else {
      setShowRegisterModal(false);
    }
    setCheckedRegisterModal(true);
  }, [registerStatus.isOpen]);

  const calculateClosingDetails = () => {
    // Use totalSales and openingCash from registerStatus if available, ensure numbers
    const totalSales =
      Number(registerStatus.totalSales) ||
      products.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalSalesQty =
      Number(registerStatus.totalSalesQty) ||
      products.reduce((sum, p) => sum + (p.qty || 0), 0);
    const openingCash =
      Number(registerStatus.openingCash ?? registerStatus.cashOnHand) || 0;
    return {
      totalSales,
      totalSalesQty,
      openingCash,
      inCashierAmount: 0,
      otherAmount: 0,
    };
  };

  const handleCloseRegister = () => {
    setIsClosingRegister(true);
    setShowRegisterModal(true);
  };

  const handleRegisterConfirm = async (amount) => {
    if (isClosingRegister) {
      const closingDetails = calculateClosingDetails();
      try {
        if (!amount || typeof amount.inCashierAmount !== "number") {
          alert("Invalid amount provided for closing register.");
          return;
        }
        await closeRegister({
          ...closingDetails,
          inCashierAmount: amount.inCashierAmount,
          otherAmount: amount.otherAmount,
        });
        setIsClosingRegister(false);
        setShowRegisterModal(false);
      } catch (error) {
        console.error("Failed to close register:", error);
        alert("Failed to close register.");
      }
    } else {
      try {
        if (!user || !user.id) {
          alert("User information is missing. Cannot open register.");
          return;
        }
        let openingCash = 0;
        if (typeof amount === "number") {
          openingCash = amount;
        } else if (
          typeof amount === "object" &&
          amount !== null &&
          "inCashierAmount" in amount
        ) {
          openingCash = amount.inCashierAmount;
        } else {
          alert("Invalid amount provided for opening register.");
          return;
        }
        const success = await openRegister({
          user_id: user.id,
          terminal_id: terminalId,
          opening_cash: openingCash,
        });
        if (success) {
          refreshRegisterStatus();
          setShowRegisterModal(false);
        }
      } catch (error) {
        console.error("Failed to open register:", error);
        alert("Failed to open register.");
      }
    }
  };

  // Display discount info in search results
  const getProductDiscountInfo = (item) => {
    const productScheme = activeSchemes.find(
      (scheme) =>
        scheme.active &&
        scheme.applies_to === "product" &&
        scheme.target?.trim().toLowerCase() ===
          (item.product_name?.trim().toLowerCase() ||
            item.description?.trim().toLowerCase())
    );
    const categoryScheme = activeSchemes.find(
      (scheme) =>
        scheme.active &&
        scheme.applies_to === "category" &&
        scheme.target?.trim().toLowerCase() ===
          item.category_name?.trim().toLowerCase()
    );
    let discountInfo = "";
    if (productScheme) {
      discountInfo = `, Discount: Product ${productScheme.target} (${
        productScheme.type === "percentage"
          ? `${productScheme.value}%`
          : `Rs. ${productScheme.value}`
      })`;
    } else if (categoryScheme) {
      discountInfo = `, Discount: Category ${categoryScheme.target} (${
        categoryScheme.type === "percentage"
          ? `${categoryScheme.value}%`
          : `Rs. ${categoryScheme.value}`
      })`;
    }
    return discountInfo;
  };

  const openProductModal = (productId) => {
    setSelectedProductId(productId);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProductId(null);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 p-2 bg-gradient-to-r from-blue-600 to-blue-800 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              className="px-3 py-2 text-lg font-bold text-white bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
            >
              <option value="Retail">🛒 Retail</option>
              <option value="Wholesale">📦 Wholesale</option>
            </select>

            <div className="flex items-center px-3 py-2 bg-blue-700 rounded-lg">
              <span className="mr-2 font-bold text-white">Bill:</span>
              <span className="text-xl font-bold text-white">{billNumber}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              className="p-3 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
              onClick={openHeldSalesList}
            >
              <ClipboardList size={24} />
            </button>
            <button
              className="p-3 text-white bg-yellow-500 rounded-lg shadow hover:bg-yellow-600"
              onClick={() => navigate("/Dashboard")}
            >
              <LayoutDashboard size={24} />
            </button>
            <button
              className="p-3 text-white bg-purple-500 rounded-lg shadow hover:bg-purple-600"
              onClick={() => setShowCalculatorModal(true)}
            >
              <Calculator size={24} />
            </button>
            <button
              className="p-3 text-white bg-green-500 rounded-lg shadow hover:bg-green-600"
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button
              className="p-3 text-white bg-red-500 rounded-lg shadow hover:bg-red-600"
              onClick={handleCloseRegister}
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Product Search */}
        <div className="p-3 bg-white shadow-md">
          <div className="flex space-x-2">
            <div className="flex-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                {searchResults.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
                    {searchResults.map((item, index) => (
                      <li
                        key={item.product_id || index}
                        className={`p-3 text-base cursor-pointer hover:bg-blue-100 ${
                          index === selectedSearchIndex ? "bg-blue-200" : ""
                        }`}
                        onClick={() => handleItemSelection(item)}
                      >
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          Code: {item.item_code || "N/A"} | Stock:{" "}
                          {item.stock ?? "N/A"} | Price:{" "}
                          {formatNumberWithCommas(
                            item.sales_price?.toFixed(2) || 0
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-24">
                <input
                  ref={quantityInputRef}
                  type="number"
                  step="1"
                  min="0.01"
                  className="w-full px-3 py-3 text-lg text-center bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Qty"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button
                className="px-5 py-3 text-lg font-bold text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
                onClick={addProductToTable}
                disabled={!selectedProduct || parseFloat(quantity || 0) <= 0}
              >
                ADD
              </button>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="sticky top-0 z-10 p-2 font-bold text-white bg-blue-600">
            Current Items ({products.length})
          </div>
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No items added yet. Search and add products.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {products.map((product, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="mr-2 font-medium text-gray-500">
                          {index + 1}.
                        </span>
                        <button
                          className="text-lg font-medium text-blue-600 hover:underline"
                          onClick={() => openProductModal(product.product_id)}
                        >
                          {product.product_name}
                        </button>
                      </div>
                      <div className="flex mt-1 space-x-4 text-sm text-gray-600">
                        <div>
                          MRP:{" "}
                          {formatNumberWithCommas(product.mrp?.toFixed(2)) || 0}
                        </div>
                        <div>
                          Disc:{" "}
                          {formatNumberWithCommas(
                            (product.mrp - product.sales_price)?.toFixed(2)
                          ) || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="w-20 px-2 py-2 text-center bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={product.qty}
                        onChange={(e) =>
                          updateProductQuantity(index, e.target.value)
                        }
                      />
                      <div className="text-lg font-bold">
                        {formatNumberWithCommas(product.total?.toFixed(2) || 0)}
                      </div>
                      <button
                        onClick={() => handleDeleteClick(index)}
                        className="p-2 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Panel */}
        <div className="sticky bottom-0 p-4 bg-blue-800 text-white shadow-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-2 bg-blue-700 rounded-lg">
              <div className="text-sm">Items</div>
              <div className="text-xl font-bold">{products.length}</div>
            </div>
            <div className="p-2 bg-blue-700 rounded-lg">
              <div className="text-sm">Qty</div>
              <div className="text-xl font-bold">
                {formatNumberWithCommas(totals.totalQty.toFixed(1))}
              </div>
            </div>
            <div className="p-2 bg-blue-700 rounded-lg">
              <div className="text-sm">Total</div>
              <div className="text-xl font-bold">
                Rs. {formatNumberWithCommas(totals.finalTotal.toFixed(2))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              className="flex items-center justify-center p-3 text-white bg-emerald-600 rounded-lg shadow hover:bg-emerald-700"
              onClick={holdSale}
              disabled={products.length === 0 || holdingSale}
            >
              <PauseCircle size={20} className="mr-1" />
              Hold
            </button>
            <button
              className="flex items-center justify-center p-3 text-white bg-gray-500 rounded-lg shadow hover:bg-gray-600"
              onClick={() => resetPOS(false)}
            >
              <RefreshCw size={20} className="mr-1" />
              Reset
            </button>
            <button
              className="flex items-center justify-center p-3 text-white bg-fuchsia-600 rounded-lg shadow hover:bg-fuchsia-700"
              onClick={handleOpenBill}
              disabled={products.length === 0}
            >
              <Printer size={20} className="mr-1" />
              Pay
            </button>
          </div>
        </div>
      </div>
      {/* Modals (keep existing modal implementations) */}
      {checkedRegisterModal && showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            setIsClosingRegister(false);
          }}
          onConfirm={handleRegisterConfirm}
          cashOnHand={registerStatus.cashOnHand}
          user={user}
          isClosing={isClosingRegister}
          closingDetails={calculateClosingDetails()}
        />
      )}
      {stockWarning && (
        <div className="flex items-center p-2 my-2 text-sm text-yellow-700 bg-yellow-100 rounded-md">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {stockWarning}
          <span className="ml-2 text-yellow-800">(Sale will proceed)</span>
        </div>
      )}
      {showBillModal && (
        <BillPrintModal
          initialProducts={products}
          initialBillDiscount={parseFloat(billDiscount || 0)}
          initialTax={parseFloat(tax || 0)}
          initialShipping={parseFloat(shipping || 0)}
          initialTotals={totals}
          initialCustomerInfo={customerInfo}
          saleType={saleType}
          onClose={closeBillModal}
        />
      )}
      {showCalculatorModal && (
        <CalculatorModal
          isOpen={showCalculatorModal}
          onClose={() => setShowCalculatorModal(false)}
        />
      )}
      {isCloseRegisterOpen && (
        <CloseRegisterModal
          isOpen={isCloseRegisterOpen}
          onClose={() => setIsCloseRegisterOpen(false)}
        />
      )}
      {showHeldSalesList && (
        <HeldSalesList
          heldSales={heldSales}
          loading={loadingHeldSales}
          onRecall={recallHeldSale}
          onDelete={deleteHeldSale}
          onClose={closeHeldSalesList}
        />
      )}
      {showProductModal && (
        <ProductDetailsModal
          productId={selectedProductId}
          onClose={closeProductModal}
        />
      )}{" "}
    </div>
  );
};

export default TOUCHPOSFORM;
