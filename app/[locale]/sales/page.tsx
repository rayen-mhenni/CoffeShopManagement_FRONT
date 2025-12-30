"use client";

import * as React from "react";
import { useMemo } from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import MonthFilter from "@/components/MonthFilter";
import EntriesTable from "@/components/EntriesTable";
import { ExportLedgerCsv } from "@/components/ExportButtons";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Modal from "@/components/Modal";
import { useAppStore } from "@/components/store";
import { getMonthKey, uniqueMonthsFromEntries, safeParseAmount, formatMoney } from "@/lib/utils";
import { PaidBy, Product } from "@/lib/types";
import { downloadSalesTemplate } from "@/lib/excel-templates";
import { toast } from "sonner";

type Line = { productId: string; qty: string };

function QuickSale({
  products,
  onCreate
}: {
  products: Product[];
  onCreate: (payload: { date: string; paidBy: PaidBy; lines: { productId: string; qty: number }[] }) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const activeProducts = products.filter((p) => p.active);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [date, setDate] = React.useState(todayStr);
  const [paidBy, setPaidBy] = React.useState<PaidBy>("cash");
  const [lines, setLines] = React.useState<Line[]>([
    { productId: activeProducts[0]?.id ?? "", qty: "1" }
  ]);

  const total = React.useMemo(() => {
    let sum = 0;
    for (const l of lines) {
      const q = safeParseAmount(l.qty);
      if (q == null) continue;
      const prod = activeProducts.find((p) => p.id === l.productId);
      if (!prod) continue;
      sum += prod.price * q;
    }
    return sum;
  }, [lines, activeProducts]);

  function addLine() {
    setLines((prev) => [...prev, { productId: activeProducts[0]?.id ?? "", qty: "1" }]);
  }

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    const normalized = lines
      .map((l) => ({ productId: l.productId, qty: safeParseAmount(l.qty) }))
      .filter((x): x is { productId: string; qty: number } => !!x.productId && x.qty != null && x.qty > 0);

    if (normalized.length === 0) return;

    onCreate({ date, paidBy, lines: normalized });
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold">{t("quickSale")}</div>
          <div className="text-sm text-zinc-600">{t("quickSaleHint")}</div>
        </div>

        <div className="text-sm font-medium">
          {t("total")}: {formatMoney(total, locale)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("date")}</div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("paidBy")}</div>
          <Select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as PaidBy)}
          >
            <option value="cash">{t("cash")}</option>
            <option value="card">{t("card")}</option>
            <option value="bank">{t("bank")}</option>
          </Select>
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <Select
              value={l.productId}
              onChange={(e) => updateLine(i, { productId: e.target.value })}
              disabled={activeProducts.length === 0}
            >
              {activeProducts.length === 0 ? (
                <option value="">{t("noProducts")}</option>
              ) : (
                activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} • {formatMoney(p.price, locale)}
                  </option>
                ))
              )}
            </Select>

            <Input
              inputMode="decimal"
              value={l.qty}
              onChange={(e) => updateLine(i, { qty: e.target.value })}
              placeholder={t("qty")}
            />

            <div className="flex gap-2">
              <Button onClick={addLine}>{t("addLine")}</Button>
              {lines.length > 1 ? (
                <Button variant="danger" onClick={() => removeLine(i)}>
                  {t("remove")}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={submit}>
          {t("createSaleEntry")}
        </Button>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const t = useTranslations();
  const { entries, supplierInvoices, month, setMonth, products, createQuickSale, salesRecords, stockMovements, importSalesExcel } = useAppStore();

  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = React.useState(false);

  const months = useMemo(
    () => uniqueMonthsFromEntries(entries, supplierInvoices, salesRecords, stockMovements),
    [entries, supplierInvoices, salesRecords, stockMovements]
  );

  const filtered = useMemo(() => {
    const base = entries.filter((e) => e.type === "in");
    if (month === "all") return base;
    return base.filter((e) => getMonthKey(e.date) === month);
  }, [entries, month]);

  
function createSaleEntry(payload: { date: string; paidBy: PaidBy; lines: { productId: string; qty: number }[] }) {
  createQuickSale(payload);
}

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("sales")}</h1>
          <p className="text-sm text-zinc-600">{t("salesEntries")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MonthFilter months={months} value={month} onChange={setMonth} />
          <ExportLedgerCsv rows={filtered} />
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImporting(true);
              try {
                await importSalesExcel(f);
                toast.success(t("importDone"));
              } catch {
                toast.error(t("importFailed"));
              } finally {
                setImporting(false);
                e.currentTarget.value = "";
              }
            }}
          />
          <Button onClick={downloadSalesTemplate}>
            {t("downloadTemplate")}
          </Button>
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? t("importing") : t("importSalesExcel")}
          </Button>
        </div>
      </div>

      <QuickSale products={products} onCreate={createSaleEntry} />

      <EntriesTable title={t("salesEntries")} entries={filtered} />
    </div>
  );
}
