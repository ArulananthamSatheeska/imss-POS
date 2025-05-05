import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Product = ({ match }) => {
    const [product, setProduct] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8080/product/${match.params.id}`);
                setProduct(response.data);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        fetchProduct();
    }, [match.params.id]);

    if (!product) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{product.product_name}</h1>
            <p>Item Code: {product.item_code}</p>
            <p>Batch Number: {product.batch_number}</p>
            <p>Expiry Date: {product.expiry_date}</p>
            <p>Buying Cost: {product.buying_cost}</p>
            <p>Sales Price: {product.sales_price}</p>
            <p>Wholesale Price: {product.wholesale_price}</p>
            <p>Minimum Price: {product.minimum_price}</p>
            <p>MRP: {product.mrp}</p>
            <p>Minimum Stock Quantity: {product.minimum_stock_quantity}</p>
            <p>Opening Stock Quantity: {product.opening_stock_quantity}</p>
            <p>Opening Stock Value: {product.opening_stock_value}</p>
            <p>Category: {product.category}</p>
            <p>Supplier: {product.supplier}</p>
            <p>Unit Type: {product.unit_type}</p>
            <p>Store Location: {product.store_location}</p>
            <p>Cabinet: {product.cabinet}</p>
            <p>Row: {product.row}</p>
            <img src={`http://127.0.0.1:8080/barcode/${product.product_id}`} alt="Barcode" />
        </div>
    );
};

export default Product;