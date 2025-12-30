import { MoneyEntry, SupplierInvoice } from "./types";

export const initialMoneyEntries: MoneyEntry[] = [
  // OUT (daily purchases)
  { id: "m1", date: "2025-12-29", type: "out", category: "Milk", note: "20L", amount: 45, paidBy: "cash" },
  { id: "m2", date: "2025-12-29", type: "out", category: "Croissant", note: "60 pcs", amount: 72, paidBy: "cash" },
  { id: "m3", date: "2025-12-29", type: "out", category: "Coffee Beans", note: "2kg", amount: 110, paidBy: "bank" },
  { id: "m4", date: "2025-12-28", type: "out", category: "Sugar", note: "10kg", amount: 38, paidBy: "cash" },

  // IN (sales / customer invoices)
  { id: "m5", date: "2025-12-29", type: "in", category: "Sales", note: "Counter sales", amount: 520, paidBy: "cash" },
  { id: "m6", date: "2025-12-29", type: "in", category: "Customer Invoice", note: "Office delivery INV-1023", amount: 180, paidBy: "bank" },
  { id: "m7", date: "2025-12-28", type: "in", category: "Sales", note: "Counter sales", amount: 460, paidBy: "cash" }
];

export const initialProducts = [
  { id: "p1", name: "Espresso", category: "Coffee", price: 6, active: true, targetDailyAvgQty: 15, targetMonthlyQty: 450 },
  { id: "p2", name: "Cappuccino", category: "Coffee", price: 10, active: true, targetDailyAvgQty: 10, targetMonthlyQty: 300 },
  { id: "p3", name: "Latte", category: "Coffee", price: 11, active: true, targetDailyAvgQty: 8, targetMonthlyQty: 240 },
  { id: "p4", name: "Croissant", category: "Croissant", price: 5, active: true, targetDailyAvgQty: 20, targetMonthlyQty: 600 },
  { id: "p5", name: "Pizza Slice", category: "Pizza", price: 12, active: true, targetDailyAvgQty: 10, targetMonthlyQty: 300 },
  { id: "p6", name: "Margherita Pizza", category: "Pizza", price: 45, active: true, targetDailyAvgQty: 2, targetMonthlyQty: 60 },
  { id: "p7", name: "Water", category: "Drink", price: 3, active: true, targetDailyAvgQty: 20, targetMonthlyQty: 600 },
  { id: "p8", name: "Soft Drink", category: "Drink", price: 6, active: true, targetDailyAvgQty: 15, targetMonthlyQty: 450 },

  // Beef example (sold by weight/portion)
  { id: "p9", name: "Beef Sandwich", category: "Sandwich", price: 18, active: true, targetDailyAvgQty: 5, targetMonthlyQty: 150 }
] as const;


export const initialIngredients = [
  { id: "i1", name: "Coffee Beans", unit: "kg", stockQty: 8, costPerUnit: 85, active: true, minStockQty: 2, costingMethod: "avg" },
  { id: "i2", name: "Milk", unit: "l", stockQty: 25, costPerUnit: 2.2, active: true, minStockQty: 8, costingMethod: "avg" },
  { id: "i3", name: "Sugar", unit: "kg", stockQty: 12, costPerUnit: 4.5, active: true, minStockQty: 3, costingMethod: "avg" },
  { id: "i4", name: "Flour", unit: "kg", stockQty: 20, costPerUnit: 3.8, active: true, minStockQty: 5, costingMethod: "avg" },
  { id: "i5", name: "Cheese", unit: "kg", stockQty: 6, costPerUnit: 22, active: true, minStockQty: 2, costingMethod: "avg" },
  { id: "i6", name: "Tomato Sauce", unit: "kg", stockQty: 10, costPerUnit: 8, active: true, minStockQty: 2, costingMethod: "avg" },

  // Beef (FIFO costing recommended because purchase price changes a lot)
  { id: "i7", name: "Beef", unit: "kg", stockQty: 8, costPerUnit: 35, active: true, minStockQty: 2, costingMethod: "fifo" }
] as const;


export const initialRecipes = [
  // Cappuccino (p2): 0.018kg beans, 0.18l milk
  { id: "r1", productId: "p2", ingredientId: "i1", qtyPerUnit: 0.018 },
  { id: "r2", productId: "p2", ingredientId: "i2", qtyPerUnit: 0.18 },

  // Latte (p3): 0.018kg beans, 0.22l milk
  { id: "r3", productId: "p3", ingredientId: "i1", qtyPerUnit: 0.018 },
  { id: "r4", productId: "p3", ingredientId: "i2", qtyPerUnit: 0.22 },

  // Espresso (p1): 0.016kg beans
  { id: "r5", productId: "p1", ingredientId: "i1", qtyPerUnit: 0.016 },

  // Croissant (p4): 0.09kg flour, 0.02kg sugar (very simplified)
  { id: "r6", productId: "p4", ingredientId: "i4", qtyPerUnit: 0.09 },
  { id: "r7", productId: "p4", ingredientId: "i3", qtyPerUnit: 0.02 },

  // Pizza Slice (p5): 0.08kg flour, 0.03kg cheese, 0.04kg sauce
  { id: "r8", productId: "p5", ingredientId: "i4", qtyPerUnit: 0.08 },
  { id: "r9", productId: "p5", ingredientId: "i5", qtyPerUnit: 0.03 },
  { id: "r10", productId: "p5", ingredientId: "i6", qtyPerUnit: 0.04 },

  // Beef Sandwich (p9): 0.12kg beef, 0.05kg flour (simplified)
  { id: "r11", productId: "p9", ingredientId: "i7", qtyPerUnit: 0.12 },
  { id: "r12", productId: "p9", ingredientId: "i4", qtyPerUnit: 0.05 }
] as const;

export const initialSalesRecords = [] as const;
export const initialStockMovements = [
  { id: "sm1", date: "2025-12-29", ingredientId: "i2", direction: "in", qty: 20, costTotal: 44, note: "Milk delivery" },
  { id: "sm2", date: "2025-12-28", ingredientId: "i1", direction: "in", qty: 2, costTotal: 170, note: "Beans purchase" }
] as const;



export const initialSupplierInvoices: SupplierInvoice[] = [
  {
    id: "s1",
    supplier: "Tripoli Dairy Co.",
    invoiceNo: "SUP-TRD-8891",
    date: "2025-12-29",
    dueDate: "2026-01-10",
    amount: 320,
    status: "unpaid"
  },
  {
    id: "s2",
    supplier: "Bakery Al Noor",
    invoiceNo: "SUP-BAN-2304",
    date: "2025-12-28",
    dueDate: "2026-01-05",
    amount: 410,
    status: "partial",
    paidAmount: 200
  },
  {
    id: "s3",
    supplier: "Coffee Importers Libya",
    invoiceNo: "SUP-CIL-5512",
    date: "2025-12-20",
    dueDate: "2025-12-30",
    amount: 980,
    status: "paid",
    paidAmount: 980
  }
];
