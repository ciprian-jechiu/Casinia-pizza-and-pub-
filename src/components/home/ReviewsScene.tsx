"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fill, useI18n } from "../I18nProvider";
import { REVIEWS, WALL_PHOTOS } from "@/lib/scenes";
import { intlLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

type Card = { kind: "review"; i: number } | { kind: "photo"; i: number } | { kind: "brand" };

/** Coloanele peretelui: recenzii, fotografii de preparate și semnătura, amestecate. */
const COLUMNS: Card[][] = [
  [{ kind: "photo", i: 0 }, { kind: "review", i: 0 }, { kind: "photo", i: 4 }, { kind: "review", i: 3 }, { kind: "photo", i: 1 }],
  [{ kind: "review", i: 1 }, { kind: "photo", i: 2 }, { kind: "brand" }, { kind: "review", i: 4 }, { kind: "photo", i: 6 }],
  [{ kind: "photo", i: 3 }, { kind: "review", i: 2 }, { kind: "photo", i: 5 }, { kind: "review", i: 0 }, { kind: "photo", i: 7 }],
  [{ kind: "review", i: 3 }, { kind: "photo", i: 6 }, { kind: "review", i: 1 }, { kind: "brand" }, { kind: "photo", i: 2 }],
];

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const f = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width="12" height="12" viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`s${i}-${Math.round(f * 100)}`}>
                <stop offset={`${f * 100}%`} stopColor="currentColor" />
                <stop offset={`${f * 100}%`} stopColor="currentColor" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${i}-${Math.round(f * 100)})`} d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8L12 2.5Z" />
          </svg>
        );
      })}
    </span>
  );
}

function WallCard({ card }: { card: Card }) {
  if (card.kind === "photo")
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-legno">
        <Image src={WALL_PHOTOS[card.i]} alt="" fill sizes="220px" className="object-cover" />
      </div>
    );
  if (card.kind === "brand")
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-[10px] bg-[#16050a] shadow-[inset_0_0_40px_rgb(232_160_138/.12)]">
        <span className="font-script text-5xl text-sabbia" style={{ textShadow: "0 0 18px rgb(200 160 120 / .55)" }}>
          Casinia
        </span>
      </div>
    );
  const r = REVIEWS[card.i];
  return (
    <figure className="w-full rounded-[10px] bg-carta p-4 text-inchiostro">
      <Stars value={5} className="text-rosso" />
      <blockquote className="mt-2 font-display text-[0.9rem] italic leading-snug">„{r.text}”</blockquote>
      <figcaption className="eyebrow mt-3 text-[0.6rem] text-inchiostro-dim">{r.author} · Google</figcaption>
    </figure>
  );
}

/** Recenzii: cifra mare a ratingului și un perete înclinat 3D care alunecă la scroll. */
export function ReviewsScene() {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root.current);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      q("[data-col]").forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: i % 2 ? -26 : 4 },
          { yPercent: i % 2 ? 4 : -26, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 } },
        );
      });
      gsap.fromTo(
        q("[data-big] > *"),
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 65%" } },
      );
    });
    return () => mm.revert();
  }, []);

  const rating = new Intl.NumberFormat(intlLocale[locale], { minimumFractionDigits: 1 }).format(site.rating.value);

  return (
    <section ref={root} id="recenzii" data-header-tone="dark" className="relative min-h-[100svh] overflow-hidden bg-notte" aria-labelledby="reviews-title">
      {/* peretele înclinat */}
      <div className="pointer-events-none absolute inset-y-[-25%] right-[-18%] w-[95%] sm:right-[-8%] sm:w-[78%] lg:w-[64%]" style={{ perspective: "1400px" }} aria-hidden>
        <div className="flex h-full gap-4" style={{ transform: "rotateX(24deg) rotateY(-16deg) rotateZ(-14deg)", transformOrigin: "50% 50%" }}>
          {COLUMNS.map((col, i) => (
            <div key={i} data-col className="flex w-[200px] shrink-0 flex-col gap-4 will-change-transform">
              {[...col, ...col].map((card, j) => (
                <WallCard key={j} card={card} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-notte via-notte/85 to-transparent sm:via-notte/60" />

      {/* cifra mare */}
      <div data-big className="relative z-10 flex min-h-[100svh] max-w-xl flex-col justify-center px-6 py-24 text-crema sm:px-[6vw]">
        <p className="eyebrow text-ottone">{dict.home.reviewsLabel}</p>
        <h2 id="reviews-title" className="mt-4 font-display text-[clamp(6rem,16vw,13rem)] leading-[0.85] tracking-[-0.04em]">
          {rating}
        </h2>
        <div className="mt-8 flex items-center gap-3 text-sm text-crema-dim">
          <Stars value={site.rating.value} className="text-ottone" />
          <span>{fill(dict.home.reviewsCount, { count: site.rating.count })}</span>
        </div>
        <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="eyebrow mt-8 w-fit underline underline-offset-4 hover:text-ottone">
          {dict.home.reviewsCta}
        </a>
      </div>
    </section>
  );
}
