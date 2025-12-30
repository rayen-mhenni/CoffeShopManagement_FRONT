"use client";

import { useLocale, useTranslations } from "@/components/i18n";
import { MoneyEntry } from "@/lib/types";
import { formatMoney, groupDailyTotals } from "@/lib/utils";
import { TableShell, Table, THead, thCls, thEndCls, tdCls, tdEndCls, trBodyCls } from "./Table";

export default function DailyTotalsTable({ entries }: { entries: MoneyEntry[] }) {
  const t = useTranslations();
  const locale = useLocale();

  const rows = groupDailyTotals(entries);

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">{t("dailyTotals")}</div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <th className={thCls}>{t("date")}</th>
              <th className={thEndCls}>{t("inMoney")}</th>
              <th className={thEndCls}>{t("outMoney")}</th>
              <th className={thEndCls}>{t("net")}</th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className={trBodyCls}>
                <td className={tdCls}>{r.date}</td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.in, locale)}
                </td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.out, locale)}
                </td>
                <td className={`${tdEndCls} font-medium`}>
                  {formatMoney(r.net, locale)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
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
