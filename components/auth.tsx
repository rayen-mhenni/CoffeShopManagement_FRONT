"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

type AuthState = {
  token: string;
  email: string;
  loading: boolean;
  error: string;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setError: (msg: string) => void;
};

const AuthCtx = React.createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("coffee_token") || "";
  });
  const [email, setEmail] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("coffee_email") || "";
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const login = React.useCallback(async (e: string, p: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ access_token: string; user?: { email?: string } }>(
        "/auth/login",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email: e, password: p }),
        },
      );
      const tk = res.access_token || "";
      setToken(tk);
      const em = res.user?.email || e;
      setEmail(em);

      localStorage.setItem("coffee_token", tk);
      localStorage.setItem("coffee_email", em);
      window.dispatchEvent(new Event("coffee_auth_changed"));

      toast.success("Logged in", {
        description: em,
      });
      return true;
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      setError(msg);
      toast.error("Login failed", {
        description: msg,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    setToken("");
    setEmail("");
    localStorage.removeItem("coffee_token");
    localStorage.removeItem("coffee_email");
    window.dispatchEvent(new Event("coffee_auth_changed"));
    toast.message("Logged out");
  }, []);

  const value: AuthState & AuthActions = {
    token,
    email,
    loading,
    error,
    login,
    logout,
    setError,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
