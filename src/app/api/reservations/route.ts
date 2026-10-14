import { getStore } from "@/lib/db";
import { json, rateLimited } from "@/lib/api";
import { notifyReservation } from "@/lib/notify";
import { isValidReservationDate, reservationSlots } from "@/lib/schedule";
import { reservationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (rateLimited(req)) return json({ error: "rate_limited" }, 429);

  const body = await req.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "invalid", fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.message })) }, 400);
  }
  const r = parsed.data;
  if (r.company) return json({ ok: true });

  if (!isValidReservationDate(r.date)) return json({ error: "invalid", fields: [{ path: "date", code: "date" }] }, 400);
  if (!reservationSlots(r.date).includes(r.time)) return json({ error: "invalid", fields: [{ path: "time", code: "time" }] }, 400);

  const store = getStore();
  if (!store) return json({ error: "unavailable" }, 503);

  try {
    const rec = await store.createReservation({
      locale: r.locale,
      name: r.name,
      phone: r.phone,
      email: r.email || null,
      date: r.date,
      time: r.time,
      guests: r.guests,
      notes: r.notes || null,
    });
    await notifyReservation(rec);
    return json({ ok: true }, 201);
  } catch (err) {
    console.error("[reservations] insert failed", err);
    return json({ error: "server" }, 500);
  }
}
