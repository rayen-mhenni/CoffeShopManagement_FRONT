"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { useTranslations } from "@/components/i18n";

type Status = "checking" | "online" | "offline";

export default function ApiStatusPill() {
  const t = useTranslations();
  const [status, setStatus] = React.useState<Status>("checking");

  React.useEffect(() => {
    let mounted = true;

    async function ping() {
      try {
        await apiFetch<{ ok: boolean }>("/health", { method: "GET", auth: false });
        if (mounted) setStatus("online");
      } catch {
        if (mounted) setStatus("offline");
      }
    }

    ping();
    const id = window.setInterval(ping, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const text =
    status === "online"
      ? t("apiOnline")
      : status === "offline"
        ? t("apiOffline")
        : t("checking");

  const dot =
    status === "online"
      ? "bg-emerald-500"
      : status === "offline"
        ? "bg-rose-500"
        : "bg-zinc-400";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-zinc-700 shadow-sm">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {text}
    </span>
  );
}
