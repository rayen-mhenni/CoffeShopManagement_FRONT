"use client";

import * as XLSX from "xlsx";

function downloadArrayBufferAsFile(ab: ArrayBuffer, filename: string) {
  const blob = new Blob([ab], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTemplateXlsx(opts: {
  filename: string;
  sheetName?: string;
  headers: string[];
  exampleRow?: Record<string, any>;
}) {
  const { filename, sheetName = "Template", headers, exampleRow } = opts;

  // Create a single example row so users see the column names immediately.
  const base: Record<string, any> = {};
  for (const h of headers) base[h] = "";
  const row = { ...base, ...(exampleRow || {}) };

  const ws = XLSX.utils.json_to_sheet([row], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadArrayBufferAsFile(out, filename);
}

// ---- Ready-to-use templates (keep headers aligned with backend import key mapping) ----

export function downloadIngredientsTemplate() {
  return downloadTemplateXlsx({
    filename: "ingredients_import_template.xlsx",
    headers: ["name", "unit", "stockQty", "costPerUnit", "active"],
    exampleRow: {
      name: "Coffee Beans",
      unit: "kg",
      stockQty: 10,
      costPerUnit: 12.5,
      active: true,
    },
  });
}

export function downloadEntriesTemplate() {
  return downloadTemplateXlsx({
    filename: "ledger_entries_import_template.xlsx",
    headers: ["date", "type", "category", "amount", "paidBy", "note"],
    exampleRow: {
      date: "2025-01-15",
      type: "in",
      category: "Sales",
      amount: 250,
      paidBy: "cash",
      note: "Optional",
    },
  });
}

export function downloadSupplierInvoicesTemplate() {
  return downloadTemplateXlsx({
    filename: "supplier_invoices_import_template.xlsx",
    headers: [
      "date",
      "supplierName",
      "invoiceNumber",
      "totalAmount",
      "paidBy",
      "note",
    ],
    exampleRow: {
      date: "2025-01-20",
      supplierName: "Supplier A",
      invoiceNumber: "INV-001",
      totalAmount: 180,
      paidBy: "bank",
      note: "Optional",
    },
  });
}

export function downloadProductsTemplate() {
  return downloadTemplateXlsx({
    filename: "products_import_template.xlsx",
    headers: [
      "name",
      "category",
      "price",
      "active",
      "targetDailyAvgQty",
      "targetMonthlyQty",
    ],
    exampleRow: {
      name: "Cappuccino",
      category: "Coffee",
      price: 4.5,
      active: true,
      targetDailyAvgQty: 30,
      targetMonthlyQty: 900,
    },
  });
}

export function downloadSalesTemplate() {
  return downloadTemplateXlsx({
    filename: "sales_import_template.xlsx",
    headers: ["date", "paidBy", "product", "qty"],
    exampleRow: {
      date: "2025-01-15",
      paidBy: "cash",
      product: "Cappuccino",
      qty: 2,
    },
  });
}

export function downloadRecipesTemplate() {
  return downloadTemplateXlsx({
    filename: "recipes_import_template.xlsx",
    headers: ["product", "ingredient", "qtyPerUnit"],
    exampleRow: {
      product: "Cappuccino",
      ingredient: "Coffee Beans",
      qtyPerUnit: 0.015,
    },
  });
}
