"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { MoneyEntry, MoneyType, PaidBy } from "@/lib/types";
import { formatMoney, safeParseAmount } from "@/lib/utils";
import Button from "./Button";
import Modal from "./Modal";
import Input from "./Input";
import Select from "./Select";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";
import { useAppStore } from "./store";

function SelectPaidBy({
  value,
  onChange
}: {
  value: PaidBy;
  onChange: (v: PaidBy) => void;
}) {
  const t = useTranslations();
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as PaidBy)}
    >
      <option value="cash">{t("cash")}</option>
      <option value="card">{t("card")}</option>
      <option value="bank">{t("bank")}</option>
    </Select>
  );
}

type Draft = {
  date: string;
  type: MoneyType;
  category: string;
  note: string;
  amount: string;
  paidBy: PaidBy;

  // Optional: link a Money IN entry to a product sale (auto stock/COGS)
  linkToProductSale: boolean;
  productId: string;
  qty: string;
};

function EntryForm({
  initial,
  onSubmit,
  products = []
}: {
  initial: Draft;
  onSubmit: (d: Draft) => void;
  products: { id: string; name: string; price: number; active: boolean }[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [d, setD] = React.useState<Draft>(initial);

  const hint =
    d.type === "out" ? t("categoryExamplesOut") : t("categoryExamplesIn");

  const activeProducts = products.filter((p) => p.active);
  const selectedProduct = activeProducts.find((p) => p.id === d.productId) || null;
  const qtyNum = safeParseAmount(d.qty) ?? 0;
  const computedAmount = selectedProduct ? qtyNum * selectedProduct.price : 0;

  React.useEffect(() => {
    if (d.linkToProductSale && d.type === "in") {
      // Force category to Sales and amount based on selection
      setD((p) => ({
        ...p,
        category: "Sales",
        amount: String(computedAmount)
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.linkToProductSale, d.type, d.productId, d.qty]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(d);
      }}
    >
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
          <div className="text-sm text-zinc-600">{t("type")}</div>
          <Select
            value={d.type}
            onChange={(e) =>
              setD((p) => ({ ...p, type: e.target.value as MoneyType }))
            }
          >
            <option value="in">{t("in")}</option>
            <option value="out">{t("out")}</option>
          </Select>
        </label>
      </div>

      <label className="space-y-1">
        <div className="text-sm text-zinc-600">{t("category")}</div>
        <Input
          value={d.category}
          onChange={(e) => setD((p) => ({ ...p, category: e.target.value }))}
          placeholder={hint}
          required
        />
      </label>

{d.type === "in" && (
  <div className="rounded-xl border bg-zinc-50 p-3">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={d.linkToProductSale}
        onChange={(e) => {
          const checked = e.target.checked;
          setD((p) => ({
            ...p,
            linkToProductSale: checked,
            productId: checked ? (p.productId || activeProducts[0]?.id || "") : "",
            qty: checked ? (p.qty || "1") : p.qty
          }));
        }}
      />
      <span className="text-sm font-medium">{t("linkToProductSale")}</span>
    </label>

    {d.linkToProductSale && (
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("product")}</div>
          <Select
            value={d.productId}
            onChange={(e) => setD((p) => ({ ...p, productId: e.target.value }))}
          >
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("qty")}</div>
          <Input
            inputMode="decimal"
            value={d.qty}
            onChange={(e) => setD((p) => ({ ...p, qty: e.target.value }))}
            placeholder="1"
          />
        </label>

        <div className="sm:col-span-2 text-sm text-zinc-600">
          {t("autoAmount")}{" "}
          <span className="font-medium text-zinc-900">
            {formatMoney(computedAmount, locale)}
          </span>
        </div>
      </div>
    )}
  </div>
)}

      <label className="space-y-1">
        <div className="text-sm text-zinc-600">{t("note")}</div>
        <Input
          value={d.note}
          onChange={(e) => setD((p) => ({ ...p, note: e.target.value }))}
          placeholder="-"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("amount")}</div>
          <Input
            inputMode="decimal"
            value={d.amount}
            onChange={(e) => setD((p) => ({ ...p, amount: e.target.value }))}
            placeholder="0"
            required
            disabled={d.linkToProductSale && d.type === "in"}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("paidBy")}</div>
          <SelectPaidBy value={d.paidBy} onChange={(v) => setD((p) => ({ ...p, paidBy: v }))} />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" variant="primary">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

export default function EntriesTable({
  title,
  entries
}: {
  title: string;
  entries: MoneyEntry[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { addEntry, updateEntry, deleteEntry, products, createQuickSale } = useAppStore();

  const [openAdd, setOpenAdd] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const editEntry = entries.find((e) => e.id === editId) || null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const addInitial: Draft = {
    date: todayStr,
    type: "out",
    category: "",
    note: "",
    amount: "",
    paidBy: "cash",
    linkToProductSale: false,
    productId: "",
    qty: "1"
  };

  const editInitial: Draft = editEntry
    ? {
        date: editEntry.date,
        type: editEntry.type,
        category: editEntry.category,
        note: editEntry.note ?? "",
        amount: String(editEntry.amount),
        paidBy: editEntry.paidBy,
        linkToProductSale: false,
        productId: "",
        qty: "1"
      }
    : addInitial;

  function submitDraft(d: Draft, mode: "add" | "edit") {
    const amount = safeParseAmount(d.amount);
    if (amount === null) return;

    const payload = {
      date: d.date,
      type: d.type,
      category: d.category.trim(),
      note: d.note.trim() || undefined,
      amount,
      paidBy: d.paidBy
    };

    if (mode === "add") {
      if (d.type === "in" && d.linkToProductSale) {
        const qty = safeParseAmount(d.qty) ?? 0;
        if (d.productId && qty > 0) {
          createQuickSale({ date: d.date, paidBy: d.paidBy, lines: [{ productId: d.productId, qty }] });
          setOpenAdd(false);
          return;
        }
      }

      addEntry(payload);
      setOpenAdd(false);
    } else if (mode === "edit" && editId) {
      updateEntry(editId, payload);
      setEditId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">{title}</div>
        <Button variant="primary" onClick={() => setOpenAdd(true)}>
          {t("addEntry")}
        </Button>
      </div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("date")}</th>
              <th className={thCls}>{t("type")}</th>
              <th className={thCls}>{t("category")}</th>
              <th className={thCls}>{t("note")}</th>
              <th className={thCls}>{t("paidBy")}</th>
              <th className={thEndCls}>{t("amount")}</th>
              <th className={thEndCls}></th>
            </tr>
          </THead>
          <tbody>
            {entries.map((r) => (
              <tr key={r.id} className={trBodyCls}>
                <td className={tdCls}>{r.date}</td>
                <td className={tdCls}>
                  {r.type === "in" ? t("in") : t("out")}
                </td>
                <td className={tdCls}>{r.category}</td>
                <td className={`${tdCls} text-zinc-600`}>{r.note ?? "-"}</td>
                <td className={tdCls}>{t(r.paidBy)}</td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.amount, locale)}
                </td>
                <td className={tdEndCls}>
                  <div className="inline-flex gap-2">
                    <Button onClick={() => setEditId(r.id)}>{t("edit")}</Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) deleteEntry(r.id);
                      }}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {entries.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={7}>
                  {t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableShell>

      <Modal
        title={t("addEntry")}
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setOpenAdd(false)}>{t("cancel")}</Button>
          </div>
        }
      >
        <EntryForm initial={addInitial} products={products} onSubmit={(d) => submitDraft(d, "add")} />
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
        <EntryForm initial={editInitial} products={products} onSubmit={(d) => submitDraft(d, "edit")} />
      </Modal>
    </div>
  );
}
