import { z } from "zod";
import { getStore } from "@/lib/db";
import { isAdmin, json, rateLimited } from "@/lib/api";
import { statusSchema } from "@/lib/validation";
import { buildReservationsWorkbook } from "@/lib/reservationsXlsx";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const querySchema = z.object({
  from: ymd.optional(),
  to: ymd.optional(),
  status: statusSchema.optional(),
});

/** GET /api/admin/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=… → fișier .xlsx cu rezervările. */
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    if (rateLimited(req, 10)) return json({ error: "rate_limited" }, 429);
    return json({ error: "unauthorized" }, 401);
  }
  const params = Object.fromEntries([...new URL(req.url).searchParams].filter(([, v]) => v !== ""));
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { from, to, status } = parsed.data;

  const store = getStore();
  if (!store) return json({ error: "unavailable" }, 503);

  const rows = (await store.listAllReservations()).filter(
    (r) => (!from || r.date >= from) && (!to || r.date <= to) && (!status || r.status === status),
  );
  const buf = await buildReservationsWorkbook(rows, { from, to, status });

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Chisinau" }).format(new Date());
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="casinia-rezervari-${today}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
