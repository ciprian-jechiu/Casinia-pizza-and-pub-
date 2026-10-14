import { z } from "zod";
import { getStore } from "@/lib/db";
import { isAdmin, json, rateLimited } from "@/lib/api";
import { statusSchema } from "@/lib/validation";

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    if (rateLimited(req, 10)) return json({ error: "rate_limited" }, 429);
    return json({ error: "unauthorized" }, 401);
  }
  const store = getStore();
  if (!store) return json({ error: "unavailable" }, 503);
  const [orders, reservations] = await Promise.all([store.listOrders(), store.listReservations()]);
  return json({ orders, reservations });
}

const patchSchema = z.object({
  table: z.enum(["orders", "reservations"]),
  id: z.string().uuid(),
  status: statusSchema,
});

export async function PATCH(req: Request) {
  if (!isAdmin(req)) return json({ error: "unauthorized" }, 401);
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const store = getStore();
  if (!store) return json({ error: "unavailable" }, 503);
  await store.setStatus(parsed.data.table, parsed.data.id, parsed.data.status);
  return json({ ok: true });
}
