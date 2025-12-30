"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "@/components/i18n";
import MonthFilter from "@/components/MonthFilter";
import SupplierInvoicesTable from "@/components/SupplierInvoicesTable";
import { ExportSuppliersCsv } from "@/components/ExportButtons";
import Button from "@/components/Button";
import { useAppStore } from "@/components/store";
import { getMonthKey, uniqueMonthsFromEntries } from "@/lib/utils";
import { downloadSupplierInvoicesTemplate } from "@/lib/excel-templates";
import { toast } from "sonner";

export default function SuppliersPage() {
  const t = useTranslations();
  const { entries, supplierInvoices, month, setMonth, salesRecords, stockMovements, importSupplierInvoicesExcel } = useAppStore();
  const importRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const months = useMemo(
    () => uniqueMonthsFromEntries(entries, supplierInvoices, salesRecords, stockMovements),
    [entries, supplierInvoices, salesRecords, stockMovements]
  );

  const filtered = useMemo(() => {
    if (month === "all") return supplierInvoices;
    return supplierInvoices.filter((s) => getMonthKey(s.date) === month);
  }, [supplierInvoices, month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("suppliers")}</h1>
          <p className="text-sm text-zinc-600">{t("supplierInvoices")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImporting(true);
              try {
                await importSupplierInvoicesExcel(file);
                toast.success(t("importDone"));
              } catch {
                toast.error(t("importFailed"));
              } finally {
                setImporting(false);
                e.target.value = "";
              }
            }}
          />

          <Button onClick={downloadSupplierInvoicesTemplate}>
            {t("downloadTemplate")}
          </Button>

          <Button onClick={() => importRef.current?.click()} disabled={importing}>
            {importing ? t("importing") : t("importExcel")}
          </Button>
          <MonthFilter months={months} value={month} onChange={setMonth} />
          <ExportSuppliersCsv rows={filtered} />
        </div>
      </div>

      <SupplierInvoicesTable rows={filtered} />
    </div>
  );
}
