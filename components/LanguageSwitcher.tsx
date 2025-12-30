"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Locale } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/components/i18n";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const t = useTranslations();

  const other: Locale = locale === "ar" ? "en" : "ar";

  // Replace first segment with other locale
  const parts = pathname.split("/");
  if (parts.length > 1) parts[1] = other;
  const nextPath = parts.join("/") || `/${other}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600">{t("language")}:</span>
      <Link
        href={nextPath}
        className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-zinc-50"
      >
        {other === "en" ? t("english") : t("arabic")}
      </Link>
    </div>
  );
}
