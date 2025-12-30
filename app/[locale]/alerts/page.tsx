"use client";

import { useTranslations } from "@/components/i18n";
import { useAppStore } from "@/components/store";
import AlertsPanel from "@/components/AlertsPanel";

export default function AlertsPage() {
  const t = useTranslations();
  const { products, ingredients, salesRecords } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("alerts")}</h1>
        <p className="text-sm text-zinc-600">{t("alertsHint")}</p>
      </div>

      <AlertsPanel products={products} ingredients={ingredients} salesRecords={salesRecords} />
    </div>
  );
}
