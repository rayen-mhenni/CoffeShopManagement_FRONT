import "../globals.css";
import * as React from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Nav from "@/components/Nav";
import { AppStoreProvider } from "@/components/store";
import { AuthProvider } from "@/components/auth";
import { I18nProvider } from "@/components/i18n";
import ApiStatusPill from "@/components/ApiStatusPill";
import AuthGate from "@/components/AuthGate";
import BrandMark from "@/components/BrandMark";
import ToasterProvider from "@/components/ToasterProvider";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next.js 16+ can provide `params` as a Promise in dev (sync dynamic APIs).
  // Accept both for compatibility.
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const resolvedParams: { locale: string } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (params as any)?.then === "function"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (params as any)
      : (params as { locale: string });

  const locale = resolvedParams.locale;

  if (!isLocale(locale)) notFound();

  const messages = (await import(`../../messages/${locale}.json`)).default;

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen text-zinc-900">
        <I18nProvider locale={locale} messages={messages}>
          <ToasterProvider />
          <AuthProvider>
            <AppStoreProvider>
              <div className="mx-auto max-w-6xl px-4">
                {/* Header */}
                <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-black/5 bg-white/70 px-4 py-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <BrandMark />
                    <div className="flex items-center gap-2">
                      <ApiStatusPill />
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>

                {/* Shell */}
                <div className="grid gap-6 pb-8 lg:grid-cols-[270px_1fr]">
                  <aside className="rounded-2xl border border-black/5 bg-white/80 p-3 shadow-sm backdrop-blur">
                    <Nav />
                  </aside>
                  <main className="min-w-0 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <AuthGate locale={locale}>{children}</AuthGate>
                  </main>
                </div>
              </div>
            </AppStoreProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
