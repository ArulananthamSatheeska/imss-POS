import React, { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
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

// --- Helper Function to Apply Discount Schemes ---
const applyDiscountScheme = (product, saleType, schemes) => {
    if (!product || !schemes || schemes.length === 0) {
        // Return base price if no product or schemes
        return saleType === "Wholesale"
            ? parseFloat(product?.wholesale_price || product?.sales_price || 0)
            : parseFloat(product?.sales_price || 0);
    }

    const basePrice = saleType === "Wholesale"
        ? parseFloat(product.wholesale_price || product.sales_price || 0) // Fallback to sales_price if wholesale is missing
        : parseFloat(product.sales_price || 0);

    const today = new Date(); // Use current date for scheme validity checks
    today.setHours(0, 0, 0, 0); // Set time to start of day for comparison

    let applicableScheme = null;

    // Prioritize product-specific schemes
    const productSchemes = schemes.filter(s =>
        s.active &&
        s.applies_to === 'product' &&
        s.target === product.product_name &&
        (!s.start_date || new Date(s.start_date) <= today) &&
        (!s.end_date || new Date(s.end_date) >= today)
    );

    // Prioritize category-specific schemes if no product scheme found
    const categorySchemes = schemes.filter(s =>
        s.active &&
        s.applies_to === 'category' &&
        s.target === product.category_name && // Assumes product has category_name
        (!s.start_date || new Date(s.start_date) <= today) &&
        (!s.end_date || new Date(s.end_date) >= today)
    );

    // --- Scheme Selection Logic (Example: Highest Discount Priority) ---
    let bestScheme = null;
    let maxDiscountValue = -1; // Use a value to compare discounts

    const findBestScheme = (schemeList) => {
        schemeList.forEach(scheme => {
            let currentDiscountValue = 0;
            if (scheme.type === 'percentage') {
                currentDiscountValue = (basePrice * parseFloat(scheme.value || 0)) / 100;
            } else if (scheme.type === 'amount') {
                currentDiscountValue = parseFloat(scheme.value || 0);
            }

            // Ensure discount doesn't make price negative
            currentDiscountValue = Math.min(currentDiscountValue, basePrice);

            if (currentDiscountValue > maxDiscountValue) {
                maxDiscountValue = currentDiscountValue;
                bestScheme = scheme;
            }
        });
    };

    findBestScheme(productSchemes);
    // Only check category schemes if no better product scheme was found
    // (This implements Product > Category priority)
    if (!bestScheme || maxDiscountValue <= 0) {
        findBestScheme(categorySchemes);
    }


    // Apply the best found scheme
    if (bestScheme) {
        let discountedPrice = basePrice;
        if (bestScheme.type === 'percentage') {
            discountedPrice = basePrice * (1 - parseFloat(bestScheme.value || 0) / 100);
        } else if (bestScheme.type === 'amount') {
            discountedPrice = basePrice - parseFloat(bestScheme.value || 0);
        }
        // Ensure price doesn't go below zero
        return Math.max(0, discountedPrice);
    }

    // No applicable scheme found, return base price
    return basePrice;
};


const POSForm = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saleType, setSaleType] = useState("Retail");
  const [products, setProducts] = useState([]); // Products in the current bill/table
  const [searchQuery, setSearchQuery] = useState("");
  const [isEasyMode, setIsEasyMode] = useState(false); // Keep or remove based on need
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [items, setItems] = useState([]); // All available items/products fetched from API
  const [activeSchemes, setActiveSchemes] = useState([]); // State for discount schemes
  const [tax, setTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [shipping, setShipping] = useState(0); // Keep or remove based on need
  const [selectedProduct, setSelectedProduct] = useState(null); // The product currently selected in search
  const [quantity, setQuantity] = useState(1);
  const searchInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const payButtonRef = useRef(null); // Make sure this exists if used
  const [showNotification, setShowNotification] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const navigate = useNavigate();
  const [billNumber, setBillNumber] = useState("");
  const [spacePressCount, setSpacePressCount] = useState(0); // Keep or remove based on need
  const [isOpen, setIsOpen] = useState(false); // For calculator modal?
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    mobile: "",
    bill_number: "",
    userId: "U-1", // Assuming a default user or get logged-in user
  });
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false); // Keep or remove
  const [closingDetails, setClosingDetails] = useState(null); // Keep or remove
  const [loadingItems, setLoadingItems] = useState(false); // Loading state for items
  const [loadingSchemes, setLoadingSchemes] = useState(false); // Loading state for schemes

  // Fetch Next Bill Number
  useEffect(() => {
    const fetchNextBillNumber = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/next-bill-number" // Ensure this endpoint exists and works
        );
        setBillNumber(response.data.next_bill_number);
      } catch (error) {
        console.error("Error fetching next bill number:", error);
        // Handle error appropriately, maybe set a default or show message
      }
    };
    fetchNextBillNumber();
  }, []);

  // Fetch All Products (Items for search)
  useEffect(() => {
    setLoadingItems(true);
    axios
      .get("http://127.0.0.1:8000/api/products")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
          // *** IMPORTANT: Ensure each product object includes 'category_name' ***
          // Example: Modify backend ProductResource or Controller if needed
          setItems(response.data.data);
          console.log("Fetched Products:", response.data.data); // Log to check structure
        } else {
          console.error("Unexpected product data format:", response.data);
          setItems([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching items:", error);
        setItems([]);
        // Add user feedback for error
      })
      .finally(() => {
        setLoadingItems(false);
      });
  }, []);

  // --- Fetch Active Discount Schemes ---
  useEffect(() => {
    setLoadingSchemes(true);
    axios
      .get("http://127.0.0.1:8000/api/discount-schemes")
      .then((response) => {
        if (response.data && Array.isArray(response.data.data)) {
            // Filter for only active schemes right away (optional, can also filter in applyDiscountScheme)
            // const active = response.data.data.filter(scheme => scheme.active);
            setActiveSchemes(response.data.data); // Store all schemes, filter during application
             console.log("Fetched Schemes:", response.data.data);
        } else {
          console.error("Unexpected scheme data format:", response.data);
          setActiveSchemes([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching discount schemes:", error);
        setActiveSchemes([]);
        // Add user feedback for error
      })
      .finally(() => {
        setLoadingSchemes(false);
      });
  }, []); // Fetch only once on mount

  // Debounced Search Function
  const debouncedSearch = useCallback( // Wrap with useCallback
    debounce((query) => {
      if (!Array.isArray(items)) {
        console.error("Items is not an array:", items);
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
          (item.product_name &&
            item.product_name.toLowerCase().includes(lowerCaseQuery)) ||
          (item.item_code && item.item_code.includes(query)) || // Keep if using item_code/barcode
          (item.barcode && item.barcode.includes(query))
      );
      setSearchResults(results);
      setSelectedSearchIndex(0); // Reset index on new search
    }, 300),
    [items] // Dependency: re-create if 'items' changes
  );

  // Handle Search Input Change
  const handleSearch = (query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // --- Recalculate prices in table when SaleType changes ---
  useEffect(() => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        // Calculate the new price considering saleType and active schemes
        const newPrice = applyDiscountScheme(product, saleType, activeSchemes);
        const discountPerUnit = Math.max(
          parseFloat(product.mrp || 0) - newPrice, // Discount is difference from MRP
          0
        );

        return {
          ...product,
          price: newPrice, // This is the actual selling price (U.Price)
          discount: discountPerUnit, // This is the discount amount per unit based on MRP
          total: newPrice * (product.qty || 1), // Total based on selling price
        };
      })
    );
  }, [saleType, activeSchemes]); // Re-run if saleType or schemes change

  // Handle Quantity Input Change
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow integers and potentially decimals if needed for units like kg
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
       setQuantity(value === "" ? "" : parseFloat(value)); // Store as number or empty string
    }
  };

  // Handle Keyboard Navigation in Search Results
  const handleKeyDown = (e) => {
    if (searchResults.length > 0) {
        if (e.key === "ArrowDown") {
            e.preventDefault(); // Prevent page scroll
            setSelectedSearchIndex((prev) =>
                Math.min(prev + 1, searchResults.length - 1)
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault(); // Prevent page scroll
            setSelectedSearchIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
             e.preventDefault(); // Prevent form submission or other default actions
            if (selectedSearchIndex >= 0) {
                handleItemSelection(searchResults[selectedSearchIndex]);
            }
        }
    } else if (e.key === "Enter" && selectedProduct && quantity > 0) {
        // If no search results but a product is selected (e.g., by clicking)
        // and quantity is entered, pressing Enter in quantity field adds the product.
        if (document.activeElement === quantityInputRef.current) {
             addProductToTable();
        }
    }
  };

  // Handle Selecting an Item from Search Results (Click or Enter)
  const handleItemSelection = (item) => {
    setSelectedProduct(item);
    setSearchQuery(item.product_name); // Update search input to show selected name
    setSearchResults([]); // Close dropdown
    setQuantity(1); // Reset quantity
    if (quantityInputRef.current) {
        quantityInputRef.current.focus(); // Focus quantity input
        quantityInputRef.current.select(); // Select text for easy replacement
    }
  };

  // --- Add Product to the Bill Table ---
  const addProductToTable = () => {
    const currentQuantity = parseFloat(quantity || 0); // Ensure quantity is a number

    if (!selectedProduct || currentQuantity <= 0) {
        alert("Please select a product and enter a valid quantity.");
        return;
    }

    // Stock Check
    if (currentQuantity > selectedProduct.stock) {
      alert(
        `Insufficient stock! Only ${selectedProduct.stock} available for ${selectedProduct.product_name}.`
      );
      return;
    }

    // --- Apply Discount Scheme to determine the final unit price ---
    const finalUnitPrice = applyDiscountScheme(selectedProduct, saleType, activeSchemes);

    // Calculate discount per unit based on MRP and the final selling price
    const discountPerUnit = Math.max(parseFloat(selectedProduct.mrp || 0) - finalUnitPrice, 0);

    // Check if product already exists in the table
    const existingProductIndex = products.findIndex(
      (p) => p.product_id === selectedProduct.product_id // Use a unique ID like product_id
    );

    if (existingProductIndex >= 0) {
      // Update existing product quantity and total
      const updatedProducts = [...products];
      const existingProduct = updatedProducts[existingProductIndex];
      const newQuantity = existingProduct.qty + currentQuantity;

      // Re-check stock for the *total* quantity
       if (newQuantity > selectedProduct.stock) {
         alert(
           `Insufficient stock! Only ${selectedProduct.stock} available for ${selectedProduct.product_name}. You already have ${existingProduct.qty} in the bill.`
         );
         return;
       }


      existingProduct.qty = newQuantity;
      // Price and discount per unit remain the same, only total changes
      existingProduct.total = finalUnitPrice * newQuantity;

      setProducts(updatedProducts);
    } else {
      // Add new product row
      const newProduct = {
        ...selectedProduct, // Include all product details
        qty: currentQuantity,
        price: finalUnitPrice, // Store the calculated final unit price (U.Price)
        discount: discountPerUnit, // Store the calculated discount amount per unit
        total: finalUnitPrice * currentQuantity,
        serialNumber: products.length + 1, // For display S.No
      };
      setProducts([...products, newProduct]);
    }

    // Reset form fields
    setSearchQuery("");
    setSelectedProduct(null);
    setQuantity(1);
    setSearchResults([]); // Clear search results
    if (searchInputRef.current) {
        searchInputRef.current.focus(); // Focus back on search input
    }
  };

  // --- Update Quantity directly in the table ---
  const updateProductQuantity = (index, newQtyStr) => {
     const newQty = parseFloat(newQtyStr);

    if (isNaN(newQty) || newQty < 0) {
        // Handle invalid input, maybe revert or show error
        console.warn("Invalid quantity input:", newQtyStr);
        // Optionally revert to previous value or set to 0/1
        // For simplicity, we might just update the state and let validation handle it elsewhere
        // Or prevent the update if newQty is invalid
        return;
    }

     setProducts((prevProducts) => {
        const productToUpdate = prevProducts[index];
         // Stock check before updating
         if (newQty > productToUpdate.stock) {
             alert(`Insufficient stock! Only ${productToUpdate.stock} available for ${productToUpdate.product_name}.`);
             // Revert input or keep the max available stock? Decide behavior.
             // For now, let's just alert and not update past stock limit.
             // To revert, you might need to store the previous value temporarily.
             // Or, simply cap the quantity at the stock level:
             // newQty = productToUpdate.stock; // Uncomment to cap at stock
              return prevProducts; // Don't update if exceeding stock
         }

        return prevProducts.map((product, i) =>
            i === index
                ? {
                    ...product,
                    qty: newQty,
                    total: newQty * product.price, // Recalculate total based on existing price
                  }
                : product
        );
    });
  };

    // --- Update Price directly in the table (Generally NOT recommended with schemes) ---
    // Be cautious allowing direct price edits if schemes are active, as it bypasses the scheme logic.
    // If allowed, recalculate the discount based on the new price and MRP.
    const updateProductPrice = (index, newPriceStr) => {
        const newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice) || newPrice < 0) {
             console.warn("Invalid price input:", newPriceStr);
            return; // Prevent update
        }

        setProducts((prevProducts) =>
            prevProducts.map((product, i) => {
                if (i === index) {
                    // Recalculate discount based on MRP and the manually entered price
                    const newDiscountPerUnit = Math.max(parseFloat(product.mrp || 0) - newPrice, 0);
                    return {
                        ...product,
                        price: newPrice, // The manually set price
                        discount: newDiscountPerUnit, // Updated discount per unit
                        total: newPrice * (product.qty || 0), // Recalculated total
                    };
                }
                return product;
            })
        );
    };

  // Delete Confirmation Handling
  const handleDeleteClick = (index) => {
    setPendingDeleteIndex(index);
    setShowNotification(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      setProducts((prevProducts) =>
        prevProducts
        .filter((_, i) => i !== pendingDeleteIndex)
        // Re-number S.No after deletion
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

  // Calculate Totals for the Bill Summary
  const calculateTotals = useCallback(() => {
    const totalQty = products.reduce((acc, p) => acc + (p.qty || 0), 0);
    // SubTotal should be sum of (MRP * Qty) BEFORE any discounts
    const subTotalMRP = products.reduce(
      (acc, p) => acc + (p.mrp || 0) * (p.qty || 0),
      0
    );
     // Total Item Discounts = sum of (Discount Per Unit * Qty)
    const totalItemDiscounts = products.reduce(
      (acc, p) => acc + (p.discount || 0) * (p.qty || 0),
      0
    );
    // Grand Total before bill-level adjustments = sum of (Final Unit Price * Qty)
    const grandTotalBeforeAdjustments = products.reduce(
      (acc, p) => acc + p.total, // 'total' already holds price * qty
      0
    );

    // Apply bill-level tax (example: tax on the final total after item discounts)
    // Adjust calculation based on tax rules (e.g., tax on MRP, tax after discount)
    // This example applies tax AFTER item discounts but BEFORE bill discount/shipping
    const taxAmount = grandTotalBeforeAdjustments * (parseFloat(tax || 0) / 100);

    // Total discount = item discounts + bill discount
    const finalTotalDiscount = totalItemDiscounts + parseFloat(billDiscount || 0);

    // Final Payable Total
    const finalTotal = grandTotalBeforeAdjustments + taxAmount - parseFloat(billDiscount || 0) + parseFloat(shipping || 0);


    return {
      totalQty,
      subTotalMRP, // Sum based on MRP
      totalItemDiscounts,
      totalBillDiscount: parseFloat(billDiscount || 0), // Just the bill discount
      finalTotalDiscount, // Item + Bill Discount
      taxAmount,
      grandTotalBeforeAdjustments, // Sum of item totals (Price * Qty)
      finalTotal, // The final payable amount
    };
  }, [products, tax, billDiscount, shipping]); // Dependencies for recalculation


  // Toggle Fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // --- Hold Sale (Example Implementation) ---
  const holdSale = () => {
    if (products.length === 0) {
      alert("Cannot hold an empty sale.");
      return;
    }
    const saleId = `HELD-${Date.now()}`; // Prefix to distinguish
    const saleData = {
      saleId,
      products,
      totals: calculateTotals(),
      tax,
      billDiscount,
      shipping,
      saleType,
      customerInfo, // Save customer info if entered
      billNumber, // Save the current bill number context if needed
    };
    try {
        // Basic example: store in localStorage. Consider a more robust backend solution for held bills.
        const heldSales = JSON.parse(localStorage.getItem("heldSales") || "[]");
        heldSales.push(saleData);
        localStorage.setItem("heldSales", JSON.stringify(heldSales));
        alert(`Sale held with ID: ${saleId}`);
        // Clear the current POS state after holding
        resetPOS();
    } catch (error) {
        console.error("Error holding sale:", error);
        alert("Failed to hold sale. Check console for details.");
    }
  };

   // --- Reset POS State ---
  const resetPOS = () => {
     setProducts([]);
     setTax(0);
     setBillDiscount(0);
     setShipping(0);
     setSearchQuery("");
     setSelectedProduct(null);
     setQuantity(1);
     setSearchResults([]);
     setCustomerInfo({ name: "", mobile: "", bill_number: "", userId: "U-1" });
     // Optionally fetch the *next* bill number again if needed, or keep the current one
     // fetchNextBillNumber(); // Uncomment if you want a fresh bill number after reset/hold
     if (searchInputRef.current) {
         searchInputRef.current.focus();
     }
  };

  // --- Open Bill Print Modal ---
  const handleOpenBill = () => {
    if (products.length === 0) {
      alert("Cannot proceed to payment with an empty bill.");
      return;
    }
    // Update customer info with the final bill number before opening modal
    setCustomerInfo((prevState) => ({
      ...prevState,
      bill_number: billNumber,
    }));
    setShowBillModal(true);
  };

  const closeBillModal = (saleSaved = false) => {
    setShowBillModal(false);
     // If sale was successfully saved in the modal, reset the POS
     if (saleSaved) {
         resetPOS();
         // Fetch the *very next* bill number after a successful save
         const fetchNextBillNumber = async () => {
           try {
             const response = await axios.get(
               "http://127.0.0.1:8000/api/next-bill-number"
             );
             setBillNumber(response.data.next_bill_number);
           } catch (error) {
             console.error("Error fetching next bill number post-sale:", error);
           }
         };
         fetchNextBillNumber();
     }
     // Always reset customer info specific to the modal interaction
     setCustomerInfo((prevState) => ({
        ...prevState, // Keep userId maybe?
        name: "",
        mobile: "",
        bill_number: "", // Clear bill number from state after modal closes
    }));
  };


  // --- Keyboard Shortcut for Pay (Alt+P) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault(); // Prevent default browser behavior (like printing)
        handleOpenBill();
      }
      // Add Alt+H for Hold?
      if (e.altKey && e.key.toLowerCase() === "h") {
         e.preventDefault();
         holdSale();
      }
       // Add Alt+R for Reset?
      if (e.altKey && e.key.toLowerCase() === "r") {
         e.preventDefault();
         resetPOS();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleOpenBill, holdSale, resetPOS]); // Include functions in dependency array if they aren't using useCallback

  // --- Other Event Handlers (Space press, Calculator etc.) ---
  // Keep the spacePressCount logic if needed for focusing Pay button
  useEffect(() => {
    if (spacePressCount === 3 && payButtonRef.current) {
      payButtonRef.current.focus();
      setSpacePressCount(0);
    }
  }, [spacePressCount]);

  // --- Calculate totals whenever dependencies change ---
  const totals = calculateTotals(); // Calculate totals once per render cycle


  // --- Component Return JSX ---
  return (
    <div
      className={`min-h-screen w-full p-4 ${isFullScreen ? "fullscreen-mode" : ""
        }`} // Add fullscreen styles if needed
    >
      {/* Top Bar */}
      <div className="p-2 mb-4 rounded-lg shadow-xl bg-slate-600"> {/* Adjusted background */}
        <div className="flex flex-wrap items-center justify-between w-full gap-4 p-2 rounded-lg shadow-md md:p-4 bg-slate-500"> {/* Flex-wrap for responsiveness */}
          {/* Left Side: Sale Type */}
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

          {/* Right Side: Bill Info & Actions */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4"> {/* Flex-wrap and gap */}
            <div className="flex items-center space-x-2">
              <label className="font-bold text-white">Bill No:</label>
              <input
                type="text"
                className="w-24 px-3 py-2 font-bold text-center text-orange-700 bg-white border rounded-lg md:w-32" // Fixed width example
                value={billNumber} // Display the fetched/current bill number
                readOnly
              />
            </div>

            {/* Action Buttons */}
            <button
              className="p-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600"
              title="View Hold List (Alt+L)" // Add shortcut hint
              onClick={() => alert("Feature: Load Held Sales - Coming Soon")} // Placeholder
            >
              <ClipboardList size={28} /> {/* Slightly smaller icons */}
            </button>

            <button
              className="p-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600"
              title="Close Register"
              onClick={() => setIsCloseRegisterOpen(true)} // Placeholder/Actual function
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
              onClick={() => navigate("/Dashboard")} // Ensure this route exists
            >
              <LayoutDashboard size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Side: Product Selection & Table */}
        <div className="p-4 rounded-lg shadow-inner lg:col-span-2 bg-slate-200 dark:bg-gray-700"> {/* Adjusted background */}
          {/* Search and Add Section */}
          <div className="relative flex flex-col items-stretch gap-2 mb-4 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-grow">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-4 py-2 border rounded-lg text-slate-700 dark:text-white dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search Product (Name, Code, Barcode)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown} // Use shared keydown handler
                disabled={loadingItems || loadingSchemes} // Disable while loading
              />
               {(loadingItems || loadingSchemes) && <span className="absolute text-xs text-gray-500 right-2 top-2">Loading...</span>}
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 overflow-auto bg-white border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-60">
                  {searchResults.map((item, index) => (
                    <li
                      key={item.product_id || index} // Use a unique key
                      className={`p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 ${index === selectedSearchIndex
                        ? "bg-blue-200 dark:bg-blue-600 text-black dark:text-white"
                        : "text-black dark:text-gray-200"
                        }`}
                      onClick={() => handleItemSelection(item)}
                      onMouseEnter={() => setSelectedSearchIndex(index)} // Optional: Highlight on hover
                    >
                      {item.product_name} ({item.item_code}) - Stock: {item.stock}
                    </li>
                  ))}
                </ul>
              )}
            </div>

             {/* Selected Product Display (Readonly) */}
             <input
                type="text"
                className="w-full px-4 py-2 font-medium bg-gray-100 border rounded-lg md:w-48 dark:bg-gray-500 text-amber-700 dark:text-amber-400" // Adjusted style
                readOnly
                value={selectedProduct ? selectedProduct.product_name : "No product selected"}
                title={selectedProduct ? selectedProduct.product_name : ""}
            />

            {/* Quantity Input */}
             <input
                ref={quantityInputRef}
                type="number" // Use number type for better mobile experience & arrows
                step="1" // Or "0.1" / "0.01" if decimal quantities needed
                min="0" // Prevent negative quantity
                className="w-full px-3 py-2 text-center bg-white border rounded-lg md:w-24 dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="Qty"
                value={quantity}
                onChange={handleQuantityChange}
                onKeyDown={handleKeyDown} // Use shared keydown handler
                disabled={!selectedProduct} // Disable if no product selected
             />

            {/* Add Button */}
            <button
              className="w-full px-5 py-2 text-white bg-green-600 rounded-lg shadow md:w-auto hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addProductToTable}
              disabled={!selectedProduct || parseFloat(quantity || 0) <= 0 || loadingItems || loadingSchemes} // Disable if no product/qty or loading
            >
              Add
            </button>
          </div>

          {/* Products Table */}
          <h2 className="my-4 text-lg font-bold text-gray-800 dark:text-gray-200">
            Current Bill Items
          </h2>
          <div className="overflow-x-auto max-h-[55vh]"> {/* Max height and scroll */}
            <table className="w-full text-sm border border-gray-400 dark:border-gray-600">
              <thead className="top-0 z-10 bg-gray-700  text-amber-500">
                <tr>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">S.No</th>
                  <th className="px-2 py-2 text-left border border-gray-500 dark:border-gray-600">Name</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">MRP</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">Qty</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">U.Price</th>
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">U.Disc</th> {/* Unit Discount */}
                  <th className="px-2 py-2 border border-gray-500 dark:border-gray-600">Total</th>
                  <th className="px-2 py-2 text-center border border-gray-500 dark:border-gray-600">
                    <Trash2 size={18} />
                  </th>
                </tr>
              </thead>
              <tbody className="text-center bg-white divide-y divide-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:divide-gray-600">
                {products.length === 0 ? (
                    <tr>
                        <td colSpan="8" className="py-6 italic text-center text-gray-500 dark:text-gray-400">
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
                        {formatNumberWithCommas(product.mrp)}
                        </td>
                        <td className="px-2 py-1 border border-gray-300 dark:border-gray-600">
                        <input
                            type="number"
                            step="1" // Or match step from main input
                            min="0"
                            className="w-16 py-1 text-center bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={product.qty}
                            onChange={(e) => updateProductQuantity(index, e.target.value)}
                            // onBlur={(e) => { /* Optional: Validate on blur */ }}
                        />
                        </td>
                        <td className="px-2 py-1 text-right border border-gray-300 dark:border-gray-600">
                         {/* Make price ReadOnly if using schemes, or allow override carefully */}
                         <input
                            type="number"
                             step="0.01"
                             min="0"
                            className="w-24 py-1 text-right bg-transparent border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 read-only:bg-gray-200 dark:read-only:bg-gray-600"
                            value={product.price.toFixed(2)} // Display formatted price
                            readOnly // Set to true to prevent manual changes that bypass schemes
                            // onChange={(e) => updateProductPrice(index, e.target.value)} // Enable only if override is needed
                        />
                        </td>
                        <td className="px-2 py-1 text-right border border-gray-300 dark:border-gray-600">
                           {/* Display calculated unit discount */}
                           {formatNumberWithCommas(product.discount.toFixed(2))}
                        </td>
                        <td className="px-2 py-1 font-medium text-right border border-gray-300 dark:border-gray-600">
                        {formatNumberWithCommas(product.total.toFixed(2))}
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

          {/* Delete Confirmation Notification */}
          {showNotification && (
            <Notification
              message="Are you sure you want to delete this product?"
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

        {/* Right Side: Payment Details & Actions */}
        <div className="w-full p-4 rounded-lg shadow-lg backdrop-blur-md bg-slate-700 bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-70"> {/* Adjusted background */}
          <h2 className="mb-4 text-xl font-bold text-white">Payment Details</h2>
          <div className="space-y-3">
            {/* Tax Input - Consider making this based on settings? */}
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
             {/* Bill Discount Input */}
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
             {/* Shipping Input - Optional */}
              {/* <div>
                 <label className="block mb-1 text-sm font-medium text-gray-200">Shipping Charges</label>
                 <input
                     type="number"
                     min="0"
                     step="0.01"
                     value={shipping}
                     onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                     className="w-full px-3 py-2 text-black bg-white border rounded-lg dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Shipping amount"
                 />
             </div> */}
          </div>

          {/* Totals Summary */}
          <div className="p-4 mt-6 text-sm text-gray-100 bg-transparent border border-gray-500 rounded-lg shadow-inner space-y-1.5"> {/* Adjusted style */}
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
             {/* Optional: Show Total Discount */}
             {/* <div className="flex justify-between font-semibold text-red-300">
                 <span>Total Discount:</span>
                 <span className="font-medium">(-) Rs. {formatNumberWithCommas(totals.finalTotalDiscount.toFixed(2))}</span>
             </div> */}
             {/* Optional: Show Total After Item Discounts */}
             {/* <div className="flex justify-between">
                 <span>Net Total (Items):</span>
                 <span className="font-medium">Rs. {formatNumberWithCommas(totals.grandTotalBeforeAdjustments.toFixed(2))}</span>
             </div> */}
             <div className="flex justify-between">
                 <span>Tax ({tax}%):</span>
                 <span className="font-medium">(+) Rs. {formatNumberWithCommas(totals.taxAmount.toFixed(2))}</span>
             </div>
              {/* Optional: Show Shipping */}
             {/* <div className="flex justify-between">
                 <span>Shipping:</span>
                 <span className="font-medium">(+) Rs. {formatNumberWithCommas(parseFloat(shipping || 0).toFixed(2))}</span>
             </div> */}
             <hr className="my-2 border-gray-500"/>
             <div className="flex justify-between text-xl font-bold text-green-400">
                 <span>Grand Total:</span>
                 <span>Rs. {formatNumberWithCommas(totals.finalTotal.toFixed(2))}</span>
             </div>
          </div>

           {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-6"> {/* Use grid for equal buttons */}
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
              onClick={resetPOS} // Use the reset function
              title="Reset Bill (Alt+R)"
            >
              <RefreshCw size={18} /> Reset
            </button>
            <button
              ref={payButtonRef} // Ref for focus
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

      {/* Modals */}
      {showBillModal && (
        <BillPrintModal
          initialProducts={products || []}
          initialBillDiscount={parseFloat(billDiscount || 0)}
          initialTax={parseFloat(tax || 0)} // Pass tax
          initialShipping={parseFloat(shipping || 0)} // Pass shipping
          initialTotals={totals} // Pass calculated totals
          initialCustomerInfo={customerInfo} // Pass customer info including bill number
          onClose={closeBillModal} // Pass the close handler
        />
      )}

       {showCalculatorModal && (
          <CalculatorModal
             isOpen={showCalculatorModal} // Control visibility
             onClose={() => setShowCalculatorModal(false)}
         />
       )}

       {isCloseRegisterOpen && (
         <CloseRegisterModal
             isOpen={isCloseRegisterOpen}
             onClose={() => setIsCloseRegisterOpen(false)}
             // Pass necessary data if needed, e.g., calculate closing details
             // closingDetails={calculatedClosingDetails}
         />
       )}

    </div>
  );
};

export default POSForm;