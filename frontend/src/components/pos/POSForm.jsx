// src/components/pos/POSForm.jsx

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

// --- Helper Function to Apply Discount Schemes ---
// (This function remains unchanged as it deals with pricing, not stock source)
const applyDiscountScheme = (product, saleType, schemes) => {
    // Ensure product and schemes are valid
    if (!product || !product.product_id || !Array.isArray(schemes)) {
        const fallbackPrice = saleType === "Wholesale"
           ? parseFloat(product?.wholesale_price || product?.sales_price || 0)
           : parseFloat(product?.sales_price || 0);
        return Math.max(0, fallbackPrice); // Ensure price is not negative
    }

    // Determine the base price based on Sale Type
    const basePrice = saleType === "Wholesale"
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
       schemeList.forEach(scheme => {
           if (!scheme.active || !scheme.type || scheme.value === null || scheme.value === undefined) return;

           const startDate = scheme.start_date ? new Date(scheme.start_date) : null;
           const endDate = scheme.end_date ? new Date(scheme.end_date) : null;
           if (startDate && startDate > today) return;
           if (endDate) {
                endDate.setHours(23, 59, 59, 999);
                if (endDate < today) return;
            }

           let currentDiscountValue = 0;
           const schemeValue = parseFloat(scheme.value || 0);

           if (scheme.type === 'percentage' && schemeValue > 0) {
               currentDiscountValue = (basePrice * schemeValue) / 100;
           } else if (scheme.type === 'amount' && schemeValue > 0) {
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

    const productSchemes = schemes.filter(s =>
       s.applies_to === 'product' &&
       s.target === product.product_name
    );
    findBestScheme(productSchemes);

    if ((!bestScheme || maxDiscountValue <= 0) && product.category_name) {
       const categorySchemes = schemes.filter(s =>
           s.applies_to === 'category' &&
           s.target === product.category_name
       );
       findBestScheme(categorySchemes);
    }

    if (bestScheme && maxDiscountValue > 0) {
       let discountedPrice = basePrice;
       const schemeValue = parseFloat(bestScheme.value || 0);

       if (bestScheme.type === 'percentage') {
           discountedPrice = basePrice * (1 - schemeValue / 100);
       } else if (bestScheme.type === 'amount') {
           discountedPrice = basePrice - schemeValue;
       }
       return Math.max(0, discountedPrice);
    }

    return basePrice;
};


const POSForm = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [saleType, setSaleType] = useState("Retail");
    const [products, setProducts] = useState([]); // Products in the current bill/table
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
    const [items, setItems] = useState([]); // All available items/products fetched from API
    const [activeSchemes, setActiveSchemes] = useState([]); // State for discount schemes
    const [tax, setTax] = useState(0);
    const [billDiscount, setBillDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null); // The product currently selected in search
    const [quantity, setQuantity] = useState(1);
    const searchInputRef = useRef(null);
    const quantityInputRef = useRef(null);
    const payButtonRef = useRef(null);
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
    });
    const [showCalculatorModal, setShowCalculatorModal] = useState(false);
    const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingSchemes, setLoadingSchemes] = useState(false);

    // Fetch Next Bill Number
    useEffect(() => {
        const fetchNextBillNumber = async () => {
            try {
                const response = await axios.get(
                    "http://127.0.0.1:8000/api/next-bill-number"
                );
                setBillNumber(response.data.next_bill_number);
            } catch (error) {
                console.error("Error fetching next bill number:", error);
                setBillNumber("ERR-001");
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
                    // Map fetched data, using 'opening_stock_quantity' for the 'stock' field used by POS logic
                    const productsWithOpeningStock = response.data.data.map(p => ({
                        ...p,
                        // --- THIS IS THE KEY CHANGE ---
                        // Use opening_stock_quantity as the value for the 'stock' property
                        stock: parseFloat(p.opening_stock_quantity || 0), // Use opening stock here
                        // Keep other fields as needed
                        category_name: p.category_name || 'Unknown Category'
                    }));
                    setItems(productsWithOpeningStock);
                    // Update log message for clarity
                    console.log("Fetched Products (using opening_stock_quantity as 'stock'):", productsWithOpeningStock);
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
    }, []); // Fetch only once on mount

    // --- Fetch Active Discount Schemes ---
    useEffect(() => {
        setLoadingSchemes(true);
        axios
            .get("http://127.0.0.1:8000/api/discount-schemes")
            .then((response) => {
                if (response.data && Array.isArray(response.data.data)) {
                    const formattedSchemes = response.data.data.map(s => ({
                        ...s,
                        applies_to: s.applies_to || s.appliesTo,
                        start_date: s.start_date || s.startDate,
                        end_date: s.end_date || s.endDate,
                    }));
                    const active = formattedSchemes.filter(scheme => scheme.active);
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

    // Debounced Search Function
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

    // Handle Search Input Change
    const handleSearch = (query) => {
        setSearchQuery(query);
        setSelectedProduct(null);
        debouncedSearch(query);
    };

    // --- Recalculate prices in table when SaleType or Schemes change ---
    useEffect(() => {
        if (activeSchemes.length > 0 || !loadingSchemes) {
            setProducts((prevProducts) =>
                prevProducts.map((product) => {
                    const newPrice = applyDiscountScheme(product, saleType, activeSchemes);
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

    // Handle Quantity Input Change
    const handleQuantityChange = (e) => {
        const value = e.target.value;
        if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setQuantity(value);
        }
    };

    // Handle Keyboard Navigation in Search Results
    const handleKeyDown = (e) => {
        const numSearchResults = searchResults.length;

        if (e.key === 'ArrowDown') {
            if (numSearchResults > 0) {
                e.preventDefault();
                setSelectedSearchIndex(prev => (prev + 1) % numSearchResults);
            }
        } else if (e.key === 'ArrowUp') {
            if (numSearchResults > 0) {
                e.preventDefault();
                setSelectedSearchIndex(prev => (prev - 1 + numSearchResults) % numSearchResults);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (numSearchResults > 0 && selectedSearchIndex >= 0) {
                handleItemSelection(searchResults[selectedSearchIndex]);
            } else if (selectedProduct && quantityInputRef.current && document.activeElement === quantityInputRef.current) {
                const currentQuantity = parseFloat(quantity || 0);
                 if (currentQuantity > 0) {
                    addProductToTable();
                 } else {
                    alert("Please enter a valid quantity.");
                 }
            } else if (searchInputRef.current && document.activeElement === searchInputRef.current && !selectedProduct && numSearchResults === 0 && searchQuery.trim() !== "") {
                 console.log("Product not found or not selected.");
            }
        }
    };


    // Handle Selecting an Item from Search Results (Click or Enter)
    const handleItemSelection = (item) => {
        if (!item || !item.product_id) {
            console.error("Invalid item selected:", item);
            return;
        }
        // item now contains 'stock' which holds the opening_stock_quantity
        setSelectedProduct(item);
        setSearchQuery(item.product_name);
        setSearchResults([]);
        setQuantity(1);
        setSelectedSearchIndex(-1);
        if (quantityInputRef.current) {
            quantityInputRef.current.focus();
            quantityInputRef.current.select();
        }
    };

    // --- Add Product to the Bill Table ---
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

        // Stock Check: Use selectedProduct.stock (which now holds opening_stock_quantity)
        const availableStock = parseFloat(selectedProduct.stock || 0); // Reads opening stock quantity
        if (isNaN(availableStock)) {
             alert(`Opening Stock information missing or invalid for ${selectedProduct.product_name}. Cannot add.`);
             return;
        }

        const finalUnitPrice = applyDiscountScheme(selectedProduct, saleType, activeSchemes);
        const mrp = parseFloat(selectedProduct.mrp || 0);
        const discountPerUnit = Math.max(0, mrp - finalUnitPrice);

        const existingProductIndex = products.findIndex(
            (p) => p.product_id === selectedProduct.product_id
        );

        let updatedProducts = [...products];

        if (existingProductIndex >= 0) {
            const existingProduct = updatedProducts[existingProductIndex];
            const newQuantity = (existingProduct.qty || 0) + currentQuantity;

            // Re-check stock for the *total* quantity using availableStock (opening stock)
            if (newQuantity > availableStock) {
                alert(
                    `Insufficient opening stock for ${selectedProduct.product_name}! Only ${availableStock} available based on opening quantity. You already have ${existingProduct.qty || 0} in the bill.`
                );
                quantityInputRef.current?.focus();
                quantityInputRef.current?.select();
                return; // Stop the update
            }

            updatedProducts[existingProductIndex] = {
                ...existingProduct,
                qty: newQuantity,
                total: finalUnitPrice * newQuantity,
            };
            setProducts(updatedProducts);
        } else {
            // Add new product row (check stock before adding using opening stock)
            if (currentQuantity > availableStock) {
                alert(
                    `Insufficient opening stock for ${selectedProduct.product_name}! Only ${availableStock} available based on opening quantity.`
                );
                quantityInputRef.current?.focus();
                quantityInputRef.current?.select();
                return; // Stop adding
            }

            const newProduct = {
                ...selectedProduct, // Include all product details (including 'stock' property which holds opening qty)
                qty: currentQuantity,
                price: finalUnitPrice,
                discount: discountPerUnit,
                total: finalUnitPrice * currentQuantity,
                serialNumber: products.length + 1,
            };
             setProducts([...products, newProduct]);
        }

        // Reset form fields
        setSearchQuery("");
        setSelectedProduct(null);
        setQuantity(1);
        setSearchResults([]);
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // --- Update Quantity directly in the table ---
    const updateProductQuantity = (index, newQtyStr) => {
        const newQty = parseFloat(newQtyStr);

        if (isNaN(newQty) || newQty < 0) {
            console.warn("Invalid quantity input:", newQtyStr);
             return;
        }

        setProducts((prevProducts) => {
            const productToUpdate = prevProducts[index];
            if (!productToUpdate) return prevProducts;

            // Use the stock value stored in the product object within the table
            // This 'stock' property holds the original opening_stock_quantity
            const availableStock = parseFloat(productToUpdate.stock || 0); // Reads opening stock

            // Stock check before updating state using opening stock
            if (!isNaN(availableStock) && newQty > availableStock) {
                alert(`Quantity exceeds opening stock! Only ${availableStock} available for ${productToUpdate.product_name} based on opening quantity.`);
                return prevProducts; // Keep previous state
            }

            return prevProducts.map((product, i) => {
                if (i === index) {
                    const newTotal = newQty * product.price;
                    return {
                        ...product,
                        qty: newQty,
                        total: newTotal,
                    };
                }
                return product;
            });
        });
    };

    // --- Update Price directly in the table --- (Generally NOT recommended with schemes)
    const updateProductPrice = (index, newPriceStr) => {
        const newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice) || newPrice < 0) {
            console.warn("Invalid price input:", newPriceStr);
            return;
        }
        setProducts((prevProducts) =>
            prevProducts.map((product, i) => {
                if (i === index) {
                    const mrp = parseFloat(product.mrp || 0);
                    const newDiscountPerUnit = Math.max(0, mrp - newPrice);
                    const newTotal = newPrice * (product.qty || 0);
                    return {
                        ...product,
                        price: newPrice,
                        discount: newDiscountPerUnit,
                        total: newTotal,
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
        if (pendingDeleteIndex !== null && pendingDeleteIndex >= 0 && pendingDeleteIndex < products.length) {
            setProducts((prevProducts) => {
                const updated = prevProducts.filter((_, i) => i !== pendingDeleteIndex);
                return updated.map((p, idx) => ({ ...p, serialNumber: idx + 1 }));
            });
        } else {
             console.warn("Attempted to delete invalid index:", pendingDeleteIndex);
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

    // Calculate Totals for the Bill Summary
    const calculateTotals = useCallback(() => {
        let totalQty = 0;
        let subTotalMRP = 0;
        let totalItemDiscounts = 0;
        let grandTotalBeforeAdjustments = 0;

        products.forEach(p => {
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
        const finalTotal = grandTotalBeforeAdjustments + taxAmount - currentBillDiscount + currentShipping;

        return {
            totalQty,
            subTotalMRP: isNaN(subTotalMRP) ? 0 : subTotalMRP,
            totalItemDiscounts: isNaN(totalItemDiscounts) ? 0 : totalItemDiscounts,
            totalBillDiscount: isNaN(currentBillDiscount) ? 0 : currentBillDiscount,
            finalTotalDiscount: isNaN(finalTotalDiscount) ? 0 : finalTotalDiscount,
            taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
            grandTotalBeforeAdjustments: isNaN(grandTotalBeforeAdjustments) ? 0 : grandTotalBeforeAdjustments,
            finalTotal: isNaN(finalTotal) ? 0 : finalTotal,
        };
    }, [products, tax, billDiscount, shipping]);


    // Toggle Fullscreen
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
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

    // --- Hold Sale (Example Implementation) ---
    const holdSale = useCallback(() => {
        if (products.length === 0) {
            alert("Cannot hold an empty sale.");
            return;
        }
        const currentTotals = calculateTotals();
        const saleId = `HELD-${Date.now()}`;
        const saleData = {
            saleId,
            products, // products will contain the 'stock' property holding opening_stock_quantity
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
            alert(`Sale held with ID: ${saleId}. Use 'View Hold List' (Alt+L) to retrieve.`);
            resetPOS(false);
        } catch (error) {
            console.error("Error holding sale:", error);
            alert("Failed to hold sale. Check console for details.");
        }
    }, [products, calculateTotals, tax, billDiscount, shipping, saleType, customerInfo, billNumber]);


    // --- Reset POS State ---
    const resetPOS = useCallback((fetchNewBill = true) => {
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

        if (fetchNewBill) {
            const fetchNextBillNumber = async () => {
                try {
                    const response = await axios.get("http://127.0.0.1:8000/api/next-bill-number");
                    setBillNumber(response.data.next_bill_number);
                } catch (error) {
                    console.error("Error fetching next bill number post-reset:", error);
                    setBillNumber("ERR-XXX");
                }
            };
            fetchNextBillNumber();
        } else {
             setCustomerInfo(prev => ({ ...prev, bill_number: "" }));
        }

        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // --- Open Bill Print Modal ---
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


    // --- Close Bill Print Modal ---
    const closeBillModal = useCallback((saleSaved = false) => {
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
            bill_number: "",
        }));
    }, [resetPOS]);

    // --- Keyboard Shortcut Hooks ---
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === "p") { e.preventDefault(); handleOpenBill(); }
            if (e.altKey && e.key.toLowerCase() === "h") { e.preventDefault(); holdSale(); }
            if (e.altKey && e.key.toLowerCase() === "r") { e.preventDefault(); resetPOS(false); }
            if (e.altKey && e.key.toLowerCase() === "c") { e.preventDefault(); setShowCalculatorModal(true); }
            if (e.altKey && e.key.toLowerCase() === "s") { e.preventDefault(); searchInputRef.current?.focus(); }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [handleOpenBill, holdSale, resetPOS]);

    // Calculate totals once per render cycle
    const totals = calculateTotals();


    // --- Component Return JSX ---
    return (
        <div
            className={`min-h-screen w-full p-4 dark:bg-gray-900 bg-gray-100 ${isFullScreen ? "fullscreen-mode" : ""}`}
        >
            {/* Top Bar */}
            <div className="p-2 mb-4 rounded-lg shadow-xl bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700">
                <div className="flex flex-wrap items-center justify-between w-full gap-2 p-3 rounded-lg shadow-md md:gap-4 bg-slate-500 dark:bg-slate-600">
                    {/* Sale Type */}
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block mb-1 text-sm font-bold text-white">Sale Type</label>
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
                    {/* Bill Info & Actions */}
                    <div className="flex flex-wrap items-center justify-end flex-grow gap-2 md:gap-3">
                        <div className="flex items-center space-x-2">
                            <label className="hidden font-bold text-white sm:inline">Bill No:</label>
                            <input type="text" className="w-24 px-2 py-2 font-bold text-center text-orange-700 bg-white border border-gray-300 rounded-lg md:w-32 dark:bg-gray-700 dark:text-orange-400 dark:border-gray-600" value={billNumber} readOnly title="Current Bill Number" />
                        </div>
                        {/* Action Buttons */}
                        <button className="p-2 text-white transition duration-150 ease-in-out bg-blue-500 rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75" title="View Hold List (Alt+L)" onClick={() => alert("Feature: Load Held Sales - Coming Soon")}> <ClipboardList size={24} /> </button>
                        <button className="p-2 text-white transition duration-150 ease-in-out bg-yellow-500 rounded-lg shadow hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75" title="Dashboard" onClick={() => navigate("/Dashboard")}> <LayoutDashboard size={24} /> </button>
                        <button className="p-2 text-white transition duration-150 ease-in-out bg-purple-500 rounded-lg shadow hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75" title="Calculator (Alt+C)" onClick={() => setShowCalculatorModal(true)}> <Calculator size={24} /> </button>
                        <button className="p-2 text-white transition duration-150 ease-in-out bg-green-500 rounded-lg shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75" title={isFullScreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"} onClick={toggleFullScreen}> {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />} </button>
                        <button className="p-2 text-white transition duration-150 ease-in-out bg-red-500 rounded-lg shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75" title="Close Register" onClick={() => setIsCloseRegisterOpen(true)}> <LogOut size={24} /> </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Left Side: Product Selection & Table */}
                <div className="p-4 rounded-lg shadow-inner lg:col-span-2 bg-slate-200 dark:bg-gray-800">
                    {/* Search and Add Section */}
                    <div className="relative flex flex-col items-stretch gap-2 mb-4 md:flex-row md:items-end">
                        <div className="relative flex-grow">
                             <label htmlFor="productSearch" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Search Product (Alt+S)</label>
                            <input id="productSearch" ref={searchInputRef} type="text" className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg text-slate-800 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name, Code, Barcode..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onKeyDown={handleKeyDown} disabled={loadingItems || loadingSchemes} autoComplete="off" />
                            {(loadingItems || loadingSchemes) && (<span className="absolute text-xs text-gray-500 top-1 right-2 dark:text-gray-400">Loading...</span>)}
                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-60">
                                    {searchResults.map((item, index) => (
                                        <li key={item.product_id || index} className={`p-2 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-600 ${index === selectedSearchIndex ? "bg-blue-200 dark:bg-blue-500 text-black dark:text-white" : "text-black dark:text-gray-200"}`} onClick={() => handleItemSelection(item)} onMouseEnter={() => setSelectedSearchIndex(index)}>
                                            {/* Displays Opening Stock in search result (because item.stock now holds opening stock) */}
                                            {item.product_name} ({item.item_code || 'No Code'}) - Stock: {item.stock ?? 'N/A'} - MRP: {formatNumberWithCommas(item.mrp || 0)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {/* Quantity Input */}
                         <div className="flex-shrink-0 w-full md:w-24">
                             <label htmlFor="quantityInput" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                            <input id="quantityInput" ref={quantityInputRef} type="number" step="1" min="0.01" className="w-full px-3 py-2 text-base text-center bg-white border border-gray-300 rounded-lg md:w-24 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:border-gray-600" placeholder="Qty" value={quantity} onChange={handleQuantityChange} onKeyDown={handleKeyDown} disabled={!selectedProduct || loadingItems || loadingSchemes} />
                        </div>
                        {/* Add Button */}
                         <div className="flex-shrink-0 w-full md:w-auto">
                            <label className="block mb-1 text-sm font-medium text-transparent dark:text-transparent">Add</label>
                            <button className="w-full px-5 py-2 text-base font-semibold text-white transition duration-150 ease-in-out bg-green-600 rounded-lg shadow md:w-auto hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" onClick={addProductToTable} disabled={!selectedProduct || parseFloat(quantity || 0) <= 0 || loadingItems || loadingSchemes}> Add </button>
                        </div>
                    </div>

                    {/* Products Table */}
                    <h2 className="my-4 text-lg font-bold text-gray-800 dark:text-gray-200"> Current Bill Items ({products.length}) </h2>
                    <div className="overflow-x-auto max-h-[50vh] border border-gray-300 dark:border-gray-600 rounded-lg">
                        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                            <thead className="sticky top-0 z-10 text-xs text-white uppercase bg-gray-700 dark:bg-gray-700 dark:text-amber-400">
                                <tr>
                                    <th scope="col" className="px-3 py-3 border-r dark:border-gray-600">S.No</th>
                                    <th scope="col" className="px-4 py-3 border-r dark:border-gray-600 min-w-[200px]">Name</th>
                                    <th scope="col" className="px-3 py-3 text-right border-r dark:border-gray-600">MRP</th>
                                    <th scope="col" className="px-3 py-3 text-center border-r dark:border-gray-600 min-w-[80px]">Qty</th>
                                    <th scope="col" className="px-3 py-3 text-right border-r dark:border-gray-600 min-w-[100px]">U.Price</th>
                                    <th scope="col" className="px-3 py-3 text-right border-r dark:border-gray-600 min-w-[80px]">U.Disc</th>
                                    <th scope="col" className="px-4 py-3 text-right border-r dark:border-gray-600 min-w-[110px]">Total</th>
                                    <th scope="col" className="px-3 py-3 text-center"> <Trash2 size={16} /> </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {products.length === 0 ? (
                                    <tr> <td colSpan="8" className="py-6 italic text-center text-gray-500 dark:text-gray-400"> No items added to the bill yet. Start searching above! </td> </tr>
                                ) : (
                                    products.map((product, index) => (
                                        <tr key={product.product_id + '-' + index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <td className="px-3 py-2 font-medium text-gray-900 border-r dark:text-white dark:border-gray-700"> {product.serialNumber} </td>
                                            <td className="px-4 py-2 border-r dark:border-gray-700" title={product.product_name}> {product.product_name} </td>
                                            <td className="px-3 py-2 text-right border-r dark:border-gray-700"> {formatNumberWithCommas(product.mrp)} </td>
                                            <td className="px-1 py-1 text-center border-r dark:border-gray-700">
                                                <input type="number" step="1" min="0" className="w-16 py-1 text-sm text-center bg-transparent border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white" value={product.qty} onChange={(e) => updateProductQuantity(index, e.target.value)} onFocus={(e) => e.target.select()} />
                                            </td>
                                            <td className="px-3 py-2 text-right border-r dark:border-gray-700">
                                                <input type="number" step="0.01" min="0" className="w-20 py-1 text-sm text-right bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 read-only:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:read-only:bg-gray-600 dark:text-white" value={product.price.toFixed(2)} readOnly />
                                            </td>
                                            <td className="px-3 py-2 text-right text-red-600 border-r dark:text-red-400 dark:border-gray-700"> {formatNumberWithCommas(product.discount?.toFixed(2) ?? 0.00)} </td>
                                            <td className="px-4 py-2 font-medium text-right text-gray-900 border-r dark:text-white dark:border-gray-700"> {formatNumberWithCommas(product.total?.toFixed(2) ?? 0.00)} </td>
                                            <td className="px-3 py-2 text-center"> <button onClick={() => handleDeleteClick(index)} className="p-1 text-red-600 transition duration-150 ease-in-out rounded-lg hover:bg-red-100 dark:hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500" title="Delete Item"> <Trash2 size={16} /> </button> </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Delete Confirmation */}
                    {showNotification && (
                        <Notification message={`Delete item "${products[pendingDeleteIndex]?.product_name ?? 'this item'}"?`} onClose={cancelDelete}>
                            <div className="flex justify-end gap-4 mt-4">
                                <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"> Yes, Delete </button>
                                <button onClick={cancelDelete} className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"> Cancel </button>
                            </div>
                        </Notification>
                    )}
                </div>

                {/* Right Side: Payment Details & Actions */}
                <div className="w-full p-4 rounded-lg shadow-lg backdrop-blur-sm bg-slate-600 bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80">
                    <h2 className="mb-4 text-xl font-bold text-white">Bill Summary</h2>
                    {/* Inputs */}
                    <div className="space-y-3">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-200">Tax (%)</label>
                            <input type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 5" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-200">Bill Discount (Amount)</label>
                            <input type="number" min="0" step="0.01" value={billDiscount} onChange={(e) => setBillDiscount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-black bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Discount amount" />
                        </div>
                    </div>
                    {/* Totals Summary */}
                    <div className="p-4 mt-6 text-sm text-gray-100 bg-transparent border border-gray-500 rounded-lg shadow-inner space-y-1.5 dark:border-gray-600">
                        <div className="flex justify-between"> <span>Total Items / Qty:</span> <span className="font-medium">{products.length} / {formatNumberWithCommas(totals.totalQty.toFixed(1))}</span> </div>
                        <div className="flex justify-between"> <span>Sub Total (MRP):</span> <span className="font-medium">Rs. {formatNumberWithCommas(totals.subTotalMRP.toFixed(2))}</span> </div>
                        <div className="flex justify-between text-red-300"> <span>(-) Item Discounts:</span> <span className="font-medium">Rs. {formatNumberWithCommas(totals.totalItemDiscounts.toFixed(2))}</span> </div>
                        <div className="flex justify-between"> <span>Net Item Total:</span> <span className="font-medium">Rs. {formatNumberWithCommas(totals.grandTotalBeforeAdjustments.toFixed(2))}</span> </div>
                        <div className="flex justify-between text-yellow-300"> <span>(+) Tax ({parseFloat(tax || 0).toFixed(1)}%):</span> <span className="font-medium">Rs. {formatNumberWithCommas(totals.taxAmount.toFixed(2))}</span> </div>
                        <div className="flex justify-between text-red-300"> <span>(-) Bill Discount:</span> <span className="font-medium">Rs. {formatNumberWithCommas(totals.totalBillDiscount.toFixed(2))}</span> </div>
                        <hr className="my-2 border-gray-500 dark:border-gray-600" />
                        <div className="flex justify-between text-xl font-bold text-green-400"> <span>Grand Total:</span> <span>Rs. {formatNumberWithCommas(totals.finalTotal.toFixed(2))}</span> </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <button className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white transition duration-150 ease-in-out rounded-lg shadow bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50" onClick={holdSale} title="Hold Bill (Alt+H)" disabled={products.length === 0}> <PauseCircle size={18} /> Hold </button>
                        <button className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white transition duration-150 ease-in-out bg-gray-500 rounded-lg shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900" onClick={() => resetPOS(false)} title="Reset Bill (Alt+R)"> <RefreshCw size={18} /> Reset </button>
                        <button ref={payButtonRef} className="flex items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-white transition duration-150 ease-in-out rounded-lg shadow bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50" onClick={handleOpenBill} title="Proceed to Pay (Alt+P)" disabled={products.length === 0}> <Printer size={18} /> Pay </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showBillModal && ( <BillPrintModal initialProducts={products} initialBillDiscount={parseFloat(billDiscount || 0)} initialTax={parseFloat(tax || 0)} initialShipping={parseFloat(shipping || 0)} initialTotals={totals} initialCustomerInfo={customerInfo} onClose={closeBillModal} /> )}
            {showCalculatorModal && ( <CalculatorModal isOpen={showCalculatorModal} onClose={() => setShowCalculatorModal(false)} /> )}
            {isCloseRegisterOpen && ( <CloseRegisterModal isOpen={isCloseRegisterOpen} onClose={() => setIsCloseRegisterOpen(false)} /> )}
        </div>
    );
};

export default POSForm;