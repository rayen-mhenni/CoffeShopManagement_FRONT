"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { Ingredient, Product, RecipeLine } from "@/lib/types";
import { formatMoney, safeParseAmount } from "@/lib/utils";
import Button from "./Button";
import Modal from "./Modal";
import Input from "./Input";
import Select from "./Select";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";
import { useAppStore } from "./store";

type DraftLine = { ingredientId: string; qtyPerUnit: string };

export default function RecipesManager({
  products,
  ingredients,
  recipes
}: {
  products: Product[];
  ingredients: Ingredient[];
  recipes: RecipeLine[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { setRecipeForProduct } = useAppStore();

  const [open, setOpen] = React.useState(false);
  const [productId, setProductId] = React.useState<string>("");

  const product = products.find((p) => p.id === productId) || null;
  const current = recipes.filter((r) => r.productId === productId);

  const [lines, setLines] = React.useState<DraftLine[]>([]);

  React.useEffect(() => {
    if (!productId && products[0]?.id) setProductId(products[0].id);
  }, [products, productId]);

  React.useEffect(() => {
    setLines(
      current.map((c) => ({ ingredientId: c.ingredientId, qtyPerUnit: String(c.qtyPerUnit) }))
    );
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // If a line was added while ingredients were still loading (or inventory is empty),
  // its ingredientId can be "". Once ingredients are available, auto-pick the first one
  // so the select doesn't appear empty.
  React.useEffect(() => {
    if (!ingredients.length) return;
    setLines((prev) =>
      prev.map((l) => (l.ingredientId ? l : { ...l, ingredientId: ingredients[0].id }))
    );
  }, [ingredients]);

  function addLine() {
    setLines((prev) => [...prev, { ingredientId: ingredients[0]?.id ?? "", qtyPerUnit: "0" }]);
  }

  function updateLine(i: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    const normalized = lines
      .map((l) => ({
        ingredientId: l.ingredientId,
        qtyPerUnit: safeParseAmount(l.qtyPerUnit)
      }))
      .filter(
        (x): x is { ingredientId: string; qtyPerUnit: number } =>
          !!x.ingredientId && x.qtyPerUnit != null && x.qtyPerUnit > 0
      );

    if (!productId) return;
    setRecipeForProduct(productId, normalized);
    setOpen(false);
  }

  // Cost preview per unit
  const costPerUnit = React.useMemo(() => {
    if (!productId) return 0;
    const ingMap = new Map(ingredients.map((i) => [i.id, i]));
    return recipes
      .filter((r) => r.productId === productId)
      .reduce((acc, r) => {
        const ing = ingMap.get(r.ingredientId);
        if (!ing) return acc;
        return acc + r.qtyPerUnit * ing.costPerUnit;
      }, 0);
  }, [productId, recipes, ingredients]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">{t("recipes")}</div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          {t("editRecipe")}
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm text-zinc-600">{t("productName")}</div>
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} • {formatMoney(p.price, locale)}
                </option>
              ))}
            </Select>
          </label>

          <div className="space-y-1">
            <div className="text-sm text-zinc-600">{t("recipeCostPerUnit")}</div>
            <div className="rounded-lg border bg-zinc-50 px-3 py-2 text-sm font-medium">
              {formatMoney(costPerUnit, locale)}
            </div>
          </div>
        </div>

        <TableShell className="mt-4 rounded-xl">
          <Table>
            <THead>
              <tr>
                <th className={thCls}>{t("ingredientName")}</th>
                <th className={thEndCls}>{t("qtyPerUnit")}</th>
              </tr>
            </THead>
            <tbody>
              {current.map((r) => {
                const ing = ingredients.find((i) => i.id === r.ingredientId);
                return (
                  <tr key={r.id} className={trBodyCls}>
                    <td className={tdCls}>{ing?.name ?? "-"}</td>
                    <td className={`${tdEndCls} font-medium`}>
                      {r.qtyPerUnit} {ing ? t(`unit_${ing.unit}`) : ""}
                    </td>
                  </tr>
                );
              })}
              {current.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={2}>
                    {t("noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableShell>
      </div>

      <Modal
        title={t("editRecipe")}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button variant="primary" onClick={save}>{t("save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="space-y-1">
            <div className="text-sm text-zinc-600">{t("productName")}</div>
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="space-y-2">
            {ingredients.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="font-medium">No ingredients found</div>
                <div className="mt-1 text-amber-700">
                  Add or import ingredients in <b>Inventory</b> first. Then come back here to build recipes.
                </div>
              </div>
            ) : null}

            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                <Select
                  value={l.ingredientId}
                  onChange={(e) => updateLine(i, { ingredientId: e.target.value })}
                >
                  <option value="" disabled>
                    Select ingredient
                  </option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({t(`unit_${ing.unit}`)}) • {formatMoney(ing.costPerUnit, locale)}
                    </option>
                  ))}
                </Select>

                <Input
                  inputMode="decimal"
                  value={l.qtyPerUnit}
                  onChange={(e) => updateLine(i, { qtyPerUnit: e.target.value })}
                  placeholder={t("qtyPerUnit")}
                />

                <div className="flex gap-2">
                  <Button onClick={addLine} disabled={!ingredients.length}>
                    {t("addLine")}
                  </Button>
                  {lines.length > 0 ? (
                    <Button variant="danger" onClick={() => removeLine(i)}>
                      {t("remove")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}

            {lines.length === 0 ? (
              <Button onClick={addLine} disabled={!ingredients.length}>
                {t("addLine")}
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
