"use client";

import * as React from "react";

export default function BrandMark({
  size = "md",
  showSubtitle = true,
}: {
  size?: "sm" | "md";
  showSubtitle?: boolean;
}) {
  const box = size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";
  const title = size === "sm" ? "text-base" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} overflow-hidden border bg-white shadow-sm ring-1 ring-black/5`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="RM Coffee" className="h-full w-full" />
      </div>

      <div className="min-w-0">
        <div className={`${title} font-semibold leading-tight truncate`}>
          Coffee Manager
        </div>
        {showSubtitle ? (
          <div className="text-xs text-zinc-600 truncate">
            Dashboard · Inventory · Sales
          </div>
        ) : null}
      </div>
    </div>
  );
}
