"use client";

import { useMemo } from "react";
import { useTranslations } from "@/components/i18n";
import { Ingredient, Product, SalesRecord } from "@/lib/types";
import { formatMoney, getLastNDaysDates, maxIsoDate } from "@/lib/utils";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";

function Badge({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export default function AlertsPanel({
  products,
  ingredients,
  salesRecords
}: {
  products: Product[];
  ingredients: Ingredient[];
  salesRecords: SalesRecord[];
}) {
  const t = useTranslations();

  const { lowProducts, lowIngredients, refDate } = useMemo(() => {
    const dates = salesRecords.map((s) => s.date);
    const ref = maxIsoDate(dates) || new Date().toISOString().slice(0, 10);
    const last7 = new Set(getLastNDaysDates(ref, 7));

    const sold7: Record<string, number> = {};
    for (const s of salesRecords) {
      if (!last7.has(s.date)) continue;
      for (const l of s.lines) {
        sold7[l.productId] = (sold7[l.productId] ?? 0) + l.qty;
      }
    }

    const lowProducts = products
      .filter((p) => p.active)
      .map((p) => {
        const sold = sold7[p.id] ?? 0;

        const td = p.targetDailyAvgQty ?? 0;
        const tm = p.targetMonthlyQty ?? 0;

        // expected weekly based on targets
        const expectedWeekly =
          td > 0 ? td * 7 : tm > 0 ? (tm / 30) * 7 : 0;

        const enabled = expectedWeekly > 0;
        const isLow = enabled && sold < expectedWeekly;

        return {
          id: p.id,
          name: p.name,
          sold,
          expectedWeekly,
          enabled,
          isLow
        };
      })
      .filter((x) => x.isLow)
      .sort((a, b) => (b.expectedWeekly - b.sold) - (a.expectedWeekly - a.sold));

    const lowIngredients = ingredients
      .filter((i) => i.active)
      .map((i) => {
        const min = i.minStockQty ?? 0;
        const enabled = min > 0;
        const isLow = enabled && i.stockQty <= min;
        return { id: i.id, name: i.name, stockQty: i.stockQty, minStockQty: min, enabled, isLow, unit: i.unit };
      })
      .filter((x) => x.isLow)
      .sort((a, b) => (a.stockQty - a.minStockQty) - (b.stockQty - b.minStockQty));

    return { lowProducts, lowIngredients, refDate: ref };
  }, [products, ingredients, salesRecords]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold">{t("alerts")}</div>
            <div className="text-sm text-zinc-600">
              {t("alertsHint")} <span className="font-medium text-zinc-900">{refDate}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm">
              <div className="text-xs text-zinc-600">{t("lowSellingProducts")}</div>
              <div className="text-base font-semibold">{lowProducts.length}</div>
            </div>
            <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm">
              <div className="text-xs text-zinc-600">{t("lowStockIngredients")}</div>
              <div className="text-base font-semibold">{lowIngredients.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-lg font-semibold">{t("lowSellingProducts")}</div>
          <div className="text-sm text-zinc-600">{t("lowSellingHint")}</div>

          <TableShell className="rounded-xl">
            <Table>
              <THead>
                <tr>
                  <th className={thCls}>{t("productName")}</th>
                  <th className={thEndCls}>{t("soldLast7Days")}</th>
                  <th className={thEndCls}>{t("expectedWeekly")}</th>
                  <th className={thCls}>{t("status")}</th>
                </tr>
              </THead>
              <tbody>
                {lowProducts.map((p) => (
                  <tr key={p.id} className={trBodyCls}>
                    <td className={tdCls}>{p.name}</td>
                    <td className={`${tdEndCls} font-medium`}>{p.sold.toFixed(2)}</td>
                    <td className={tdEndCls}>{p.expectedWeekly.toFixed(2)}</td>
                    <td className={tdCls}>
                      <Badge tone="warn">{t("statusLow")}</Badge>
                    </td>
                  </tr>
                ))}
                {lowProducts.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                      {t("noAlerts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableShell>
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-lg font-semibold">{t("lowStockIngredients")}</div>
          <div className="text-sm text-zinc-600">{t("lowStockHint")}</div>

          <TableShell className="rounded-xl">
            <Table>
              <THead>
                <tr>
                  <th className={thCls}>{t("ingredient")}</th>
                  <th className={thEndCls}>{t("stock")}</th>
                  <th className={thEndCls}>{t("minStock")}</th>
                  <th className={thCls}>{t("status")}</th>
                </tr>
              </THead>
              <tbody>
                {lowIngredients.map((i) => (
                  <tr key={i.id} className={trBodyCls}>
                    <td className={tdCls}>{i.name}</td>
                    <td className={`${tdEndCls} font-medium`}>
                      {i.stockQty.toFixed(2)} {i.unit}
                    </td>
                    <td className={tdEndCls}>
                      {i.minStockQty.toFixed(2)} {i.unit}
                    </td>
                    <td className={tdCls}>
                      <Badge tone="warn">{t("statusLow")}</Badge>
                    </td>
                  </tr>
                ))}
                {lowIngredients.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                      {t("noAlerts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableShell>

          <div className="text-xs text-zinc-500">
            {t("alertsNote")}
          </div>
        </div>
      </div>
    </div>
  );
}
