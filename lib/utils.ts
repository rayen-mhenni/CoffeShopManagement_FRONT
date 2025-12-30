import { MoneyEntry, SupplierInvoice } from "./types";

export function getMonthKey(date: string): string {
  // YYYY-MM-DD -> YYYY-MM
  return date.slice(0, 7);
}

export function parseIsoDate(date: string) {
  // date is YYYY-MM-DD
  const [y, m, d] = date.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, deltaDays: number) {
  const d = parseIsoDate(date);
  d.setDate(d.getDate() + deltaDays);
  return formatIsoDate(d);
}

export function maxIsoDate(dates: string[]) {
  return dates.reduce((acc, d) => (acc && acc > d ? acc : d), "");
}

export function getLastNDaysDates(endDate: string, n: number) {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    days.push(addDays(endDate, -i));
  }
  return days;
}


export function uniqueMonthsFromEntries(
  entries: MoneyEntry[],
  supplierInvoices: SupplierInvoice[],
  salesRecords: { date: string }[] = [],
  stockMovements: { date: string }[] = []
) {
  const set = new Set<string>();
  for (const e of entries) set.add(getMonthKey(e.date));
  for (const s of supplierInvoices) set.add(getMonthKey(s.date));
  for (const r of salesRecords) set.add(getMonthKey(r.date));
  for (const m of stockMovements) set.add(getMonthKey(m.date));
  return Array.from(set).sort().reverse();
}

export function safeParseAmount(v: string): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n;
}

export function formatMoney(amount: number, locale: string) {
  try {
    // LYD formatting (browsers usually support it)
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "LYD",
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback
    return `${amount.toFixed(2)} LYD`;
  }
}

export function groupDailyTotals(entries: MoneyEntry[]) {
  const byDate: Record<string, { in: number; out: number }> = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = { in: 0, out: 0 };
    if (e.type === "in") byDate[e.date].in += e.amount;
    else byDate[e.date].out += e.amount;
  }
  const dates = Object.keys(byDate).sort().reverse();
  return dates.map((date) => ({
    date,
    in: byDate[date].in,
    out: byDate[date].out,
    net: byDate[date].in - byDate[date].out
  }));
}

export function toCsv(rows: Record<string, any>[], headers: { key: string; label: string }[]) {
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const head = headers.map((h) => escape(h.label)).join(",");
  const body = rows
    .map((r) => headers.map((h) => escape(r[h.key])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

export function downloadTextFile(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function uuid(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}
