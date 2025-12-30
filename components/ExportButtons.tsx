"use client";

import { useLocale, useTranslations } from "@/components/i18n";
import Button from "./Button";
import { downloadTextFile, formatMoney, toCsv } from "@/lib/utils";
import { MoneyEntry, SupplierInvoice } from "@/lib/types";

export function ExportLedgerCsv({ rows }: { rows: MoneyEntry[] }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Button
      onClick={() => {
        const csv = toCsv(
          rows.map((r) => ({
            date: r.date,
            type: r.type,
            category: r.category,
            note: r.note ?? "",
            paidBy: r.paidBy,
            amount: formatMoney(r.amount, locale)
          })),
          [
            { key: "date", label: t("date") },
            { key: "type", label: t("type") },
            { key: "category", label: t("category") },
            { key: "note", label: t("note") },
            { key: "paidBy", label: t("paidBy") },
            { key: "amount", label: t("amount") }
          ]
        );

        downloadTextFile("ledger.csv", csv);
      }}
    >
      {t("exportCsv")}
    </Button>
  );
}

export function ExportSuppliersCsv({ rows }: { rows: SupplierInvoice[] }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Button
      onClick={() => {
        const csv = toCsv(
          rows.map((r) => ({
            supplier: r.supplier,
            invoiceNo: r.invoiceNo,
            date: r.date,
            dueDate: r.dueDate,
            status: r.status,
            paidAmount: r.paidAmount ?? "",
            amount: formatMoney(r.amount, locale),
            note: r.note ?? ""
          })),
          [
            { key: "supplier", label: t("supplier") },
            { key: "invoiceNo", label: t("invoiceNo") },
            { key: "date", label: t("date") },
            { key: "dueDate", label: t("dueDate") },
            { key: "status", label: t("status") },
            { key: "paidAmount", label: t("paidAmount") },
            { key: "amount", label: t("amount") },
            { key: "note", label: t("note") }
          ]
        );

        downloadTextFile("supplier-invoices.csv", csv);
      }}
    >
      {t("exportCsv")}
    </Button>
  );
}
