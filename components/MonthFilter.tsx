"use client";

import { useTranslations } from "@/components/i18n";
import Select from "./Select";

export default function MonthFilter({
  months,
  value,
  onChange
}: {
  months: string[];
  value: string | "all";
  onChange: (v: string | "all") => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600">{t("month")}:</span>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
      >
        <option value="all">{t("allMonths")}</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
