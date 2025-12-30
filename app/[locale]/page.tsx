"use client";

import { useMemo } from "react";
import { useTranslations } from "@/components/i18n";
import DashboardWidget from "@/components/DashboardWidget";
import SummaryCards from "@/components/SummaryCards";
import MonthFilter from "@/components/MonthFilter";
import DailyTotalsTable from "@/components/DailyTotalsTable";
import ProductPerformanceCard from "@/components/ProductPerformanceCard";
import { ExportLedgerCsv } from "@/components/ExportButtons";
import { useAppStore } from "@/components/store";
import { getMonthKey, uniqueMonthsFromEntries } from "@/lib/utils";

export default function OverviewPage() {
  const t = useTranslations();
  const { entries, supplierInvoices, products, month, setMonth, salesRecords, stockMovements } = useAppStore();

  const months = useMemo(
    () => uniqueMonthsFromEntries(entries, supplierInvoices, salesRecords, stockMovements),
    [entries, supplierInvoices, salesRecords, stockMovements]
  );

  const filtered = useMemo(() => {
    if (month === "all") return entries;
    return entries.filter((e) => getMonthKey(e.date) === month);
  }, [entries, month]);

  return (
    <div className="space-y-6">
      <DashboardWidget />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("appName")}</h1>
          <p className="text-sm text-zinc-600">{t("overview")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MonthFilter months={months} value={month} onChange={setMonth} />
          <ExportLedgerCsv rows={filtered} />
        </div>
      </div>

      <SummaryCards entries={filtered} />
      <ProductPerformanceCard products={products} sales={salesRecords} month={month} />
      <DailyTotalsTable entries={filtered} />
    </div>
  );
}
