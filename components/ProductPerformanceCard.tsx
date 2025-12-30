"use client";

import { useMemo } from "react";
import { useTranslations } from "@/components/i18n";
import { Product, SalesRecord } from "@/lib/types";
import { getMonthKey } from "@/lib/utils";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";

type Row = {
  productId: string;
  name: string;
  sold: number;
  days: number;
  avgPerDay: number;
  targetDaily: number;
  targetMonthly: number;
  status: "ok" | "low" | "off";
};

export default function ProductPerformanceCard({
  products,
  sales,
  month
}: {
  products: Product[];
  sales: SalesRecord[];
  month: string | "all";
}) {
  const t = useTranslations();

  const rows = useMemo(() => {
    const filtered = month === "all" ? sales : sales.filter((s) => getMonthKey(s.date) === month);

    const soldByProduct: Record<string, number> = {};
    const daysSet = new Set<string>();

    for (const s of filtered) {
      daysSet.add(s.date);
      for (const l of s.lines) {
        soldByProduct[l.productId] = (soldByProduct[l.productId] ?? 0) + l.qty;
      }
    }

    const days = Math.max(1, daysSet.size);

    const result: Row[] = products.map((p) => {
      const sold = soldByProduct[p.id] ?? 0;
      const avgPerDay = sold / days;

      const targetDaily = p.targetDailyAvgQty ?? 0;
      const targetMonthly = p.targetMonthlyQty ?? 0;

      const enabled = (targetDaily > 0) || (targetMonthly > 0);

      const low =
        (targetMonthly > 0 && sold < targetMonthly) ||
        (targetDaily > 0 && avgPerDay < targetDaily);

      const status: Row["status"] = enabled ? (low ? "low" : "ok") : "off";

      return {
        productId: p.id,
        name: p.name,
        sold,
        days,
        avgPerDay,
        targetDaily,
        targetMonthly,
        status
      };
    });

    // sort: low first, then by biggest shortfall
    return result.sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === "low") return -1;
        if (b.status === "low") return 1;
        if (a.status === "ok") return -1;
        if (b.status === "ok") return 1;
      }
      const aShort = Math.max(0, a.targetMonthly - a.sold);
      const bShort = Math.max(0, b.targetMonthly - b.sold);
      return bShort - aShort;
    });
  }, [products, sales, month]);

  function badge(status: Row["status"]) {
    if (status === "off")
      return <span className="rounded-full border bg-white px-2 py-0.5 text-xs text-zinc-600">{t("thresholdOff")}</span>;
    if (status === "ok")
      return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{t("statusOk")}</span>;
    return <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700">{t("statusLow")}</span>;
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{t("productPerformance")}</div>
          <div className="text-sm text-zinc-600">{t("productPerformanceHint")}</div>
        </div>
      </div>

      <TableShell className="rounded-xl">
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("productName")}</th>
              <th className={thEndCls}>{t("soldQty")}</th>
              <th className={thEndCls}>{t("avgPerDay")}</th>
              <th className={thEndCls}>{t("targetDailyAvgQty")}</th>
              <th className={thEndCls}>{t("targetMonthlyQty")}</th>
              <th className={thCls}>{t("status")}</th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.productId} className={trBodyCls}>
                <td className={tdCls}>{r.name}</td>
                <td className={`${tdEndCls} font-medium`}>{r.sold.toFixed(2)}</td>
                <td className={tdEndCls}>{r.avgPerDay.toFixed(2)}</td>
                <td className={tdEndCls}>{r.targetDaily.toFixed(2)}</td>
                <td className={tdEndCls}>{r.targetMonthly.toFixed(2)}</td>
                <td className={tdCls}>{badge(r.status)}</td>
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
    </div>
  );
}
