"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { SupplierInvoice, SupplierInvoiceStatus } from "@/lib/types";
import { formatMoney, safeParseAmount } from "@/lib/utils";
import Button from "./Button";
import Modal from "./Modal";
import Input from "./Input";
import Select from "./Select";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";
import { useAppStore } from "./store";

function StatusPill({ status }: { status: SupplierInvoiceStatus }) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
  const cls =
    status === "paid"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : status === "partial"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-rose-50 border-rose-200 text-rose-700";

  return <span className={`${base} ${cls}`}>{status}</span>;
}

type Draft = {
  supplier: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  amount: string;
  status: SupplierInvoiceStatus;
  paidAmount: string;
  note: string;
};

function InvoiceForm({
  initial,
  onSubmit
}: {
  initial: Draft;
  onSubmit: (d: Draft) => void;
}) {
  const t = useTranslations();
  const [d, setD] = React.useState<Draft>(initial);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(d);
      }}
    >
      <label className="space-y-1">
        <div className="text-sm text-zinc-600">{t("supplier")}</div>
        <Input
          value={d.supplier}
          onChange={(e) => setD((p) => ({ ...p, supplier: e.target.value }))}
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("invoiceNo")}</div>
          <Input
            value={d.invoiceNo}
            onChange={(e) => setD((p) => ({ ...p, invoiceNo: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("status")}</div>
          <Select
            value={d.status}
            onChange={(e) =>
              setD((p) => ({ ...p, status: e.target.value as SupplierInvoiceStatus }))
            }
          >
            <option value="unpaid">{t("unpaid")}</option>
            <option value="partial">{t("partial")}</option>
            <option value="paid">{t("paid")}</option>
          </Select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("date")}</div>
          <Input
            type="date"
            value={d.date}
            onChange={(e) => setD((p) => ({ ...p, date: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("dueDate")}</div>
          <Input
            type="date"
            value={d.dueDate}
            onChange={(e) => setD((p) => ({ ...p, dueDate: e.target.value }))}
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("amount")}</div>
          <Input
            inputMode="decimal"
            value={d.amount}
            onChange={(e) => setD((p) => ({ ...p, amount: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("paidAmount")}</div>
          <Input
            inputMode="decimal"
            value={d.paidAmount}
            onChange={(e) => setD((p) => ({ ...p, paidAmount: e.target.value }))}
            placeholder="0"
          />
        </label>
      </div>

      <label className="space-y-1">
        <div className="text-sm text-zinc-600">{t("note")}</div>
        <Input
          value={d.note}
          onChange={(e) => setD((p) => ({ ...p, note: e.target.value }))}
          placeholder="-"
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" variant="primary">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

export default function SupplierInvoicesTable({ rows }: { rows: SupplierInvoice[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const {
    addSupplierInvoice,
    updateSupplierInvoice,
    deleteSupplierInvoice,
    setSupplierStatus
  } = useAppStore();

  const [openAdd, setOpenAdd] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const editRow = rows.find((r) => r.id === editId) || null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const addInitial: Draft = {
    supplier: "",
    invoiceNo: "",
    date: todayStr,
    dueDate: todayStr,
    amount: "",
    status: "unpaid",
    paidAmount: "",
    note: ""
  };

  const editInitial: Draft = editRow
    ? {
        supplier: editRow.supplier,
        invoiceNo: editRow.invoiceNo,
        date: editRow.date,
        dueDate: editRow.dueDate,
        amount: String(editRow.amount),
        status: editRow.status,
        paidAmount: editRow.paidAmount ? String(editRow.paidAmount) : "",
        note: editRow.note ?? ""
      }
    : addInitial;

  function submit(d: Draft, mode: "add" | "edit") {
    const amount = safeParseAmount(d.amount);
    if (amount === null) return;
    const paidAmount =
      d.paidAmount.trim() === "" ? undefined : safeParseAmount(d.paidAmount);

    const payload: Omit<SupplierInvoice, "id"> = {
      supplier: d.supplier.trim(),
      invoiceNo: d.invoiceNo.trim(),
      date: d.date,
      dueDate: d.dueDate,
      amount,
      status: d.status,
      paidAmount:
        d.status === "unpaid"
          ? undefined
          : d.status === "paid"
            ? amount
            : paidAmount ?? 0,
      note: d.note.trim() || undefined
    };

    if (mode === "add") {
      addSupplierInvoice(payload);
      setOpenAdd(false);
    } else if (mode === "edit" && editId) {
      updateSupplierInvoice(editId, payload);
      setEditId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">{t("supplierInvoices")}</div>
        <Button variant="primary" onClick={() => setOpenAdd(true)}>
          {t("addSupplierInvoice")}
        </Button>
      </div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("supplier")}</th>
              <th className={thCls}>{t("invoiceNo")}</th>
              <th className={thCls}>{t("date")}</th>
              <th className={thCls}>{t("dueDate")}</th>
              <th className={thCls}>{t("status")}</th>
              <th className={thEndCls}>{t("paidAmount")}</th>
              <th className={thEndCls}>{t("amount")}</th>
              <th className={thEndCls}></th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={trBodyCls}>
                <td className={tdCls}>{r.supplier}</td>
                <td className={tdCls}>{r.invoiceNo}</td>
                <td className={tdCls}>{r.date}</td>
                <td className={tdCls}>{r.dueDate}</td>
                <td className={tdCls}>
                  <StatusPill status={r.status} />
                </td>
                <td className={`${tdEndCls} font-medium`}>
                  {r.paidAmount == null ? "-" : formatMoney(r.paidAmount, locale)}
                </td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.amount, locale)}
                </td>
                <td className={tdEndCls}>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button onClick={() => setEditId(r.id)}>{t("edit")}</Button>
                    <Button
                      onClick={() => setSupplierStatus(r.id, "paid")}
                    >
                      {t("markPaid")}
                    </Button>
                    <Button
                      onClick={() => setSupplierStatus(r.id, "partial")}
                    >
                      {t("markPartial")}
                    </Button>
                    <Button
                      onClick={() => setSupplierStatus(r.id, "unpaid")}
                    >
                      {t("markUnpaid")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) deleteSupplierInvoice(r.id);
                      }}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={8}>
                  {t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableShell>

      <Modal
        title={t("addSupplierInvoice")}
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setOpenAdd(false)}>{t("cancel")}</Button>
          </div>
        }
      >
        <InvoiceForm initial={addInitial} onSubmit={(d) => submit(d, "add")} />
      </Modal>

      <Modal
        title={t("edit")}
        open={!!editId}
        onClose={() => setEditId(null)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setEditId(null)}>{t("cancel")}</Button>
          </div>
        }
      >
        <InvoiceForm initial={editInitial} onSubmit={(d) => submit(d, "edit")} />
      </Modal>
    </div>
  );
}
