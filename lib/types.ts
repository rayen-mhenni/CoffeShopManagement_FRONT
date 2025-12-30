export type MoneyType = "in" | "out";
export type PaidBy = "cash" | "card" | "bank";

export type MoneyEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  type: MoneyType;
  category: string;
  note?: string;
  amount: number; // LYD
  paidBy: PaidBy;
};

export type SupplierInvoiceStatus = "paid" | "unpaid" | "partial";

export type SupplierInvoice = {
  id: string;
  supplier: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number;
  status: SupplierInvoiceStatus;
  paidAmount?: number; // when partial/paid
  note?: string;
};


export type ProductCategory =
  | "Coffee"
  | "Pizza"
  | "Croissant"
  | "Sandwich"
  | "Drink"
  | "Dessert"
  | "Other";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  targetDailyQty?: number; // LYD
  active: boolean;

  imageUrl?: string; // /uploads/products/<file>

  // Thresholds (0 = disabled)
  targetDailyAvgQty?: number; // expected average qty per day
  targetMonthlyQty?: number; // expected total qty per month
};


export type Unit = "kg" | "g" | "l" | "ml" | "pcs";

export type Ingredient = {
  id: string;
  name: string;
  unit: Unit;
  stockQty: number;
  costPerUnit: number; // LYD (used for AVG costing or as a hint for FIFO)
  active: boolean;

  // Alerts/thresholds
  minStockQty?: number; // alert when stock <= minStockQty (0/undefined = off)

  // Costing
  costingMethod?: "avg" | "fifo"; // default "avg"
};

export type IngredientLot = {
  id: string;
  ingredientId: string;
  date: string; // YYYY-MM-DD
  qty: number;
  unitCost: number; // LYD per unit
};

export type RecipeLine = {
  id: string;
  productId: string;
  ingredientId: string;
  qtyPerUnit: number; // uses ingredient.unit
};

export type StockDirection = "in" | "out";

export type StockMovement = {
  id: string;
  date: string; // YYYY-MM-DD
  ingredientId: string;
  direction: StockDirection;
  qty: number;
  costTotal?: number; // LYD, optional for adjustments/spoilage
  note?: string;
};

export type SaleLine = {
  productId: string;
  qty: number;
  unitPrice: number; // LYD (product price at time of sale)
  name: string;
};

export type SalesRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  paidBy: PaidBy;
  lines: SaleLine[];
  revenue: number;
  cogs: number; // cost of goods sold
  profit: number;
};
