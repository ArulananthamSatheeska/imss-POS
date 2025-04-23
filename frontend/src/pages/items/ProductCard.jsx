import React from "react";

const ProductCard = ({ product, onSelect }) => (
    <div
        className="product-card"
        tabIndex="0"
        onClick={() => onSelect(product)}
        onKeyDown={(e) => e.key === "Enter" && onSelect(product)}
        role="button"
        aria-label={`Select product ${product.product_name}`}
    >
        <h4>{product.product_name}</h4>
        <p>Price: LKR {product.sales_price}</p>
        <p>Barcode: {product.barcode}</p>
    </div>
);

export default ProductCard;