import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Select from "react-select";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#2563eb" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #2563eb" : "none",
    minHeight: "42px",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: "#2563eb",
    },
    fontSize: "0.875rem",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    fontSize: "0.875rem",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
        ? "#e0e7ff"
        : "white",
    color: state.isSelected ? "white" : "black",
    cursor: "pointer",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6b7280",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
  }),
};
import axios from "axios";
import { toast } from "react-toastify";
import { format } from "date-fns";

// ErrorBoundary component remains the same
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded">
          <h1 className="font-bold">Something went wrong.</h1>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

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

const SalesInvoice = ({
  initialData,
  isEditMode,
  onGenerateInvoice,
  onCancel,
  onUpdateInvoice,
}) => {
  const draftKey = "salesInvoiceDraft";
  const formatDate = (date) => {
    try {
      return date
        ? format(new Date(date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
    } catch {
      return format(new Date(), "yyyy-MM-dd");
    }
  };

  // Refs
  const formRef = useRef(null);
  const invoiceNoRef = useRef(null);
  const invoiceDateRef = useRef(null);
  const invoiceTimeRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerAddressRef = useRef(null);
  const customerPhoneRef = useRef(null);
  const customerEmailRef = useRef(null);
  const purchaseMethodRef = useRef(null);
  const purchaseAmountRef = useRef(null);
  const taxPercentageRef = useRef(null);
  const itemRefs = useRef([]);

  // Helper to get default form state
  const getDefaultFormState = () => {
    return {
      invoice: {
        no: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
      },
      customer: { id: null, name: "", address: "", phone: "", email: "" },
      items: [],
      purchaseDetails: { method: "cash", amount: 0, taxPercentage: 0 },
      status: "pending",
      id: null,
    };
  };

  // State
  const [formData, setFormData] = useState(() => {
    const defaultState = getDefaultFormState();

    if (isEditMode && initialData) {
      return {
        ...defaultState,
        ...initialData,
        invoice: {
          ...defaultState.invoice,
          ...(initialData.invoice || {}),
          date: formatDate(initialData.invoice?.date),
        },
        customer: {
          ...defaultState.customer,
          id: initialData.customer?.id || null,
          name: initialData.customer?.name || "",
          address: initialData.customer?.address || "",
          phone: initialData.customer?.phone || "",
          email: initialData.customer?.email || "",
        },
        items: (initialData.items || []).map((item, idx) => {
          const qty = parseFloat(item.qty || item.quantity || 1);
          const salesPrice = parseFloat(
            item.salesPrice || item.sales_price || 0
          );
          const buyingCost = parseFloat(
            item.buyingCost || item.buying_cost || 0
          );
          const unitPrice = parseFloat(item.unitPrice || item.unit_price || 0);
          const mrp = parseFloat(item.mrp || unitPrice);
          const stock = parseFloat(item.stock || 0);

          return {
            ...item,
            id: item.id || Date.now() + idx,
            productId: item.productId || item.product_id || null,
            categoryId: item.categoryId || null,
            qty,
            unitPrice,
            mrp,
            salesPrice,
            buyingCost,
            stock,
            discountAmount: 0,
            specialDiscount: parseFloat(item.specialDiscount || 0),
            total: parseFloat(
              item.total || qty * unitPrice - (item.specialDiscount || 0)
            ),
            totalBuyingCost: parseFloat(
              item.totalBuyingCost || qty * buyingCost
            ),
            supplier: item.supplier || "",
            category: item.category || "",
            store_location: item.store_location || "",
          };
        }),
        purchaseDetails: {
          ...defaultState.purchaseDetails,
          ...(initialData.purchaseDetails || {}),
          taxPercentage: initialData.tax_percentage || 0,
        },
        id: initialData.id || null,
      };
    }

    const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
    if (savedDraft) {
      return {
        ...defaultState,
        ...savedDraft,
        invoice: {
          ...defaultState.invoice,
          ...savedDraft.invoice,
          date: formatDate(savedDraft.invoice?.date),
        },
        customer: {
          ...defaultState.customer,
          ...savedDraft.customer,
          id: savedDraft.customer?.id || null,
        },
        items: (savedDraft.items || []).map((item, idx) => {
          const qty = parseFloat(item.qty || 1);
          const salesPrice = parseFloat(item.salesPrice || 0);
          const buyingCost = parseFloat(item.buyingCost || 0);
          const unitPrice = parseFloat(item.unitPrice || 0);
          const mrp = parseFloat(item.mrp || unitPrice);
          const stock = parseFloat(item.stock || 0);

          return {
            ...item,
            id: item.id || Date.now() + idx,
            productId: item.productId || null,
            categoryId: item.categoryId || null,
            qty,
            unitPrice,
            mrp,
            salesPrice,
            buyingCost,
            stock,
            discountAmount: 0,
            specialDiscount: 0,
            total: 0,
            totalBuyingCost: 0,
            supplier: item.supplier || "",
            category: item.category || "",
            store_location: item.store_location || "",
          };
        }),
        purchaseDetails: {
          ...defaultState.purchaseDetails,
          ...(savedDraft.purchaseDetails || {}),
          taxPercentage: savedDraft.taxPercentage || 0,
        },
        id: savedDraft.id || null,
      };
    }

    return defaultState;
  });

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [discountSchemes, setDiscountSchemes] = useState([]);

  // Clear form to default state
  const clearForm = () => {
    setFormData(getDefaultFormState());
    setErrors({});
    setNewItem({
      productId: null,
      qty: 1,
      unitPrice: 0,
      discountAmount: 0,
    });
  };

  // Override onCancel to clear form
  const handleCancel = () => {
    clearForm();
    if (onCancel) {
      onCancel();
    }
  };

  const newItemQtyRef = useRef(null);
  const newItemUnitPriceRef = useRef(null);
  const newItemDiscountAmountRef = useRef(null);
  const newItemProductSelectRef = useRef(null);

  const [newItem, setNewItem] = useState({
    productId: null,
    qty: 1,
    unitPrice: 0,
    discountAmount: 0,
  });

  const handleNewItemProductSelect = (selectedOption) => {
    const productId = selectedOption ? selectedOption.value : null;
    const product = products.find((p) => p.product_id === productId);
    let discountAmount = 0;
    if (product) {
      const { discount: specialDiscount } = calculateSpecialDiscount(
        {
          productId: product.product_id,
          qty: 1,
          unitPrice: parseFloat(product.mrp) || 0,
        },
        formData.invoice.date
      );
      discountAmount = specialDiscount || 0;
    }
    setNewItem((prev) => ({
      ...prev,
      productId,
      unitPrice: product ? parseFloat(product.mrp) || 0 : 0,
      discountAmount,
    }));
    setErrors((prev) => ({ ...prev, newItemDescription: undefined }));
  };

  // Update handleSubmit to clear form after save
  // const handleSubmit = useCallback(
  //   async (e) => {
  //     e.preventDefault();
  //     if (!validateForm()) {
  //       toast.warn("Please fix validation errors.");
  //       return;
  //     }

  //     // Generate invoice number if empty
  //     let invoiceNo = formData.invoice.no;
  //     if (!invoiceNo || invoiceNo.trim() === "") {
  //       // Use localStorage to keep track of last invoice number index
  //       const lastIndexStr = localStorage.getItem("lastInvoiceIndex");
  //       let lastIndex = lastIndexStr ? parseInt(lastIndexStr, 10) : 0;
  //       lastIndex += 1;
  //       localStorage.setItem("lastInvoiceIndex", lastIndex.toString());
  //       // Format invoice number as INV-001, INV-002, etc.
  //       invoiceNo = `INV-${lastIndex.toString().padStart(3, "0")}`;
  //       setFormData((prev) => ({
  //         ...prev,
  //         invoice: {
  //           ...prev.invoice,
  //           no: invoiceNo,
  //         },
  //       }));
  //       console.log("Generated invoice number:", invoiceNo);
  //     } else {
  //       console.log("Using existing invoice number:", invoiceNo);
  //     }

  //     // Additional validation for payload fields before sending
  //     if (!invoiceNo) {
  //       toast.error("Invoice number is required.");
  //       return;
  //     }
  //     if (!formData.invoice.date) {
  //       toast.error("Invoice date is required.");
  //       return;
  //     }
  //     if (!formData.invoice.time) {
  //       toast.error("Invoice time is required.");
  //       return;
  //     }
  //     if (!formData.items || formData.items.length === 0) {
  //       toast.error("At least one invoice item is required.");
  //       return;
  //     }
  //     for (const item of formData.items) {
  //       if (!item.productId) {
  //         toast.error("All items must have a valid product selected.");
  //         return;
  //       }
  //       if (item.qty <= 0) {
  //         toast.error("Item quantity must be greater than zero.");
  //         return;
  //       }
  //       if (item.unitPrice < 0) {
  //         toast.error("Item unit price cannot be negative.");
  //         return;
  //       }
  //     }

  //     setLoading(true);
  //     const payload = {
  //       invoice: {
  //         no: invoiceNo,
  //         date: formData.invoice.date,
  //         time: formData.invoice.time,
  //       },
  //       customer: {
  //         id: formData.customer.id || null,
  //         name: formData.customer.name,
  //         address: formData.customer.address || null,
  //         phone: formData.customer.phone || null,
  //         email: formData.customer.email || null,
  //       },
  //       items: formData.items.map((item) => ({
  //         id: isEditMode && item.id ? item.id : undefined,
  //         product_id: item.productId || null,
  //         description: item.description || "Item",
  //         qty: parseFloat(item.qty) || 0,
  //         unit_price: parseFloat(item.unitPrice) || 0,
  //         sales_price: parseFloat(item.salesPrice) || 0,
  //         discount_amount: parseFloat(item.discountAmount) || 0,
  //         discount_percentage: parseFloat(item.discountPercentage) || 0,
  //         special_discount: parseFloat(item.specialDiscount) || 0,
  //         total: parseFloat(item.total) || 0,
  //         total_buying_cost: parseFloat(item.totalBuyingCost) || 0,
  //         supplier: item.supplier || null,
  //         category: item.category || null,
  //         store_location: item.store_location || null,
  //         mrp: parseFloat(item.mrp) || 0,
  //       })),
  //       purchaseDetails: {
  //         method: formData.purchaseDetails.method,
  //         amount: parseFloat(formData.purchaseDetails.amount) || 0,
  //         tax_percentage:
  //           parseFloat(formData.purchaseDetails.taxPercentage) || 0,
  //       },
  //       status: formData.status,
  //     };

  //     try {
  //       if (isEditMode) {
  //         await onUpdateInvoice(payload, formData.id);
  //         toast.success("Invoice updated successfully!");
  //       } else {
  //         await onGenerateInvoice(payload);
  //         toast.success("Invoice created successfully!");
  //         localStorage.removeItem(draftKey);
  //         clearForm();
  //         invoiceNoRef.current?.focus();
  //       }
  //     } catch (error) {
  //       const message =
  //         error.response?.data?.message || "Failed to save invoice.";
  //       const details = error.response?.data?.errors
  //         ? Object.entries(error.response.data.errors)
  //             .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
  //             .join("\n")
  //         : "No detailed errors provided.";
  //       console.error("API Error Details:", {
  //         message,
  //         details,
  //         response: error.response?.data,
  //         fullError: error,
  //       });
  //       toast.error(`${message}\n${details}`);
  //     } finally {
  //       setLoading(false);
  //     }
  //   },
  //   [formData, isEditMode, onGenerateInvoice, onUpdateInvoice, products]
  // );

  const handleNewItemInputChange = (e, field) => {
    const value = e.target.value;
    setNewItem((prev) => ({
      ...prev,
      [field]:
        field === "qty" || field === "unitPrice" || field === "discountAmount"
          ? value === ""
            ? ""
            : parseFloat(value) || 0
          : value,
    }));
    setErrors((prev) => ({
      ...prev,
      [`newItem${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined,
    }));
  };

  const handleAddNewItem = () => {
    const { productId, qty, unitPrice, discountAmount } = newItem;
    const newErrors = {};
    if (qty === "" || qty <= 0)
      newErrors.newItemQty = "Quantity must be positive";
    if (unitPrice === "" || unitPrice < 0)
      newErrors.newItemUnitPrice = "Unit price must be non-negative";
    if (discountAmount !== "" && discountAmount < 0)
      newErrors.newItemDiscountAmount = "Discount cannot be negative";
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    const product = products.find((p) => p.product_id === productId);

    const newItemToAdd = {
      id: Date.now(),
      productId,
      qty,
      unitPrice: product ? parseFloat(product.mrp) || 0 : unitPrice,
      discountAmount,
      discountPercentage: "",
      specialDiscount: 0,
      total: 0,
      totalBuyingCost:
        qty * (product ? parseFloat(product.buying_cost) || 0 : 0),
      description: product ? product.product_name : "",
      salesPrice: product ? parseFloat(product.sales_price) || 0 : 0,
      buyingCost: product ? parseFloat(product.buying_cost) || 0 : 0,
      categoryId: product ? product.category_id : null,
      mrp: product ? parseFloat(product.mrp) || 0 : 0,
      stock: product ? parseFloat(product.opening_stock_quantity) || 0 : 0,
      supplier: product ? product.supplier || "" : "",
      category: product ? product.category || "" : "",
      store_location: product ? product.store_location || "" : "",
    };

    // Recalculate totals for the new item
    const newItemWithTotals = updateItemTotal(
      newItemToAdd,
      formData.invoice.date
    );

    console.log("Adding new item:", newItemWithTotals);

    setFormData((prev) => {
      const updatedItems = [...prev.items, newItemWithTotals];
      console.log("Updated items array:", updatedItems);
      return {
        ...prev,
        items: updatedItems,
      };
    });
    setNewItem({
      productId: null,
      qty: 1,
      unitPrice: 0,
      discountAmount: 0,
    });
    setErrors((prev) => ({
      ...prev,
      newItemDescription: undefined,
      newItemQty: undefined,
      newItemUnitPrice: undefined,
      newItemDiscountAmount: undefined,
    }));
    newItemProductSelectRef.current?.focus();
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCustomersLoading(true);
        const today = format(new Date(), "yyyy-MM-dd");

        const endpoints = [
          {
            url: "/api/detailed-stock-reports",
            params: { toDate: today },
            name: "stock",
          },
          { url: "/api/products", name: "products" },
          { url: "/api/customers", name: "customers" },
          { url: "/api/categories", name: "categories" },
          { url: "/api/discount-schemes", name: "schemes" },
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            axios
              .get(endpoint.url, { params: endpoint.params })
              .then((res) => ({ data: res.data, name: endpoint.name }))
              .catch((err) => {
                console.error(`Error fetching ${endpoint.url}:`, err);
                toast.error(`Failed to load ${endpoint.name} data`);
                return { data: null, name: endpoint.name };
              })
          )
        );

        // Convert responses to an object for easier access
        const responseData = responses.reduce((acc, response) => {
          acc[response.name] = response.data;
          return acc;
        }, {});

        // Process products with stock and category_name
        if (responseData.products?.data) {
          const productsWithStock = responseData.products.data.map(
            (product) => {
              const stockItem =
                responseData.stock?.data?.find(
                  (stock) => stock.itemCode === product.item_code
                ) ||
                responseData.stock?.find(
                  (stock) => stock.itemCode === product.item_code
                );

              return {
                ...product,
                product_id: product.product_id,
                category_name: product.category || "Unknown",
                opening_stock_quantity: stockItem
                  ? parseFloat(stockItem.closingStock || 0)
                  : parseFloat(product.opening_stock_quantity || 0),
                buying_cost: parseFloat(product.buying_cost || 0),
              };
            }
          );
          setProducts(productsWithStock);
        }

        if (responseData.customers?.data) {
          setCustomers(responseData.customers.data);
        } else if (responseData.customers) {
          // Handle case where data might not be nested under .data
          setCustomers(responseData.customers);
        }

        if (responseData.categories) {
          setCategories(
            responseData.categories.data || responseData.categories
          );
        }

        if (responseData.schemes?.data || responseData.schemes) {
          setDiscountSchemes(responseData.schemes.data || responseData.schemes);
        }
      } catch (error) {
        console.error("Error in main fetch:", error);
        toast.error("Failed to load some data. Check console for details.");
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchData();
  }, []); // Add dependencies if needed

  // Recalculate discounts when discountSchemes or products change
  useEffect(() => {
    if (discountSchemes.length > 0 && products.length > 0) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          updateItemTotal(item, prev.invoice.date)
        ),
      }));
    }
  }, [discountSchemes, products]);

  useEffect(() => {
    itemRefs.current = formData.items.map((_, index) => ({
      description: { current: null },
      qty: { current: null },
      unitPrice: { current: null },
      discountAmount: { current: null },
      discountPercentage: { current: null },
    }));
  }, [formData.items.length]);

  useEffect(() => {
    invoiceNoRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      const { id, status, ...draftData } = formData;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [formData, isEditMode]);

  // Calculate special discount based on product or category
  const calculateSpecialDiscount = useCallback(
    (item, invoiceDate) => {
      if (!item.productId) {
        return { discount: 0, scheme: null, schemeType: null };
      }

      const product = products.find((p) => p.product_id === item.productId);
      if (!product) {
        console.warn(`Product not found for productId: ${item.productId}`);
        return { discount: 0, scheme: null, schemeType: null };
      }

      const categoryName = product.category_name || "Unknown";
      if (categoryName === "Unknown") {
        console.warn(
          `No valid category_name for product: ${product.product_name} (category_id: ${product.category_id})`
        );
      }

      const qty = parseFloat(item.qty) || 1;
      const salesPrice = parseFloat(item.unitPrice) || 0;
      const totalAmount = qty * salesPrice;

      const applicableScheme = discountSchemes.find((scheme) => {
        if (
          !scheme.active ||
          !isDateWithinScheme(invoiceDate, scheme.start_date, scheme.end_date)
        ) {
          return false;
        }
        const target = scheme.target?.trim().toLowerCase();
        const productMatch =
          scheme.applies_to === "product" &&
          target ===
            (product.description?.trim().toLowerCase() ||
              product.product_name?.trim().toLowerCase());
        const categoryMatch =
          scheme.applies_to === "category" &&
          categoryName &&
          target === categoryName?.trim().toLowerCase();
        return productMatch || categoryMatch;
      });

      if (!applicableScheme) {
        return { discount: 0, scheme: null, schemeType: null };
      }

      let discount = 0;
      if (applicableScheme.type === "percentage") {
        discount = (totalAmount * parseFloat(applicableScheme.value)) / 100;
      } else if (applicableScheme.type === "amount") {
        discount = parseFloat(applicableScheme.value) * qty;
      }

      const schemeType =
        applicableScheme.applies_to === "product" ? "product" : "category";
      return {
        discount: discount >= 0 ? discount : 0,
        scheme: applicableScheme,
        schemeType,
      };
    },
    [products, discountSchemes]
  );

  // Update item totals including special discount
  const updateItemTotal = useCallback(
    (item, invoiceDate) => {
      const qty = parseFloat(item.qty) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const mrp = parseFloat(item.mrp) || 0;
      const buyingCost = parseFloat(item.buyingCost) || 0;
      let discountAmount = parseFloat(item.discountAmount) || 0;
      const discountPercentage = parseFloat(item.discountPercentage) || 0;

      // Calculate discount amount or fallback to (mrp - salesPrice) * qty
      if (
        item.discountAmount !== "" &&
        item.discountAmount !== undefined &&
        item.discountAmount !== 0
      ) {
        discountAmount = discountAmount >= 0 ? discountAmount : 0;
      } else {
        // Calculate discount as (mrp - salesPrice) * qty if discountAmount is empty, zero or undefined
        discountAmount = (mrp - item.salesPrice) * qty;
        discountAmount = discountAmount >= 0 ? discountAmount : 0;
      }

      // Calculate special discount
      const {
        discount: specialDiscount,
        scheme,
        schemeType,
      } = calculateSpecialDiscount(item, invoiceDate);

      // Combine discountAmount and specialDiscount for total discount
      const totalDiscount = discountAmount + specialDiscount;

      // Calculate total: qty * unitPrice - totalDiscount
      const total = qty * unitPrice - totalDiscount;

      const profit =
        qty * (parseFloat(item.salesPrice) || 0) - qty * buyingCost;

      return {
        ...item,
        discountAmount: discountAmount >= 0 ? discountAmount : 0,
        discountPercentage,
        specialDiscount,
        totalDiscount,
        discountScheme: scheme,
        discountSchemeType: schemeType,
        total: total >= 0 ? total : 0,
        totalBuyingCost: qty * buyingCost,
        mrp,
        profit: profit >= 0 ? profit : 0,
        unitPrice: unitPrice || 0,
        totalBuyingCost: qty * buyingCost || 0,
      };
    },
    [calculateSpecialDiscount]
  );

  const handleInputChange = (e, section, field, index = null) => {
    const { name, value } = e.target;
    const targetName = name || field;
    let processedValue = value;

    setFormData((prev) => {
      const newData = { ...prev };
      if (index !== null && section === "items") {
        const newItems = [...newData.items];
        if (
          targetName === "qty" ||
          targetName === "unitPrice" ||
          targetName === "discountAmount"
        ) {
          processedValue = value === "" ? "" : parseFloat(value) || 0;
          newItems[index] = {
            ...newItems[index],
            [targetName]: processedValue,
          };
          // Sync salesPrice with unitPrice when unitPrice changes
          if (targetName === "unitPrice") {
            newItems[index].salesPrice = processedValue;
          }
          newItems[index] = updateItemTotal(
            newItems[index],
            newData.invoice.date
          );
        } else {
          newItems[index] = {
            ...newItems[index],
            [targetName]: processedValue,
          };
        }
        newData.items = newItems;
      } else {
        if (
          section === "purchaseDetails" &&
          (targetName === "amount" || targetName === "taxPercentage")
        ) {
          processedValue = value === "" ? "" : parseFloat(value) || 0;
        }
        newData[section] = {
          ...newData[section],
          [targetName]: processedValue,
        };
        if (section === "invoice" && targetName === "date") {
          newData.items = newData.items.map((item) =>
            updateItemTotal(item, processedValue)
          );
        }
      }
      return newData;
    });

    setErrors((prev) => ({
      ...prev,
      [`${
        section === "items"
          ? `item${
              targetName.charAt(0).toUpperCase() + targetName.slice(1)
            }${index}`
          : `${section}${
              targetName.charAt(0).toUpperCase() + targetName.slice(1)
            }`
      }`]: undefined,
      items: undefined,
      purchaseAmount: undefined,
    }));
  };

  const handleCustomerSelect = (selectedOption) => {
    const customer = selectedOption
      ? customers.find((c) => c.id === selectedOption.value)
      : null;
    setFormData((prev) => ({
      ...prev,
      customer: {
        id: customer ? customer.id : null,
        name: customer ? customer.customer_name : "",
        address: customer ? customer.address || "" : "",
        phone: customer ? customer.phone || "" : "",
        email: customer ? customer.email || "" : "",
      },
    }));
    setErrors((prev) => ({
      ...prev,
      customerName: undefined,
      customerEmail: undefined,
    }));
    setTimeout(() => customerAddressRef.current?.focus(), 0);
  };

  const handleProductSelect = async (selectedOption, index) => {
    const productId = selectedOption ? selectedOption.value : null;
    let product = products.find((p) => p.product_id === productId);
    // Fetch additional product details
    let supplier = "",
      category = "",
      store_location = "";
    if (productId) {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/products/${productId}`
        );
        const productData = response.data.data;
        supplier = productData.supplier || "N/A";
        category = productData.category || "N/A";
        store_location = productData.store_location || "N/A";
      } catch (error) {
        console.error("Error fetching product details:", error);
        toast.error("Failed to fetch product details.");
      }
    }

    console.log("handleProductSelect product:", product);
    console.log(
      "handleProductSelect product.mrp:",
      product ? product.mrp : "N/A"
    );
    console.log(
      "handleProductSelect product.sales_price:",
      product ? product.sales_price : "N/A"
    );

    setFormData((prev) => {
      const newItems = [...prev.items];
      if (!newItems[index]) {
        // If index is invalid, do nothing or add a new item
        return prev;
      }
      const qty = parseFloat(newItems[index].qty) || 1;
      const mrp = product ? parseFloat(product.mrp) || 0 : 0;
      // Set unitPrice to sales_price (user feedback: unit price is sales price)
      const unitPriceValue = product ? parseFloat(product.sales_price) || 0 : 0;
      const buyingCost = product ? parseFloat(product.buying_cost) || 0 : 0;
      const stock = product
        ? parseFloat(product.opening_stock_quantity) || 0
        : 0;

      newItems[index] = {
        ...newItems[index],
        productId: product ? product.product_id : null,
        categoryId: product ? product.category_id : null,
        description: product ? product.product_name : "",
        unitPrice: unitPriceValue,
        mrp,
        salesPrice: product ? parseFloat(product.sales_price) || mrp : 0,
        buyingCost,
        stock,
        discountAmount: 0,
        discountPercentage: "",
        totalBuyingCost: qty * buyingCost,
        supplier,
        category,
        store_location,
      };

      newItems[index] = updateItemTotal(newItems[index], prev.invoice.date);
      return { ...prev, items: newItems };
    });

    if (product && !product.category_name) {
      toast.warn(`No category assigned to product: ${product.product_name}`);
    }

    setErrors((prev) => ({ ...prev, [`itemDescription${index}`]: undefined }));
    setTimeout(() => itemRefs.current[index]?.qty?.current?.focus(), 0);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          description: "",
          qty: 1,
          unitPrice: "",
          salesPrice: 0,
          discountAmount: 0,
          discountPercentage: "",
          specialDiscount: 0,
          total: 0,
          totalBuyingCost: 0,
          productId: null,
          buyingCost: 0,
          categoryId: null,
          mrp: 0,
          stock: 0,
        },
      ],
    }));
    setTimeout(
      () =>
        itemRefs.current[formData.items.length]?.description?.current?.focus(),
      0
    );
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateSubtotal = useCallback(() => {
    return formData.items.reduce((sum, item) => {
      const total = parseFloat(item.total) || 0;
      return sum + total;
    }, 0);
  }, [formData.items]);

  const calculateTotalDiscount = useCallback(() => {
    return formData.items.reduce((sum, item) => {
      const discountAmount = parseFloat(item.discountAmount) || 0;
      const specialDiscount = parseFloat(item.specialDiscount) || 0;
      return sum + discountAmount + specialDiscount;
    }, 0);
  }, [formData.items]);

  const calculateTax = useCallback(
    (subtotal) => {
      const taxPercentage =
        parseFloat(formData.purchaseDetails.taxPercentage) || 0;
      return subtotal * (taxPercentage / 100);
    },
    [formData.purchaseDetails.taxPercentage]
  );

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    return subtotal + calculateTax(subtotal);
  }, [calculateSubtotal, calculateTax]);

  const calculateBalance = useCallback(() => {
    return (
      (parseFloat(formData.purchaseDetails.amount) || 0) - calculateTotal()
    );
  }, [calculateTotal, formData.purchaseDetails.amount]);

  const validateForm = () => {
    const newErrors = {};
    const { invoice, customer, items, purchaseDetails } = formData;
    const total = calculateTotal();
    const amountPaid = parseFloat(purchaseDetails.amount) || 0;

    if (!invoice.date) newErrors.invoiceDate = "Invoice date is required";
    if (!invoice.time || !/^\d{2}:\d{2}$/.test(invoice.time))
      newErrors.invoiceTime = "Invalid time format (HH:MM)";
    // Removed required validation for customer name as per user request
    // if (formData.purchaseDetails.method !== "credit" && !customer.name?.trim())
    //   newErrors.customerName = "Customer name is required";
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      newErrors.customerEmail = "Invalid email address";
    if (!items.length) newErrors.items = "At least one item is required";
    if (
      purchaseDetails.taxPercentage !== "" &&
      parseFloat(purchaseDetails.taxPercentage) < 0
    ) {
      newErrors.purchaseTaxPercentage = "Tax percentage cannot be negative";
    }
    if (purchaseDetails.amount !== "" && amountPaid < 0)
      newErrors.purchaseAmount = "Amount paid cannot be negative";

    // Validate amount paid based on payment method
    const fullPaymentMethods = ["cash", "card", "online", "cheque"];
    if (
      fullPaymentMethods.includes(purchaseDetails.method) &&
      purchaseDetails.amount !== "" &&
      amountPaid < total
    ) {
      newErrors.purchaseAmount = `Amount paid must be at least ${formatCurrency(total)} for ${purchaseDetails.method} payments`;
    }
    if (
      purchaseDetails.method === "credit" &&
      purchaseDetails.amount !== "" &&
      amountPaid >= total
    ) {
      newErrors.purchaseAmount = `Amount paid must be less than ${formatCurrency(total)} for credit payments`;
    }

    items.forEach((item, idx) => {
      if (item.qty === "" || parseFloat(item.qty) <= 0)
        newErrors[`itemQty${idx}`] = "Quantity must be positive";
      if (item.unitPrice === "" || parseFloat(item.unitPrice) < 0)
        newErrors[`itemUnitPrice${idx}`] = "Unit price must be non-negative";
      if (item.discountAmount !== "" && parseFloat(item.discountAmount) < 0)
        newErrors[`itemDiscountAmount${idx}`] =
          "Discount amount cannot be negative";
      if (
        item.discountPercentage !== "" &&
        (parseFloat(item.discountPercentage) < 0 ||
          parseFloat(item.discountPercentage) > 100)
      ) {
        newErrors[`itemDiscountPercentage${idx}`] =
          "Discount percentage must be between 0 and 100";
      }
      if (item.specialDiscount < 0)
        newErrors[`itemSpecialDiscount${idx}`] =
          "Special discount cannot be negative";
      const product = products.find((p) => p.product_id === item.productId);
      if (
        product &&
        parseFloat(item.qty) > parseFloat(product.opening_stock_quantity)
      ) {
        newErrors[`itemQty${idx}`] =
          `Quantity exceeds available stock (${product.opening_stock_quantity})`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) {
        toast.warn("Please fix validation errors.");
        return;
      }

      // Generate invoice number if empty
      let invoiceNo = formData.invoice.no;
      if (!invoiceNo || invoiceNo.trim() === "") {
        // Use localStorage to keep track of last invoice number index
        const lastIndexStr = localStorage.getItem("lastInvoiceIndex");
        let lastIndex = lastIndexStr ? parseInt(lastIndexStr, 10) : 0;
        lastIndex += 1;
        localStorage.setItem("lastInvoiceIndex", lastIndex.toString());
        // Format invoice number as INV-001, INV-002, etc.
        invoiceNo = `INV-${lastIndex.toString().padStart(3, "0")}`;
        setFormData((prev) => ({
          ...prev,
          invoice: {
            ...prev.invoice,
            no: invoiceNo,
          },
        }));
        console.log("Generated invoice number:", invoiceNo);
      } else {
        console.log("Using existing invoice number:", invoiceNo);
      }

      // Additional validation for payload fields before sending
      if (!invoiceNo) {
        toast.error("Invoice number is required.");
        return;
      }
      if (!formData.invoice.date) {
        toast.error("Invoice date is required.");
        return;
      }
      if (!formData.invoice.time) {
        toast.error("Invoice time is required.");
        return;
      }
      if (!formData.items || formData.items.length === 0) {
        toast.error("At least one invoice item is required.");
        return;
      }
      for (const item of formData.items) {
        if (!item.productId) {
          toast.error("All items must have a valid product selected.");
          return;
        }
        if (item.qty <= 0) {
          toast.error("Item quantity must be greater than zero.");
          return;
        }
        if (item.unitPrice < 0) {
          toast.error("Item unit price cannot be negative.");
          return;
        }
      }

      setLoading(true);
      const payload = {
        invoice: {
          no: invoiceNo,
          date: formData.invoice.date,
          time: formData.invoice.time,
        },
        customer: {
          id: formData.customer.id || null,
          name: formData.customer.name,
          address: formData.customer.address || null,
          phone: formData.customer.phone || null,
          email: formData.customer.email || null,
        },
        items: formData.items.map((item) => ({
          id: isEditMode && item.id ? item.id : undefined,
          product_id: item.productId || null,
          description: item.description || "Item",
          qty: parseFloat(item.qty) || 0,
          unit_price: parseFloat(item.unitPrice) || 0,
          sales_price: parseFloat(item.salesPrice) || 0,
          discount_amount: parseFloat(item.discountAmount) || 0,
          discount_percentage: parseFloat(item.discountPercentage) || 0,
          special_discount: parseFloat(item.specialDiscount) || 0,
          total: parseFloat(item.total) || 0,
          total_buying_cost: parseFloat(item.totalBuyingCost) || 0,
          supplier: item.supplier || null,
          category: item.category || null,
          store_location: item.store_location || null,
          mrp: parseFloat(item.mrp) || 0,
        })),
        purchaseDetails: {
          method: formData.purchaseDetails.method,
          amount: parseFloat(formData.purchaseDetails.amount) || 0,
          tax_percentage:
            parseFloat(formData.purchaseDetails.taxPercentage) || 0,
        },
        status: formData.status,
      };

      try {
        if (isEditMode) {
          await onUpdateInvoice(payload, formData.id);
          toast.success("Invoice updated successfully!");
        } else {
          await onGenerateInvoice(payload);
          toast.success("Invoice created successfully!");
          localStorage.removeItem(draftKey);
          setFormData({
            invoice: {
              no: "",
              date: format(new Date(), "yyyy-MM-dd"),
              time: format(new Date(), "HH:mm"),
            },
            customer: { id: null, name: "", address: "", phone: "", email: "" },
            items: [],
            purchaseDetails: { method: "cash", amount: 0, taxPercentage: 0 },
            status: "pending",
            id: null,
          });
          setErrors({});
          invoiceNoRef.current?.focus();
        }
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to save invoice.";
        const details = error.response?.data?.errors
          ? Object.entries(error.response.data.errors)
              .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
              .join("\n")
          : "No detailed errors provided.";
        console.error("API Error Details:", {
          message,
          details,
          response: error.response?.data,
          fullError: error,
        });
        toast.error(`${message}\n${details}`);
      } finally {
        setLoading(false);
      }
    },
    [formData, isEditMode, onGenerateInvoice, onUpdateInvoice, products]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(e);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, onCancel]);

  const getFieldOrder = useCallback(() => {
    const fields = [
      { ref: invoiceNoRef, name: "invoiceNo", type: "input" },
      { ref: invoiceDateRef, name: "invoiceDate", type: "input" },
      { ref: invoiceTimeRef, name: "invoiceTime", type: "input" },
      { ref: customerNameRef, name: "customerName", type: "select" },
      { ref: customerAddressRef, name: "customerAddress", type: "input" },
      { ref: customerPhoneRef, name: "customerPhone", type: "input" },
      { ref: customerEmailRef, name: "customerEmail", type: "input" },
      // Add new item input refs here for enter key navigation
      { ref: newItemQtyRef, name: "newItemQty", type: "input" },
      { ref: newItemUnitPriceRef, name: "newItemUnitPrice", type: "input" },
      {
        ref: newItemDiscountAmountRef,
        name: "newItemDiscountAmount",
        type: "input",
      },
    ];
    formData.items.forEach((_, index) => {
      fields.push(
        {
          ref: itemRefs.current[index]?.description,
          name: `itemDescription${index}`,
          type: "select",
          index,
        },
        {
          ref: itemRefs.current[index]?.qty,
          name: `itemQty${index}`,
          type: "input",
          index,
        },
        {
          ref: itemRefs.current[index]?.unitPrice,
          name: `itemUnitPrice${index}`,
          type: "input",
          index,
        },
        {
          ref: itemRefs.current[index]?.discountAmount,
          name: `itemDiscountAmount${index}`,
          type: "input",
          index,
        },
        {
          ref: itemRefs.current[index]?.discountPercentage,
          name: `itemDiscountPercentage${index}`,
          type: "input",
          index,
        }
      );
    });
    fields.push(
      { ref: purchaseMethodRef, name: "purchaseMethod", type: "select-native" },
      { ref: purchaseAmountRef, name: "purchaseAmount", type: "input" },
      { ref: taxPercentageRef, name: "purchaseTaxPercentage", type: "input" }
    );
    return fields;
  }, [formData.items]);

  const handleEnterKey = (e, currentRef, itemIndex = null) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();

    const fields = getFieldOrder();
    const currentFieldIndex = fields.findIndex(
      (field) => field.ref?.current === currentRef.current
    );
    if (currentFieldIndex === -1) return;

    const currentField = fields[currentFieldIndex];
    if (
      currentField.type === "select" &&
      currentField.name === "customerName" &&
      !formData.customer.name
    )
      return;
    if (
      currentField.type === "select" &&
      currentField.name.startsWith("itemDescription") &&
      !formData.items[itemIndex]?.productId
    )
      return;

    // Add new item if Enter pressed on discountAmount of last item
    if (
      currentField.name === `itemDiscountAmount${formData.items.length - 1}`
    ) {
      addItem();
      return;
    }
    if (currentField.name === `itemQty${formData.items.length - 1}`) {
      addItem();
      return;
    }

    if (currentField.ref === purchaseAmountRef) {
      document.getElementById("invoiceForm")?.requestSubmit();
      return;
    }

    for (let i = currentFieldIndex + 1; i < fields.length; i++) {
      const nextField = fields[i];
      if (nextField.ref?.current) {
        nextField.ref.current.focus();
        if (nextField.type === "input") nextField.ref.current.select?.();
        break;
      }
    }
  };

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: c.customer_name })),
    [customers]
  );

  const filteredProductOptions = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.product_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((p) => {
        const categoryName = p.category_name || "Unknown";
        const productScheme = discountSchemes.find((scheme) => {
          if (!scheme.active || scheme.applies_to !== "product") return false;
          return (
            scheme.target?.trim().toLowerCase() ===
            (p.description?.trim().toLowerCase() ||
              p.product_name?.trim().toLowerCase())
          );
        });
        const categoryScheme = discountSchemes.find((scheme) => {
          if (!scheme.active || scheme.applies_to !== "category") return false;
          return (
            scheme.target?.trim().toLowerCase() ===
            categoryName?.trim().toLowerCase()
          );
        });

        let discountInfo = "";
        if (productScheme) {
          discountInfo = `, Product Discount: ${
            productScheme.type === "percentage"
              ? `${productScheme.value}%`
              : `LKR ${productScheme.value}`
          }`;
        } else if (categoryScheme) {
          discountInfo = `, Category Discount: ${
            categoryScheme.type === "percentage"
              ? `${categoryScheme.value}%`
              : `LKR ${categoryScheme.value}`
          }`;
        }

        return {
          value: p.product_id,
          label: `${p.product_name} (${p.description || "No description"})`,
          description: `${p.product_name} - Stock: ${p.opening_stock_quantity ?? "N/A"}, Category: ${categoryName}${discountInfo}`,
          stock: p.opening_stock_quantity,
          mrp: p.mrp,
          salesPrice: p.sales_price,
        };
      });
  }, [products, discountSchemes, searchTerm]);

  const getSelectStyles = (hasError) => ({
    control: (provided, state) => ({
      ...provided,
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#3b82f6"
          : "#d1d5db",
      boxShadow: state.isFocused
        ? "0 0 0 1px #3b82f6"
        : hasError
          ? "0 0 0 1px #ef4444"
          : "none",
      "&:hover": { borderColor: hasError ? "#ef4444" : "#9ca3af" },
      minHeight: "42px",
    }),
    menu: (provided) => ({ ...provided, zIndex: 50 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#dbeafe"
        : state.isFocused
          ? "#eff6ff"
          : "white",
    }),
    indicatorSeparator: () => ({ display: "none" }),
  });

  const subtotal = useMemo(() => calculateSubtotal(), [calculateSubtotal]);
  const tax = useMemo(() => calculateTax(subtotal), [calculateTax, subtotal]);
  const total = useMemo(() => calculateTotal(), [calculateTotal]);
  const balance = useMemo(() => calculateBalance(), [calculateBalance]);

  const assignRef = (index, field, element) => {
    if (!itemRefs.current[index]) itemRefs.current[index] = {};
    itemRefs.current[index][field] = { current: element };
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm">
        <div className="relative w-full h-full bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
          <h3 className="p-6 text-2xl font-bold text-blue-600 border-b border-gray-200">
            {isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </h3>
          <form
            id="invoiceForm"
            onSubmit={handleSubmit}
            noValidate
            className="w-full h-full p-6 overflow-y-auto bg-gray-50"
          >
            <div className="p-4 mb-6 bg-white border rounded-lg shadow-sm">
              <h4 className="pb-2 mb-3 text-lg font-semibold border-b">
                Invoice Details
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="invoiceNo"
                    className="block mb-1 text-sm font-medium"
                  >
                    Invoice No
                  </label>
                  <input
                    id="invoiceNo"
                    ref={invoiceNoRef}
                    type="text"
                    value={formData.invoice.no}
                    onChange={(e) => handleInputChange(e, "invoice", "no")}
                    onKeyDown={(e) => handleEnterKey(e, invoiceNoRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${
                      errors.invoiceNo
                        ? "border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                    placeholder="INV-2025-001"
                    readOnly
                  />
                </div>
                <div>
                  <label
                    htmlFor="invoiceDate"
                    className="block mb-1 text-sm font-medium"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoiceDate"
                    ref={invoiceDateRef}
                    type="date"
                    value={formData.invoice.date}
                    onChange={(e) => handleInputChange(e, "invoice", "date")}
                    onKeyDown={(e) => handleEnterKey(e, invoiceDateRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${
                      errors.invoiceDate
                        ? "border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                    required
                  />
                  {errors.invoiceDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.invoiceDate}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="invoiceTime"
                    className="block mb-1 text-sm font-medium"
                  >
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoiceTime"
                    ref={invoiceTimeRef}
                    type="time"
                    value={formData.invoice.time}
                    onChange={(e) => handleInputChange(e, "invoice", "time")}
                    onKeyDown={(e) => handleEnterKey(e, invoiceTimeRef)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${
                      errors.invoiceTime
                        ? "border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                    required
                  />
                  {errors.invoiceTime && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.invoiceTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 mb-6 bg-white border rounded-lg shadow-sm">
              <h4 className="pb-2 mb-3 text-lg font-semibold border-b">
                Customer Information
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label
                    htmlFor="customerName"
                    className="block mb-1 text-sm font-medium"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Select
                    inputId="customerName"
                    ref={customerNameRef}
                    options={customerOptions}
                    value={
                      customerOptions.find(
                        (option) => option.label === formData.customer.name
                      ) || null
                    }
                    onChange={handleCustomerSelect}
                    placeholder={
                      customersLoading ? "Loading..." : "Select customer"
                    }
                    isClearable
                    isSearchable
                    isDisabled={customersLoading}
                    styles={getSelectStyles(!!errors.customerName)}
                    onKeyDown={(e) => handleEnterKey(e, customerNameRef)}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="customerAddress"
                    className="block mb-1 text-sm font-medium"
                  >
                    Address
                  </label>
                  <input
                    id="customerAddress"
                    ref={customerAddressRef}
                    type="text"
                    value={formData.customer.address}
                    onChange={(e) =>
                      handleInputChange(e, "customer", "address")
                    }
                    onKeyDown={(e) => handleEnterKey(e, customerAddressRef)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customerPhone"
                    className="block mb-1 text-sm font-medium"
                  >
                    Phone
                  </label>
                  <input
                    id="customerPhone"
                    ref={customerPhoneRef}
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => handleInputChange(e, "customer", "phone")}
                    onKeyDown={(e) => handleEnterKey(e, customerPhoneRef)}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="+94 123 456 7890"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customerEmail"
                    className="block mb-1 text-sm font-medium"
                  >
                    Email
                  </label>
                  <input
                    id="customerEmail"
                    ref={customerEmailRef}
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => handleInputChange(e, "customer", "email")}
                    onKeyDown={(e) => handleEnterKey(e, filteredProductOptions)}
                    className={`w-full p-2.5 border rounded-md focus:outline-none ${
                      errors.customerEmail
                        ? "border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                    placeholder="customer@example.com"
                  />
                  {errors.customerEmail && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.customerEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* New Item Selection Section */}
            <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="pb-2 mb-4 text-lg font-semibold text-gray-800 border-b border-gray-200">
                Add New Item
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                {/* Product Selection */}
                <div className="md:col-span-5">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <Select
                    ref={newItemProductSelectRef}
                    options={filteredProductOptions}
                    value={
                      newItem.productId
                        ? filteredProductOptions.find(
                            (option) => option.value === newItem.productId
                          ) || null
                        : null
                    }
                    placeholder="Search or select product"
                    isClearable
                    isSearchable
                    onChange={handleNewItemProductSelect}
                    onInputChange={(value) => setSearchTerm(value)}
                    styles={customSelectStyles}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    noOptionsMessage={() => "No products found"}
                    loadingMessage={() => "Loading..."}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newItem.productId) {
                        e.preventDefault();
                        newItemQtyRef.current?.focus();
                        newItemQtyRef.current?.select();
                      }
                    }}
                  />
                  {errors.newItemDescription && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.newItemDescription}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    ref={newItemQtyRef}
                    className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.newItemQty ? "border-red-500" : "border-gray-300"
                    }`}
                    value={newItem.qty}
                    onChange={(e) => handleNewItemInputChange(e, "qty")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        newItemUnitPriceRef.current?.focus();
                        newItemUnitPriceRef.current?.select();
                      }
                    }}
                  />
                  {errors.newItemQty && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.newItemQty}
                    </p>
                  )}
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    ref={newItemUnitPriceRef}
                    className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.newItemUnitPrice
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    value={newItem.unitPrice}
                    onChange={(e) => handleNewItemInputChange(e, "unitPrice")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        newItemDiscountAmountRef.current?.focus();
                        newItemDiscountAmountRef.current?.select();
                      }
                    }}
                  />
                  {errors.newItemUnitPrice && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.newItemUnitPrice}
                    </p>
                  )}
                </div>

                {/* Discount */}
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Discount
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      ref={newItemDiscountAmountRef}
                      className={`w-full p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 ${
                        errors.newItemDiscountAmount
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Amount"
                      value={newItem.discountAmount}
                      onChange={(e) =>
                        handleNewItemInputChange(e, "discountAmount")
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewItem();
                        }
                      }}
                    />
                    <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                      LKR
                    </span>
                  </div>
                  {errors.newItemDiscountAmount && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.newItemDiscountAmount}
                    </p>
                  )}
                </div>

                {/* Add Button */}
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="w-full h-[42px] px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Items Table Section */}
            <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Invoice Items
                </h4>
                <div className="text-sm text-gray-500">
                  {formData.items.length} item(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Qty
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        MRP
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Discount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 font-medium">
                            {item.description || "N/A"}
                          </div>
                          {item.discountScheme && (
                            <div className="text-xs text-green-600 mt-1">
                              {item.discountSchemeType === "product"
                                ? `Product Discount: ${item.discountScheme.value}${item.discountScheme.type === "percentage" ? "%" : " LKR"}`
                                : `Category Discount: ${item.discountScheme.value}${item.discountScheme.type === "percentage" ? "%" : " LKR"}`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {item.qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 w-32 whitespace-nowrap text-right text-sm text-gray-500">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discountAmount}
                            onChange={(e) =>
                              handleInputChange(
                                e,
                                "items",
                                "discountAmount",
                                index
                              )
                            }
                            className="w-full p-1 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {formatCurrency(item.salesPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-1"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm md:col-span-2">
                <h4 className="pb-2 mb-3 text-lg font-semibold text-gray-800 border-b border-gray-200">
                  Payment Details
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="purchaseMethod"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Payment Method
                    </label>
                    <select
                      id="purchaseMethod"
                      ref={purchaseMethodRef}
                      value={formData.purchaseDetails.method}
                      onChange={(e) =>
                        handleInputChange(e, "purchaseDetails", "method")
                      }
                      onKeyDown={(e) => handleEnterKey(e, purchaseMethodRef)}
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online Payment</option>
                      <option value="cheque">Cheque</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="purchaseAmount"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="purchaseAmount"
                      ref={purchaseAmountRef}
                      type="number"
                      value={formData.purchaseDetails.amount}
                      onChange={(e) =>
                        handleInputChange(e, "purchaseDetails", "amount")
                      }
                      onKeyDown={(e) => handleEnterKey(e, purchaseAmountRef)}
                      className={`w-full p-2.5 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.purchaseAmount
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {errors.purchaseAmount && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.purchaseAmount}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="taxPercentage"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Tax (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="taxPercentage"
                      ref={taxPercentageRef}
                      type="number"
                      value={formData.purchaseDetails.taxPercentage}
                      onChange={(e) =>
                        handleInputChange(e, "purchaseDetails", "taxPercentage")
                      }
                      onKeyDown={(e) => handleEnterKey(e, taxPercentageRef)}
                      className={`w-full p-2.5 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.purchaseTaxPercentage
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="0"
                      step="0.1"
                      placeholder="0.0"
                    />
                    {errors.purchaseTaxPercentage && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.purchaseTaxPercentage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h4 className="pb-2 mb-3 text-lg font-semibold text-gray-800 border-b border-gray-200">
                  Invoice Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Tax ({formData.purchaseDetails.taxPercentage}%):
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(tax)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-base font-semibold">Total:</span>
                    <span className="text-base font-semibold">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount Paid:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(
                        parseFloat(formData.purchaseDetails.amount) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium">
                      {balance < 0 ? "Balance Due:" : "Change:"}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        balance < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(balance))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 py-4 mt-6 -mx-6 bg-white border-t border-gray-200 rounded-b-xl">
              <div className="flex justify-end px-6 space-x-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="w-4 h-4 mr-2 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : isEditMode ? (
                    "Update Invoice (Ctrl+S)"
                  ) : (
                    "Save Invoice (Ctrl+S)"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SalesInvoice;
