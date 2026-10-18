import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const hits = new Map<string, number[]>();

/** Limitare simplă per IP (best-effort, per instanță): max `limit` cereri în `windowMs`. */
export function rateLimited(req: Request, limit = 6, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > limit;
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function isAdmin(req: Request) {
  // spațiile de la capete (copiate din greșeală) nu contează
  const expected = (process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV !== "production" ? "casinia-dev" : "")).trim();
  const given = (req.headers.get("x-admin-key") ?? "").trim();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
