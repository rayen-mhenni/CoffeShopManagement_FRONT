import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50";

  const sizes: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-[var(--brand)] text-white shadow-sm hover:opacity-95 active:opacity-90",
    secondary:
      "border border-black/10 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50",
    ghost: "text-zinc-900 hover:bg-zinc-100",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70",
  };

  return (
    <button
      className={cx(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

export default Button;
