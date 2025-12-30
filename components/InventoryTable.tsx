"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { Ingredient, Unit, PaidBy } from "@/lib/types";
import { formatMoney, safeParseAmount } from "@/lib/utils";
import { downloadIngredientsTemplate } from "@/lib/excel-templates";
import { toast } from "@/lib/toast";
import Button from "./Button";
import Modal from "./Modal";
import { useAppStore } from "./store";
import Input from "./Input";
import Select from "./Select";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";

const units: Unit[] = ["kg", "g", "l", "ml", "pcs"];

type Draft = {
  name: string;
  unit: Unit;
  stockQty: string;
  costPerUnit: string;
  active: boolean;
  minStockQty: string;
  costingMethod: "avg" | "fifo";
};

type ReceiveDraft = {
  date: string;
  ingredientId: string;
  qty: string;
  costTotal: string;
  paidBy: PaidBy;
  note: string;
  createExpenseEntry: boolean;
  updateCostAverage: boolean;
};

type AdjustDraft = {
  date: string;
  ingredientId: string;
  qty: string;
  note: string;
};

function IngredientForm({
  initial,
  onSubmit,
}: {
  initial: Draft;
  onSubmit: (d: Draft) => void;
}) {
  const t = useTranslations();
  const [d, setD] = React.useState<Draft>(initial);

  React.useEffect(() => {
    setD(initial);
  }, [initial]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(d);
      }}
    >
      <label className="space-y-1">
        <div className="text-sm text-zinc-600">{t("ingredientName")}</div>
        <Input
          value={d.name}
          onChange={(e) => setD((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("unit")}</div>
          <Select
            value={d.unit}
            onChange={(e) => setD((p) => ({ ...p, unit: e.target.value as Unit }))}
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {t(`unit_${u}`)}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("costPerUnit")}</div>
          <Input
            inputMode="decimal"
            value={d.costPerUnit}
            onChange={(e) => setD((p) => ({ ...p, costPerUnit: e.target.value }))}
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("minStockQty")}</div>
          <Input
            inputMode="decimal"
            value={d.minStockQty}
            onChange={(e) => setD((p) => ({ ...p, minStockQty: e.target.value }))}
            placeholder="0"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("costingMethod")}</div>
          <Select
            value={d.costingMethod}
            onChange={(e) =>
              setD((p) => ({ ...p, costingMethod: e.target.value as "avg" | "fifo" }))
            }
          >
            <option value="avg">{t("avgCosting")}</option>
            <option value="fifo">{t("fifoCosting")}</option>
          </Select>
        </label>
      </div>

      <label className="space-y-1">
        <div className="text-sm text-zinc-600">{t("stockQty")}</div>
        <Input
          inputMode="decimal"
          value={d.stockQty}
          onChange={(e) => setD((p) => ({ ...p, stockQty: e.target.value }))}
          required
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={d.active}
          onChange={(e) => setD((p) => ({ ...p, active: e.target.checked }))}
        />
        <span className="text-sm">{t("active")}</span>
      </label>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" variant="primary">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

export default function InventoryTable({ rows }: { rows: Ingredient[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const { addIngredient, updateIngredient, deleteIngredient, receiveStock, adjustStockOut, importIngredientsExcel } = useAppStore();

  const importRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = React.useState(false);

  const [openAdd, setOpenAdd] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const [openReceive, setOpenReceive] = React.useState(false);
  const [openAdjust, setOpenAdjust] = React.useState(false);


  const editRow = rows.find((r) => r.id === editId) || null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const addInitial: Draft = {
    name: "",
    unit: "kg",
    stockQty: "0",
    costPerUnit: "0",
    active: true,
    minStockQty: "0",
    costingMethod: "avg"
  };
  const editInitial: Draft = editRow
    ? {
        name: editRow.name,
        unit: editRow.unit,
        stockQty: String(editRow.stockQty),
        costPerUnit: String(editRow.costPerUnit),
        active: editRow.active,
        minStockQty: String(editRow.minStockQty ?? 0),
        costingMethod: (editRow.costingMethod ?? "avg") as "avg" | "fifo"
      }
    : addInitial;

  function submitIngredient(d: Draft, mode: "add" | "edit") {
    const stockQty = safeParseAmount(d.stockQty);
    const costPerUnit = safeParseAmount(d.costPerUnit);
    const minStock = safeParseAmount(d.minStockQty) ?? 0;
    if (stockQty == null || costPerUnit == null) return;

    const payload = {
      name: d.name.trim(),
      unit: d.unit,
      stockQty,
      costPerUnit,
      active: d.active,
      minStockQty: minStock,
      costingMethod: d.costingMethod
    };

    if (mode === "add") {
      addIngredient(payload);
      setOpenAdd(false);
    } else if (mode === "edit" && editId) {
      updateIngredient(editId, payload);
      setEditId(null);
    }
  }

  // Receive / adjust drafts
  const [receiveDraft, setReceiveDraft] = React.useState<ReceiveDraft>({
    date: todayStr,
    ingredientId: rows[0]?.id ?? "",
    qty: "1",
    costTotal: "0",
    paidBy: "cash",
    note: "",
    createExpenseEntry: true,
    updateCostAverage: true
  });

  const [adjustDraft, setAdjustDraft] = React.useState<AdjustDraft>({
    date: todayStr,
    ingredientId: rows[0]?.id ?? "",
    qty: "1",
    note: t("spoilage")
  });

  React.useEffect(() => {
    if (!receiveDraft.ingredientId && rows[0]?.id) {
      setReceiveDraft((p) => ({ ...p, ingredientId: rows[0].id }));
    }
    if (!adjustDraft.ingredientId && rows[0]?.id) {
      setAdjustDraft((p) => ({ ...p, ingredientId: rows[0].id }));
    }
  }, [rows, receiveDraft.ingredientId, adjustDraft.ingredientId]);

  function submitReceive() {
    const qty = safeParseAmount(receiveDraft.qty);
    const costTotal = safeParseAmount(receiveDraft.costTotal);
    if (qty == null || costTotal == null) return;
    if (!receiveDraft.ingredientId) return;

    receiveStock({
      date: receiveDraft.date,
      ingredientId: receiveDraft.ingredientId,
      qty,
      costTotal,
      paidBy: receiveDraft.paidBy,
      createExpenseEntry: receiveDraft.createExpenseEntry,
      updateCostAverage: receiveDraft.updateCostAverage,
      note: receiveDraft.note.trim() || undefined
    });

    setOpenReceive(false);
  }

  function submitAdjust() {
    const qty = safeParseAmount(adjustDraft.qty);
    if (qty == null) return;
    if (!adjustDraft.ingredientId) return;

    adjustStockOut({
      date: adjustDraft.date,
      ingredientId: adjustDraft.ingredientId,
      qty,
      note: adjustDraft.note.trim() || undefined
    });

    setOpenAdjust(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">{t("inventory")}</div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadIngredientsTemplate}>
            {t("downloadTemplate")}
          </Button>
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
                await importIngredientsExcel(file);
                toast.success(t("importDone"));
              } catch {
                toast.error(t("importFailed"));
              } finally {
                setImporting(false);
                e.target.value = "";
              }
            }}
          />

          <Button
            onClick={() => importRef.current?.click()}
            disabled={importing}
          >
            {importing ? t("importing") : t("importExcel")}
          </Button>
          <Button onClick={() => setOpenReceive(true)}>{t("receiveStock")}</Button>
          <Button onClick={() => setOpenAdjust(true)}>{t("adjustStockOut")}</Button>
          <Button variant="primary" onClick={() => setOpenAdd(true)}>
            {t("addIngredient")}
          </Button>
        </div>
      </div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("ingredientName")}</th>
              <th className={thCls}>{t("unit")}</th>
              <th className={thEndCls}>{t("stockQty")}</th>
              <th className={thEndCls}>{t("costPerUnit")}</th>
              <th className={thCls}>{t("active")}</th>
              <th className={thEndCls}></th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={trBodyCls}>
                <td className={tdCls}>{r.name}</td>
                <td className={tdCls}>{t(`unit_${r.unit}`)}</td>
                <td className={`${tdEndCls} font-medium`}>
                  {r.stockQty.toFixed(3)}
                </td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.costPerUnit, locale)}
                </td>
                <td className={tdCls}>{r.active ? t("yes") : t("no")}</td>
                <td className={tdEndCls}>
                  <div className="inline-flex gap-2">
                    <Button onClick={() => setEditId(r.id)}>{t("edit")}</Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) deleteIngredient(r.id);
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
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={6}>
                  {t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableShell>

      {/* Add */}
      <Modal
        title={t("addIngredient")}
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setOpenAdd(false)}>{t("cancel")}</Button>
          </div>
        }
      >
        <IngredientForm initial={addInitial} onSubmit={(d) => submitIngredient(d, "add")} />
      </Modal>

      {/* Edit */}
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
        <IngredientForm initial={editInitial} onSubmit={(d) => submitIngredient(d, "edit")} />
      </Modal>

      {/* Receive stock */}
      <Modal
        title={t("receiveStock")}
        open={openReceive}
        onClose={() => setOpenReceive(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpenReceive(false)}>{t("cancel")}</Button>
            <Button variant="primary" onClick={submitReceive}>{t("save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("date")}</div>
              <Input
                type="date"
                value={receiveDraft.date}
                onChange={(e) => setReceiveDraft((p) => ({ ...p, date: e.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("ingredientName")}</div>
              <Select
                value={receiveDraft.ingredientId}
                onChange={(e) => setReceiveDraft((p) => ({ ...p, ingredientId: e.target.value }))}
              >
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("qty")}</div>
              <Input
                inputMode="decimal"
                value={receiveDraft.qty}
                onChange={(e) => setReceiveDraft((p) => ({ ...p, qty: e.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("costTotal")}</div>
              <Input
                inputMode="decimal"
                value={receiveDraft.costTotal}
                onChange={(e) => setReceiveDraft((p) => ({ ...p, costTotal: e.target.value }))}
              />
            </label>
          </div>

          <label className="space-y-1">
            <div className="text-sm text-zinc-600">{t("paidBy")}</div>
            <Select
              value={receiveDraft.paidBy}
              onChange={(e) => setReceiveDraft((p) => ({ ...p, paidBy: e.target.value as PaidBy }))}
            >
              <option value="cash">{t("cash")}</option>
              <option value="card">{t("card")}</option>
              <option value="bank">{t("bank")}</option>
            </Select>
          </label>

          <label className="space-y-1">
            <div className="text-sm text-zinc-600">{t("note")}</div>
            <Input
              value={receiveDraft.note}
              onChange={(e) => setReceiveDraft((p) => ({ ...p, note: e.target.value }))}
              placeholder="-"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={receiveDraft.createExpenseEntry}
              onChange={(e) => setReceiveDraft((p) => ({ ...p, createExpenseEntry: e.target.checked }))}
            />
            <span className="text-sm">{t("createExpenseEntry")}</span>
          </label>
        </div>
      </Modal>

      {/* Adjust stock out */}
      <Modal
        title={t("adjustStockOut")}
        open={openAdjust}
        onClose={() => setOpenAdjust(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpenAdjust(false)}>{t("cancel")}</Button>
            <Button variant="primary" onClick={submitAdjust}>{t("save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("date")}</div>
              <Input
                type="date"
                value={adjustDraft.date}
                onChange={(e) => setAdjustDraft((p) => ({ ...p, date: e.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("ingredientName")}</div>
              <Select
                value={adjustDraft.ingredientId}
                onChange={(e) => setAdjustDraft((p) => ({ ...p, ingredientId: e.target.value }))}
              >
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("qty")}</div>
              <Input
                inputMode="decimal"
                value={adjustDraft.qty}
                onChange={(e) => setAdjustDraft((p) => ({ ...p, qty: e.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-zinc-600">{t("note")}</div>
              <Input
                value={adjustDraft.note}
                onChange={(e) => setAdjustDraft((p) => ({ ...p, note: e.target.value }))}
                placeholder={t("spoilage")}
              />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
