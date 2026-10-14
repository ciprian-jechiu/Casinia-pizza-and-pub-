import "server-only";
import { formatPrice } from "./i18n";
import type { OrderRecord, ReservationRecord } from "./db";
import { shortId } from "./db";

/**
 * Notificare opțională pe Telegram pentru personal.
 * Se activează setând TELEGRAM_BOT_TOKEN și TELEGRAM_CHAT_ID. Eșecul nu blochează comanda.
 */
async function send(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("[notify] telegram failed", err);
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function notifyOrder(o: OrderRecord) {
  const lines = o.items.map((i) => `• ${i.qty} × ${esc(i.name)} — ${formatPrice(i.price * i.qty, "ro")}`);
  return send(
    [
      `🍕 <b>Comandă nouă #${shortId(o.id)}</b>`,
      `${esc(o.name)} · ${esc(o.phone)}`,
      o.method === "delivery" ? `🚗 Livrare: ${esc(o.address ?? "")}` : "🏠 Ridicare de la local",
      `⏰ ${o.scheduled_time ?? "cât mai repede"} · 💳 ${o.payment === "cash" ? "numerar" : "card"}`,
      "",
      ...lines,
      "",
      `<b>Total: ${formatPrice(o.total, "ro")}</b>`,
      o.notes ? `📝 ${esc(o.notes)}` : "",
    ]
      .filter((l) => l !== null)
      .join("\n"),
  );
}

export function notifyReservation(r: ReservationRecord) {
  return send(
    [
      `📅 <b>Rezervare nouă</b>`,
      `${r.date} la ${r.time} · ${r.guests} pers.`,
      `${esc(r.name)} · ${esc(r.phone)}${r.email ? ` · ${esc(r.email)}` : ""}`,
      r.notes ? `📝 ${esc(r.notes)}` : "",
    ].join("\n"),
  );
}
