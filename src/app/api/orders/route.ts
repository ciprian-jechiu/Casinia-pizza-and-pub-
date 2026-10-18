import { getStore, shortId, type OrderLine } from "@/lib/db";
import { json, rateLimited } from "@/lib/api";
import { menuById } from "@/lib/menu";
import { notifyOrder } from "@/lib/notify";
import { PROMO, promoFor } from "@/lib/promo";
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
  for (const { id, qty, choices } of o.items) {
    const item = menuById.get(id);
    if (!item) return json({ error: "invalid", fields: [{ path: "items", code: "unknown_item" }] }, 400);
    // ofertele se comandă doar cu livrare
    if (item.offer?.deliveryOnly && o.method !== "delivery") {
      return json({ error: "invalid", fields: [{ path: "items", code: "offer_delivery" }] }, 400);
    }
    // pe bon: combo-urile își arată conținutul (burger + cartofi + Pepsi)
    let name = item.offer && !item.offer.choose && item.description ? `${item.name.ro} (${item.description.ro})` : item.name.ro;
    const rule = item.offer?.choose;
    if (rule) {
      // oferta 3+1: exact `count` pizza, doar din lista permisă
      if (!choices || choices.length !== rule.count || choices.some((c) => !rule.from.includes(c))) {
        return json({ error: "invalid", fields: [{ path: "items", code: "bad_choices" }] }, 400);
      }
      const counts = new Map<string, number>();
      for (const c of choices) counts.set(c, (counts.get(c) ?? 0) + 1);
      name += ": " + [...counts].map(([c, n]) => `${n > 1 ? `${n}× ` : ""}${menuById.get(c)!.name.ro}`).join(", ");
    }
    lines.push({ id: rule ? `${id}:${[...choices!].sort().join(",")}` : id, name, qty, price: item.price });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  // Oferta 3+1: la fiecare 3 pizza, o Margherita cadou (0 lei), ca bucătăria s-o vadă pe bon.
  const { gifts } = promoFor(o.items);
  if (gifts > 0) {
    const gift = menuById.get(PROMO.giftId);
    if (gift) lines.push({ id: `${PROMO.giftId}-cadou`, name: `${gift.name.ro} (cadou 3+1)`, qty: gifts, price: 0 });
  }

  if (o.method === "delivery" && subtotal < site.ordering.minOrderDelivery) {
    return json({ error: "invalid", fields: [{ path: "items", code: "min_order" }] }, 400);
  }
  // livrarea în afara Stăuceni costă 50 lei — apare ca rând separat pe comandă (bon, tabel, Telegram)
  if (o.method === "delivery" && o.zone === "outside") {
    lines.push({ id: "livrare", name: "Livrare în afara Stăuceni", qty: 1, price: site.ordering.deliveryFeeOutside });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
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
