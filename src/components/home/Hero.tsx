"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { Embers } from "./Embers";
import { HERO_IMAGE, menuImage } from "@/lib/menu";
import { BRAND_SAND, OVEN_IMAGE } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger);

/**
 * Momentul de efect al site-ului:
 * 1. la încărcare, cuptorul se aprinde din întuneric și semnătura „Casinia” se scrie în culoarea logo-ului;
 * 2. la scroll, „camera” intră în gura cuptorului, iar pizza apare din foc.
 *
 * Semnătura stă mereu deasupra cuptorului (z-index) și, în repaus, cuptorul e așezat sub ea,
 * deci nu o acoperă niciodată. Animația de scroll folosește doar transform și opacity (GPU),
 * fără clip-path, ca să rămână fluidă.
 */
export function Hero() {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const mouthRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();

    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const { reduced } = ctx.conditions as { motion: boolean; reduced: boolean };

        if (reduced) {
          gsap.set(q(".sig-path"), { strokeDashoffset: 0, fillOpacity: 1 });
          gsap.set(q("[data-oven-layer]"), { autoAlpha: 1 });
          return;
        }

        // ── 1. secvența de încărcare ─────────────────────────────
        gsap.set(q("[data-oven-layer]"), { autoAlpha: 0, scale: 1.08 });
        gsap.set(q("[data-word]"), { yPercent: 110 });
        gsap.set(q("[data-fade]"), { autoAlpha: 0, y: 16 });

        const intro = gsap.timeline({ defaults: { ease: "expo.out" }, paused: true });
        intro
          .to(q("[data-oven-layer]"), { autoAlpha: 1, scale: 1, duration: 2.6, ease: "power3.out" }, 0)
          .to(q(".sig-path"), { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, 0.2)
          .to(q(".sig-path"), { fillOpacity: 1, duration: 1.2, ease: "power1.out" }, 1.9)
          .to(q("[data-word]"), { yPercent: 0, duration: 1.2, stagger: 0.035 }, 1.4)
          .to(q("[data-fade]"), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 1.8);

        // pornește după ce fontul semnăturii e încărcat, altfel conturul s-ar desena cu fontul de rezervă
        let cancelled = false;
        Promise.race([document.fonts.load('200px "Great Vibes"'), new Promise((r) => setTimeout(r, 1500))]).then(() => {
          if (!cancelled) intro.play();
        });

        // ── 2. intrarea în cuptor la scroll ─────────────────────
        const scroll = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=180%",
            pin: true,
            anticipatePin: 1,
            scrub: 1.2,
            invalidateOnRefresh: true,
            // dacă vizitatorul derulează înainte să se termine intro-ul, îl ducem la final
            onUpdate: (self) => {
              if (self.progress > 0.01 && intro.progress() < 1) intro.progress(1);
            },
          },
        });
        scroll
          // textul de jos coboară; semnătura rămâne pe loc, vizibilă, deasupra tuturor straturilor
          .to(q("[data-bottom]"), { y: 80, autoAlpha: 0, duration: 0.18 }, 0)
          .to(q("[data-sig]"), { scale: 0.88, duration: 0.5, ease: "power1.inOut" }, 0)
          // camera intră în gura cuptorului
          .to(q("[data-oven-layer]"), { scale: 5.5, duration: 0.7, ease: "power2.in" }, 0.04)
          .to(q("[data-embers]"), { autoAlpha: 0, duration: 0.25 }, 0.3)
          // pizza apare din foc
          .fromTo(q("[data-pizza-layer]"), { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.32, ease: "power2.out" }, 0.5)
          .to(q("[data-oven-layer]"), { autoAlpha: 0, duration: 0.15 }, 0.66)
          .to(q("[data-shade]"), { opacity: 1, duration: 0.16 }, 0.7)
          .fromTo(q("[data-oven] > *"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.14, ease: "power2.out" }, 0.76)
          .to({}, { duration: 0.1 });

        return () => {
          cancelled = true;
          intro.kill();
        };
      },
    );

    return () => mm.revert();
  }, []);

  const words = dict.hero.title.split(" ");

  return (
    // Wrapper stabil deținut de React: GSAP pune „pin-spacer” între el și <section>,
    // așa React nu mai găsește noduri mutate când navighezi între pagini (eroarea insertBefore).
    <div>
    <section ref={root} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-black" aria-labelledby="hero-title">
      {/* ── cuptorul real ── */}
      <div aria-hidden className="absolute inset-0">
        {/* poziționarea (translate) stă pe părinte, iar GSAP scalează doar copilul */}
        <div
          className="absolute left-1/2 top-[50%] w-[150vw] -translate-x-1/2 -translate-y-[55%] md:top-[57%] md:w-[min(92vw,84svh)]"
          style={{ aspectRatio: "1400 / 1057" }}
        >
        <div data-oven-layer className="absolute inset-0 will-change-transform" style={{ transformOrigin: "50% 56%" }}>
          <Image
            src={OVEN_IMAGE}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 150vw, 92vw"
            className="object-cover"
            style={{ maskImage: "radial-gradient(ellipse 62% 60% at 50% 52%, black 62%, transparent 100%)" }}
          />
          {/* pâlpâirea focului: o lumină caldă care respiră peste flăcări */}
          <div className="oven-flicker absolute inset-0 mix-blend-screen" />
          {/* gura cuptorului, de aici pornesc scânteile */}
          <div ref={mouthRef} className="absolute left-[16%] top-[18%] h-[66%] w-[68%]" />
        </div>
        </div>
      </div>

      <div data-embers className="absolute inset-0">
        <Embers originRef={mouthRef} />
      </div>

      {/* ── pizza care apare din foc ── */}
      <div data-pizza-layer className="invisible absolute inset-0 overflow-hidden opacity-0">
        <div className="absolute left-1/2 top-[-15%] h-[130%] -translate-x-[35%]" style={{ aspectRatio: "1024 / 682" }}>
          <Image
            src={menuImage(HERO_IMAGE, 1600)}
            alt="Pizza Polo e Funghi, cu mozzarella, piept de pui, ciuperci și parmezan"
            fill
            sizes="(max-width: 768px) 300vw, 160vw"
            className="object-cover"
            style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 60%, transparent 69%)" }}
          />
        </div>
        {/* umbră sus, ca semnătura să rămână lizibilă peste pizza */}
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-black/85 via-black/45 to-transparent" />
        <div data-shade className="absolute inset-0 bg-gradient-to-r from-notte/95 via-notte/70 to-notte/10 opacity-0" />
      </div>

      {/* ── semnătura: mereu deasupra ── */}
      <div data-sig className="pointer-events-none absolute inset-x-0 top-[max(11svh,5.5rem)] z-30 flex justify-center px-4 will-change-transform">
        <svg viewBox="0 70 1000 230" className="w-[min(86vw,34rem)] overflow-visible md:w-[min(56vw,40rem)]" role="img" aria-label="Casinia">
          <text
            className="sig-path"
            x="500"
            y="230"
            textAnchor="middle"
            fontFamily='"Great Vibes", cursive'
            fontSize="230"
            fill={BRAND_SAND}
            fillOpacity="0"
            stroke={BRAND_SAND}
            strokeWidth="1.6"
            strokeDasharray="2600"
            strokeDashoffset="2600"
            style={{ filter: "drop-shadow(0 4px 22px rgb(0 0 0 / .85))" }}
          >
            Casinia
          </text>
        </svg>
      </div>

      {/* ── text + acțiuni ── */}
      <div data-bottom className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent pb-[4svh] pt-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p data-fade className="mb-2 text-sm text-ottone">{dict.hero.kicker}</p>
            <h1 id="hero-title" className="text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.05]">
              {words.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span data-word className="inline-block">
                    {w}
                    {i < words.length - 1 ? " " : ""}
                  </span>
                </span>
              ))}
            </h1>
            <p data-fade className="mt-3 max-w-lg text-sm text-crema-dim md:text-base">{dict.hero.lead}</p>
          </div>
          <div data-fade className="flex flex-wrap gap-3">
            <Link href={`/${locale}/meniu`} className="btn btn-brass">
              {dict.hero.ctaOrder}
            </Link>
            <Link href={`/${locale}/rezervare`} className="btn btn-ghost">
              {dict.hero.ctaReserve}
            </Link>
          </div>
        </div>
      </div>

      {/* ── textul care apare după intrarea în cuptor ── */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center">
        <div data-oven className="mx-auto w-full max-w-7xl px-4 pt-[16svh] sm:px-8">
          <h2 className="max-w-xl text-[clamp(2.4rem,6vw,5rem)] leading-[0.98] opacity-0">{dict.oven.title}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-crema/85 opacity-0">{dict.oven.body}</p>
        </div>
      </div>
    </section>
    </div>
  );
}
