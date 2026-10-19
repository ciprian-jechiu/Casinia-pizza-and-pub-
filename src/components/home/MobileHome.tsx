"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { fill, useI18n } from "../I18nProvider";
import { AddToCart } from "../AddToCart";
import { categories, imageSize, itemsByCategory, menuImage, type CategoryId } from "@/lib/menu";
import { formatPrice } from "@/lib/i18n";
import { REVIEWS } from "@/lib/scenes";
import { site } from "@/lib/site";
import { useClientValue } from "@/lib/useClient";

/** Ziua și ora curentă în Chișinău: [ziua 0–6, minute de la miezul nopții]. */
function chisinauNow(): [number, number] {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Chisinau", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return [day, Number(parts.hour) * 60 + Number(parts.minute)];
}
const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** „open|22:00”, „closed|10:00” sau „today|10:00–22:00” — doar în browser (ora reală). */
function openState(): string {
  const [day, now] = chisinauNow();
  const today = site.hours.find((h) => h.day === day);
  if (today && now >= toMin(today.open) && now < toMin(today.close)) return `open|${today.close}`;
  if (today && now < toMin(today.open)) return `closed|${today.open}`;
  const tomorrow = site.hours.find((h) => h.day === (day + 1) % 7);
  return tomorrow ? `closed|${tomorrow.open}` : "";
}

const QUICK: CategoryId[] = categories.map((c) => c.id).filter((id) => id !== "oferte");

/**
 * Pagina principală pe telefon: totul la îndemână din primul ecran.
 * Fotografie mare + rating + program → oferte → comandă rapidă pe categorii →
 * livrare/program/adresă → rezervare → povestea → evenimente → recenzii.
 * Pe laptop rămân scenele animate (vezi HomeSwitch).
 */
export function MobileHome() {
  const { locale, dict } = useI18n();
  const t = dict.mobile;
  const [cat, setCat] = useState<CategoryId>("pizza");
  const state = useClientValue(openState);
  const [stateKind, stateTime] = (state ?? "").split("|");
  const offers = itemsByCategory("oferte");
  const items = itemsByCategory(cat);
  const todayHours = useClientValue(() => {
    const h = site.hours.find((x) => x.day === chisinauNow()[0]);
    return h ? `${h.open}–${h.close}` : "";
  });
  const story = dict.home.story.join(" ").replace(/[{}]/g, "").toLowerCase();

  return (
    <div className="bg-notte">
      {/* ── 1. primul ecran ── */}
      <section data-header-tone="dark" className="relative h-[86svh] min-h-[540px] overflow-hidden">
        <Image src="/menu/pizza-casinia.jpg" alt={dict.home.headline} fill priority sizes="100vw" className="object-cover object-[38%_50%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(28_7_10/.7)_0%,rgb(28_7_10/0)_24%,rgb(28_7_10/.15)_48%,rgb(43_11_16/.97)_88%,var(--color-notte)_100%)]" />
        <div className="absolute inset-x-5 bottom-7 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 text-[0.8rem] font-semibold">
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-crema/15 px-3 backdrop-blur-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" className="text-ottone" fill="currentColor" aria-hidden>
                <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z" />
              </svg>
              {fill(t.rating, { value: site.rating.value.toLocaleString(locale === "en" ? "en-GB" : locale) })}
            </a>
            {stateKind && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-crema/15 px-3 backdrop-blur-sm">
                <span className={`size-[7px] rounded-full ${stateKind === "open" ? "bg-basilico-light" : "bg-ottone-soft"}`} aria-hidden />
                {fill(stateKind === "open" ? t.openUntil : t.closedNow, { time: stateTime })}
              </span>
            )}
          </div>
          <h1 className="font-display text-[2.6rem] leading-[1.04]">
            {t.heroTitle}
            <br />
            <i className="text-ottone">{t.heroAccent}</i>
          </h1>
          <p className="text-[0.95rem] leading-relaxed text-crema-dim">{t.heroLead}</p>
          <div className="flex gap-2.5">
            <a href="#comanda-rapida" className="btn btn-brass h-12 flex-1 justify-center">
              {dict.nav.order}
            </a>
            <Link href={`/${locale}/rezervare`} className="btn btn-ghost h-12 flex-1 justify-center">
              {dict.home.reserve}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. oferte ── */}
      {offers.length > 0 && (
        <section className="pt-4" aria-labelledby="m-offers">
          <div className="flex items-baseline justify-between px-4 pb-3">
            <h2 id="m-offers" className="font-display text-2xl">{t.offersTitle}</h2>
            <Link href={`/${locale}/meniu#oferte`} className="py-2 text-sm font-semibold text-ottone">
              {t.seeAll} →
            </Link>
          </div>
          <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" data-lenis-prevent-touch>
            {offers.map((o) => (
              <li key={o.id} className="w-[44%] max-w-[200px] shrink-0 snap-start">
                <Link href={`/${locale}/meniu/${o.id}`} className="block">
                  <span className="relative block aspect-[2/3] overflow-hidden rounded-[16px] bg-[#f3e6cf]">
                    {o.image && <Image src={menuImage(o.image, 640)} alt={o.name[locale]} fill sizes="200px" className="object-cover" />}
                  </span>
                  <span className="mt-2 block font-display text-[1.05rem] leading-tight">{o.name[locale]}</span>
                  <span className="mt-0.5 block text-sm font-semibold text-ottone">{formatPrice(o.price, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 3. comandă rapidă ── */}
      <section id="comanda-rapida" className="scroll-mt-16 pt-8" aria-labelledby="m-quick">
        <div className="flex items-baseline justify-between px-4">
          <h2 id="m-quick" className="font-display text-2xl">{t.quickTitle}</h2>
          <Link href={`/${locale}/meniu`} className="py-2 text-sm font-semibold text-ottone">
            {t.fullMenu} →
          </Link>
        </div>
        <nav className="sticky top-[4.5rem] z-30 border-b border-linia bg-notte/95 px-4 py-3 backdrop-blur" aria-label={dict.nav.menu}>
          <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]" data-lenis-prevent-touch>
            {QUICK.map((id) => {
              const c = categories.find((x) => x.id === id)!;
              const on = id === cat;
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setCat(id)}
                    aria-pressed={on}
                    className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${on ? "bg-crema text-notte" : "border border-linia text-crema-dim"}`}
                  >
                    {c.name[locale]}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <ul className="px-4">
          {items.map((it) => {
            const [w, h] = imageSize(it.id);
            return (
              <li key={it.id} className="flex gap-3.5 border-b border-linia py-4">
                <Link href={`/${locale}/meniu/${it.id}`} tabIndex={-1} aria-hidden className="relative size-[5.5rem] shrink-0 overflow-hidden rounded-2xl bg-legno">
                  {it.image && <Image src={menuImage(it.image, 320)} alt="" width={w} height={h} sizes="88px" className="size-full object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="font-display text-[1.15rem] leading-tight">
                    <Link href={`/${locale}/meniu/${it.id}`}>{it.name[locale]}</Link>
                  </h3>
                  {it.description && <p className="mt-1 line-clamp-2 text-[0.8rem] leading-snug text-crema-dim">{it.description[locale]}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="font-semibold text-ottone tabular-nums">
                      {formatPrice(it.price, locale)}
                      {it.weight && <span className="ml-1 text-xs font-normal text-crema-dim">· {it.weight}</span>}
                    </span>
                    <AddToCart id={it.id} compact label={t.add} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 4. livrare / program / adresă ── */}
      <section className="mx-4 mt-8 grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] border border-linia bg-legno p-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ottone" aria-hidden>
            <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
            <circle cx="7.5" cy="17.5" r="1.5" />
            <circle cx="17.5" cy="17.5" r="1.5" />
          </svg>
          <p className="mt-2.5 text-[0.8rem] font-bold">{t.delivery}</p>
          <p className="mt-0.5 text-xs leading-snug text-crema-dim">{fill(t.deliveryBody, { fee: site.ordering.deliveryFeeOutside })}</p>
        </div>
        <div className="rounded-[18px] border border-linia bg-legno p-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ottone" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <p className="mt-2.5 text-[0.8rem] font-bold">{dict.visit.hours}</p>
          <p className="mt-0.5 text-xs leading-snug text-crema-dim">
            {todayHours ? (
              <>
                {t.hoursToday}
                <br />
                {todayHours}
              </>
            ) : (
              " "
            )}
          </p>
        </div>
        <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-[18px] border border-linia bg-legno p-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ottone" aria-hidden>
            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          <p className="mt-2.5 text-[0.8rem] font-bold">{t.findUs}</p>
          <p className="mt-0.5 text-xs leading-snug text-crema-dim">
            {site.address.street}, {site.address.city}
          </p>
        </a>
      </section>

      {/* ── 5. rezervare ── */}
      <section className="relative mx-4 mt-8 h-80 overflow-hidden rounded-3xl" aria-labelledby="m-reserve">
        <Image src="/rezervat.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(28_7_10/.1)_15%,rgb(28_7_10/.95)_100%)]" />
        <div className="absolute inset-x-5 bottom-5">
          <h2 id="m-reserve" className="font-display text-[1.75rem]">{dict.home.reserve}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-crema-dim">{t.reserveBody}</p>
          <Link href={`/${locale}/rezervare`} className="btn btn-brass mt-4 h-12 w-full justify-center">
            {dict.home.reserve}
          </Link>
        </div>
      </section>

      {/* ── 6. povestea ── */}
      <section id="poveste" className="scroll-mt-20 px-5 pt-12" aria-labelledby="m-story">
        <p className="eyebrow text-ottone">{dict.nav.story}</p>
        <h2 id="m-story" className="mt-3 font-display text-[1.6rem] leading-snug first-letter:uppercase">
          {story}
        </h2>
        <p className="mt-3 text-sm text-crema-dim">{dict.home.storyLabel}</p>
      </section>

      {/* ── 7. evenimente ── */}
      <section id="evenimente" className="mx-4 mt-10 scroll-mt-20 rounded-3xl bg-carta p-6 text-inchiostro" aria-labelledby="m-events">
        <p className="eyebrow text-rosso">{dict.home.eventsLabel}</p>
        <h2 id="m-events" className="mt-3 font-display text-[1.75rem] leading-tight">{dict.home.eventsTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-inchiostro-dim">{dict.home.eventsBody}</p>
        <a href={site.phoneHref} className="mt-5 inline-flex h-12 items-center rounded-full bg-inchiostro px-6 text-sm font-semibold text-carta">
          {dict.home.eventsCta}
        </a>
      </section>

      {/* ── 8. recenzii ── */}
      <section className="mx-4 mb-10 mt-6 rounded-3xl border border-linia bg-legno p-6" aria-labelledby="m-reviews">
        <p className="eyebrow text-ottone">{dict.home.reviewsLabel}</p>
        <div className="mt-3 flex items-baseline gap-3">
          <span id="m-reviews" className="font-display text-5xl leading-none">
            {site.rating.value.toLocaleString(locale === "en" ? "en-GB" : locale)}
          </span>
          <span className="text-sm text-crema-dim">{fill(dict.home.reviewsCount, { count: site.rating.count })}</span>
        </div>
        <ul className="mt-5 space-y-4">
          {[REVIEWS[3], REVIEWS[1]].map((r, i) => (
            <li key={i}>
              <p className="font-display text-[1.05rem] italic leading-relaxed">„{r.text}”</p>
              <p className="mt-1 text-xs text-crema-dim">{r.author} · Google</p>
            </li>
          ))}
        </ul>
        <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block py-2 text-sm font-semibold text-ottone underline underline-offset-4">
          {dict.home.reviewsCta}
        </a>
      </section>
    </div>
  );
}
