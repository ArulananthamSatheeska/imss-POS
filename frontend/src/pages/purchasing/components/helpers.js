// src/pages/purchasing/components/helpers.js
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
    }).format(amount);
};

export const calculateTotals = (purchasedItems) => {
    const subtotal = purchasedItems.reduce(
        (acc, item) => acc + (item.quantity * item.buyingCost || 0),
        0
    );
    const totalDiscount = purchasedItems.reduce(
        (acc, item) => acc + (item.discountAmount || 0),
        0
    );
    const totalTax = purchasedItems.reduce(
        (acc, item) => acc + (item.tax || 0),
        0
    );
    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
};

export const mapToInvoice = (item, purchasedItems, items) => {
    const invoiceItems = purchasedItems
        .filter((i) => i.purchaseId === item.purchaseId)
        .map((i) => ({
            id: i.id.split("-")[1],
            productId: items.find((prod) => prod.product_name === i.product_name)?.product_id,
            description: i.product_name,
            quantity: i.quantity,
            freeItems: 0,
            buyingCost: i.buyingCost,
            discountPercentage: i.discountPercentage,
            discountAmount: i.discountAmount,
            tax: i.tax,
            total: i.totalPrice,
        }));

    return {
        billNumber: item.billNumber,
        invoiceNumber: item.invoiceNumber,
        purchaseDate: item.date,
        paymentMethod: item.paymentMethod,
        supplierId: item.supplierId,
        storeId: item.storeId,
        items: invoiceItems,
        total: invoiceItems.reduce((sum, i) => sum + i.total, 0),
        status: item.status,
        id: item.purchaseId,
    };
};

export const exportToExcel = (filteredItems) => {
    const worksheet = XLSX.utils.json_to_sheet(
        filteredItems.map((item, index) => ({
            "S.No": index + 1,
            "Bill Number": item.billNumber,
            "Invoice Number": item.invoiceNumber,
            Supplier: item.supplier,
            Store: item.store,
            Item: item.product_name,
            Quantity: item.quantity,
            "Buying Cost": item.buyingCost,
            Discount: item.discountAmount,
            Tax: item.tax,
            Total: item.totalPrice,
            Date: item.date,
            Status: item.status,
        }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PurchaseEntries");
    XLSX.writeFile(
        workbook,
        `Purchase_Entries_${new Date().toISOString().split("T")[0]}.xlsx`
    );
};