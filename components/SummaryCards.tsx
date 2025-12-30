"use client";

import { useLocale, useTranslations } from "@/components/i18n";
import { MoneyEntry } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

function sum(entries: MoneyEntry[], type: "in" | "out") {
  return entries
    .filter((e) => e.type === type)
    .reduce((acc, e) => acc + e.amount, 0);
}

export default function SummaryCards({
  entries
}: {
  entries: MoneyEntry[];
}) {
  const t = useTranslations();
  const locale = useLocale();

  const inTotal = sum(entries, "in");
  const outTotal = sum(entries, "out");
  const net = inTotal - outTotal;

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-600">{t("inMoney")}</div>
        <div className="mt-1 text-2xl font-semibold">
          {formatMoney(inTotal, locale)}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-600">{t("outMoney")}</div>
        <div className="mt-1 text-2xl font-semibold">
          {formatMoney(outTotal, locale)}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-600">{t("net")}</div>
        <div className="mt-1 text-2xl font-semibold">
          {formatMoney(net, locale)}
        </div>
      </div>
    </section>
  );
}
