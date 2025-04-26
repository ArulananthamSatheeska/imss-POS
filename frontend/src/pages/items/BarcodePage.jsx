import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/NewAuthContext";
import { getApi } from "../../services/api";
import JsBarcode from "jsbarcode";

export const BarcodePage = () => {
  const { user } = useAuth();
  const api = getApi();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [templateSize, setTemplateSize] = useState("50mmx25mm");
  const [paperSize, setPaperSize] = useState("50mm");
  const [barcodesToPrint, setBarcodesToPrint] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const printRef = useRef();

  useEffect(() => {
    let isMounted = true;
    if (user?.token) {
      fetchProducts().then(() => {
        if (!isMounted) return;
      });
    } else {
      toast.error("Please login to access this feature");
      setErrors({ auth: "User not authenticated" });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  useEffect(() => {
    if (barcodesToPrint.length > 0) {
      barcodesToPrint.forEach((product, index) => {
        const canvas = document.getElementById(`barcode-${index}`);
        if (canvas) {
          const barcodeWidth =
            parseInt(templateSize.split("x")[0].replace("mm", "")) <= 38
              ? 0.8
              : 1.2;
          const barcodeHeight =
            parseInt(templateSize.split("x")[1].replace("mm", "")) <= 20
              ? 10
              : 15;

          try {
            JsBarcode(canvas, product.barcode, {
              format: "CODE128",
              width: barcodeWidth,
              height: barcodeHeight,
              displayValue: false,
              margin: 0,
            });
          } catch (error) {
            console.error(
              `Error generating barcode for index ${index}:`,
              error
            );
            toast.error("Failed to generate barcode.");
          }
        } else {
          console.warn(`Canvas barcode-${index} not found`);
        }
      });
    }
  }, [barcodesToPrint, templateSize]);

  const fetchProducts = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const productsRes = await api
        .get(`/products?_t=${timestamp}`)
        .catch((err) => {
          console.error(
            "Products fetch error:",
            err.response?.data || err.message
          );
          toast.error(
            "Failed to fetch products: " +
              (err.response?.data?.message || err.message)
          );
          return { data: [] };
        });

      const productsData = Array.isArray(productsRes.data.data)
        ? productsRes.data.data
        : Array.isArray(productsRes.data)
        ? productsRes.data
        : [];

      const formattedProducts = productsData.map((product) => {
        const mrpValue =
          product.mrp != null && !isNaN(parseFloat(product.mrp))
            ? parseFloat(product.mrp).toFixed(2)
            : "N/A";
        const formattedMrp = mrpValue !== "N/A" ? `Rs.${mrpValue}/=` : "N/A";

        return {
          product_id: product.product_id,
          product_name: product.product_name,
          barcode: product.barcode || "N/A",
          batch_number: product.batch_number || "N/A",
          expiry_date: product.expiry_date
            ? new Date(product.expiry_date).toLocaleDateString()
            : "N/A",
          supplier: product.supplier || "Unknown Seller",
          mrp: formattedMrp,
        };
      });

      setProducts(formattedProducts);

      if (formattedProducts.length === 0) {
        setErrors({
          products: "No products available. Please add products in the system.",
        });
        toast.warn("No products available");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Error fetching products";
      setErrors({ fetch: errorMsg });
      toast.error(errorMsg);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setBarcodesToPrint([]);
    setSearchQuery("");
  };

  const filteredProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toString().includes(searchQuery)
  );

  const handleGenerateBarcodes = () => {
    if (!selectedProduct) {
      toast.error("Please select a product.");
      return;
    }
    if (selectedProduct.barcode === "N/A") {
      toast.error("Selected product does not have a valid barcode.");
      return;
    }
    if (quantity < 1 || isNaN(quantity)) {
      toast.error("Please enter a valid quantity (minimum 1).");
      return;
    }

    // Generate one barcode for preview, but store quantity for printing
    setBarcodesToPrint([selectedProduct]);
    console.log(
      `Prepared to generate ${quantity} barcodes for:`,
      selectedProduct.product_name
    );
  };

  const handlePrint = () => {
    if (barcodesToPrint.length === 0) {
      toast.error("Please generate a barcode before printing.");
      return;
    }

    // Generate the specified quantity of barcodes for printing
    const printBarcodes = Array.from(
      { length: quantity },
      () => selectedProduct
    );

    // Create canvas elements for each barcode
    const barcodeImages = [];
    printBarcodes.forEach((product, index) => {
      const canvas = document.createElement("canvas");
      const barcodeWidth =
        parseInt(templateSize.split("x")[0].replace("mm", "")) <= 38
          ? 0.8
          : 1.2;
      const barcodeHeight =
        parseInt(templateSize.split("x")[1].replace("mm", "")) <= 20 ? 10 : 15;

      try {
        JsBarcode(canvas, product.barcode, {
          format: "CODE128",
          width: barcodeWidth,
          height: barcodeHeight,
          displayValue: false,
          margin: 0,
        });
        barcodeImages[index] = canvas.toDataURL("image/png");
      } catch (error) {
        console.error(`Error generating barcode for index ${index}:`, error);
        toast.error("Failed to prepare barcode for printing.");
      }
    });

    // Generate print content with all barcodes
    const [labelWidth, labelHeight] = templateSize.split("x").map((dim) => dim);
    const printContent = printBarcodes
      .map(
        (product, index) => `
        <div class="barcode-label" style="border: 1px solid #000; padding: 2px; text-align: left; font-size: 8px; width: 100%; max-width: calc(${labelWidth} - 2mm); height: ${labelHeight}; background-color: #fff; position: relative; box-sizing: border-box; margin: 2mm 0 2mm 2mm;">
          <h3 style="margin: 0 0 1px 0; font-weight: bold; font-size: 10px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${product.product_name.toUpperCase()}
          </h3>
          <div style="margin: 1px 0; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            කල්. දිනය/ EXP Date: ${product.expiry_date}
          </div>
          <div style="margin: 1px 0; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            කු. අං/ Batch No: ${product.batch_number}
          </div>
          <img src="${
            barcodeImages[index]
          }" style="margin: 0 auto; display: block; width: 80%; height: auto;" />
          <div class="mrp" style="text-align: center; font-size: 8px; position: absolute; bottom: 10px; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            MRP: ${product.mrp}
          </div>
          <div class="seller" style="text-align: center; font-size: 8px; position: absolute; bottom: 1px; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            Import&Distributed by: ${product.supplier}
          </div>
        </div>
      `
      )
      .join("");

    const paperWidth = paperSize;
    const columns = parseInt(paperWidth) <= 50 ? 1 : 2;

    const styles = `
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        body { 
          font-family: 'Noto Sans Sinhala', 'Roboto', sans-serif; 
          margin: 0; 
          padding: 0; 
        }
        @media print {
          .barcode-label { 
            margin: 2mm 0 2mm 2mm; /* Keep margins for spacing */
            page-break-inside: avoid; /* Prevent sticker from splitting */
            break-inside: avoid; /* Additional support for continuous printing */
            width: 100%; /* Fill the grid cell */
            max-width: calc(${labelWidth} - 2mm); /* Ensure label doesn't exceed adjusted width */
          }
          @page { 
            size: ${paperWidth} auto; /* Match roll width, auto height for continuous printing */
            margin: 0; /* Remove page margins */
          }
          .barcode-container {
            width: ${paperWidth};
            display: grid; /* Use CSS Grid for column layout */
            grid-template-columns: repeat(${columns}, 1fr); /* 1 or 2 columns based on paperWidth */
            gap: 0; /* No gap between grid cells */
            break-after: auto; /* Allow continuous flow */
            page-break-before: auto;
            page-break-after: auto;
            page-break-inside: auto;
          }
        }
      </style>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&display=swap" rel="stylesheet">
          ${styles}
        </head>
        <body>
          <div class="barcode-container" style="width: ${paperWidth};">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const waitForRender = () => {
      if (printWindow.document.readyState === "complete") {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        setTimeout(waitForRender, 100);
      }
    };
    setTimeout(waitForRender, 500);
  };

  const paperSizeOptions = {
    "30mmx20mm": ["30mm", "60mm"],
    "38mmx25mm": ["38mm", "76mm"],
    "30mmx16mm": ["30mm", "60mm"],
    "40mmx20mm": ["40mm", "80mm"],
    "50mmx25mm": ["50mm", "100mm"],
    "60mmx15mm": ["60mm", "120mm"],
    "75mmx25mm": ["75mm", "150mm"],
    "70mmx30mm": ["70mm", "140mm"],
    "100mmx50mm": ["100mm", "200mm"],
    "100mmx150mm": ["100mm", "200mm"],
  };

  return (
    <div
      style={{
        backgroundColor: "#e8f0fe",
        minHeight: "100vh",
        padding: "30px",
        display: "flex",
        justifyContent: "center",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "15px",
          padding: "30px",
          width: "100%",
          maxWidth: "900px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            color: "#1e3a8a",
            textAlign: "center",
            marginBottom: "30px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Barcode Generator
        </h1>

        {Object.keys(errors).length > 0 && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {Object.values(errors).filter(Boolean).join(", ")}
          </div>
        )}

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              color: "#666",
              fontSize: "16px",
            }}
          >
            <div
              style={{
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                animation: "spin 1s linear infinite",
                marginRight: "10px",
              }}
            />
            Loading products...
          </div>
        )}

        {!loading && (
          <>
            <div
              style={{
                marginBottom: "30px",
                backgroundColor: "#f8fafc",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <input
                type="text"
                placeholder="Search by Product Name or Barcode"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  color: "#1f2937",
                  backgroundColor: "#fff",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
              {searchQuery && (
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    marginTop: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.product_id}
                        onClick={() => handleSelectProduct(product)}
                        style={{
                          padding: "12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f1f5f9",
                          color: "#374151",
                          fontSize: "15px",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#eff6ff")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "#fff")
                        }
                      >
                        {product.product_name} - {product.barcode}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: "14px",
                      }}
                    >
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedProduct && (
              <>
                <div
                  style={{
                    marginBottom: "30px",
                    backgroundColor: "#f8fafc",
                    padding: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      color: "#1e3a8a",
                      marginBottom: "15px",
                      fontWeight: "600",
                    }}
                  >
                    Product Details: {selectedProduct.product_name}
                  </h3>
                  <div
                    style={{ display: "grid", gap: "10px", color: "#4b5563" }}
                  >
                    <div>
                      <strong>Batch No:</strong> {selectedProduct.batch_number}
                    </div>
                    <div>
                      <strong>EXP Date:</strong> {selectedProduct.expiry_date}
                    </div>
                    <div>
                      <strong>Seller:</strong> {selectedProduct.supplier}
                    </div>
                    <div>
                      <strong>Barcode:</strong> {selectedProduct.barcode}
                    </div>
                    <div>
                      <strong>MRP:</strong> {selectedProduct.mrp}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                    marginBottom: "30px",
                    backgroundColor: "#f8fafc",
                    padding: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div>
                    <label
                      htmlFor="templateSize"
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#1f2937",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      Template Size
                    </label>
                    <select
                      id="templateSize"
                      value={templateSize}
                      onChange={(e) => {
                        setTemplateSize(e.target.value);
                        setPaperSize(paperSizeOptions[e.target.value][0]);
                      }}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#1f2937",
                        backgroundColor: "#fff",
                        boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                        outline: "none",
                        transition: "border-color 0.3s ease",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    >
                      {Object.keys(paperSizeOptions).map((size) => (
                        <option key={size} value={size}>
                          {size.replace("mmx", "mm x ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="paperSize"
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#1f2937",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      Paper Size
                    </label>
                    <select
                      id="paperSize"
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#1f2937",
                        backgroundColor: "#fff",
                        boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                        outline: "none",
                        transition: "border-color 0.3s ease",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    >
                      {paperSizeOptions[templateSize].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="quantity"
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#1f2937",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      min="1"
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#1f2937",
                        backgroundColor: "#fff",
                        boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                        outline: "none",
                        transition: "border-color 0.3s ease",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedProduct && barcodesToPrint.length > 0 && (
              <div style={{ marginTop: "30px" }}>
                <h3
                  style={{
                    fontSize: "20px",
                    color: "#1e3a8a",
                    marginBottom: "20px",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Generated Barcode (Preview)
                </h3>
                <div
                  ref={printRef}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(50mm, 1fr))",
                    gap: "20px",
                    justifyItems: "center",
                  }}
                >
                  {barcodesToPrint.slice(0, 1).map((product, index) => {
                    const [labelWidth, labelHeight] = templateSize
                      .split("x")
                      .map((dim) => dim);
                    return (
                      <div
                        key={`${product.barcode}-${index}`}
                        className="barcode-label"
                        style={{
                          border: "1px solid #000",
                          padding: "2px",
                          textAlign: "left",
                          fontSize: "8px",
                          width: labelWidth,
                          height: labelHeight,
                          backgroundColor: "#fff",
                          boxSizing: "border-box",
                          position: "relative",
                        }}
                      >
                        <h3
                          style={{
                            margin: "0 0 1px 0",
                            fontWeight: "bold",
                            fontSize: "10px",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {product.product_name.toUpperCase()}
                        </h3>
                        <div
                          style={{
                            margin: "1px 0",
                            lineHeight: "1.1",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          කල්. දිනය/ EXP Date: {product.expiry_date}
                        </div>
                        <div
                          style={{
                            margin: "1px 0",
                            lineHeight: "1.1",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          කු. අං/ Batch No: ${product.batch_number}
                        </div>
                        <canvas
                          id={`barcode-${index}`}
                          style={{
                            margin: "0 auto",
                            display: "block",
                            width: "80%",
                            height: "auto",
                          }}
                        />
                        <div className="mrp">MRP: ${product.mrp}</div>
                        <div className="seller">
                          Import&Distributed by: ${product.supplier}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedProduct && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "30px",
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                }}
              >
                <button
                  onClick={handleGenerateBarcodes}
                  disabled={loading}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: loading ? "#d1d5db" : "#1e3a8a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition:
                      "background-color 0.3s ease, transform 0.2s ease",
                    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={(e) =>
                    !loading && (e.target.style.backgroundColor = "#1e40af")
                  }
                  onMouseLeave={(e) =>
                    !loading && (e.target.style.backgroundColor = "#1e3a8a")
                  }
                  onMouseDown={(e) =>
                    !loading && (e.target.style.transform = "scale(0.98)")
                  }
                  onMouseUp={(e) =>
                    !loading && (e.target.style.transform = "scale(1)")
                  }
                >
                  Generate Barcode
                </button>
                {barcodesToPrint.length > 0 && (
                  <button
                    onClick={handlePrint}
                    style={{
                      padding: "12px 30px",
                      backgroundColor: "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition:
                        "background-color 0.3s ease, transform 0.2s ease",
                      boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#218838")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#28a745")
                    }
                    onMouseDown={(e) =>
                      (e.target.style.transform = "scale(0.98)")
                    }
                    onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
                  >
                    Print Barcodes
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
