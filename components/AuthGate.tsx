"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";

/**
 * Client-side route protection.
 * - If not authenticated => redirect to /[locale]/login
 * - If authenticated and on /login => redirect to /[locale]
 */
export default function AuthGate({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const loginPath = `/${locale}/login`;
  const isLogin = pathname === loginPath;

  React.useEffect(() => {
    if (!mounted) return;

    if (!token && !isLogin) {
      router.replace(loginPath);
      return;
    }

    if (token && isLogin) {
      router.replace(`/${locale}`);
    }
  }, [mounted, token, isLogin, loginPath, locale, router]);

  if (!mounted) return null;

  if (!token && !isLogin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-zinc-600">Redirecting to login…</div>
      </div>
    );
  }

  return <>{children}</>;
}
