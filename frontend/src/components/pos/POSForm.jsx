import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import CloseRegisterModal from "../models/CloseRegisterModal";
import HeldSalesList from "./HeldSalesList";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import CashRegister from "./CashRegistryModal.jsx";
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
import { formatNumberWithCommas } from "../../utils/numberformat";
import CalculatorModal from "../models/calculator/CalculatorModal.jsx";
import { useRegister } from "../../context/RegisterContext";
import { useAuth } from "../../context/NewAuthContext";
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

const POSForm = ({
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
          const qty = product.qty || 1;
          const combinedDiscount = unitDiscount + specialDiscount;
          const total = qty * ((product.mrp || 0) - combinedDiscount);

          return {
            ...product,
            schemeName: schemeName,
            discount: combinedDiscount,
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
    const totalSpecialDiscount = calculateSpecialDiscount(
      productWithQty,
      saleType,
      new Date().toISOString().split("T")[0]
    );
    const specialDiscountPerUnit = totalSpecialDiscount / currentQuantity;

    const discountAmountPerUnit = Math.max(
      0,
      (selectedProduct.mrp || 0) - (selectedProduct.sales_price || 0)
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

      updatedProducts[existingProductIndex] = {
        ...existingProduct,
        qty: newQuantity,
        price: existingProduct.price || 0,
        discountPerUnit:
          existingProduct.discountPerUnit || discountAmountPerUnit,
        specialDiscountPerUnit:
          existingProduct.specialDiscountPerUnit || specialDiscountPerUnit,
        discount:
          (existingProduct.discountPerUnit || discountAmountPerUnit) +
          (existingProduct.specialDiscountPerUnit || specialDiscountPerUnit),
        discount_percentage: existingProduct.discount_percentage || 0,
        schemeName: schemeName,
        total:
          newQuantity *
          ((existingProduct.mrp || 0) -
            ((existingProduct.discountPerUnit || discountAmountPerUnit) +
              (existingProduct.specialDiscountPerUnit ||
                specialDiscountPerUnit))),
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
        discountPerUnit: discountAmountPerUnit,
        specialDiscountPerUnit: specialDiscountPerUnit,
        discount: discountAmountPerUnit + specialDiscountPerUnit,
        discount_percentage:
          selectedProduct.mrp && selectedProduct.sales_price
            ? ((discountAmountPerUnit + specialDiscountPerUnit) /
                selectedProduct.mrp) *
              100
            : 0,
        schemeName: schemeName,
        total:
          currentQuantity *
          ((selectedProduct.mrp || 0) -
            (discountAmountPerUnit + specialDiscountPerUnit)),
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

      const discountPerUnit = productToUpdate.discountPerUnit || 0;
      const specialDiscountPerUnit =
        productToUpdate.specialDiscountPerUnit || 0;
      const combinedDiscountPerUnit = discountPerUnit + specialDiscountPerUnit;

      return prevProducts.map((product, i) => {
        if (i === index) {
          const total = newQty * ((product.mrp || 0) - combinedDiscountPerUnit);
          return {
            ...product,
            qty: newQty,
            discount: combinedDiscountPerUnit,
            total: total >= 0 ? total : 0,
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
          const totalSpecialDiscount = calculateSpecialDiscount(
            updatedProductWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          const specialDiscountPerUnit =
            totalSpecialDiscount / (product.qty || 1);
          const newDiscountPerUnit = Math.max(0, (product.mrp || 0) - newPrice);
          const newDiscountPercentage =
            newPrice > 0 ? (newDiscountPerUnit / newPrice) * 100 : 0;
          const combinedDiscountPerUnit =
            newDiscountPerUnit + specialDiscountPerUnit;
          const qty = product.qty || 1;
          const total = qty * ((product.mrp || 0) - combinedDiscountPerUnit);
          return {
            ...product,
            price: newPrice,
            discountPerUnit: newDiscountPerUnit,
            specialDiscountPerUnit: specialDiscountPerUnit,
            discount: combinedDiscountPerUnit,
            discount_percentage: newDiscountPercentage,
            schemeName: null,
            total: total >= 0 ? total : 0,
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
          const totalSpecialDiscount = calculateSpecialDiscount(
            updatedProductWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          const specialDiscountPerUnit =
            totalSpecialDiscount / (product.qty || 1);
          const newDiscountPercentage =
            product.price > 0 ? (newDiscount / product.price) * 100 : 0;
          const combinedDiscountPerUnit = newDiscount + specialDiscountPerUnit;
          const qty = product.qty || 1;
          const total = qty * ((product.mrp || 0) - combinedDiscountPerUnit);
          return {
            ...product,
            discountPerUnit: newDiscount,
            specialDiscountPerUnit: specialDiscountPerUnit,
            discount: combinedDiscountPerUnit,
            discount_percentage: newDiscountPercentage,
            schemeName: null,
            total: total >= 0 ? total : 0,
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
          const totalSpecialDiscount = calculateSpecialDiscount(
            updatedProductWithQty,
            saleType,
            new Date().toISOString().split("T")[0]
          );
          const specialDiscountPerUnit =
            totalSpecialDiscount / (product.qty || 1);
          const newDiscount = (product.price * newPercentage) / 100;
          const combinedDiscountPerUnit = newDiscount + specialDiscountPerUnit;
          const newTotal =
            ((product.mrp || 0) - combinedDiscountPerUnit) * product.qty;
          return {
            ...product,
            discountPerUnit: newDiscount,
            specialDiscountPerUnit: specialDiscountPerUnit,
            discount: combinedDiscountPerUnit,
            discount_percentage: newPercentage,
            schemeName: null,
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
    let grandTotalBeforeAdjustments = 0;

    products.forEach((p) => {
      const qty = p.qty || 0;
      const mrp = parseFloat(p.mrp || 0);
      const unitDiscount = p.discount || 0;

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
    // Reset the dismissal flag to ensure modal shows when register is closed
    localStorage.removeItem("registerModalDismissed");
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
        if (
          !amount ||
          typeof amount.inCashierAmount !== "number" ||
          amount.inCashierAmount < 0
        ) {
          return "Invalid amount provided for closing register.";
        }
        await closeRegister({
          ...closingDetails,
          inCashierAmount: amount.inCashierAmount,
          otherAmount: amount.otherAmount,
        });
        setIsClosingRegister(false);
        setShowRegisterModal(false);
        refreshRegisterStatus();
        return null;
      } catch (error) {
        console.error("Failed to close register:", error);
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          return error.response.data.message;
        }
        return "Failed to close register.";
      }
    } else {
      try {
        if (!user || !user.id) {
          return "User information is missing. Cannot open register.";
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
          return "Invalid amount provided for opening register.";
        }
        if (openingCash < 0) {
          return "Opening cash amount cannot be negative.";
        }
        const success = await openRegister({
          user_id: user.id,
          terminal_id: terminalId,
          opening_cash: openingCash,
        });
        if (success) {
          refreshRegisterStatus();
          setShowRegisterModal(false);
          return null;
        }
      } catch (error) {
        console.error("Failed to open register:", error);
        return "Failed to open register.";
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
    <div
      className={`min-h-screen w-full p-4 dark:bg-gray-900 bg-gray-100 ${isFullScreen ? "fullscreen-mode" : ""}`}
    >
      <div className="p-2 mb-4 rounded-lg shadow-xl bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700">
        <div className="flex flex-wrap items-center justify-between w-full gap-2 p-3 rounded-lg shadow-md md:gap-4 bg-slate-500 dark:bg-slate-600">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block mb-1 text-sm font-bold text-white">
                Sale Type
              </label>
              <select
                className="px-3 py-2 text-base text-orange-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-orange-400 dark:border-gray-600"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
              >
                <option value="Retail">🛒 Retail</option>
                <option value="Wholesale">📦 Wholesale</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end flex-grow gap-2 md:gap-3">
            <div className="flex items-center space-x-2">
              <label className="hidden font-bold text-white sm:inline">
                Bill No:
              </label>
              <input
                type="text"
                className="w-24 px-2 py-2 font-bold text-center text-orange-700 bg-white border border-gray-300 rounded-lg md:w-32 dark:bg-gray-700 dark:text-orange-400 dark:border-gray-600"
                value={billNumber}
                readOnly
                title="Current Bill Number"
              />
            </div>
            <button
              className="p-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
              title="View Hold List (Alt+L)"
              onClick={openHeldSalesList}
            >
              <ClipboardList size={24} />
            </button>
            <button
              className="p-2 text-white bg-yellow-500 rounded-lg shadow hover:bg-yellow-600"
              title="Dashboard"
              onClick={() => navigate("/Dashboard")}
            >
              <LayoutDashboard size={24} />
            </button>
            <button
              className="p-2 text-white bg-purple-500 rounded-lg shadow hover:bg-purple-600"
              title="Calculator (Alt+C)"
              onClick={() => setShowCalculatorModal(true)}
            >
              <Calculator size={24} />
            </button>
            <button
              className="p-2 text-white bg-green-500 rounded-lg shadow hover:bg-green-600"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
            <button
              className="p-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600"
              title="Close Register"
              onClick={handleCloseRegister}
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="p-4 rounded-lg shadow-inner lg:col-span-2 bg-slate-200 dark:bg-gray-800">
          <div className="relative flex flex-col items-stretch gap-2 mb-4 md:flex-row md:items-end">
            <div className="relative flex-grow">
              <label
                htmlFor="productSearch"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Search Product (Alt+S)
              </label>
              <input
                id="productSearch"
                ref={searchInputRef}
                type="text"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg text-slate-800 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name, Code, Barcode..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loadingItems || loadingSchemes}
                autoComplete="off"
              />
              {(loadingItems || loadingSchemes) && (
                <span className="absolute text-xs text-gray-500 top-1 right-2 dark:text-gray-400">
                  Loading...
                </span>
              )}
              {searchResults.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-60">
                  {searchResults.map((item, index) => (
                    <li
                      key={item.product_id || index}
                      className={`p-2 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-600 ${
                        index === selectedSearchIndex
                          ? "bg-blue-200 dark:bg-blue-500 text-black dark:text-white"
                          : "text-black dark:text-gray-200"
                      }`}
                      onClick={() => handleItemSelection(item)}
                      onMouseEnter={() => setSelectedSearchIndex(index)}
                    >
                      {item.product_name} (Code: {item.item_code || "N/A"},
                      Stock: {item.stock ?? "N/A"}, Category:{" "}
                      {item.category_name}
                      {getProductDiscountInfo(item)})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex-shrink-0 w-full md:w-24">
              <label
                htmlFor="quantityInput"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Quantity
              </label>
              <input
                id="quantityInput"
                ref={quantityInputRef}
                type="number"
                step="1"
                min="0.01"
                className="w-full px-3 py-2 text-base text-center bg-white border border-gray-300 rounded-lg md:w-24 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:border-gray-600"
                placeholder="Qty"
                value={quantity}
                onChange={handleQuantityChange}
                onKeyDown={handleKeyDown}
                disabled={!selectedProduct || loadingItems || loadingSchemes}
              />
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <label className="block mb-1 text-sm font-medium text-transparent dark:text-transparent">
                Add
              </label>
              <button
                className="w-full px-5 py-2 text-base font-semibold text-white bg-green-600 rounded-lg shadow md:w-auto hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={addProductToTable}
                disabled={
                  !selectedProduct ||
                  parseFloat(quantity || 0) <= 0 ||
                  loadingItems ||
                  loadingSchemes
                }
              >
                Add
              </button>
            </div>
          </div>

          <h2 className="my-4 text-lg font-bold text-gray-800 dark:text-gray-200">
            Current Bill Items ({products.length})
          </h2>
          <div className="overflow-x-auto max-h-[50vh] border border-gray-300 dark:border-gray-600 rounded-lg">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="text-xs text-white uppercase bg-gray-700 dark:bg-gray-700 dark:text-amber-400">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 border-r dark:border-gray-600"
                  >
                    S.No
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 border-r dark:border-gray-600 min-w-[200px]"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center border-r dark:border-gray-600 min-w-[80px]"
                  >
                    Qty
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right border-r dark:border-gray-600 min-w-[100px]"
                  >
                    MRP
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right border-r dark:border-gray-600 min-w-[80px]"
                  >
                    Disc
                  </th>

                  <th
                    scope="col"
                    className="px-3 py-3 text-right border-r dark:border-gray-600 min-w-[80px]"
                  >
                    Unit Price
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-right border-r dark:border-gray-600 min-w-[110px]"
                  >
                    Total
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    <Trash2 size={16} />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-6 italic text-center text-gray-500 dark:text-gray-400"
                    >
                      No items added to the bill yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={product.product_id + "-" + index}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <td className="px-3 py-2 font-medium text-gray-900 border-r dark:text-white dark:border-gray-700">
                        {product.serialNumber}
                      </td>
                      <td
                        className="px-4 py-2 border-r dark:border-gray-700"
                        title={product.product_name}
                      >
                        <button
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={() => openProductModal(product.product_id)}
                        >
                          {product.product_name}
                        </button>
                      </td>
                      <td className="px-1 py-1 text-center border-r dark:border-gray-700">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-16 py-1 text-sm text-center bg-transparent border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:text-white"
                          value={product.qty}
                          onChange={(e) =>
                            updateProductQuantity(index, e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                        />
                      </td>
                      <td className="px-3 py-2 text-right border-r dark:border-gray-700">
                        <div className="flex flex-col items-end">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-20 py-1 text-sm text-right bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formatNumberWithCommas(
                              parseFloat(product.mrp || 0).toFixed(2)
                            )}
                            onChange={(e) =>
                              updateProductPrice(index, e.target.value)
                            }
                            onFocus={(e) => e.target.select()}
                          />
                          {/* <div className="flex flex-col items-end mt-1 text-xs text-red-600 dark:text-red-400">
                            <span>
                              MRP:{" "}
                              {formatNumberWithCommas(
                                parseFloat(product.mrp || 0).toFixed(2)
                              )}
                            </span>
                            <span>
                              Sales:{" "}
                              {formatNumberWithCommas(
                                parseFloat(product.sales_price || 0).toFixed(2)
                              )}
                            </span>
                          </div> */}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right border-r dark:border-gray-700">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-20 py-1 text-sm text-right bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formatNumberWithCommas(
                            parseFloat(product.discount || 0).toFixed(2)
                          )}
                          onChange={(e) =>
                            updateProductDiscount(index, e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                        />
                      </td>
                      <td className="px-1 py-1 text-center border-r dark:border-gray-700">
                        {formatNumberWithCommas(
                          product.sales_price?.toFixed(2) ?? 0.0
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-right text-gray-900 border-r dark:text-white dark:border-gray-700">
                        {formatNumberWithCommas(
                          product.total?.toFixed(2) ?? 0.0
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
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
            <Notification
              message={`Delete item "${products[pendingDeleteIndex]?.product_name ?? "this item"}"?`}
              onClose={cancelDelete}
            >
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

        <div className="w-full p-4 rounded-lg shadow-lg backdrop-blur-sm bg-slate-600 bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80">
          <h2 className="mb-4 text-xl font-bold text-white">Bill Summary</h2>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-200">
                Tax (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) =>
                  setTax(
                    e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-200">
                Bill Discount (Amount)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={billDiscount}
                onChange={(e) =>
                  setBillDiscount(
                    e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Discount amount"
              />
            </div>
          </div>
          <div className="p-4 mt-6 text-sm text-gray-100 bg-transparent border border-gray-500 rounded-lg shadow-inner space-y-1.5 dark:border-gray-600">
            <div className="flex justify-between">
              <span>Total Items / Qty:</span>
              <span className="font-medium">
                {products.length} /{" "}
                {formatNumberWithCommas(totals.totalQty.toFixed(1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sub Total (MRP):</span>
              <span className="font-medium">
                Rs. {formatNumberWithCommas(totals.subTotalMRP.toFixed(2))}
              </span>
            </div>
            <div className="flex justify-between text-red-300">
              <span>(-) Item Discounts:</span>
              <span className="font-medium">
                Rs.{" "}
                {formatNumberWithCommas(totals.totalItemDiscounts.toFixed(2))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Net Item Total:</span>
              <span className="font-medium">
                Rs.{" "}
                {formatNumberWithCommas(
                  totals.grandTotalBeforeAdjustments.toFixed(2)
                )}
              </span>
            </div>
            <div className="flex justify-between text-yellow-300">
              <span>(+) Tax ({parseFloat(tax || 0).toFixed(1)}%):</span>
              <span className="font-medium">
                Rs. {formatNumberWithCommas(totals.taxAmount.toFixed(2))}
              </span>
            </div>
            <div className="flex justify-between text-red-300">
              <span>(-) Bill Discount:</span>
              <span className="font-medium">
                Rs.{" "}
                {formatNumberWithCommas(totals.totalBillDiscount.toFixed(2))}
              </span>
            </div>
            <hr className="my-2 border-gray-500 dark:border-gray-600" />
            <div className="flex justify-between text-xl font-bold text-green-400">
              <span>Grand Total:</span>
              <span>
                Rs. {formatNumberWithCommas(totals.finalTotal.toFixed(2))}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {isEditMode ? (
              <>
                <button
                  className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg shadow hover:bg-red-700"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  className="flex items-center justify-center col-span-2 gap-1 px-3 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={products.length === 0}
                >
                  Update Sale
                </button>
              </>
            ) : (
              <>
                <button
                  className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white rounded-lg shadow bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  onClick={holdSale}
                  title="Hold Bill (Alt+H)"
                  disabled={products.length === 0 || holdingSale}
                >
                  <PauseCircle size={18} /> Hold
                </button>
                <button
                  className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white bg-gray-500 rounded-lg shadow hover:bg-gray-600"
                  onClick={() => resetPOS(false)}
                  title="Reset Bill (Alt+R)"
                >
                  <RefreshCw size={18} /> Reset
                </button>
                <button
                  ref={payButtonRef}
                  className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white rounded-lg shadow bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50"
                  onClick={handleOpenBill}
                  title="Proceed to Pay (Alt+P)"
                  disabled={products.length === 0}
                >
                  <Printer size={18} /> Pay
                </button>
              </>
            )}
          </div>
        </div>
      </div>

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
      )}
    </div>
  );
};

export default POSForm;
