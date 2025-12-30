"use client";

import * as React from "react";
import { useLocale, useTranslations } from "@/components/i18n";
import { apiFetch } from "@/lib/api";

type DashboardRes = {
  date: string;
  todayTotals: { revenue: number; cogs: number; profit: number; count: number };
  alertsLast7Days: { salesAlertsCount: number; lowStockCount: number; total: number; from: string; to: string };
  lowStockCount: number;
  lowStockCriticalCount: number;
  wasteWeekCost: number;
  weekStart: string;
};

function fmt(n: number) {
  if (Number.isNaN(n)) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

export default function DashboardWidget() {
  const t = useTranslations();
  const locale = useLocale();

  const [data, setData] = React.useState<DashboardRes | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const res = await apiFetch<DashboardRes>(`/reports/dashboard?date=${encodeURIComponent(date)}`, { method: "GET" });
        if (mounted) setData(res);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    function onAuthChanged() {
      load();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("coffee_auth_changed", onAuthChanged);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("coffee_auth_changed", onAuthChanged);
      }
    };
  }, []);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{t("dashboardWidgetTitle")}</div>
          <div className="text-xs text-zinc-600">{t("dashboardWidgetHint")}</div>
        </div>
        {loading && <div className="text-xs text-zinc-600">{t("loading")}</div>}
      </div>

      {err && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">{err}</div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs text-zinc-600">{t("todayRevenue")}</div>
          <div className="mt-1 text-lg font-semibold">{fmt(data?.todayTotals.revenue || 0)} {t("lyd")}</div>
          <div className="text-xs text-zinc-600">{t("orders")}: {fmt(data?.todayTotals.count || 0)}</div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs text-zinc-600">{t("todayProfit")}</div>
          <div className="mt-1 text-lg font-semibold">{fmt(data?.todayTotals.profit || 0)} {t("lyd")}</div>
          <div className="text-xs text-zinc-600">{t("cogs")}: {fmt(data?.todayTotals.cogs || 0)} {t("lyd")}</div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs text-zinc-600">{t("alertsLast7Days")}</div>
          <div className="mt-1 text-lg font-semibold">{fmt(data?.alertsLast7Days.total || 0)}</div>
          <div className="text-xs text-zinc-600">
            {t("sales")}: {fmt(data?.alertsLast7Days.salesAlertsCount || 0)} · {t("inventory")}: {fmt(data?.alertsLast7Days.lowStockCount || 0)}
          </div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs text-zinc-600">{t("lowStockNow")}</div>
          <div className="mt-1 text-lg font-semibold">{fmt(data?.lowStockCount || 0)}</div>
          <div className="text-xs text-zinc-600">{t("critical")}: {fmt(data?.lowStockCriticalCount || 0)}</div>
        </div>

        <div className="rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs text-zinc-600">{t("wasteThisWeek")}</div>
          <div className="mt-1 text-lg font-semibold">{fmt(data?.wasteWeekCost || 0)} {t("lyd")}</div>
          <div className="text-xs text-zinc-600">{t("weekStart")}: {data?.weekStart || "-"}</div>
        </div>
      </div>
    </div>
  );
}
