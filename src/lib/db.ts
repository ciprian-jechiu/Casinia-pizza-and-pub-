import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Status } from "./validation";

export type OrderLine = { id: string; name: string; qty: number; price: number };

export type OrderRecord = {
  id: string;
  created_at: string;
  status: Status;
  locale: string;
  name: string;
  phone: string;
  method: "pickup" | "delivery";
  address: string | null;
  scheduled_time: string | null;
  payment: "cash" | "card";
  notes: string | null;
  items: OrderLine[];
  total: number;
};

export type ReservationRecord = {
  id: string;
  created_at: string;
  status: Status;
  locale: string;
  name: string;
  phone: string;
  email: string | null;
  date: string;
  time: string;
  guests: number;
  notes: string | null;
};

type NewOrder = Omit<OrderRecord, "id" | "created_at" | "status">;
type NewReservation = Omit<ReservationRecord, "id" | "created_at" | "status">;

export interface Store {
  createOrder(o: NewOrder): Promise<OrderRecord>;
  createReservation(r: NewReservation): Promise<ReservationRecord>;
  listOrders(): Promise<OrderRecord[]>;
  listReservations(): Promise<ReservationRecord[]>;
  /** Toate rezervările, fără limită (pentru exportul în Excel). */
  listAllReservations(): Promise<ReservationRecord[]>;
  setStatus(table: "orders" | "reservations", id: string, status: Status): Promise<void>;
}

// ───────── Supabase (producție) ─────────

class SupabaseStore implements Store {
  constructor(private db: SupabaseClient) {}

  async createOrder(o: NewOrder) {
    const { data, error } = await this.db.from("orders").insert(o).select().single();
    if (error) throw error;
    return data as OrderRecord;
  }
  async createReservation(r: NewReservation) {
    const { data, error } = await this.db.from("reservations").insert(r).select().single();
    if (error) throw error;
    return data as ReservationRecord;
  }
  async listOrders() {
    const { data, error } = await this.db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data as OrderRecord[];
  }
  async listReservations() {
    const { data, error } = await this.db
      .from("reservations")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(300);
    if (error) throw error;
    return data as ReservationRecord[];
  }
  async listAllReservations() {
    const all: ReservationRecord[] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await this.db
        .from("reservations")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .range(from, from + page - 1);
      if (error) throw error;
      all.push(...(data as ReservationRecord[]));
      if (!data || data.length < page) break;
    }
    return all;
  }
  async setStatus(table: "orders" | "reservations", id: string, status: Status) {
    const { error } = await this.db.from(table).update({ status }).eq("id", id);
    if (error) throw error;
  }
}

// ───────── Fișier local (doar dezvoltare, fără Supabase) ─────────

class FileStore implements Store {
  private file = path.join(process.cwd(), ".data", "store.json");

  private async read(): Promise<{ orders: OrderRecord[]; reservations: ReservationRecord[] }> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      return { orders: [], reservations: [] };
    }
  }
  private async write(data: { orders: OrderRecord[]; reservations: ReservationRecord[] }) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(data, null, 2));
  }
  private meta() {
    return { id: crypto.randomUUID(), created_at: new Date().toISOString(), status: "new" as const };
  }

  async createOrder(o: NewOrder) {
    const data = await this.read();
    const rec = { ...this.meta(), ...o };
    data.orders.unshift(rec);
    await this.write(data);
    return rec;
  }
  async createReservation(r: NewReservation) {
    const data = await this.read();
    const rec = { ...this.meta(), ...r };
    data.reservations.push(rec);
    await this.write(data);
    return rec;
  }
  async listOrders() {
    return (await this.read()).orders;
  }
  async listReservations() {
    return (await this.read()).reservations.sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    );
  }
  async listAllReservations() {
    return this.listReservations();
  }
  async setStatus(table: "orders" | "reservations", id: string, status: Status) {
    const data = await this.read();
    const row = (data[table] as { id: string; status: Status }[]).find((r) => r.id === id);
    if (row) row.status = status;
    await this.write(data);
  }
}

// ───────── Google Sheets (tabelul e baza de date) ─────────

/**
 * Vorbește cu scriptul din tabel (google-sheets/Code.gs), publicat ca aplicație web.
 * Fiecare rezervare/comandă devine imediat un rând în tabel; statusul schimbat în tabel apare și în admin.
 */
class SheetsStore implements Store {
  constructor(
    private url: string,
    private secret: string,
  ) {}

  private async call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: this.secret, action, ...payload }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let data: { error?: string } & T;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`[sheets] răspuns invalid (${res.status}): ${text.slice(0, 120)}`);
    }
    if (data.error) throw new Error(`[sheets] ${data.error}`);
    return data;
  }

  async createOrder(o: NewOrder | OrderRecord) {
    this.cached = null;
    return (await this.call<{ record: OrderRecord }>("createOrder", { data: o })).record;
  }
  async createReservation(r: NewReservation | ReservationRecord) {
    this.cached = null;
    return (await this.call<{ record: ReservationRecord }>("createReservation", { data: r })).record;
  }
  // panoul cere comenzile și rezervările deodată → un singur apel la tabel
  private cached: { at: number; p: Promise<{ orders: OrderRecord[]; reservations: ReservationRecord[] }> } | null = null;
  private list() {
    if (!this.cached || Date.now() - this.cached.at > 2000) {
      const p = this.call<{ orders: OrderRecord[]; reservations: ReservationRecord[] }>("list");
      p.catch(() => (this.cached = null));
      this.cached = { at: Date.now(), p };
    }
    return this.cached.p;
  }
  async listOrders() {
    return (await this.list()).orders;
  }
  async listReservations() {
    return (await this.list()).reservations;
  }
  async listAllReservations() {
    return (await this.list()).reservations;
  }
  async setStatus(table: "orders" | "reservations", id: string, status: Status) {
    this.cached = null;
    await this.call("setStatus", { table, id, status });
  }
}

/**
 * Supabase rămâne baza principală, iar tabelul primește o copie a fiecărui rând (același ID),
 * plus schimbările de status. Dacă Google nu răspunde, rezervarea tot se salvează.
 */
class MirroredStore implements Store {
  constructor(
    private primary: Store,
    private sheets: SheetsStore,
  ) {}
  private async mirror(what: string, fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (err) {
      console.error(`[sheets] copierea în tabel a eșuat (${what})`, err);
    }
  }
  async createOrder(o: NewOrder) {
    const rec = await this.primary.createOrder(o);
    await this.mirror("comandă", () => this.sheets.createOrder(rec));
    return rec;
  }
  async createReservation(r: NewReservation) {
    const rec = await this.primary.createReservation(r);
    await this.mirror("rezervare", () => this.sheets.createReservation(rec));
    return rec;
  }
  listOrders() {
    return this.primary.listOrders();
  }
  listReservations() {
    return this.primary.listReservations();
  }
  listAllReservations() {
    return this.primary.listAllReservations();
  }
  async setStatus(table: "orders" | "reservations", id: string, status: Status) {
    await this.primary.setStatus(table, id, status);
    await this.mirror("status", () => this.sheets.setStatus(table, id, status));
  }
}

let store: Store | null | undefined;

/**
 * Store-ul activ:
 *  - Supabase (+ copie în Google Sheets, dacă e configurat),
 *  - altfel Google Sheets ca bază de date,
 *  - altfel fișier local (doar în dezvoltare); null în producție fără configurare.
 */
export function getStore(): Store | null {
  if (store !== undefined) return store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
  const sheetsSecret = process.env.GOOGLE_SHEETS_SECRET;
  const sheets = sheetsUrl && sheetsSecret ? new SheetsStore(sheetsUrl, sheetsSecret) : null;
  if (url && key) {
    const supabase = new SupabaseStore(createClient(url, key, { auth: { persistSession: false } }));
    store = sheets ? new MirroredStore(supabase, sheets) : supabase;
  } else if (sheets) {
    store = sheets;
  } else if (process.env.NODE_ENV !== "production") {
    store = new FileStore();
  } else {
    store = null;
  }
  return store;
}

/** Număr scurt de comandă afișat clientului, derivat din UUID. */
export const shortId = (uuid: string) => uuid.replace(/-/g, "").slice(0, 6).toUpperCase();
