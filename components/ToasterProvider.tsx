"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-black/10 bg-white/90 text-zinc-900 shadow-lg backdrop-blur",
          title: "text-sm font-semibold",
          description: "text-sm text-zinc-600",
        },
      }}
    />
  );
}
