"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import { formatPrice } from "@/lib/i18n";
import type { OrderRecord, ReservationRecord } from "@/lib/db";
import type { Status } from "@/lib/validation";
import { PosterStatus } from "./PosterStatus";

const KEY = "casinia-admin-key";
const statuses: Status[] = ["new", "confirmed", "done", "cancelled"];
const statusColor: Record<Status, string> = {
  new: "bg-pomodoro text-crema",
  confirmed: "bg-ottone text-notte",
  done: "bg-basilico text-notte",
  cancelled: "bg-legno-2 text-crema-dim",
};

export function AdminPanel() {
  const { locale, dict } = useI18n();
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"orders" | "reservations" | "poster">("orders");
  const [data, setData] = useState<{ orders: OrderRecord[]; reservations: ReservationRecord[]; storage?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    async (k: string) => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin", { headers: { "x-admin-key": k }, cache: "no-store" });
        if (res.status === 401) {
          setError(dict.admin.wrong);
          setKey(null);
          sessionStorage.removeItem(KEY);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setData(await res.json());
        setKey(k);
        setError("");
      } catch {
        setError(dict.errors.generic.replace("{phone}", "—"));
      } finally {
        setLoading(false);
      }
    },
    [dict],
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    // sesiunea salvată se reîncarcă după montare (sessionStorage nu există pe server)
    if (saved) queueMicrotask(() => void load(saved));
  }, [load]);

  // reîmprospătare automată la 30 de secunde, cât panoul e deschis
  useEffect(() => {
    if (!key) return;
    const id = window.setInterval(() => load(key), 30_000);
    return () => window.clearInterval(id);
  }, [key, load]);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const k = String(new FormData(e.currentTarget).get("password") ?? "");
    sessionStorage.setItem(KEY, k);
    await load(k);
  }

  async function setStatus(table: "orders" | "reservations", id: string, status: Status) {
    if (!key) return;
    setData((d) =>
      d
        ? {
            ...d,
            [table]: (d[table] as { id: string; status: Status }[]).map((r) => (r.id === id ? { ...r, status } : r)),
          }
        : d,
    );
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ table, id, status }),
    });
  }

  async function exportExcel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!key) return;
    const qs = new URLSearchParams(
      [...new FormData(e.currentTarget)].map(([k, v]) => [k, String(v)] as [string, string]).filter(([, v]) => v),
    );
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/export?${qs}`, { headers: { "x-admin-key": key }, cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "casinia-rezervari.xlsx";
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(dict.errors.generic.replace("{phone}", "—"));
    } finally {
      setExporting(false);
    }
  }

  const when = (iso: string) =>
    new Intl.DateTimeFormat("ro-MD", { timeZone: "Europe/Chisinau", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

  if (!key || !data) {
    return (
      <form onSubmit={login} className="max-w-sm space-y-4">
        <label htmlFor="pw" className="block text-sm text-crema-dim">{dict.admin.password}</label>
        <input id="pw" name="password" type="password" autoComplete="current-password" className="field" required />
        {error && <p role="alert" className="text-sm text-errore">{error}</p>}
        <button className="btn btn-brass" disabled={loading}>{dict.admin.login}</button>
      </form>
    );
  }

  const StatusSelect = ({ table, id, value }: { table: "orders" | "reservations"; id: string; value: Status }) => (
    <select
      value={value}
      onChange={(e) => setStatus(table, id, e.target.value as Status)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusColor[value]}`}
      aria-label="Status"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{dict.admin.status[s]}</option>
      ))}
    </select>
  );

  const newCount = (rows: { status: Status }[]) => rows.filter((r) => r.status === "new").length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {(["orders", "reservations"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className="chip">
            {t === "orders" ? dict.admin.orders : dict.admin.reservations}
            {newCount(data[t]) > 0 && <span className="ml-2 rounded-full bg-pomodoro px-2 text-xs text-crema">{newCount(data[t])}</span>}
          </button>
        ))}
        <button type="button" onClick={() => setTab("poster")} aria-pressed={tab === "poster"} className="chip">Poster</button>
        <button type="button" className="chip ml-auto" onClick={() => load(key)} disabled={loading}>{dict.admin.refresh}</button>
        <button type="button" className="chip" onClick={() => { sessionStorage.removeItem(KEY); setKey(null); setData(null); }}>{dict.admin.logout}</button>
      </div>

      {data.storage === false && tab !== "poster" && (
        <p className="mb-6 rounded-xl border border-ottone/40 bg-legno/60 px-4 py-3 text-sm text-crema-dim">
          Comenzile și rezervările nu se salvează încă: lipsește legătura cu tabelul Google (GOOGLE_SHEETS_URL și GOOGLE_SHEETS_SECRET pe Vercel).
          Comenzile ajung totuși pe casa Poster, dacă e conectată.
        </p>
      )}
      {tab === "poster" ? (
        <PosterStatus adminKey={key} />
      ) : tab === "orders" ? (
        data.orders.length === 0 ? (
          <p className="text-crema-dim">{dict.admin.none}</p>
        ) : (
          <ul className="space-y-4">
            {data.orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-linia bg-legno/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl">#{o.id.replace(/-/g, "").slice(0, 6).toUpperCase()} · {o.name}</p>
                    <p className="text-sm text-crema-dim">
                      <a className="text-crema hover:text-ottone" href={`tel:${o.phone}`}>{o.phone}</a> · {when(o.created_at)} ·{" "}
                      {o.method === "delivery" ? `${dict.checkout.delivery}: ${o.address}` : dict.checkout.pickup} ·{" "}
                      {o.scheduled_time ?? dict.checkout.asap} · {o.payment === "cash" ? dict.checkout.cash : "Card"}
                    </p>
                  </div>
                  <StatusSelect table="orders" id={o.id} value={o.status} />
                </div>
                <ul className="mt-3 text-sm">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between border-b border-linia/50 py-1">
                      <span>{i.qty} × {i.name}</span>
                      <span className="tabular-nums">{formatPrice(i.qty * i.price, locale)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-sm text-crema-dim">{o.notes}</span>
                  <span className="font-display text-2xl text-ottone">{formatPrice(o.total, locale)}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
        <form onSubmit={exportExcel} className="mb-8 rounded-2xl border border-linia bg-legno/60 p-5">
          <p className="mb-4 font-display text-xl">{dict.admin.exportTitle}</p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block text-sm text-crema-dim">
              {dict.admin.exportFrom}
              <input type="date" name="from" className="field mt-1 w-44" />
            </label>
            <label className="block text-sm text-crema-dim">
              {dict.admin.exportTo}
              <input type="date" name="to" className="field mt-1 w-44" />
            </label>
            <label className="block text-sm text-crema-dim">
              Status
              <select name="status" className="field mt-1 w-48" defaultValue="">
                <option value="">{dict.admin.exportAllStatuses}</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{dict.admin.status[s]}</option>
                ))}
              </select>
            </label>
            <button className="btn btn-brass" disabled={exporting}>{exporting ? dict.admin.exporting : dict.admin.exportButton}</button>
          </div>
          <p className="mt-3 text-xs text-crema-dim">{dict.admin.exportHint}</p>
          {error && <p role="alert" className="mt-2 text-sm text-errore">{error}</p>}
        </form>
        {data.reservations.length === 0 ? (
        <p className="text-crema-dim">{dict.admin.none}</p>
      ) : (
        <div className="overflow-x-auto" data-lenis-prevent>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-crema-dim">
              <tr className="border-b border-linia">
                <th className="py-2 font-normal">{dict.reservation.date}</th>
                <th className="py-2 font-normal">{dict.reservation.time}</th>
                <th className="py-2 font-normal">{dict.reservation.guests}</th>
                <th className="py-2 font-normal">{dict.reservation.name}</th>
                <th className="py-2 font-normal">{dict.reservation.phone}</th>
                <th className="py-2 font-normal">{dict.reservation.notes}</th>
                <th className="py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.reservations.map((r) => (
                <tr key={r.id} className="border-b border-linia/60 align-top">
                  <td className="py-3 tabular-nums">{r.date}</td>
                  <td className="py-3 tabular-nums">{r.time}</td>
                  <td className="py-3">{r.guests}</td>
                  <td className="py-3">{r.name}</td>
                  <td className="py-3"><a className="hover:text-ottone" href={`tel:${r.phone}`}>{r.phone}</a></td>
                  <td className="max-w-56 py-3 text-crema-dim">{r.notes}</td>
                  <td className="py-3"><StatusSelect table="reservations" id={r.id} value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}
    </div>
  );
}
