import "server-only";
import { menu, menuById } from "./menu";
import type { OrderRecord } from "./db";

/**
 * Legătura cu casa Poster (joinposter.com).
 *
 * Fiecare comandă de pe site devine o „comandă online” pe terminal (incomingOrders.createIncomingOrder),
 * unde casierul o acceptă. Tokenul stă DOAR pe server: variabila de mediu POSTER_TOKEN.
 *
 * Opțional:
 *  - POSTER_SPOT_ID — localul (dacă lipsește, se ia primul local din cont)
 *  - POSTER_PRODUCT_MAP — JSON {"id-site": product_id_poster, …} pentru produsele care nu se potrivesc după nume
 */

const API = process.env.POSTER_API_URL || "https://joinposter.com/api";

export const posterEnabled = () => Boolean(process.env.POSTER_TOKEN);

type PosterProduct = { product_id: string; product_name: string; category_name?: string; price?: Record<string, string>; hidden?: string };
type PosterSpot = { spot_id: string; spot_name?: string; name?: string; spot_adress?: string; address?: string };

async function call<T>(method: string, init?: { body?: URLSearchParams | Record<string, unknown>; params?: Record<string, string> }): Promise<T> {
  const token = process.env.POSTER_TOKEN;
  if (!token) throw new Error("[poster] POSTER_TOKEN lipsește");
  const qs = new URLSearchParams({ token, ...(init?.params ?? {}) });
  const isForm = init?.body instanceof URLSearchParams;
  const res = await fetch(`${API}/${method}?${qs}`, {
    method: init?.body ? "POST" : "GET",
    headers: init?.body ? { "content-type": isForm ? "application/x-www-form-urlencoded" : "application/json" } : undefined,
    body: init?.body ? (isForm ? (init.body as URLSearchParams) : JSON.stringify(init.body)) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data: { response?: T; error?: unknown; message?: string } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* răspuns care nu e JSON */
  }
  if (!res.ok || !data || data.error || data.response === undefined) {
    // tot răspunsul, ca să se vadă motivul exact în jurnalul Vercel
    throw new Error(`[poster] ${method}: HTTP ${res.status} — ${text.slice(0, 500)}`);
  }
  return data.response;
}

// ───────── meniul și localul (cache 10 minute) ─────────

let cache: { at: number; products: PosterProduct[]; spots: PosterSpot[] } | null = null;

async function catalog() {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache;
  const [products, spots] = await Promise.all([call<PosterProduct[]>("menu.getProducts"), call<PosterSpot[]>("access.getSpots")]);
  cache = { at: Date.now(), products, spots };
  return cache;
}

export async function spotId(): Promise<string> {
  if (process.env.POSTER_SPOT_ID) return process.env.POSTER_SPOT_ID;
  const { spots } = await catalog();
  if (!spots.length) throw new Error("[poster] contul nu are niciun local");
  return String(spots[0].spot_id);
}

/** Normalizează un nume pentru potrivire: fără diacritice, fără cuvântul „pizza”, fără semne („combo” rămâne!). */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(^|\s)(pizza|пицца)(?=\s|$)/g, " ")
    .replace(/[^a-z0-9а-яё]+/g, " ")
    .trim();

/**
 * Potriviri verificate în Poster-ul Casinia (produsele cu nume diferit față de site).
 * POSTER_PRODUCT_MAP de pe server le poate suprascrie.
 */
const DEFAULT_MAP: Record<string, string> = {
  "pizza-pepperoni": "19", // PEPERONI
  "pizza-pollo": "118", // PIZZA POLO
  "double-cheese-burger": "29", // DOUBLE CHESSE BURGER
  "burger-krispy": "125", // Burger Kryspy
  "aripi-bbq": "40", // Aripi B.B.Q
  "aripi-krispy": "13", // ARIPI DE PUI KRISPY
  "nuggets-copii": "128", // Nughete copii
  "cartofi-wedges": "11", // CARTOFI WEGES
  "cartof-ca-acasa": "189", // Cartof ca acasa (FAST FOOD)
  "cartof-ca-acasa-bacon": "190", // Cartof ca acasa cu bacon
  "piure-cartof": "186", // Piureu de cartof
  "piure-broccoli": "191", // Piure din brocolli
  pepsi: "154", // Pepsi Cola 0.25l — Pepsi-ul cadou din combo-uri
};

/** Combo-urile nu există ca produse în Poster: pe casă pleacă burgerul + cartofii fries + Pepsi (cadou). */
const COMBOS: Record<string, { burger: string; side: string; drink: string }> = {
  "combo-burger-clasic": { burger: "burger-clasic", side: "cartofi-fries", drink: "pepsi" },
  "combo-cheeseburger": { burger: "cheeseburger-clasic", side: "cartofi-fries", drink: "pepsi" },
  "combo-burger-krispy": { burger: "burger-krispy", side: "cartofi-fries", drink: "pepsi" },
  "combo-double-cheeseburger": { burger: "double-cheese-burger", side: "cartofi-fries", drink: "pepsi" },
};

/** Produse speciale de pe comandă (nu sunt în meniul site-ului ca atare). */
const EXTRA_NAMES: Record<string, string[]> = {
  livrare: ["livrare in afara stauceni", "livrare", "доставка"],
};

/** id-site → product_id din Poster (după hartă explicită sau după nume). */
export async function productMap(): Promise<Map<string, string>> {
  const { products } = await catalog();
  const visible = products.filter((p) => p.hidden !== "1");
  const byName = new Map<string, string>();
  for (const p of visible) byName.set(norm(p.product_name), String(p.product_id));

  const map = new Map<string, string>(Object.entries(DEFAULT_MAP));
  for (const item of menu) {
    if (map.has(item.id)) continue;
    const names = [item.name.ro, item.name.ru, item.name.en].map(norm);
    const hit = names.map((n) => byName.get(n)).find(Boolean);
    if (hit) map.set(item.id, hit);
  }
  for (const [id, names] of Object.entries(EXTRA_NAMES)) {
    const hit = names.map((n) => byName.get(norm(n))).find(Boolean);
    if (hit) map.set(id, hit);
  }
  // potrivirile manuale au ultimul cuvânt
  try {
    const manual = JSON.parse(process.env.POSTER_PRODUCT_MAP || "{}") as Record<string, string | number>;
    for (const [k, v] of Object.entries(manual)) map.set(k, String(v));
  } catch {
    console.error("[poster] POSTER_PRODUCT_MAP nu e JSON valid");
  }
  return map;
}

/** Raport pentru panoul de admin: ce produse de pe site au corespondent în Poster. */
export async function posterReport() {
  const { products, spots } = await catalog();
  const map = await productMap();
  const nameOf = new Map(products.map((p) => [String(p.product_id), p.product_name]));
  return {
    spots: spots.map((s) => ({ id: String(s.spot_id), name: s.spot_name ?? s.name ?? "", address: s.spot_adress ?? s.address ?? "" })),
    spotId: await spotId(),
    items: [...menu.map((m) => ({ id: m.id, name: m.name.ro })), { id: "livrare", name: "Livrare în afara Stăuceni (50 lei)" }].map((m) => {
      const combo = COMBOS[m.id];
      if (combo) {
        const parts = [combo.burger, combo.side, combo.drink].map((x) => nameOf.get(map.get(x) ?? "") ?? "?");
        return { id: m.id, name: m.name, posterId: "combo", posterName: `se desface: ${parts.join(" + ")} (Pepsi 0 lei)` };
      }
      if (menuById.get(m.id)?.offer?.choose) {
        return { id: m.id, name: m.name, posterId: "bundle", posterName: "se desface: cele 3 pizza alese (465 lei împărțiți) + pizza gratis (0 lei)" };
      }
      const pid = map.get(m.id);
      return { id: m.id, name: m.name, posterId: pid ?? null, posterName: pid ? (nameOf.get(pid) ?? null) : null };
    }),
    posterProducts: products.filter((p) => p.hidden !== "1").map((p) => ({ id: String(p.product_id), name: p.product_name, category: p.category_name ?? "" })),
  };
}

// ───────── trimiterea comenzii ─────────

/** 069123456 → +37369123456; restul rămâne cum e (doar cifre și +). */
function phoneForPoster(raw: string) {
  const p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("373")) return `+${p}`;
  if (p.startsWith("0")) return `+373${p.slice(1)}`;
  return p;
}

/** id-ul de pe rândul comenzii → id-ul produsului din meniul site-ului. */
function baseId(lineId: string) {
  if (lineId.endsWith("-cadou")) return lineId.slice(0, -"-cadou".length);
  return lineId.split(":")[0];
}

/**
 * Trimite comanda pe casa Poster. Produsele fără corespondent în Poster nu se pierd:
 * apar în comentariul comenzii, ca să le vadă casierul.
 */
export async function sendOrderToPoster(o: OrderRecord, shortNo: string) {
  const map = await productMap();
  const body = new URLSearchParams();
  body.set("spot_id", await spotId());
  body.set("phone", phoneForPoster(o.phone));
  body.set("first_name", o.name);
  if (o.method === "delivery" && o.address) body.set("address", o.address);

  const missing: string[] = [];
  const details: string[] = [];
  const out: { pid: string; count: number; price: number }[] = [];
  const push = (siteId: string, count: number, price: number, label: string) => {
    const pid = map.get(siteId);
    if (pid) out.push({ pid, count, price });
    else missing.push(`${count}× ${label} — ${price * count} lei`);
  };

  for (const line of o.items) {
    const id = baseId(line.id);
    const combo = COMBOS[id];
    const item = menuById.get(id);
    if (combo) {
      // burger la prețul lui, cartofii cu restul până la prețul combo-ului, Pepsi cadou
      const burgerPrice = Math.min(menuById.get(combo.burger)?.price ?? line.price, line.price);
      push(combo.burger, line.qty, burgerPrice, menuById.get(combo.burger)?.name.ro ?? combo.burger);
      push(combo.side, line.qty, line.price - burgerPrice, "Cartofi fries (combo)");
      push(combo.drink, line.qty, 0, "Pepsi (cadou combo)");
      details.push(`${line.qty}× ${line.name}`);
    } else if (item?.offer?.choose && line.id.includes(":")) {
      // pachetul 3+1: id-ul rândului e „pizza-3-plus-1:a,b,c+gift”
      const [, rest = ""] = line.id.split(":");
      const [choiceStr = "", gift] = rest.split("+");
      const choices = choiceStr.split(",").filter(Boolean);
      const base = choices.map((c) => menuById.get(c)?.price ?? 0);
      const sum = base.reduce((a, b) => a + b, 0) || 1;
      // cei 465 lei se împart proporțional pe cele 3 pizza (ultima ia restul, ca totalul să fie exact)
      let left = line.price;
      choices.forEach((c, i) => {
        const p = i === choices.length - 1 ? left : Math.round((base[i] * line.price) / sum);
        left -= p;
        push(c, line.qty, p, menuById.get(c)?.name.ro ?? c);
      });
      if (gift) push(gift, line.qty, 0, `${menuById.get(gift)?.name.ro ?? gift} (gratis 3+1)`);
      details.push(`${line.qty}× ${line.name}`);
    } else {
      if (line.id.endsWith("-cadou")) details.push(`${line.qty}× ${line.name}`);
      push(id, line.qty, line.price, line.name);
    }
  }

  const n = out.length;

  const comment = [
    `COMANDĂ DE PE SITE #${shortNo} — sunați clientul pentru confirmare`,
    `Client: ${o.name}, tel. ${phoneForPoster(o.phone)}`,
    o.method === "delivery" ? `LIVRARE: ${o.address ?? ""}` : "RIDICARE de la local",
    `Plata: ${o.payment === "cash" ? "numerar" : "card"}`,
    `Total site: ${o.total} lei`,
    details.length ? `Detalii: ${details.join("; ")}` : "",
    missing.length ? `ATENȚIE, produse nepotrivite în Poster (adăugați manual): ${missing.join("; ")}` : "",
    o.notes ? `Obs.: ${o.notes}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  body.set("comment", comment.slice(0, 1000));

  if (n === 0) {
    // Poster cere cel puțin un produs: fără nicio potrivire, comanda rămâne doar în tabel/admin.
    throw new Error(`[poster] niciun produs al comenzii #${shortNo} nu are corespondent în Poster`);
  }
  // Variante de trimitere: dacă Poster refuză una, o încercăm pe următoarea (motivul fiecărei erori e păstrat).
  const base = Object.fromEntries(body) as Record<string, string>;
  const asForm = (withPrice: boolean) => {
    const f = new URLSearchParams(base);
    out.forEach((p, i) => {
      f.set(`products[${i}][product_id]`, p.pid);
      f.set(`products[${i}][count]`, String(p.count));
      if (withPrice) f.set(`products[${i}][price]`, String(Math.round(p.price * 100))); // în bani
    });
    return f;
  };
  const asJson = (withPrice: boolean) => ({
    ...base,
    spot_id: Number(base.spot_id),
    products: out.map((p) => ({ product_id: Number(p.pid), count: p.count, ...(withPrice ? { price: Math.round(p.price * 100) } : {}) })),
  });
  const attempts: [string, URLSearchParams | Record<string, unknown>][] = [
    ["form+preț", asForm(true)],
    ["json+preț", asJson(true)],
    ["form fără preț", asForm(false)],
    ["json fără preț", asJson(false)],
  ];
  const errors: string[] = [];
  for (const [label, payload] of attempts) {
    try {
      const res = await call<{ incoming_order_id?: number | string }>("incomingOrders.createIncomingOrder", { body: payload });
      if (errors.length) console.warn(`[poster] #${shortNo} a mers cu varianta „${label}” după: ${errors.join(" || ")}`);
      return res.incoming_order_id ?? null;
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(errors.join(" || "));
}

/** Folosit de serverul de comenzi: dacă nu e configurat Poster, nu face nimic. */
export async function forwardToPoster(o: OrderRecord, shortNo: string) {
  if (!posterEnabled()) return;
  // pe casă ajung toate comenzile (livrare și ridicare); POSTER_ONLY_DELIVERY=true le-ar limita la livrare
  if (o.method !== "delivery" && process.env.POSTER_ONLY_DELIVERY === "true") return;
  try {
    const id = await sendOrderToPoster(o, shortNo);
    console.info(`[poster] comanda #${shortNo} trimisă pe casă (incoming_order_id=${id})`);
  } catch (err) {
    console.error(`[poster] comanda #${shortNo} NU a ajuns pe casă`, err);
  }
}

