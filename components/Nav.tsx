"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useLocale, useTranslations } from "@/components/i18n";
import { useAuth } from "@/components/auth";
import BrandMark from "@/components/BrandMark";

function NavLink({
  href,
  label,
  right,
}: {
  href: string;
  label: React.ReactNode;
  right?: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={
        "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition focus:outline-none " +
        (active
          ? "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] text-white shadow-sm ring-1 ring-black/5"
          : "text-zinc-700 hover:bg-[var(--muted)]")
      }
    >
      <span className="truncate">{label}</span>
      {right}
    </Link>
  );
}

export default function Nav() {
  const t = useTranslations();
  const locale = useLocale();
  const { token, email, logout } = useAuth();

  const [reportsBadge, setReportsBadge] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;

    async function loadBadge() {
      try {
        const tok =
          typeof window !== "undefined"
            ? localStorage.getItem("coffee_token")
            : null;
        if (!tok) {
          if (mounted) setReportsBadge(0);
          return;
        }

        const d = new Date();
        const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
        const fromD = new Date(d.getTime() - 6 * 24 * 3600 * 1000);
        const from = `${fromD.getFullYear()}-${String(
          fromD.getMonth() + 1
        ).padStart(2, "0")}-${String(fromD.getDate()).padStart(2, "0")}`;

        const res = await apiFetch<{ total: number }>(
          `/reports/alerts-count?from=${encodeURIComponent(
            from
          )}&to=${encodeURIComponent(to)}`,
          { method: "GET" }
        );

        if (mounted) setReportsBadge(Number(res?.total ?? 0));
      } catch {
        if (mounted) setReportsBadge(0);
      }
    }

    loadBadge();

    function onAuthChanged() {
      loadBadge();
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

  const reportsRight =
    reportsBadge > 0 ? (
      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
        {reportsBadge}
      </span>
    ) : null;

  return (
    <nav className="flex h-full flex-col gap-1">
      <div className="mb-2 rounded-xl border border-black/5 bg-white/70 p-2 shadow-sm backdrop-blur">
        <BrandMark size="sm" showSubtitle={false} />
      </div>

      {token ? (
        <div className="space-y-1">
          <NavLink href={`/${locale}`} label={t("overview")} />
          <NavLink href={`/${locale}/ledger`} label={t("ledger")} />
          <NavLink href={`/${locale}/sales`} label={t("sales")} />
          <NavLink href={`/${locale}/products`} label={t("products")} />
          <NavLink href={`/${locale}/inventory`} label={t("inventory")} />
          <NavLink href={`/${locale}/recipes`} label={t("recipes")} />
          <NavLink href={`/${locale}/alerts`} label={t("alerts")} />
          <NavLink
            href={`/${locale}/reports`}
            label={t("reports")}
            right={reportsRight}
          />
          <NavLink href={`/${locale}/suppliers`} label={t("suppliers")} />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl border border-black/5 bg-white/70 p-3 text-sm text-zinc-700">
            {t("loginRequired")}
          </div>
          <NavLink href={`/${locale}/login`} label={t("login")} />
        </div>
      )}

      <div className="mt-auto pt-3">
        <div className="mb-2 border-t border-black/5" />
        {token ? (
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-[var(--muted)]"
          >
            <span className="truncate">
              {t("logout")}
              {email ? (
                <span className="ml-2 text-xs text-zinc-500">({email})</span>
              ) : null}
            </span>
          </button>
        ) : (
          <div className="px-1 text-xs text-zinc-500">{t("guest")}</div>
        )}
      </div>
    </nav>
  );
}
