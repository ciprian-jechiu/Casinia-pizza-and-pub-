"use client";

import { useEffect, useState } from "react";

type Report = {
  enabled: boolean;
  error?: string;
  spotId?: string;
  spots?: { id: string; name: string; address: string }[];
  items?: { id: string; name: string; posterId: string | null; posterName: string | null }[];
  posterProducts?: { id: string; name: string; category: string }[];
};

/** Tabul „Poster” din admin: arată dacă site-ul e legat de casă și ce produse s-au potrivit. */
export function PosterStatus({ adminKey }: { adminKey: string }) {
  const [r, setR] = useState<Report | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/poster", { headers: { "x-admin-key": adminKey }, cache: "no-store" })
      .then((res) => res.json())
      .then((d) => alive && setR(d))
      .catch((e) => alive && setR({ enabled: true, error: String(e) }));
    return () => {
      alive = false;
    };
  }, [adminKey]);

  if (!r) return <p className="text-crema-dim">Se verifică legătura cu Poster…</p>;
  if (!r.enabled)
    return (
      <p className="max-w-xl text-crema-dim">
        Poster nu e conectat. Adaugă variabila <code className="text-crema">POSTER_TOKEN</code> pe Vercel (Settings → Environment Variables), apoi Redeploy.
      </p>
    );
  if (r.error) return <p role="alert" className="max-w-2xl text-errore">Eroare Poster: {r.error}</p>;

  const missing = r.items?.filter((i) => !i.posterId) ?? [];
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-linia bg-legno/60 p-5 text-sm">
        <p className="font-display text-xl text-basilico">Conectat la Poster ✓</p>
        <p className="mt-2 text-crema-dim">
          Localul folosit: <span className="text-crema">{r.spots?.find((s) => s.id === r.spotId)?.name || r.spotId}</span>
          {r.spots && r.spots.length > 1 && <> · în cont sunt {r.spots.length} localuri ({r.spots.map((s) => `${s.name} #${s.id}`).join(", ")})</>}
        </p>
        <p className="mt-1 text-crema-dim">
          Produse potrivite: <span className="text-crema">{(r.items?.length ?? 0) - missing.length}</span> din {r.items?.length ?? 0}.
          {missing.length > 0 && " Cele nepotrivite apar în comentariul comenzii pe casă."}
        </p>
      </div>

      <div className="overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-crema-dim">
            <tr className="border-b border-linia">
              <th className="py-2 font-normal">Produs pe site</th>
              <th className="py-2 font-normal">Produs în Poster</th>
            </tr>
          </thead>
          <tbody>
            {r.items?.map((i) => (
              <tr key={i.id} className="border-b border-linia/60">
                <td className="py-2.5">{i.name}</td>
                <td className={`py-2.5 ${i.posterId ? "" : "text-errore"}`}>{i.posterId ? `${i.posterName} (#${i.posterId})` : "— negăsit"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missing.length > 0 && (
        <details className="text-sm text-crema-dim">
          <summary className="cursor-pointer text-crema">Toate produsele din Poster ({r.posterProducts?.length})</summary>
          <ul className="mt-3 columns-2 gap-8">
            {r.posterProducts?.map((p) => (
              <li key={p.id}>
                {p.name} <span className="opacity-60">#{p.id} · {p.category}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
