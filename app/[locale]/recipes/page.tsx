"use client";

import * as React from "react";

import { useTranslations } from "@/components/i18n";
import { useAppStore } from "@/components/store";
import RecipesManager from "@/components/RecipesManager";
import Button from "@/components/Button";
import { downloadRecipesTemplate } from "@/lib/excel-templates";
import { toast } from "sonner";

export default function RecipesPage() {
  const t = useTranslations();
  const { products, ingredients, recipes, importRecipesExcel } = useAppStore();

  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("recipes")}</h1>
          <p className="text-sm text-zinc-600">{t("recipesHint")}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImporting(true);
              try {
                await importRecipesExcel(f);
                toast.success(t("importDone"));
              } catch {
                toast.error(t("importFailed"));
              } finally {
                setImporting(false);
                e.currentTarget.value = "";
              }
            }}
          />

          <Button onClick={downloadRecipesTemplate}>
            {t("downloadTemplate")}
          </Button>

          <Button onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? t("importing") : t("importRecipesExcel")}
          </Button>
        </div>
      </div>

      <RecipesManager products={products} ingredients={ingredients} recipes={recipes} />
    </div>
  );
}
