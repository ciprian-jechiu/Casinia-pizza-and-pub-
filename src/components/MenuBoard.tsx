"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useI18n } from "./I18nProvider";
import { AddToCart } from "./AddToCart";
import { getLenis } from "./SmoothScroll";
import { PromoBadge, PromoBanner } from "./PromoBanner";
import { OfferPicker } from "./OfferPicker";
import { site } from "@/lib/site";
import { categories, imageSize, itemsByCategory, menuImage, type CategoryId, type MenuItem } from "@/lib/menu";
import { formatPrice } from "@/lib/i18n";

/** Meniul complet: file de categorii lipite sus + liste cu puncte de legătură până la preț. */
export function MenuBoard() {
  const { locale, dict } = useI18n();
  const [active, setActive] = useState<CategoryId>("oferte");
  const sections = useRef<Map<CategoryId, HTMLElement>>(new Map());

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id as CategoryId);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (id: CategoryId) => {
    const el = sections.current.get(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -150 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
      <PromoBanner className="mb-10" />
      <nav className="sticky top-[4.5rem] z-40 -mx-4 mb-10 border-b border-linia bg-notte px-4 py-3 sm:-mx-8 sm:px-8" aria-label={dict.nav.menu}>
        <ul className="flex gap-2 overflow-x-auto" data-lenis-prevent-touch>
          {categories.map((c) => (
            <li key={c.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => jump(c.id)}
                aria-current={active === c.id ? "true" : undefined}
                className={`relative z-10 min-h-11 rounded-full px-4 text-sm transition-colors ${active === c.id ? "text-notte" : "text-crema-dim hover:text-crema"}`}
              >
                {c.name[locale]}
              </button>
              {active === c.id && (
                <motion.span layoutId="menu-tab" className="absolute inset-0 rounded-full bg-ottone" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              )}
            </li>
          ))}
        </ul>
      </nav>

      {categories.map((c) => {
        const items = itemsByCategory(c.id);
        return (
          <section
            key={c.id}
            id={c.id}
            ref={(el) => {
              if (el) sections.current.set(c.id, el);
            }}
            className="scroll-mt-36 pb-20"
            aria-labelledby={`cat-${c.id}`}
          >
            <h2 id={`cat-${c.id}`} className="mb-8 text-[clamp(2.2rem,4vw,3.4rem)] leading-none">{c.name[locale]}</h2>
            {c.id === "oferte" ? (
              <OffersGrid items={items} />
            ) : (
            <ul className={`grid gap-x-12 gap-y-10 ${c.id === "pizza" ? "lg:grid-cols-2" : "md:grid-cols-2"}`}>
              {items.map((it) => (
                <li key={it.id} className="flex gap-5">
                  {it.image ? (
                    <Link href={`/${locale}/meniu/${it.id}`} tabIndex={-1} aria-hidden className="relative size-24 shrink-0">
                      <span className="arch absolute inset-0 bg-legno">
                        <Image src={menuImage(it.image, 320)} alt="" fill sizes="6rem" className="object-cover transition-transform duration-700 hover:scale-105" />
                      </span>
                      {it.category === "pizza" && <PromoBadge className="absolute -right-2 -top-2 z-10" />}
                    </Link>
                  ) : (
                    <div className="hidden size-24 shrink-0 sm:block" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-2xl leading-tight">
                        <Link href={`/${locale}/meniu/${it.id}`} className="underline-offset-4 hover:text-ottone hover:underline">
                          {it.name[locale]}
                        </Link>
                      </h3>
                      <span className="leader" aria-hidden />
                      <span className="shrink-0 font-display text-xl text-ottone tabular-nums">{formatPrice(it.price, locale)}</span>
                    </div>
                    {(it.description || it.weight) && (
                      <p className="mt-1.5 text-sm leading-relaxed text-crema-dim">
                        {it.description?.[locale]}
                        {it.weight && <span className="whitespace-nowrap text-crema-dim/70"> · {it.weight}</span>}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <AddToCart id={it.id} compact />
                      {it.signature && <span className="text-xs text-ottone">{dict.menuPage.signature}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Rubrica „Oferte”: afișele Casinia ca și carduri, cu prețul și butonul de comandă. */
function OffersGrid({ items }: { items: MenuItem[] }) {
  const { locale, dict } = useI18n();
  return (
    <>
      <p className="-mt-4 mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-crema-dim">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ottone" aria-hidden>
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        </svg>
        {dict.offers.lead} <span className="text-crema">{site.ordering.deliveryZones.join(" · ")}</span>
      </p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const [w, h] = imageSize(it.id);
          return (
            <li key={it.id} className="group flex flex-col overflow-hidden rounded-[20px] border border-linia bg-legno/60">
              <Link href={`/${locale}/meniu/${it.id}`} className="relative block aspect-[2/3] overflow-hidden bg-[#f3e6cf]" aria-label={it.name[locale]}>
                {it.image && (
                  <Image
                    src={menuImage(it.image, 640)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className={`transition-transform duration-700 group-hover:scale-[1.03] ${h / w > 1.7 ? "object-cover object-top" : "object-cover"}`}
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl leading-tight">
                    <Link href={`/${locale}/meniu/${it.id}`} className="hover:text-ottone">{it.name[locale]}</Link>
                  </h3>
                  <span className="shrink-0 font-display text-2xl text-ottone tabular-nums">{formatPrice(it.price, locale)}</span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-crema-dim">{it.description?.[locale]}</p>
                <p className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-ottone">{dict.offers.deliveryBadge}</p>
                <div className="mt-4">{it.offer?.choose ? <OfferPicker item={it} compact /> : <AddToCart id={it.id} compact />}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
