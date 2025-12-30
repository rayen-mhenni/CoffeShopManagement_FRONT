"use client";

import * as XLSX from "xlsx";

function normalizeHeader(h: any) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

export type ParsedRow = Record<string, any>;

export async function parseExcelFile(file: File): Promise<ParsedRow[]> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const raw: ParsedRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  // Normalize keys
  return raw.map((row) => {
    const out: ParsedRow = {};
    for (const [k, v] of Object.entries(row)) out[normalizeHeader(k)] = v;
    return out;
  });
}
