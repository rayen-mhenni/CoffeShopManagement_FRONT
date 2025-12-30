"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useAuth } from "@/components/auth";
import { useLocale, useTranslations } from "@/components/i18n";

export default function LocalModeBanner() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { token } = useAuth();

  // Don't show on login page
  const onLogin = pathname?.includes(`/${locale}/login`) || pathname === `/${locale}/login`;
  if (onLogin) return null;

  if (token) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-semibold">{t("localModeTitle")}</div>
          <div className="text-amber-800/80">{t("localModeHint")}</div>
        </div>
        <Link
          href={`/${locale}/login`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white"
        >
          {t("login")}
        </Link>
      </div>
    </div>
  );
}
