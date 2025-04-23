import React from "react";
import ReactDOM from "react-dom";
import PrintableInvoice from './PrintableInvoice';

const testData = {
    customer: {
        name: "John Doe",
        address: "123 Main St, Anytown, USA",
        phone: "123-456-7890"
    },
    items: [
        { description: "Item 1", qty: 2, unitPrice: 100, freeQty: 0, discountAmount: 0, discountPercentage: 0, total: 200 },
        { description: "Item 2", qty: 1, unitPrice: 150, freeQty: 0, discountAmount: 0, discountPercentage: 0, total: 150 }
    ],
    footerDetails: {
        approvedBy: "Jane Smith",
        nextApprovalTo: "Manager",
        dateTime: new Date().toLocaleString()
    },
    total: 350,
    invoice: {
        no: "INV-001",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    }
};

const TestInvoice = () => {
    return <PrintableInvoice {...testData} />;
};

ReactDOM.render(<TestInvoice />, document.getElementById("root"));
