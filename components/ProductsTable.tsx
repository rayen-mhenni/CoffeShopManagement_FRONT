"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { Product, ProductCategory } from "@/lib/types";
import { formatMoney, safeParseAmount } from "@/lib/utils";
import { API_ORIGIN } from "@/lib/api";
import { parseExcelFile } from "@/lib/excel";
import { downloadProductsTemplate } from "@/lib/excel-templates";
import Button from "./Button";
import Modal from "./Modal";
import { useAppStore } from "./store";
import Input from "./Input";
import Select from "./Select";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";

const categories: ProductCategory[] = [
  "Coffee",
  "Pizza",
  "Croissant",
  "Sandwich",
  "Drink",
  "Dessert",
  "Other",
];

type Draft = {
  name: string;
  category: ProductCategory;
  price: string;
  active: boolean;
  targetDailyAvgQty: string;
  targetMonthlyQty: string;
};

function ProductForm({
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
        <div className="text-sm text-zinc-600">{t("productName")}</div>
        <Input
          value={d.name}
          onChange={(e) => setD((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("category")}</div>
          <Select
            value={d.category}
            onChange={(e) =>
              setD((p) => ({ ...p, category: e.target.value as ProductCategory }))
            }
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(`cat_${c}`)}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("price")}</div>
          <Input
            inputMode="decimal"
            value={d.price}
            onChange={(e) => setD((p) => ({ ...p, price: e.target.value }))}
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("targetDailyAvgQty")}</div>
          <Input
            inputMode="decimal"
            value={d.targetDailyAvgQty}
            onChange={(e) =>
              setD((p) => ({ ...p, targetDailyAvgQty: e.target.value }))
            }
            placeholder="0"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-zinc-600">{t("targetMonthlyQty")}</div>
          <Input
            inputMode="decimal"
            value={d.targetMonthlyQty}
            onChange={(e) =>
              setD((p) => ({ ...p, targetMonthlyQty: e.target.value }))
            }
            placeholder="0"
          />
        </label>
      </div>

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

function ImageCell({
  imageUrl,
  name,
}: {
  imageUrl?: string;
  name: string;
}) {
  const src = imageUrl ? `${API_ORIGIN}${imageUrl}` : "";
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-xl border bg-zinc-50">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            —
          </div>
        )}
      </div>
    </div>
  );
}

function pickFirst<T>(...values: any[]): T | undefined {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s !== "") return v as T;
  }
  return undefined;
}

export default function ProductsTable({ rows }: { rows: Product[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const { addProduct, updateProduct, deleteProduct, uploadProductImage, importProducts } =
    useAppStore();

  const [openAdd, setOpenAdd] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = React.useState(false);

  const editRow = rows.find((r) => r.id === editId) || null;

  const addInitial: Draft = {
    name: "",
    category: "Coffee",
    price: "",
    active: true,
    targetDailyAvgQty: "0",
    targetMonthlyQty: "0",
  };

  const editInitial: Draft = editRow
    ? {
        name: editRow.name,
        category: editRow.category,
        price: String(editRow.price),
        active: editRow.active,
        targetDailyAvgQty: String(editRow.targetDailyAvgQty ?? 0),
        targetMonthlyQty: String(editRow.targetMonthlyQty ?? 0),
      }
    : addInitial;

  function submit(d: Draft, mode: "add" | "edit") {
    const price = safeParseAmount(d.price);
    const targetDailyAvgQty = safeParseAmount(d.targetDailyAvgQty) ?? 0;
    const targetMonthlyQty = safeParseAmount(d.targetMonthlyQty) ?? 0;
    if (price === null) return;

    const payload = {
      name: d.name.trim(),
      category: d.category,
      price,
      active: d.active,
      targetDailyAvgQty,
      targetMonthlyQty,
    };

    if (mode === "add") {
      addProduct(payload as any);
      setOpenAdd(false);
    } else if (mode === "edit" && editId) {
      updateProduct(editId, payload as any);
      setEditId(null);
    }
  }

  async function onPickImportFile(file: File) {
    setImporting(true);
    try {
      const parsed = await parseExcelFile(file);

      const mapped = parsed
        .map((r) => {
          const name = pickFirst<string>(r.name, r.product, r.productname, r.title);
          const category = pickFirst<string>(r.category, r.cat) ?? "Other";
          const price = pickFirst<any>(r.price, r.amount, r.unitprice, r.sellprice);
          const active = pickFirst<any>(r.active, r.enabled, r.isactive);
          const targetDailyAvgQty = pickFirst<any>(r.targetdailyavgqty, r.dailyavg, r.dailyavgqty);
          const targetMonthlyQty = pickFirst<any>(r.targetmonthlyqty, r.monthlyqty, r.monthqty);

          if (!name) return null;
          const p = safeParseAmount(String(price ?? ""));
          if (p === null) return null;

          const cat = categories.includes(category as any)
            ? (category as ProductCategory)
            : "Other";

          return {
            name: String(name).trim(),
            category: cat,
            price: p,
            active:
              active === undefined
                ? true
                : String(active).toLowerCase() === "false"
                ? false
                : Boolean(active),
            targetDailyAvgQty: safeParseAmount(String(targetDailyAvgQty ?? "")) ?? 0,
            targetMonthlyQty: safeParseAmount(String(targetMonthlyQty ?? "")) ?? 0,
          } as Omit<Product, "id">;
        })
        .filter(Boolean) as Omit<Product, "id">[];

      if (!mapped.length) {
        alert(t("importNoRows"));
        return;
      }

      await importProducts(mapped);
      alert(t("importDone"));
    } catch (e: any) {
      alert(e?.message || t("importFailed"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">{t("products")}</div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadProductsTemplate}>
            {t("downloadTemplate")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickImportFile(f);
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? t("importing") : t("importExcel")}
          </Button>
          <Button variant="primary" onClick={() => setOpenAdd(true)}>
            {t("addProduct")}
          </Button>
        </div>
      </div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("image")}</th>
              <th className={thCls}>{t("productName")}</th>
              <th className={thCls}>{t("category")}</th>
              <th className={thEndCls}>{t("price")}</th>
              <th className={thCls}>{t("active")}</th>
              <th className={thEndCls}></th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={trBodyCls}>
                <td className={tdCls}>
                  <div className="flex items-center gap-2">
                    <ImageCell imageUrl={r.imageUrl} name={r.name} />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          uploadProductImage(r.id, f);
                          e.target.value = "";
                        }}
                      />
                      <span className="text-xs font-medium text-[var(--brand)] hover:underline">
                        {t("uploadImage")}
                      </span>
                    </label>
                  </div>
                </td>
                <td className={tdCls}>{r.name}</td>
                <td className={tdCls}>{t(`cat_${r.category}`)}</td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.price, locale)}
                </td>
                <td className={tdCls}>{r.active ? t("yes") : t("no")}</td>
                <td className={tdEndCls}>
                  <div className="inline-flex gap-2">
                    <Button onClick={() => setEditId(r.id)}>{t("edit")}</Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) deleteProduct(r.id);
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

      <Modal
        title={t("addProduct")}
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setOpenAdd(false)}>{t("cancel")}</Button>
          </div>
        }
      >
        <ProductForm initial={addInitial} onSubmit={(d) => submit(d, "add")} />
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
        <ProductForm initial={editInitial} onSubmit={(d) => submit(d, "edit")} />
      </Modal>
    </div>
  );
}
