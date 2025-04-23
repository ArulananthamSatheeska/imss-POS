// Item object structure
export const Item = {
  id: String,
  name: String,
  price: Number,
  stock: Number,
  category: String,
  description: String, // Optional
  batchNumber: String,
  expiryDate: String,
  buyingCost: Number,
  salesPrice: Number,
  mrp: Number,
  barcode: String,
  openingStockQty: Number,
  openingStockValue: Number,
  minPrice: Number,
  minStockQty: Number,
};

// Sale object structure
export const Sale = {
  id: String,
  items: Array, // Array of SaleItem objects
  total: Number,
  timestamp: Date,
  paymentMethod: String, // 'cash' or 'credit'
  customerName: String, // Optional
  customerPhone: String, // Optional
  billNumber: String,
  discount: Number,
  finalAmount: Number,
};

// SaleItem object structure
export const SaleItem = {
  itemId: String,
  quantity: Number,
  price: Number,
  subtotal: Number,
};

// DashboardStats object structure
export const DashboardStats = {
  totalSales: Number,
  todaysSales: Number,
  topSellingItems: Array, // Array of Item objects
  lowStockItems: Array, // Array of Item objects
  salesByDate: Array, // Array of objects with { date: String, amount: Number }
  itemsByCategory: Array, // Array of objects with { category: String, count: Number }
};
