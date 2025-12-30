"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "@/components/i18n";
import { useAuth } from "@/components/auth";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { login, loading, error, setError } = useAuth();

  const [email, setEmail] = React.useState("bassem@coffeShop.com");
  const [password, setPassword] = React.useState("adminCoffeShop2025");

  React.useEffect(() => {
    // clear error when changing locale
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) router.push(`/${locale}`);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center">
      <div className="w-full space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
          <p className="text-sm text-zinc-600">{t("loginHint")}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="space-y-1 block">
            <div className="text-sm text-zinc-600">{t("email")}</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="space-y-1 block">
            <div className="text-sm text-zinc-600">{t("password")}</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <Button type="submit" disabled={loading} variant="primary" className="w-full py-2.5">
            {loading ? t("loading") : t("login")}
          </Button>
        </form>
      </div>
    </div>
  );
}
