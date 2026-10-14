import { site } from "./site";

export const TIMEZONE = "Europe/Chisinau";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Data și ora curente în Chișinău, independent de fusul serverului. */
export function nowInChisinau(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

export function hoursFor(isoDate: string) {
  return site.hours.find((h) => h.day === weekday(isoDate)) ?? null;
}

/** Intervalele de rezervare disponibile într-o zi (exclude orele trecute pentru azi). */
export function reservationSlots(isoDate: string, now = new Date()): string[] {
  const h = hoursFor(isoDate);
  if (!h) return [];
  const { slotMinutes, lastSlotBeforeCloseMinutes } = site.reservation;
  const open = toMin(h.open);
  const last = toMin(h.close) - lastSlotBeforeCloseMinutes;
  const today = nowInChisinau(now);
  if (isoDate < today.date) return [];
  const earliest = isoDate === today.date ? today.minutes + 30 : -1;
  const slots: string[] = [];
  for (let t = open; t <= last; t += slotMinutes) if (t >= earliest) slots.push(toHHMM(t));
  return slots;
}

/** Ore la care se poate programa o comandă azi (din 30 în 30 min, cu 45 min timp de pregătire). */
export function orderSlotsToday(now = new Date()): string[] {
  const today = nowInChisinau(now);
  const h = hoursFor(today.date);
  if (!h) return [];
  const start = Math.max(toMin(h.open), today.minutes + 45);
  const close = toMin(h.close) - 15;
  const slots: string[] = [];
  for (let t = Math.ceil(start / 15) * 15; t <= close; t += 15) slots.push(toHHMM(t));
  return slots;
}

export function isValidReservationDate(isoDate: string, now = new Date()) {
  const today = nowInChisinau(now).date;
  return isoDate >= today && isoDate <= addDays(today, site.reservation.maxDaysAhead);
}
