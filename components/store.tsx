"use client";

import * as React from "react";
import {
  MoneyEntry,
  SupplierInvoice,
  SupplierInvoiceStatus,
  Product,
  Ingredient,
  IngredientLot,
  RecipeLine,
  SalesRecord,
  StockMovement,
  PaidBy,
} from "@/lib/types";
import { getMonthKey } from "@/lib/utils";
import { apiFetch, normalizeMongoDoc } from "@/lib/api";
import { toast } from "@/lib/toast";

type IngredientLotsState = Record<string, IngredientLot[]>;

type AppState = {
  entries: MoneyEntry[];
  supplierInvoices: SupplierInvoice[];
  products: Product[];
  ingredients: Ingredient[];
  recipes: RecipeLine[];
  salesRecords: SalesRecord[];
  stockMovements: StockMovement[];
  ingredientLots: IngredientLotsState; // FIFO lots by ingredient
  month: string | "all";
};

type AppActions = {
  setMonth: (m: string | "all") => void;

  // Products
  addProduct: (p: Omit<Product, "id">) => Promise<void> | void;
  updateProduct: (
    id: string,
    patch: Partial<Omit<Product, "id">>
  ) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void> | void;
  uploadProductImage: (id: string, file: File) => Promise<void> | void;
  importProducts: (rows: Omit<Product, "id">[]) => Promise<void> | void;

  // Recipes
  setRecipeForProduct: (
    productId: string,
    lines: { ingredientId: string; qtyPerUnit: number }[]
  ) => Promise<void> | void;
  importRecipesExcel: (file: File) => Promise<void> | void;

  // Money ledger
  addEntry: (e: Omit<MoneyEntry, "id">) => Promise<void> | void;
  updateEntry: (
    id: string,
    patch: Partial<Omit<MoneyEntry, "id">>
  ) => Promise<void> | void;
  deleteEntry: (id: string) => Promise<void> | void;
  importEntriesExcel: (file: File) => Promise<void> | void;

  // Supplier invoices
  addSupplierInvoice: (s: Omit<SupplierInvoice, "id">) => Promise<void> | void;
  updateSupplierInvoice: (
    id: string,
    patch: Partial<Omit<SupplierInvoice, "id">>
  ) => Promise<void> | void;
  deleteSupplierInvoice: (id: string) => Promise<void> | void;
  setSupplierStatus: (id: string, status: SupplierInvoiceStatus) => void;
  importSupplierInvoicesExcel: (file: File) => Promise<void> | void;

  // Ingredients / inventory
  addIngredient: (i: Omit<Ingredient, "id">) => Promise<void> | void;
  updateIngredient: (
    id: string,
    patch: Partial<Omit<Ingredient, "id">>
  ) => Promise<void> | void;
  deleteIngredient: (id: string) => Promise<void> | void;
  importIngredientsExcel: (file: File) => Promise<void> | void;

  receiveStock: (args: {
    date: string;
    ingredientId: string;
    qty: number;
    costTotal: number;
    paidBy: PaidBy;
    createExpenseEntry?: boolean;
    updateCostAverage?: boolean;
    note?: string;
  }) => Promise<void> | void;

  adjustStockOut: (args: {
    date: string;
    ingredientId: string;
    qty: number;
    note?: string;
  }) => Promise<void> | void;

  // Sales
  createQuickSale: (args: {
    date: string;
    paidBy: PaidBy;
    lines: { productId: string; qty: number }[];
  }) => Promise<void> | void;
  importSalesExcel: (file: File) => Promise<void> | void;
};

function hasToken() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("coffee_token");
}

function oidToString(v: any) {
  if (!v) return "";
  return typeof v === "string" ? v : String(v);
}

function normalizePaidBy(v: any): PaidBy {
  const s = String(v ?? "").toLowerCase();
  if (s === "transfer") return "bank";
  if (s === "bank" || s === "card" || s === "cash") return s as PaidBy;
  return "cash";
}

function normalizeRecipeDoc(doc: any) {
  const base = normalizeMongoDoc(doc);
  return {
    id: base.id,
    productId: oidToString(base.productId),
    ingredientId: oidToString(base.ingredientId),
    qtyPerUnit: Number(base.qtyPerUnit ?? 0),
  } as RecipeLine;
}

function normalizeMovementDoc(doc: any) {
  const base = normalizeMongoDoc(doc);
  return {
    id: base.id,
    date: String(base.date ?? ""),
    ingredientId: oidToString(base.ingredientId),
    direction: base.direction as any,
    qty: Number(base.qty ?? 0),
    costTotal: base.costTotal != null ? Number(base.costTotal) : undefined,
    note: base.note ? String(base.note) : "",
  } as StockMovement;
}

function normalizeIngredientDoc(doc: any) {
  const base = normalizeMongoDoc(doc);
  return {
    id: base.id,
    name: String(base.name ?? ""),
    unit: base.unit as any,
    stockQty: Number(base.stockQty ?? 0),
    costPerUnit: Number(base.costPerUnit ?? 0),
    active: Boolean(base.active ?? true),
    minStockQty: Number(base.minStockQty ?? 0),
    costingMethod: (base.costingMethod ?? "avg") as any,
  } as Ingredient;
}

function normalizeEntryDoc(doc: any) {
  const base = normalizeMongoDoc(doc);
  const paidBy = normalizePaidBy(base.paidBy);
  return {
    id: base.id,
    date: String(base.date ?? ""),
    type: base.type as any,
    category: String(base.category ?? ""),
    note: base.note ? String(base.note) : "",
    amount: Number(base.amount ?? 0),
    paidBy,
  } as MoneyEntry;
}

function normalizeSaleDoc(doc: any) {
  const base = normalizeMongoDoc(doc);
  const paidBy = normalizePaidBy(base.paidBy);
  return {
    id: base.id,
    date: String(base.date ?? ""),
    paidBy,
    lines: Array.isArray(base.lines)
      ? base.lines.map((l: any) => ({
          productId: oidToString(l.productId),
          name: String(l.name ?? ""),
          qty: Number(l.qty ?? 0),
          unitPrice: Number(l.unitPrice ?? 0),
        }))
      : [],
    revenue: Number(base.revenue ?? 0),
    cogs: Number(base.cogs ?? 0),
    profit: Number(base.profit ?? 0),
  } as SalesRecord;
}

function normalizeSupplierInvoiceDoc(doc: any) {
  const base = normalizeMongoDoc(doc);
  return {
    id: base.id,
    date: String(base.date ?? ""),
    supplier: String(base.supplierName ?? base.supplier ?? ""),
    invoiceNo: base.invoiceNumber ? String(base.invoiceNumber) : String(base.invoiceNo ?? ""),
    amount: Number(base.totalAmount ?? base.amount ?? 0),
    paidAmount: Number(base.paidAmount ?? 0),
    status: (base.status ?? "unpaid") as any,
    dueDate: base.dueDate ? String(base.dueDate) : String(base.dueDate ?? ""),
    note: base.note ? String(base.note) : "",
  } as SupplierInvoice;
}

/** FIFO consume from lots (oldest first). Returns remaining lots + total cost. */
function consumeLotsFIFO(lots: IngredientLot[], qtyNeeded: number) {
  let remaining = qtyNeeded;
  let cost = 0;
  const next: IngredientLot[] = [];

  for (const lot of lots) {
    if (remaining <= 0) {
      next.push(lot);
      continue;
    }
    const take = Math.min(lot.qty, remaining);
    cost += take * lot.unitCost;
    remaining -= take;

    const left = lot.qty - take;
    if (left > 0) next.push({ ...lot, qty: left });
  }

  return { lots: next, cost, shortage: remaining };
}

const AppStoreContext = React.createContext<(AppState & AppActions) | null>(
  null
);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<MoneyEntry[]>([]);
  const [supplierInvoices, setSupplierInvoices] = React.useState<SupplierInvoice[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [recipes, setRecipes] = React.useState<RecipeLine[]>([]);
  const [salesRecords, setSalesRecords] = React.useState<SalesRecord[]>([]);
  const [stockMovements, setStockMovements] = React.useState<StockMovement[]>([]);
  const [ingredientLots, setIngredientLots] = React.useState<IngredientLotsState>({});

  const [month, setMonth] = React.useState<string | "all">(() => {
    const d = new Date();
    return getMonthKey(d.toISOString().slice(0, 10));
  });

  // Load backend data when token exists (and refresh when login/logout happens)
  React.useEffect(() => {
    let mounted = true;

    async function loadAll() {
      if (!hasToken()) {
        // Logged out => clear all state
        setProducts([]);
        setIngredients([]);
        setRecipes([]);
        setEntries([]);
        setSupplierInvoices([]);
        setStockMovements([]);
        setSalesRecords([]);
        setIngredientLots({});
        return;
      }

      try {
        const [pList, iList, rList, eList, siList, mList, sList] =
          await Promise.all([
            apiFetch<any[]>("/products").catch(() => []),
            apiFetch<any[]>("/ingredients").catch(() => []),
            apiFetch<any[]>("/recipes").catch(() => []),
            apiFetch<any[]>("/entries").catch(() => []),
            apiFetch<any[]>("/supplier-invoices").catch(() => []),
            apiFetch<any[]>("/inventory/movements").catch(() => []),
            apiFetch<any[]>("/sales").catch(() => []),
          ]);

        if (!mounted) return;

        setProducts(
          (pList || []).map((d) => normalizeMongoDoc(d)) as Product[]
        );
        setIngredients(
          (iList || []).map((d) => normalizeIngredientDoc(d)) as Ingredient[]
        );
        setRecipes(
          (rList || []).map((d) => normalizeRecipeDoc(d)) as RecipeLine[]
        );
        setEntries(
          (eList || []).map((d) => normalizeEntryDoc(d)) as MoneyEntry[]
        );
        setSupplierInvoices(
          (siList || []).map((d) =>
            normalizeSupplierInvoiceDoc(d)
          ) as SupplierInvoice[]
        );
        setStockMovements(
          (mList || []).map((d) => normalizeMovementDoc(d)) as StockMovement[]
        );
        setSalesRecords(
          (sList || []).map((d) => normalizeSaleDoc(d)) as SalesRecord[]
        );
      } catch {
        // ignore
      }
    }

    loadAll();

    function onAuthChanged() {
      loadAll();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("coffee_auth_changed", onAuthChanged);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("coffee_auth_changed", onAuthChanged);
      }
    };
  }, []);

  // --- Products ---
  const addProduct = React.useCallback(async (p: Omit<Product, "id">) => {
    if (!hasToken()) return;
    try {
      const created = await apiFetch<any>("/products", {
        method: "POST",
        body: JSON.stringify(p),
      });
      const mapped = normalizeMongoDoc(created) as Product;
      setProducts((prev) => [mapped, ...prev]);
      toast.success("Product added", { description: mapped.name });
    } catch (err: any) {
      toast.error("Failed to add product", { description: err?.message });
    }
  }, []);

  const updateProduct = React.useCallback(
    async (id: string, patch: Partial<Omit<Product, "id">>) => {
      if (!hasToken()) return;
      try {
        const updated = await apiFetch<any>(`/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        const mapped = normalizeMongoDoc(updated) as Product;
        setProducts((prev) => prev.map((x) => (x.id === id ? mapped : x)));
        toast.success("Product updated", { description: mapped.name });
      } catch (err: any) {
        toast.error("Failed to update product", { description: err?.message });
      }
    },
    []
  );

  const deleteProduct = React.useCallback(async (id: string) => {
    if (!hasToken()) return;
    try {
      const toDelete = products.find((p) => p.id === id);
      await apiFetch<any>(`/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((x) => x.id !== id));
      setRecipes((prev) => prev.filter((r) => r.productId !== id));
      toast.success("Product deleted", { description: toDelete?.name });
    } catch (err: any) {
      toast.error("Failed to delete product", { description: err?.message });
    }
  }, []);

  const uploadProductImage = React.useCallback(async (id: string, file: File) => {
    if (!hasToken()) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const updated = await apiFetch<any>(`/products/${id}/image`, {
        method: "POST",
        body: fd,
      });
      const mapped = normalizeMongoDoc(updated) as Product;
      setProducts((prev) => prev.map((x) => (x.id === id ? mapped : x)));
      toast.success("Image uploaded", { description: mapped.name });
    } catch (err: any) {
      toast.error("Failed to upload image", { description: err?.message });
    }
  }, []);

  const importProducts = React.useCallback(async (rows: Omit<Product, "id">[]) => {
    if (!hasToken()) return;
    try {
      await apiFetch<any>("/products/import", {
        method: "POST",
        body: JSON.stringify({ rows }),
      });
      const pList = await apiFetch<any[]>("/products").catch(() => []);
      setProducts((pList || []).map((d) => normalizeMongoDoc(d)) as Product[]);
      toast.success("Products imported", { description: `${rows.length} row(s)` });
    } catch (err: any) {
      toast.error("Failed to import products", { description: err?.message });
    }
  }, []);

  // --- Recipes ---
  const setRecipeForProduct = React.useCallback(
    async (
      productId: string,
      lines: { ingredientId: string; qtyPerUnit: number }[]
    ) => {
      if (!hasToken()) return;
      try {
        const res = await apiFetch<any[]>(`/recipes/${productId}`, {
          method: "PUT",
          body: JSON.stringify({ lines }),
        });
        const mapped = (res || []).map((d) => normalizeRecipeDoc(d)) as RecipeLine[];
        setRecipes((prev) => {
          const without = prev.filter((r) => r.productId !== productId);
          return [...mapped, ...without];
        });
        toast.success("Recipe updated", { description: `${lines.length} line(s)` });
      } catch (err: any) {
        toast.error("Failed to update recipe", { description: err?.message });
      }
    },
    []
  );

  const importRecipesExcel = React.useCallback(async (file: File) => {
    if (!hasToken()) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiFetch<any>("/recipes/import", { method: "POST", body: fd });
      const list = await apiFetch<any[]>("/recipes").catch(() => []);
      setRecipes((list || []).map((d) => normalizeRecipeDoc(d)) as RecipeLine[]);
      toast.success("Recipes imported");
    } catch (err: any) {
      toast.error("Failed to import recipes", { description: err?.message });
    }
  }, []);

  // --- Money ledger ---
  const addEntry = React.useCallback(async (e: Omit<MoneyEntry, "id">) => {
    if (!hasToken()) return;
    try {
      const created = await apiFetch<any>("/entries", {
        method: "POST",
        body: JSON.stringify(e),
      });
      const mapped = normalizeEntryDoc(created) as MoneyEntry;
      setEntries((prev) => [mapped, ...prev]);
      toast.success("Entry added", { description: `${mapped.type} • ${mapped.amount}` });
    } catch (err: any) {
      toast.error("Failed to add entry", { description: err?.message });
    }
  }, []);

  const updateEntry = React.useCallback(
    async (id: string, patch: Partial<Omit<MoneyEntry, "id">>) => {
      if (!hasToken()) return;
      try {
        const updated = await apiFetch<any>(`/entries/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        const mapped = normalizeEntryDoc(updated) as MoneyEntry;
        setEntries((prev) => prev.map((x) => (x.id === id ? mapped : x)));
        toast.success("Entry updated");
      } catch (err: any) {
        toast.error("Failed to update entry", { description: err?.message });
      }
    },
    []
  );

  const deleteEntry = React.useCallback(async (id: string) => {
    if (!hasToken()) return;
    try {
      await apiFetch<any>(`/entries/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((x) => x.id !== id));
      toast.success("Entry deleted");
    } catch (err: any) {
      toast.error("Failed to delete entry", { description: err?.message });
    }
  }, []);

  const importEntriesExcel = React.useCallback(async (file: File) => {
    if (!hasToken()) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiFetch<any>("/entries/import", { method: "POST", body: fd });
      const eList = await apiFetch<any[]>("/entries").catch(() => []);
      setEntries((eList || []).map((d) => normalizeEntryDoc(d)) as MoneyEntry[]);
      toast.success("Entries imported");
    } catch (err: any) {
      toast.error("Failed to import entries", { description: err?.message });
    }
  }, []);

  // --- Supplier invoices ---
  const addSupplierInvoice = React.useCallback(
    async (s: Omit<SupplierInvoice, "id">) => {
      if (!hasToken()) return;
      try {
        const created = await apiFetch<any>("/supplier-invoices", {
          method: "POST",
          body: JSON.stringify({
            date: s.date,
            supplierName: s.supplier,
            invoiceNumber: s.invoiceNo || undefined,
            totalAmount: s.amount,
            paidAmount: s.paidAmount ?? 0,
            status: s.status,
            dueDate: s.dueDate || undefined,
            note: s.note || undefined,
          }),
        });
        const mapped = normalizeSupplierInvoiceDoc(created) as SupplierInvoice;
        setSupplierInvoices((prev) => [mapped, ...prev]);
        toast.success("Supplier invoice added", { description: mapped.supplier });
      } catch (err: any) {
        toast.error("Failed to add supplier invoice", { description: err?.message });
      }
    },
    []
  );

  const updateSupplierInvoice = React.useCallback(
    async (id: string, patch: Partial<Omit<SupplierInvoice, "id">>) => {
      if (!hasToken()) return;
      const mappedPatch: any = {};
      if (patch.date != null) mappedPatch.date = patch.date;
      if (patch.supplier != null) mappedPatch.supplierName = patch.supplier;
      if (patch.invoiceNo != null) mappedPatch.invoiceNumber = patch.invoiceNo;
      if (patch.amount != null) mappedPatch.totalAmount = patch.amount;
      if (patch.paidAmount != null) mappedPatch.paidAmount = patch.paidAmount;
      if (patch.status != null) mappedPatch.status = patch.status;
      if (patch.dueDate != null) mappedPatch.dueDate = patch.dueDate;
      if (patch.note != null) mappedPatch.note = patch.note;

      try {
        const updated = await apiFetch<any>(`/supplier-invoices/${id}`, {
          method: "PATCH",
          body: JSON.stringify(mappedPatch),
        });
        const mapped = normalizeSupplierInvoiceDoc(updated) as SupplierInvoice;
        setSupplierInvoices((prev) => prev.map((x) => (x.id === id ? mapped : x)));
        toast.success("Supplier invoice updated");
      } catch (err: any) {
        toast.error("Failed to update supplier invoice", { description: err?.message });
      }
    },
    []
  );

  const deleteSupplierInvoice = React.useCallback(async (id: string) => {
    if (!hasToken()) return;
    try {
      await apiFetch<any>(`/supplier-invoices/${id}`, { method: "DELETE" });
      setSupplierInvoices((prev) => prev.filter((x) => x.id !== id));
      toast.success("Supplier invoice deleted");
    } catch (err: any) {
      toast.error("Failed to delete supplier invoice", { description: err?.message });
    }
  }, []);

  const importSupplierInvoicesExcel = React.useCallback(async (file: File) => {
    if (!hasToken()) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiFetch<any>("/supplier-invoices/import", { method: "POST", body: fd });
      const list = await apiFetch<any[]>("/supplier-invoices").catch(() => []);
      setSupplierInvoices(
        (list || []).map((d) => normalizeSupplierInvoiceDoc(d)) as SupplierInvoice[]
      );
      toast.success("Supplier invoices imported");
    } catch (err: any) {
      toast.error("Failed to import supplier invoices", { description: err?.message });
    }
  }, []);

  const setSupplierStatus = React.useCallback(
    (id: string, status: SupplierInvoiceStatus) => {
      if (!hasToken()) return;
      // reuse the existing PATCH endpoint
      void updateSupplierInvoice(id, { status } as any);
    },
    [updateSupplierInvoice]
  );

  // --- Ingredients ---
  const addIngredient = React.useCallback(async (i: Omit<Ingredient, "id">) => {
    if (!hasToken()) return;
    try {
      const created = await apiFetch<any>("/ingredients", {
        method: "POST",
        body: JSON.stringify(i),
      });
      const mapped = normalizeIngredientDoc(created) as Ingredient;
      setIngredients((prev) => [mapped, ...prev]);
      toast.success("Ingredient added", { description: mapped.name });
    } catch (err: any) {
      toast.error("Failed to add ingredient", { description: err?.message });
    }
  }, []);

  const updateIngredient = React.useCallback(
    async (id: string, patch: Partial<Omit<Ingredient, "id">>) => {
      if (!hasToken()) return;
      try {
        const updated = await apiFetch<any>(`/ingredients/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        const mapped = normalizeIngredientDoc(updated) as Ingredient;
        setIngredients((prev) => prev.map((x) => (x.id === id ? mapped : x)));
        toast.success("Ingredient updated", { description: mapped.name });
      } catch (err: any) {
        toast.error("Failed to update ingredient", { description: err?.message });
      }
    },
    []
  );

  const deleteIngredient = React.useCallback(async (id: string) => {
    if (!hasToken()) return;
    try {
      await apiFetch<any>(`/ingredients/${id}`, { method: "DELETE" });
      setIngredients((prev) => prev.filter((x) => x.id !== id));
      setRecipes((prev) => prev.filter((r) => r.ingredientId !== id));
      setIngredientLots((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      toast.success("Ingredient deleted");
    } catch (err: any) {
      toast.error("Failed to delete ingredient", { description: err?.message });
    }
  }, []);

  const importIngredientsExcel = React.useCallback(async (file: File) => {
    if (!hasToken()) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiFetch<any>("/ingredients/import", { method: "POST", body: fd });
      const iList = await apiFetch<any[]>("/ingredients").catch(() => []);
      setIngredients(
        (iList || []).map((d) => normalizeIngredientDoc(d)) as Ingredient[]
      );
      toast.success("Ingredients imported");
    } catch (err: any) {
      toast.error("Failed to import ingredients", { description: err?.message });
    }
  }, []);

  const receiveStock = React.useCallback(
    async (args: {
      date: string;
      ingredientId: string;
      qty: number;
      costTotal: number;
      paidBy: PaidBy;
      createExpenseEntry?: boolean;
      updateCostAverage?: boolean;
      note?: string;
    }) => {
      if (!args.ingredientId || args.qty <= 0 || args.costTotal < 0) return;
      if (!hasToken()) return;

      try {
        await apiFetch<any>("/inventory/receive", {
          method: "POST",
          body: JSON.stringify({
            date: args.date,
            ingredientId: args.ingredientId,
            qty: args.qty,
            costTotal: args.costTotal,
            createExpenseEntry: args.createExpenseEntry,
            paidBy: args.paidBy,
            updateCostAverage: args.updateCostAverage,
            note: args.note,
          }),
        });

        const [iList, eList, mList, sList] = await Promise.all([
          apiFetch<any[]>("/ingredients").catch(() => []),
          apiFetch<any[]>("/entries").catch(() => []),
          apiFetch<any[]>("/inventory/movements").catch(() => []),
          apiFetch<any[]>("/sales").catch(() => []),
        ]);

        setIngredients(
          (iList || []).map((d) => normalizeIngredientDoc(d)) as Ingredient[]
        );
        setEntries((eList || []).map((d) => normalizeEntryDoc(d)) as MoneyEntry[]);
        setStockMovements(
          (mList || []).map((d) => normalizeMovementDoc(d)) as StockMovement[]
        );
        setSalesRecords((sList || []).map((d) => normalizeSaleDoc(d)) as SalesRecord[]);

        toast.success("Stock received", { description: `${args.qty}` });
      } catch (err: any) {
        toast.error("Failed to receive stock", { description: err?.message });
      }
    },
    [ingredients]
  );

  const adjustStockOut = React.useCallback(
    async (args: {
      date: string;
      ingredientId: string;
      qty: number;
      note?: string;
    }) => {
      if (!args.ingredientId || args.qty <= 0) return;
      if (!hasToken()) return;

      try {
        await apiFetch<any>("/inventory/adjust-out", {
          method: "POST",
          body: JSON.stringify({
            date: args.date,
            ingredientId: args.ingredientId,
            qty: args.qty,
            note: args.note,
          }),
        });

        const [iList, mList, sList] = await Promise.all([
          apiFetch<any[]>("/ingredients").catch(() => []),
          apiFetch<any[]>("/inventory/movements").catch(() => []),
          apiFetch<any[]>("/sales").catch(() => []),
        ]);

        setIngredients(
          (iList || []).map((d) => normalizeIngredientDoc(d)) as Ingredient[]
        );
        setStockMovements(
          (mList || []).map((d) => normalizeMovementDoc(d)) as StockMovement[]
        );
        setSalesRecords(
          (sList || []).map((d) => normalizeSaleDoc(d)) as SalesRecord[]
        );

        toast.success("Stock adjusted (out)", { description: `${args.qty}` });
      } catch (err: any) {
        toast.error("Failed to adjust stock", { description: err?.message });
      }
    },
    [ingredients]
  );

  // --- Sales (Quick Sale) ---
  const createQuickSale = React.useCallback(
    async (args: {
      date: string;
      paidBy: PaidBy;
      lines: { productId: string; qty: number }[];
    }) => {
      if (!hasToken()) return;

      try {
        await apiFetch<any>("/sales", {
          method: "POST",
          body: JSON.stringify({
            date: args.date,
            paidBy: args.paidBy,
            lines: args.lines,
          }),
        });

        const [sList, eList, iList, mList] = await Promise.all([
          apiFetch<any[]>("/sales").catch(() => []),
          apiFetch<any[]>("/entries").catch(() => []),
          apiFetch<any[]>("/ingredients").catch(() => []),
          apiFetch<any[]>("/inventory/movements").catch(() => []),
        ]);

        setSalesRecords(
          (sList || []).map((d) => normalizeSaleDoc(d)) as SalesRecord[]
        );
        setEntries((eList || []).map((d) => normalizeEntryDoc(d)) as MoneyEntry[]);
        setIngredients(
          (iList || []).map((d) => normalizeIngredientDoc(d)) as Ingredient[]
        );
        setStockMovements(
          (mList || []).map((d) => normalizeMovementDoc(d)) as StockMovement[]
        );

        const qty = args.lines.reduce((a, l) => a + (l.qty || 0), 0);
        toast.success("Sale recorded", { description: `${qty} item(s)` });
      } catch (err: any) {
        toast.error("Failed to record sale", { description: err?.message });
      }
    },
    [products, ingredients, recipes, ingredientLots]
  );

  const importSalesExcel = React.useCallback(async (file: File) => {
    if (!hasToken()) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiFetch<any>("/sales/import", { method: "POST", body: fd });

      const [sList, eList, iList, mList] = await Promise.all([
        apiFetch<any[]>("/sales").catch(() => []),
        apiFetch<any[]>("/entries").catch(() => []),
        apiFetch<any[]>("/ingredients").catch(() => []),
        apiFetch<any[]>("/inventory/movements").catch(() => []),
      ]);

      setSalesRecords(
        (sList || []).map((d) => normalizeSaleDoc(d)) as SalesRecord[]
      );
      setEntries((eList || []).map((d) => normalizeEntryDoc(d)) as MoneyEntry[]);
      setIngredients(
        (iList || []).map((d) => normalizeIngredientDoc(d)) as Ingredient[]
      );
      setStockMovements(
        (mList || []).map((d) => normalizeMovementDoc(d)) as StockMovement[]
      );

      toast.success("Sales imported");
    } catch (err: any) {
      toast.error("Failed to import sales", { description: err?.message });
    }
  }, []);


  const value = React.useMemo(
    () => ({
      entries,
      supplierInvoices,
      products,
      ingredients,
      recipes,
      salesRecords,
      stockMovements,
      ingredientLots,
      month,

      setMonth,

      addProduct,
      updateProduct,
      deleteProduct,
      uploadProductImage,
      importProducts,

      setRecipeForProduct,
      importRecipesExcel,

      addEntry,
      updateEntry,
      deleteEntry,
      importEntriesExcel,

      addSupplierInvoice,
      updateSupplierInvoice,
      deleteSupplierInvoice,
      setSupplierStatus,
      importSupplierInvoicesExcel,

      addIngredient,
      updateIngredient,
      deleteIngredient,
      importIngredientsExcel,

      receiveStock,
      adjustStockOut,

      createQuickSale,
      importSalesExcel,
    }),
    [
      entries,
      supplierInvoices,
      products,
      ingredients,
      recipes,
      salesRecords,
      stockMovements,
      ingredientLots,
      month,
      addProduct,
      updateProduct,
      deleteProduct,
      uploadProductImage,
      importProducts,
      setRecipeForProduct,
      importRecipesExcel,
      addEntry,
      updateEntry,
      deleteEntry,
      importEntriesExcel,
      addSupplierInvoice,
      updateSupplierInvoice,
      deleteSupplierInvoice,
      setSupplierStatus,
      importSupplierInvoicesExcel,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      importIngredientsExcel,
      receiveStock,
      adjustStockOut,
      createQuickSale,
      importSalesExcel,
    ]
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
