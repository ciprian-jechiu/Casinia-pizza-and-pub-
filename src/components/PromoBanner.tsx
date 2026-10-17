"use client";

import { useI18n } from "./I18nProvider";

/** Oferta „Pizza 3+1”, afișată la începutul meniului. */
export function PromoBanner({ className = "" }: { className?: string }) {
  const { dict } = useI18n();
  const p = dict.promo;
  return (
    <aside
      aria-label={p.title}
      className={`relative overflow-hidden rounded-[22px] border border-ottone/40 bg-gradient-to-br from-legno-2 via-legno to-notte p-6 sm:flex sm:items-center sm:gap-8 sm:p-8 ${className}`}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-ottone/10 blur-2xl" />
      <PromoBadge size="lg" className="relative mb-5 sm:mb-0" />
      <div className="relative">
        <p className="eyebrow text-ottone">{p.title}</p>
        <p className="mt-2 font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight">{p.lead}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-crema-dim sm:text-base">{p.body}</p>
      </div>
    </aside>
  );
}

/** Cercul „3+1” pus pe fotografiile pizzelor. */
export function PromoBadge({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = size === "lg" ? "size-24 text-3xl" : size === "md" ? "size-14 text-lg" : "size-9 text-[0.72rem]";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-ottone font-display font-semibold leading-none text-notte shadow-[0_6px_18px_-6px_rgb(0_0_0/.6)] ${s} ${className}`}
    >
      3+1
    </span>
  );
}
