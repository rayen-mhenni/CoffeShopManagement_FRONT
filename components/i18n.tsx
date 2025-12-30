"use client";

import * as React from "react";

export type Messages = Record<string, string>;

const I18nContext = React.createContext<{ locale: string; messages: Messages } | null>(null);

export function I18nProvider({
  locale,
  messages,
  children
}: {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

/**
 * API-compatible with next-intl for this project:
 * - useTranslations() -> returns t(key)
 * - useLocale() -> returns current locale
 */
export function useTranslations() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations must be used within I18nProvider");
  return (key: string) => ctx.messages[key] ?? key;
}

export function useLocale() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used within I18nProvider");
  return ctx.locale;
}
