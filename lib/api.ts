"use client";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api";

// Used for static uploads served by the backend (e.g. /uploads/..)
export const API_ORIGIN = API_BASE.replace(/\/?api\/?$/, "");

export type ApiError = { status: number; message: string };

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("coffee_token") || "";
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");

  if (opts.body && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const auth = opts.auth !== false; // default true
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...opts, headers });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }

  return data as T;
}

export function normalizeMongoDoc<T extends Record<string, any>>(doc: T): any {
  if (!doc) return doc;
  const id = String((doc as any)._id ?? (doc as any).id ?? "");
  const { _id, __v, ...rest } = doc as any;
  return { id, ...rest };
}
