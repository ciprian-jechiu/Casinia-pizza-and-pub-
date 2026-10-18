import "server-only";
import { menu } from "./menu";
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

async function call<T>(method: string, init?: { body?: URLSearchParams; params?: Record<string, string> }): Promise<T> {
  const token = process.env.POSTER_TOKEN;
  if (!token) throw new Error("[poster] POSTER_TOKEN lipsește");
  const qs = new URLSearchParams({ token, ...(init?.params ?? {}) });
  const res = await fetch(`${API}/${method}?${qs}`, {
    method: init?.body ? "POST" : "GET",
    headers: init?.body ? { "content-type": "application/x-www-form-urlencoded" } : undefined,
    body: init?.body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => null)) as { response?: T; error?: unknown; message?: string } | null;
  if (!res.ok || !data || data.error || data.response === undefined) {
    throw new Error(`[poster] ${method}: ${res.status} ${JSON.stringify(data?.error ?? data?.message ?? data).slice(0, 300)}`);
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

  const map = new Map<string, string>();
  for (const item of menu) {
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
  let n = 0;
  for (const line of o.items) {
    const pid = map.get(baseId(line.id));
    // pachetul 3+1 și cadourile au detalii (ce pizza) — le punem și în comentariu
    if (line.id.includes(":") || line.id.endsWith("-cadou")) details.push(`${line.qty}× ${line.name}`);
    if (!pid) {
      missing.push(`${line.qty}× ${line.name} — ${line.price * line.qty} lei`);
      continue;
    }
    body.set(`products[${n}][product_id]`, pid);
    body.set(`products[${n}][count]`, String(line.qty));
    body.set(`products[${n}][price]`, String(Math.round(line.price * 100))); // în bani (kopecks)
    n++;
  }

  const comment = [
    `Site #${shortNo}`,
    o.method === "delivery" ? `LIVRARE: ${o.address ?? ""}` : "RIDICARE de la local",
    `Ora: ${o.scheduled_time ?? "cât mai repede"}`,
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
  const res = await call<{ incoming_order_id?: number | string }>("incomingOrders.createIncomingOrder", { body });
  return res.incoming_order_id ?? null;
}

/** Folosit de serverul de comenzi: dacă nu e configurat Poster, nu face nimic. */
export async function forwardToPoster(o: OrderRecord, shortNo: string) {
  if (!posterEnabled()) return;
  try {
    const id = await sendOrderToPoster(o, shortNo);
    console.info(`[poster] comanda #${shortNo} trimisă pe casă (incoming_order_id=${id})`);
  } catch (err) {
    console.error(`[poster] comanda #${shortNo} NU a ajuns pe casă`, err);
  }
}

