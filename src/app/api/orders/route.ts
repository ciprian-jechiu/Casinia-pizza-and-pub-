import { getStore, shortId, type OrderLine } from "@/lib/db";
import { json, rateLimited } from "@/lib/api";
import { menuById } from "@/lib/menu";
import { notifyOrder } from "@/lib/notify";
import { orderSlotsToday } from "@/lib/schedule";
import { site } from "@/lib/site";
import { orderSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (rateLimited(req)) return json({ error: "rate_limited" }, 429);

  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "invalid", fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.message })) }, 400);
  }
  const o = parsed.data;
  if (o.company) return json({ ok: true, id: "000000" }); // capcană anti-spam

  // Prețurile se calculează pe server, din meniu — nu ne încredem în ce trimite browserul.
  const lines: OrderLine[] = [];
  for (const { id, qty } of o.items) {
    const item = menuById.get(id);
    if (!item) return json({ error: "invalid", fields: [{ path: "items", code: "unknown_item" }] }, 400);
    lines.push({ id, name: item.name.ro, qty, price: item.price });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  if (o.method === "delivery" && total < site.ordering.minOrderDelivery) {
    return json({ error: "invalid", fields: [{ path: "items", code: "min_order" }] }, 400);
  }
  if (o.when === "scheduled" && !orderSlotsToday().includes(o.time!)) {
    return json({ error: "invalid", fields: [{ path: "time", code: "time" }] }, 400);
  }

  const store = getStore();
  if (!store) return json({ error: "unavailable" }, 503);

  try {
    const rec = await store.createOrder({
      locale: o.locale,
      name: o.name,
      phone: o.phone,
      method: o.method,
      address: o.method === "delivery" ? o.address : null,
      scheduled_time: o.when === "scheduled" ? o.time! : null,
      payment: o.payment,
      notes: o.notes || null,
      items: lines,
      total,
    });
    await notifyOrder(rec);
    return json({ ok: true, id: shortId(rec.id), total }, 201);
  } catch (err) {
    console.error("[orders] insert failed", err);
    return json({ error: "server" }, 500);
  }
}
