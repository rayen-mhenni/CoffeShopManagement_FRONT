"use client";

import { useLocale, useTranslations } from "@/components/i18n";
import { SalesRecord } from "@/lib/types";
import { formatMoney, groupDailyTotals, getMonthKey, toCsv, downloadTextFile } from "@/lib/utils";
import Button from "./Button";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";

export default function ProfitReport({ rows }: { rows: SalesRecord[] }) {
  const t = useTranslations();
  const locale = useLocale();

  // Group by day from sales records (revenue/cogs/profit)
  const byDate: Record<string, { revenue: number; cogs: number; profit: number }> = {};
  for (const r of rows) {
    if (!byDate[r.date]) byDate[r.date] = { revenue: 0, cogs: 0, profit: 0 };
    byDate[r.date].revenue += r.revenue;
    byDate[r.date].cogs += r.cogs;
    byDate[r.date].profit += r.profit;
  }
  const dates = Object.keys(byDate).sort().reverse();
  const daily = dates.map((d) => ({ date: d, ...byDate[d] }));

  const totalRevenue = daily.reduce((a, x) => a + x.revenue, 0);
  const totalCogs = daily.reduce((a, x) => a + x.cogs, 0);
  const totalProfit = daily.reduce((a, x) => a + x.profit, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-600">{t("revenue")}</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(totalRevenue, locale)}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-600">{t("cogs")}</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(totalCogs, locale)}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-600">{t("profit")}</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(totalProfit, locale)}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            const csv = toCsv(
              daily.map((r) => ({
                date: r.date,
                revenue: formatMoney(r.revenue, locale),
                cogs: formatMoney(r.cogs, locale),
                profit: formatMoney(r.profit, locale)
              })),
              [
                { key: "date", label: t("date") },
                { key: "revenue", label: t("revenue") },
                { key: "cogs", label: t("cogs") },
                { key: "profit", label: t("profit") }
              ]
            );
            downloadTextFile("profit-report.csv", csv);
          }}
        >
          {t("exportCsv")}
        </Button>
      </div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("date")}</th>
              <th className={thEndCls}>{t("revenue")}</th>
              <th className={thEndCls}>{t("cogs")}</th>
              <th className={thEndCls}>{t("profit")}</th>
            </tr>
          </THead>
          <tbody>
            {daily.map((r) => (
              <tr key={r.date} className={trBodyCls}>
                <td className={tdCls}>{r.date}</td>
                <td className={`${tdEndCls} font-medium`}>{formatMoney(r.revenue, locale)}</td>
                <td className={`${tdEndCls} font-medium`}>{formatMoney(r.cogs, locale)}</td>
                <td className={`${tdEndCls} font-medium`}>{formatMoney(r.profit, locale)}</td>
              </tr>
            ))}
            {daily.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
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
