"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "./I18nProvider";
import { AddToCart } from "./AddToCart";
import { getLenis } from "./SmoothScroll";
import { menuById, menuImage, type MenuItem } from "@/lib/menu";

/**
 * Oferta „Pizza 3+1”: butonul deschide o fereastră în care clientul alege cele 4 pizza
 * (aceeași pizza poate fi aleasă de mai multe ori), apoi oferta intră în coș cu alegerile.
 */
export function OfferPicker({ item, compact = false, className = "" }: { item: MenuItem; compact?: boolean; className?: string }) {
  const { locale, dict } = useI18n();
  const t = dict.offers;
  const rule = item.offer!.choose!;
  const giftFrom = item.offer?.gift ?? [];
  const [open, setOpen] = useState(false);
  const [gift, setGift] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const panel = useRef<HTMLDivElement>(null);

  const chosen = Object.values(counts).reduce((a, b) => a + b, 0);
  const left = rule.count - chosen;
  const choices = Object.entries(counts).flatMap(([id, n]) => Array<string>(n).fill(id));

  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  const change = (id: string, d: number) =>
    setCounts((c) => {
      const next = Math.max(0, (c[id] ?? 0) + d);
      if (d > 0 && left <= 0) return c;
      const copy = { ...c, [id]: next };
      if (!next) delete copy[id];
      return copy;
    });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`btn btn-brass ${compact ? "min-h-10 px-4 text-sm" : ""} ${className}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        {t.choose}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[70] bg-notte/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="panel"
              ref={panel}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="offer-picker-title"
              data-lenis-prevent
              className="fixed inset-x-0 bottom-0 z-[80] mx-auto flex max-h-[92svh] w-full max-w-2xl flex-col rounded-t-[26px] border border-linia bg-legno outline-none sm:inset-y-0 sm:my-auto sm:h-fit sm:rounded-[26px]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-linia px-6 py-5">
                <div>
                  <h2 id="offer-picker-title" className="text-3xl leading-tight">{t.chooseTitle}</h2>
                  <p className="mt-1 text-sm text-crema-dim">{t.chooseLead}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-legno-2" aria-label={t.close}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="eyebrow px-2 pb-2 pt-1 text-crema-dim">{t.paidTitle}</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {rule.from.map((id) => {
                  const p = menuById.get(id);
                  if (!p) return null;
                  const n = counts[id] ?? 0;
                  return (
                    <li key={id} className={`flex items-center gap-3 rounded-2xl p-2 transition-colors ${n ? "bg-legno-2" : ""}`}>
                      <div className="arch relative size-14 shrink-0 bg-legno-2">
                        {p.image && <Image src={menuImage(p.image, 200)} alt="" fill sizes="56px" className="object-cover" />}
                      </div>
                      <span className="min-w-0 flex-1 font-display text-lg leading-tight">{p.name[locale]}</span>
                      <div className="flex items-center rounded-full border border-linia">
                        <button type="button" className="grid size-10 place-items-center text-lg disabled:opacity-30" onClick={() => change(id, -1)} disabled={!n} aria-label={`− ${p.name[locale]}`}>
                          −
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums" aria-live="polite">{n}</span>
                        <button type="button" className="grid size-10 place-items-center text-lg disabled:opacity-30" onClick={() => change(id, 1)} disabled={left <= 0} aria-label={`+ ${p.name[locale]}`}>
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {giftFrom.length > 0 && (
                <>
                  <p className="eyebrow px-2 pb-2 pt-5 text-ottone">{t.giftTitle}</p>
                  <div className="grid grid-cols-3 gap-2 px-1 pb-1" role="radiogroup" aria-label={t.giftTitle}>
                    {giftFrom.map((id) => {
                      const g = menuById.get(id);
                      if (!g) return null;
                      const on = gift === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setGift(id)}
                          className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-sm leading-tight transition-colors ${
                            on ? "border-ottone bg-ottone/15 text-crema" : "border-linia text-crema-dim hover:border-crema-dim"
                          }`}
                        >
                          <span className="arch relative block size-14 bg-legno-2">
                            {g.image && <Image src={menuImage(g.image, 200)} alt="" fill sizes="56px" className="object-cover" />}
                          </span>
                          {g.name[locale]}
                          <span className="text-xs text-ottone">{dict.promo.free}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linia px-6 py-4">
                <p className="text-sm" aria-live="polite">
                  <span className="text-ottone">{t.chosen.replace("{n}", String(chosen)).replace("{total}", String(rule.count))}</span>
                  {left > 0 && <span className="text-crema-dim"> · {t.chooseMore.replace("{n}", String(left))}</span>}
                </p>
                <AddToCart
                  id={item.id}
                  choices={choices}
                  gift={gift ?? undefined}
                  disabled={left !== 0 || (giftFrom.length > 0 && !gift)}
                  label={t.add}
                  onAdded={() =>
                    window.setTimeout(() => {
                      setOpen(false);
                      setCounts({});
                      setGift(null);
                    }, 700)
                  }
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
