import React, { useEffect, useContext } from "react";
import JsBarcode from "jsbarcode";
import { BarcodeContext } from "./BarcodePage"; // Use Context API

const BarcodeLabel = ({ product, index }) => {
    const { settings } = useContext(BarcodeContext);

    useEffect(() => {
        JsBarcode(`#barcode-${index}`, product.barcode, settings);
    }, [product, settings, index]);

    return (
        <div className="barcode-item">
            {settings.showCompany && <div>{product.company_name || "COMPANY NAME"}</div>}
            {settings.showPrice && <div>LKR {product.sales_price}</div>}
            {settings.showProductName && <div>{product.product_name}</div>}
            <canvas id={`barcode-${index}`} />
        </div>
    );
};

export default BarcodeLabel;
