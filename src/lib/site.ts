/**
 * Datele publice ale restaurantului (sursa: Google Maps + meniul online casinia-pizza-pub.ps.me).
 * Tot ce e marcat TODO trebuie confirmat cu proprietarul.
 */
export const site = {
  name: "Casinia Pizza Pub",
  phone: "+373 684 88 488",
  phoneHref: "tel:+37368488488",
  address: {
    street: "Strada Unirii 20",
    building: "Stil Market",
    city: "Stăuceni",
    country: "Republica Moldova",
  },
  geo: { lat: 47.0954174, lng: 28.8683843 },
  mapsUrl:
    "https://www.google.com/maps/place/Casinia+Pizza+Pub/@47.0954174,28.8683843,17z/data=!3m1!4b1!4m6!3m5!1s0x40c963007b1c3a57:0x6a4c139a636884a9!8m2!3d47.0954174!4d28.8683843!16s%2Fg%2F11nw1h8yql",
  mapsEmbed:
    "https://www.google.com/maps?q=Casinia+Pizza+Pub,+Strada+Unirii+20,+St%C4%83uceni&z=16&output=embed",
  rating: { value: 4.7, count: 14 },
  priceRange: "200–300 MDL",
  currency: "MDL",
  /**
   * TODO: programul nu apare public. Valori provizorii, folosite și pentru intervalele de rezervare.
   * day: 0 = duminică ... 6 = sâmbătă
   */
  hours: [
    { day: 1, open: "10:00", close: "22:00" },
    { day: 2, open: "10:00", close: "22:00" },
    { day: 3, open: "10:00", close: "22:00" },
    { day: 4, open: "10:00", close: "22:00" },
    { day: 5, open: "10:00", close: "23:00" },
    { day: 6, open: "10:00", close: "23:00" },
    { day: 0, open: "10:00", close: "22:00" },
  ],
  reservation: {
    maxGuests: 12,
    slotMinutes: 30,
    /** ultima rezervare posibilă înainte de închidere */
    lastSlotBeforeCloseMinutes: 60,
    maxDaysAhead: 60,
  },
  ordering: {
    /** TODO: de confirmat zona și costul livrării cu proprietarul */
    deliveryEnabled: true,
    minOrderDelivery: 150,
  },
} as const;

/** Program compact: grupează zilele consecutive cu aceleași ore („Dum–Joi 10:00–22:00”). */
export function hoursSummary(daysShort: readonly string[]) {
  const order = [0, 1, 2, 3, 4, 5, 6];
  const rows = order.map((d) => {
    const h = site.hours.find((x) => x.day === d);
    return { d, key: h ? `${h.open}–${h.close}` : "" };
  });
  const groups: { from: number; to: number; key: string }[] = [];
  for (const r of rows) {
    const g = groups[groups.length - 1];
    if (g && g.key === r.key) g.to = r.d;
    else groups.push({ from: r.d, to: r.d, key: r.key });
  }
  return groups
    .filter((g) => g.key)
    .map((g) => `${daysShort[g.from]}${g.to !== g.from ? `–${daysShort[g.to]}` : ""} ${g.key}`);
}

export type Site = typeof site;
