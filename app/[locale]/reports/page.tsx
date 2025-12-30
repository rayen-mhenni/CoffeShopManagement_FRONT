"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/components/store";

type Overview = {
  range: { from: string; to: string; dayCount: number };
  totals: { revenue: number; cogs: number; profit: number; count: number };
  byDay: { date: string; revenue: number; cogs: number; profit: number }[];
  byProduct: {
    productId: string;
    name: string;
    qty: number;
    revenue: number;
    estimatedCogs: number;
    estimatedProfit: number;
    marginPct: number | null;
    targetDailyQty: number;
    avgDailyQty: number;
    expectedQty: number;
    ratio: number | null;
    status: "ok" | "warn" | "critical";
    underperforming: boolean;
  }[];
  alerts: any[];
  alertsWeekly: any[];
  alertsMonthly: any[];
  rankings: {
    topByRevenue: any[];
    topByProfit: any[];
    worstByProfit: any[];
  };
  beef: null | {
    ingredientId: string;
    ingredientName: string;
    qtyUsed: number;
    cost: number;
    revenueFromBeefProducts: number;
    contribution: number;
  };
  beefSeries: { date: string; qtyUsed: number; cost: number; revenue: number; contribution: number }[];
  beefWeekly: { week: string; qtyUsed: number; cost: number; revenue: number; contribution: number; marginPct: number | null }[];
  lowStock: { ingredientId: string; name: string; unit: string; stockQty: number; minStockQty: number; ratio: number | null; status: "warn" | "critical"; shortage: number }[];
  waste: {
    totalCost: number;
    byDay: { date: string; cost: number; qty: number }[];
    byIngredient: { ingredientId: string; name: string; unit: string; qty: number; cost: number; count: number }[];
  };
};

function exportCsv(filename: string, rows: Record<string, any>[]) {
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = keys.map(escape).join(",");
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(",")).join("\n");
  const csv = [header, body].filter(Boolean).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function firstOfMonthISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const { ingredients } = useAppStore();

  const [from, setFrom] = React.useState(firstOfMonthISO());
  const [to, setTo] = React.useState(todayISO());
  const [alertMode, setAlertMode] = React.useState<"day" | "week" | "month">("day");
  const [beefIngredientId, setBeefIngredientId] = React.useState<string>("");

  React.useEffect(() => {
    // auto-guess beef ingredient once ingredients are loaded (optional feature)
    if (beefIngredientId) return;
    const guess = ingredients.find((i) => {
      const n = String((i as any).name || "");
      return n.toLowerCase().includes("beef") || n.includes("لحم");
    });
    if (guess?.id) setBeefIngredientId(guess.id);
  }, [ingredients, beefIngredientId]);


  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const underperforming = (
    alertMode === "week"
      ? data?.alertsWeekly
      : alertMode === "month"
        ? data?.alertsMonthly
        : data?.alerts
  ) || (data?.byProduct || []).filter((p) => p.underperforming);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<Overview>(
        `/reports/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${
          beefIngredientId ? `&beefIngredientId=${encodeURIComponent(beefIngredientId)}` : ""
        }`,
        { method: "GET" }
      );
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // auto load once
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("reports")}</h1>
          <p className="text-sm text-zinc-600">{t("reportsHint")}</p>
        </div>
  
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <div className="text-xs text-zinc-600">{t("from")}</div>
            <input
              type="date"
              className="rounded-lg border bg-white px-3 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
  
          <label className="space-y-1">
            <div className="text-xs text-zinc-600">{t("to")}</div>
            <input
              type="date"
              className="rounded-lg border bg-white px-3 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
  
          <label className="space-y-1">
            <div className="text-xs text-zinc-600">{t("beefIngredient")}</div>
            <select
              className="rounded-lg border bg-white px-3 py-2 text-sm"
              value={beefIngredientId}
              onChange={(e) => setBeefIngredientId(e.target.value)}
            >
              <option value="">{t("none")}</option>
              {ingredients
                .filter((i) => i.active)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </label>
  
          <button
            onClick={load}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t("loading") : t("refresh")}
          </button>
        </div>
      </div>
  
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
  
      {/* Totals */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-zinc-600">{t("totalRevenue")}</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(data?.totals.revenue || 0)} {t("lyd")}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-zinc-600">{t("totalCogs")}</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(data?.totals.cogs || 0)} {t("lyd")}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-zinc-600">{t("totalProfit")}</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(data?.totals.profit || 0)} {t("lyd")}</div>
        </div>
      </div>
  
      {/* Alerts */}
  <div className="rounded-2xl border bg-white p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm font-semibold">{t("alertsTitle")}</div>
      <div className="text-xs text-zinc-600">{t("alertsHint")}</div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const rows = (underperforming || []).map((a: any) => ({
            product: a.name,
            status: a.status,
            qty: a.qty,
            expected: a.expectedQty,
            ratio: a.ratio ?? "",
            revenue: a.revenue
          }));
          exportCsv(`alerts_${alertMode}_${from}_${to}.csv`, rows);
        }}
        className="rounded-lg border bg-white px-2 py-1 text-xs hover:bg-zinc-50"
        disabled={!underperforming?.length}
      >
        {t("exportCsv")}
      </button>
    </div>
  </div>
  
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-zinc-600">
          <th className="py-2">{t("product")}</th>
          <th className="py-2">{t("status")}</th>
          <th className="py-2">{t("qty")}</th>
          <th className="py-2">{t("expectedQty")}</th>
          <th className="py-2">{t("ratio")}</th>
        </tr>
      </thead>
      <tbody>
        {(underperforming || []).slice(0, 12).map((a: any) => (
          <tr key={a.productId} className="border-t">
            <td className="py-2 font-medium">{a.name}</td>
            <td className="py-2">
              <span
                className={
                  a.status === "critical"
                    ? "inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800"
                    : a.status === "warn"
                      ? "inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                      : "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
                }
              >
                {a.status === "critical" ? t("critical") : a.status === "warn" ? t("warn") : t("ok")}
              </span>
            </td>
            <td className="py-2">{fmt(a.qty)}</td>
            <td className="py-2">{fmt(a.expectedQty)}</td>
            <td className="py-2">{a.ratio == null ? "-" : fmt(a.ratio * 100)}%</td>
          </tr>
        ))}
        {!underperforming?.length && (
          <tr>
            <td className="py-4 text-sm text-zinc-600" colSpan={5}>
              {t("noAlerts")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  </div>
  
  {/* Low stock alerts */}
  <div className="rounded-2xl border bg-white p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm font-semibold">{t("lowStockTitle")}</div>
      <div className="text-xs text-zinc-600">{t("lowStockHint")}</div>
    </div>
  
    <button
      onClick={() => {
        const rows = (data?.lowStock || []).map((a) => ({
          ingredient: a.name,
          status: a.status,
          stock: a.stockQty,
          min: a.minStockQty,
          shortage: a.shortage
        }));
        exportCsv(`low_stock_${from}_${to}.csv`, rows);
      }}
      className="rounded-lg border bg-white px-2 py-1 text-xs hover:bg-zinc-50"
      disabled={!data?.lowStock?.length}
    >
      {t("exportCsv")}
    </button>
  </div>
  
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-zinc-600">
          <th className="py-2">{t("ingredient")}</th>
          <th className="py-2">{t("status")}</th>
          <th className="py-2">{t("stock")}</th>
          <th className="py-2">{t("min")}</th>
          <th className="py-2">{t("shortage")}</th>
        </tr>
      </thead>
      <tbody>
        {(data?.lowStock || []).slice(0, 12).map((a) => (
          <tr key={a.ingredientId} className="border-t">
            <td className="py-2 font-medium">{a.name}</td>
            <td className="py-2">
              <span
                className={
                  a.status === "critical"
                    ? "inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800"
                    : "inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                }
              >
                {a.status === "critical" ? t("critical") : t("warn")}
              </span>
            </td>
            <td className="py-2">{fmt(a.stockQty)} {a.unit}</td>
            <td className="py-2">{fmt(a.minStockQty)} {a.unit}</td>
            <td className="py-2">{fmt(a.shortage)} {a.unit}</td>
          </tr>
        ))}
        {!data?.lowStock?.length && (
          <tr>
            <td className="py-4 text-sm text-zinc-600" colSpan={5}>
              {t("noLowStock")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  </div>
  
  {/* Underperforming */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t("underperformingProducts")}</div>
            <div className="text-xs text-zinc-600">{t("underperformingHint")}</div>
          </div>
          <div className="text-xs text-zinc-600">
            {underperforming.length}/{(data?.byProduct || []).length}
          </div>
        </div>
  
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-600">
                <th className="py-2">{t("product")}</th>
                <th className="py-2">{t("avgDailyQty")}</th>
                <th className="py-2">{t("targetDailyQty")}</th>
                <th className="py-2">{t("expectedQty")}</th>
                <th className="py-2">{t("ratio")}</th>
                <th className="py-2">{t("revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {(underperforming.length ? underperforming : (data?.byProduct || []).slice(0, 8)).map((p) => (
                <tr key={p.productId} className="border-t">
                  <td className="py-2 font-medium">
                    {p.name}
                    {p.underperforming && (
                      <span className="ms-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                        {t("lowSales")}
                      </span>
                    )}
                  </td>
                  <td className="py-2">{fmt(p.avgDailyQty)}</td>
                  <td className="py-2">{fmt(p.targetDailyQty)}</td>
                  <td className="py-2">{fmt(p.expectedQty)}</td>
                  <td className="py-2">{p.ratio == null ? "-" : fmt(p.ratio * 100)}%</td>
                  <td className="py-2">{fmt(p.revenue)} {t("lyd")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  
      {/* Beef analysis */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-semibold">{t("beefAnalysis")}</div>
        <div className="text-xs text-zinc-600">{t("beefHint")}</div>
  
        {!data?.beef ? (
          <div className="mt-3 text-sm text-zinc-600">{t("selectIngredientToAnalyze")}</div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600">{t("ingredient")}</div>
              <div className="mt-1 font-semibold">{data.beef.ingredientName || t("beef")}</div>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600">{t("qtyUsed")}</div>
              <div className="mt-1 font-semibold">{fmt(data.beef.qtyUsed)}</div>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600">{t("beefCost")}</div>
              <div className="mt-1 font-semibold">{fmt(data.beef.cost)} {t("lyd")}</div>
            </div>
            <div className="rounded-xl border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600">{t("beefContribution")}</div>
              <div className="mt-1 font-semibold">{fmt(data.beef.contribution)} {t("lyd")}</div>
            </div>
          </div>
        )}
      </div>
  
      {/* Waste / adjustments */}
  <div className="rounded-2xl border bg-white p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm font-semibold">{t("wasteTitle")}</div>
      <div className="text-xs text-zinc-600">{t("wasteHint")}</div>
    </div>
    <div className="flex items-center gap-2">
      <div className="text-xs text-zinc-600">
        {t("total")}: {fmt(data?.waste?.totalCost || 0)} {t("lyd")}
      </div>
      <button
        onClick={() => {
          const rows = (data?.waste?.byIngredient || []).map((r) => ({
            ingredient: r.name,
            qty: r.qty,
            unit: r.unit,
            cost: r.cost,
            count: r.count
          }));
          exportCsv(`waste_${from}_${to}.csv`, rows);
        }}
        className="rounded-lg border bg-white px-2 py-1 text-xs hover:bg-zinc-50"
        disabled={!data?.waste?.byIngredient?.length}
      >
        {t("exportCsv")}
      </button>
    </div>
  </div>
  
  <div className="mt-3 grid gap-3 md:grid-cols-2">
    <div className="rounded-xl border bg-zinc-50 p-3">
      <div className="text-xs text-zinc-600">{t("wasteByIngredient")}</div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-600">
              <th className="py-2">{t("ingredient")}</th>
              <th className="py-2">{t("qty")}</th>
              <th className="py-2">{t("beefCost")}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.waste?.byIngredient || []).slice(0, 8).map((r) => (
              <tr key={r.ingredientId} className="border-t">
                <td className="py-2 font-medium">{r.name}</td>
                <td className="py-2">{fmt(r.qty)} {r.unit}</td>
                <td className="py-2">{fmt(r.cost)} {t("lyd")}</td>
              </tr>
            ))}
            {!data?.waste?.byIngredient?.length && (
              <tr>
                <td className="py-4 text-sm text-zinc-600" colSpan={3}>
                  {t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  
    <div className="rounded-xl border bg-zinc-50 p-3">
      <div className="text-xs text-zinc-600">{t("wasteByDay")}</div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-600">
              <th className="py-2">{t("date")}</th>
              <th className="py-2">{t("beefCost")}</th>
              <th className="py-2">{t("qty")}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.waste?.byDay || []).slice(0, 10).map((r) => (
              <tr key={r.date} className="border-t">
                <td className="py-2 font-medium">{r.date}</td>
                <td className="py-2">{fmt(r.cost)} {t("lyd")}</td>
                <td className="py-2">{fmt(r.qty)}</td>
              </tr>
            ))}
            {!data?.waste?.byDay?.length && (
              <tr>
                <td className="py-4 text-sm text-zinc-600" colSpan={3}>
                  {t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </div>
  
  {/* Rankings */}
  <div className="rounded-2xl border bg-white p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm font-semibold">{t("rankingsTitle")}</div>
      <div className="text-xs text-zinc-600">{t("rankingsHint")}</div>
    </div>
    <button
      onClick={() => {
        const rows = (data?.byProduct || []).map((p) => ({
          product: p.name,
          qty: p.qty,
          revenue: p.revenue,
          estProfit: p.estimatedProfit,
          targetDaily: p.targetDailyQty,
          expectedQty: p.expectedQty,
          ratio: p.ratio ?? ""
        }));
        exportCsv(`product_performance_${from}_${to}.csv`, rows);
      }}
      className="rounded-lg border bg-white px-2 py-1 text-xs hover:bg-zinc-50"
      disabled={!data?.byProduct?.length}
    >
      {t("exportCsv")}
    </button>
  </div>
  
  <div className="mt-3 grid gap-3 md:grid-cols-3">
    <div className="rounded-xl border bg-zinc-50 p-3">
      <div className="text-xs text-zinc-600">{t("topByRevenue")}</div>
      <ol className="mt-2 space-y-1 text-sm">
        {(data?.rankings?.topByRevenue || []).map((p: any) => (
          <li key={p.productId} className="flex items-center justify-between">
            <span className="font-medium">{p.name}</span>
            <span className="text-xs text-zinc-600">{fmt(p.revenue)} {t("lyd")}</span>
          </li>
        ))}
        {!data?.rankings?.topByRevenue?.length && <li className="text-sm text-zinc-600">{t("noData")}</li>}
      </ol>
    </div>
  
    <div className="rounded-xl border bg-zinc-50 p-3">
      <div className="text-xs text-zinc-600">{t("topByProfit")}</div>
      <ol className="mt-2 space-y-1 text-sm">
        {(data?.rankings?.topByProfit || []).map((p: any) => (
          <li key={p.productId} className="flex items-center justify-between">
            <span className="font-medium">{p.name}</span>
            <span className="text-xs text-zinc-600">{fmt(p.estimatedProfit)} {t("lyd")}</span>
          </li>
        ))}
        {!data?.rankings?.topByProfit?.length && <li className="text-sm text-zinc-600">{t("noData")}</li>}
      </ol>
    </div>
  
    <div className="rounded-xl border bg-zinc-50 p-3">
      <div className="text-xs text-zinc-600">{t("worstByProfit")}</div>
      <ol className="mt-2 space-y-1 text-sm">
        {(data?.rankings?.worstByProfit || []).map((p: any) => (
          <li key={p.productId} className="flex items-center justify-between">
            <span className="font-medium">{p.name}</span>
            <span className="text-xs text-zinc-600">{fmt(p.estimatedProfit)} {t("lyd")}</span>
          </li>
        ))}
        {!data?.rankings?.worstByProfit?.length && <li className="text-sm text-zinc-600">{t("noData")}</li>}
      </ol>
    </div>
  </div>
  </div>
  
  {/* Beef weekly summary */}
  <div className="rounded-2xl border bg-white p-4">
  <div className="text-sm font-semibold">{t("beefWeeklyTitle")}</div>
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-zinc-600">
          <th className="py-2">{t("week")}</th>
          <th className="py-2">{t("qtyUsed")}</th>
          <th className="py-2">{t("beefCost")}</th>
          <th className="py-2">{t("revenue")}</th>
          <th className="py-2">{t("beefContribution")}</th>
          <th className="py-2">{t("margin")}</th>
        </tr>
      </thead>
      <tbody>
        {(data?.beefWeekly || []).map((w) => (
          <tr key={w.week} className="border-t">
            <td className="py-2 font-medium">{w.week}</td>
            <td className="py-2">{fmt(w.qtyUsed)}</td>
            <td className="py-2">{fmt(w.cost)} {t("lyd")}</td>
            <td className="py-2">{fmt(w.revenue)} {t("lyd")}</td>
            <td className="py-2">{fmt(w.contribution)} {t("lyd")}</td>
            <td className="py-2">{w.marginPct == null ? "-" : fmt(w.marginPct * 100)}%</td>
          </tr>
        ))}
        {!data?.beefWeekly?.length && (
          <tr>
            <td className="py-4 text-sm text-zinc-600" colSpan={6}>
              {t("selectIngredientToAnalyze")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  </div>
  
  {/* Beef daily trend */}
  <div className="rounded-2xl border bg-white p-4">
  <div className="text-sm font-semibold">{t("beefTrend")}</div>
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-zinc-600">
          <th className="py-2">{t("date")}</th>
          <th className="py-2">{t("qtyUsed")}</th>
          <th className="py-2">{t("beefCost")}</th>
          <th className="py-2">{t("revenue")}</th>
          <th className="py-2">{t("beefContribution")}</th>
        </tr>
      </thead>
      <tbody>
        {(data?.beefSeries || []).map((r) => (
          <tr key={r.date} className="border-t">
            <td className="py-2 font-medium">{r.date}</td>
            <td className="py-2">{fmt(r.qtyUsed)}</td>
            <td className="py-2">{fmt(r.cost)} {t("lyd")}</td>
            <td className="py-2">{fmt(r.revenue)} {t("lyd")}</td>
            <td className="py-2">{fmt(r.contribution)} {t("lyd")}</td>
          </tr>
        ))}
        {!data?.beefSeries?.length && (
          <tr>
            <td className="py-4 text-sm text-zinc-600" colSpan={5}>
              {t("selectIngredientToAnalyze")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  </div>
  
  {/* Product performance table */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-semibold">{t("productPerformance")}</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-600">
                <th className="py-2">{t("product")}</th>
                <th className="py-2">{t("qty")}</th>
                <th className="py-2">{t("revenue")}</th>
                <th className="py-2">{t("estimatedProfit")}</th>
                <th className="py-2">{t("margin")}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.byProduct || []).map((p) => (
                <tr key={p.productId} className="border-t">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">{fmt(p.qty)}</td>
                  <td className="py-2">{fmt(p.revenue)} {t("lyd")}</td>
                  <td className="py-2">{fmt(p.estimatedProfit)} {t("lyd")}</td>
                  <td className="py-2">{p.marginPct == null ? "-" : fmt(p.marginPct * 100)}%</td>
                </tr>
              ))}
              {!data?.byProduct?.length && (
                <tr>
                  <td className="py-4 text-sm text-zinc-600" colSpan={5}>
                    {t("noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
  
          <div className="mt-2 text-xs text-zinc-500">
            {t("profitNote")}
          </div>
        </div>
      </div>
    </div>
  );
  }