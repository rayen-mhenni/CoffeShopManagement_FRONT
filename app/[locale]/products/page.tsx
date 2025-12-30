"use client";

import { useMemo } from "react";
import { useTranslations } from "@/components/i18n";
import ProductsTable from "@/components/ProductsTable";
import ProductPerformanceCard from "@/components/ProductPerformanceCard";
import MonthFilter from "@/components/MonthFilter";
import { useAppStore } from "@/components/store";
import { uniqueMonthsFromEntries } from "@/lib/utils";

export default function ProductsPage() {
  const t = useTranslations();
  const { products, entries, supplierInvoices, month, setMonth, salesRecords, stockMovements } = useAppStore();

  const months = useMemo(
    () => uniqueMonthsFromEntries(entries, supplierInvoices, salesRecords, stockMovements),
    [entries, supplierInvoices, salesRecords, stockMovements]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("products")}</h1>
          <p className="text-sm text-zinc-600">{t("productsHint")}</p>
        </div>

        <MonthFilter months={months} value={month} onChange={setMonth} />
      </div>

      <ProductPerformanceCard products={products} sales={salesRecords} month={month} />

      <ProductsTable rows={products} />
    </div>
  );
}
