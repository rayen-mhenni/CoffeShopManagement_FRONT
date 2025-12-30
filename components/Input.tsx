import * as React from "react";

export default function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 " +
        className
      }
      {...props}
    />
  );
}
