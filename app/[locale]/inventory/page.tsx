"use client";

import { useTranslations } from "@/components/i18n";
import { useAppStore } from "@/components/store";
import InventoryTable from "@/components/InventoryTable";

export default function InventoryPage() {
  const t = useTranslations();
  const { ingredients } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("inventory")}</h1>
        <p className="text-sm text-zinc-600">{t("inventoryHint")}</p>
      </div>

      <InventoryTable rows={ingredients} />
    </div>
  );
}
