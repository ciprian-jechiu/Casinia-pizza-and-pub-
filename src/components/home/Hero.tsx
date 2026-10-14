"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { Embers } from "./Embers";
import { HERO_IMAGE, menuImage } from "@/lib/menu";

gsap.registerPlugin(ScrollTrigger);

/**
 * Momentul de efect al site-ului:
 * 1. la încărcare, semnătura „Casinia” se scrie în alamă, iar gura cuptorului se aprinde;
 * 2. la scroll, arcada cuptorului se deschide până umple ecranul și dezvăluie pizza.
 */
export function Hero() {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();

    /** clip-path care decupează stratul cu imaginea exact pe forma arcadei */
    const archClip = () => {
      const a = archRef.current!.getBoundingClientRect();
      const s = el.getBoundingClientRect();
      const top = a.top - s.top;
      const left = a.left - s.left;
      const right = s.width - (left + a.width);
      const bottom = s.height - (top + a.height);
      const r = a.width / 2;
      return `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px ${r}px 18px 18px)`;
    };
    const closedClip = () => {
      const a = archRef.current!.getBoundingClientRect();
      const s = el.getBoundingClientRect();
      const top = a.top - s.top + a.height;
      const left = a.left - s.left;
      const right = s.width - (left + a.width);
      const bottom = s.height - (a.top - s.top + a.height);
      return `inset(${top}px ${right}px ${bottom}px ${left}px round ${a.width / 2}px ${a.width / 2}px 18px 18px)`;
    };

    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        const { reduced } = ctx.conditions as { motion: boolean; reduced: boolean };

        if (reduced) {
          gsap.set(q("[data-media]"), { clipPath: archClip() });
          gsap.set(q(".sig-path"), { strokeDashoffset: 0, fillOpacity: 1 });
          return;
        }

        // ── 1. secvența de încărcare ─────────────────────────────
        gsap.set(q("[data-media]"), { clipPath: closedClip() });
        gsap.set(q("[data-media] img"), { scale: 1.35 });
        gsap.set(q("[data-word]"), { yPercent: 110 });
        gsap.set(q("[data-fade]"), { autoAlpha: 0, y: 16 });

        const intro = gsap.timeline({ defaults: { ease: "expo.out" }, paused: true });
        intro
          .to(q(".sig-path"), { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, 0)
          .to(q(".sig-path"), { fillOpacity: 1, duration: 1.2, ease: "power1.out" }, 1.7)
          .to(q("[data-media]"), { clipPath: archClip, duration: 1.6, ease: "power4.inOut" }, 0.6)
          .to(q("[data-media] img"), { scale: 1.12, duration: 2.2 }, 0.6)
          .to(q("[data-glow]"), { opacity: 1, duration: 1.6 }, 1.2)
          .to(q("[data-word]"), { yPercent: 0, duration: 1.1, stagger: 0.035 }, 1.5)
          .to(q("[data-fade]"), { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1.9);

        // pornește după ce fontul semnăturii e încărcat, altfel conturul s-ar desena cu fontul de rezervă
        let cancelled = false;
        Promise.race([
          document.fonts.load('200px "Great Vibes"'),
          new Promise((r) => setTimeout(r, 1500)),
        ]).then(() => {
          if (!cancelled) intro.play();
        });

        // ── 2. cuptorul se deschide la scroll ───────────────────
        const scroll = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=140%",
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            // dacă vizitatorul derulează înainte să se termine intro-ul, îl ducem la final
            onUpdate: (self) => {
              if (self.progress > 0.01 && intro.progress() < 1) intro.progress(1);
            },
          },
        });
        scroll
          .to(q("[data-sig]"), { yPercent: -60, autoAlpha: 0, ease: "none", duration: 0.35 }, 0)
          .to(q("[data-bottom]"), { y: 60, autoAlpha: 0, ease: "none", duration: 0.3 }, 0)
          .fromTo(q("[data-media]"), { clipPath: archClip }, { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)", ease: "power2.inOut", duration: 0.7, immediateRender: false }, 0.05)
          .to(q("[data-media] img"), { scale: 1, ease: "none", duration: 0.75 }, 0.05)
          .to(q("[data-glow]"), { opacity: 0, duration: 0.3 }, 0.1)
          .to(q("[data-shade]"), { opacity: 1, ease: "none", duration: 0.3 }, 0.55)
          .fromTo(q("[data-oven] > *"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.25 }, 0.68)
          .to({}, { duration: 0.15 });

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
    <section ref={root} className="relative h-[100svh] min-h-[600px] overflow-hidden" aria-labelledby="hero-title">
      {/* gura cuptorului: strălucire caldă în spatele arcadei */}
      <div
        data-glow
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[52%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{ background: "radial-gradient(circle, rgb(222 120 50 / .28), rgb(201 162 99 / .08) 45%, transparent 70%)" }}
      />

      {/* stratul cu imaginea, decupat pe arcadă */}
      <div data-media className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(50% 50% 50% 50%)" }}>
        {/* imaginea e mai înaltă decât ecranul ca să-l acopere complet; pizza (≈35% din lățime) cade pe centru */}
        <div className="absolute left-1/2 top-[-15%] h-[130%] -translate-x-[35%]" style={{ aspectRatio: "1024 / 682" }}>
          <Image
            src={menuImage(HERO_IMAGE, 1600)}
            alt="Pizza Polo e Funghi, cu mozzarella, piept de pui, ciuperci și parmezan"
            fill
            priority
            sizes="(max-width: 768px) 300vw, 160vw"
            className="object-cover will-change-transform"
            style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 60%, transparent 69%)" }}
          />
        </div>
        <div data-shade className="absolute inset-0 bg-gradient-to-r from-notte/95 via-notte/70 to-notte/10 opacity-0" />
      </div>

      {/* poziția arcadei (invizibilă): de aici se calculează decupajul */}
      <div
        ref={archRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[19svh] h-[38svh] w-[min(72vw,34svh)] -translate-x-1/2 md:top-[22svh] md:h-[52svh] md:w-[min(44vw,50svh)]"
      />

      <Embers originRef={archRef} />

      {/* semnătura */}
      <div data-sig className="pointer-events-none absolute inset-x-0 top-[9svh] z-10 flex justify-center px-4">
        <svg viewBox="0 0 1000 300" className="w-[min(92vw,62rem)] overflow-visible" role="img" aria-label="Casinia">
          <defs>
            <linearGradient id="brass" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#e9cf98" />
              <stop offset=".45" stopColor="#c9a263" />
              <stop offset="1" stopColor="#8a6a3c" />
            </linearGradient>
          </defs>
          <text
            className="sig-path"
            x="500"
            y="215"
            textAnchor="middle"
            fontFamily='"Great Vibes", cursive'
            fontSize="230"
            fill="url(#brass)"
            fillOpacity="0"
            stroke="#d9b877"
            strokeWidth="1.4"
            strokeDasharray="2600"
            strokeDashoffset="2600"
            style={{ filter: "drop-shadow(0 6px 24px rgb(0 0 0 / .6))" }}
          >
            Casinia
          </text>
        </svg>
      </div>

      {/* text + acțiuni */}
      <div data-bottom className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-notte via-notte/80 to-transparent pb-[5svh] pt-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p data-fade className="mb-3 text-sm text-ottone">{dict.hero.kicker}</p>
            <h1 id="hero-title" className="text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.05]">
              {words.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span data-word className="inline-block">
                    {w}
                    {i < words.length - 1 ? " " : ""}
                  </span>
                </span>
              ))}
            </h1>
            <p data-fade className="mt-4 max-w-lg text-crema-dim">{dict.hero.lead}</p>
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

      {/* textul care apare după deschiderea cuptorului */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center">
        <div data-oven className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <h2 className="max-w-xl text-[clamp(2.4rem,6vw,5rem)] leading-[0.98] opacity-0">{dict.oven.title}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-crema/85 opacity-0">{dict.oven.body}</p>
        </div>
      </div>
    </section>
  );
}
