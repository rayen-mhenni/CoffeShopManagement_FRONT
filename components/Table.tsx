import * as React from "react";

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(" ");
}

export function TableShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <table className={cx("w-full text-sm", className)}>{children}</table>;
}

export function THead({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <thead className={cx("bg-zinc-50 text-zinc-700", className)}>{children}</thead>
  );
}

export const thCls = "px-4 py-3 text-start font-medium";
export const thEndCls = "px-4 py-3 text-end font-medium";
export const tdCls = "px-4 py-3";
export const tdEndCls = "px-4 py-3 text-end";
export const trBodyCls = "border-t hover:bg-zinc-50/60";
