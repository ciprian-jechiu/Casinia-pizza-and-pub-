"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { categories, isBanner, itemsByCategory, menu, menuImage, type CategoryId } from "@/lib/menu";
import { CATEGORY_IMAGE, SCENE } from "@/lib/scenes";
import { Logo } from "../Logo";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scena de deschidere, fixată la scroll:
 * fațada → prin ușă în sală (titlul) → masa rezervată („Riservato.”) → panoul crem cu meniul.
 * Totul se mișcă doar din transform/opacity, legat de scroll (scrub).
 */
export function IntroScene() {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<CategoryId | null>(null);
  // preparatul peste care e mouse-ul în panou: poza lui apare în stânga
  const [preview, setPreview] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const html = document.documentElement;
    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { desktop, reduced } = ctx.conditions as Record<string, boolean>;

        if (reduced) {
          gsap.set(q("[data-l='facade'], [data-l='interior'], [data-hint], [data-headline], [data-biglogo]"), { autoAlpha: 0 });
          gsap.set(q("[data-l='table'], [data-riservato]"), { autoAlpha: 1 });
          gsap.set(q("[data-panel]"), { xPercent: 0, yPercent: 0, autoAlpha: 1 });
          if (desktop) gsap.set(q("[data-media]"), { right: "44%" });
          return;
        }

        html.dataset.intro = "facade";
        let panelWasOpen = false;

        // ── la încărcare: fațada iese din întuneric ──
        gsap.fromTo(q("[data-facade-inner]"), { scale: 1.12, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2, ease: "power2.out" });
        gsap.fromTo(q("[data-biglogo-inner]"), { autoAlpha: 0, y: 24, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.6, delay: 0.5, ease: "power3.out" });
        gsap.fromTo(q("[data-hint-inner]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1, delay: 1.4, ease: "power2.out" });

        // ── la scroll: prin ușă în sală → titlul → masa („Riservato.”) → panoul de meniu ──
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "intro",
            trigger: el,
            start: "top top",
            end: "+=430%",
            pin: true,
            anticipatePin: 1,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              html.dataset.intro = self.progress < 0.13 ? "facade" : "";
              const open = self.progress > 0.8;
              html.dataset.panel = open ? "open" : "";
              // la derularea înapoi, panoul se închide și imaginea categoriei dispare
              if (!open && panelWasOpen) setActive(null);
              panelWasOpen = open;
            },
            onLeave: () => {
              html.dataset.panel = "";
            },
            onEnterBack: (self) => {
              html.dataset.panel = self.progress > 0.8 ? "open" : "";
            },
          },
        });

        tl.addLabel("s0", 0)
          // 1. prin ușă, în sală, cu titlul
          .to(q("[data-hint]"), { autoAlpha: 0, duration: 0.4 }, 0)
          .to(q("[data-biglogo]"), { autoAlpha: 0, scale: 1.25, y: -40, duration: 0.9, ease: "power1.in" }, 0)
          .to(q("[data-l='facade']"), { scale: 3.4, duration: 2.3, ease: "power2.in" }, 0)
          .to(q("[data-l='facade']"), { autoAlpha: 0, duration: 0.6 }, 1.75)
          .fromTo(q("[data-l='interior']"), { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 2.2, ease: "power2.out" }, 1.55)
          .fromTo(
            q("[data-hw]"),
            { yPercent: 110, autoAlpha: 0, filter: "blur(6px)" },
            { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.1, ease: "power2.out" },
            2.7,
          )
          .addLabel("s1", 4.4)
          // 2. spre masă
          .to(q("[data-headline]"), { autoAlpha: 0, y: -30, duration: 0.6 }, 4.6)
          .to(q("[data-l='interior']"), { scale: 1.7, duration: 1.8, ease: "power2.in" }, 4.6)
          .fromTo(q("[data-l='table']"), { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 1.8, ease: "power2.out" }, 5.5)
          .fromTo(q("[data-riservato] > *"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: "power2.out" }, 6.4)
          .addLabel("s2", 7.6)
          // 3. panoul de meniu
          .to(q("[data-riservato]"), { autoAlpha: 0, x: -30, duration: 0.5 }, 8.1)
          .fromTo(
            q("[data-panel]"),
            desktop ? { xPercent: 100, autoAlpha: 1 } : { yPercent: 100, autoAlpha: 1 },
            { xPercent: 0, yPercent: 0, autoAlpha: 1, duration: 1.3, ease: "power3.out" },
            8.2,
          )
          .fromTo(q("[data-panel-item]"), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }, 8.8)
          .to({}, { duration: 0.6 })
          .addLabel("s3");

        if (desktop) tl.fromTo(q("[data-media]"), { right: "0%" }, { right: "44%", duration: 1.3, ease: "power3.out" }, 8.2);

        return () => {
          delete html.dataset.intro;
          delete html.dataset.panel;
        };
      },
    );
    return () => mm.revert();
  }, []);

  const words = dict.home.headline.split(" ");

  return (
    // wrapper stabil pentru pin-spacer-ul GSAP
    <div>
      <section ref={root} id="intro" data-header-tone="dark" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-notte" aria-labelledby="intro-title">
        {/* ── imagini ── */}
        <div data-media className="absolute inset-y-0 left-0 right-0 overflow-hidden">
          <div data-l="facade" className="absolute inset-0 will-change-transform" style={{ transformOrigin: SCENE.facade.door }}>
            <div data-facade-inner className="absolute inset-0">
              <Image src={SCENE.facade.src} alt={SCENE.facade.alt} fill priority sizes="100vw" className="object-cover" style={{ objectPosition: SCENE.facade.door }} />
            </div>
          </div>
          <div data-l="interior" className="invisible absolute inset-0 opacity-0 will-change-transform" style={{ transformOrigin: SCENE.interior.table }}>
            <Image src={SCENE.interior.src} alt={SCENE.interior.alt} fill sizes="100vw" className="object-cover" />
          </div>
          <div data-l="table" className="invisible absolute inset-0 opacity-0 will-change-transform">
            <Image src={SCENE.table.src} alt={SCENE.table.alt} fill sizes="100vw" className="object-cover" />
          </div>
          {/* imaginea categoriei alese în meniu */}
          {categories.map((c) => (
            <div
              key={c.id}
              aria-hidden={active !== c.id}
              className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-[var(--ease-oven)] ${active === c.id ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
            >
              <Image src={CATEGORY_IMAGE[c.id].src} alt={CATEGORY_IMAGE[c.id].alt} fill sizes="(min-width: 1024px) 56vw, 100vw" className="object-cover" />
            </div>
          ))}
          {/* poza preparatului peste care e mouse-ul */}
          {menu
            .filter((m) => m.image)
            .map((m) => (
              <div
                key={m.id}
                aria-hidden
                className={`absolute inset-0 bg-black transition-opacity duration-500 ${preview === m.id ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                {preview === m.id && (
                  <Image
                    src={menuImage(m.image!, 1600)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    className={isBanner(m) ? "object-contain" : "object-cover"}
                  />
                )}
              </div>
            ))}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/45" />
        </div>


        {/* ── logo-ul mare, pe fațadă ── */}
        <div data-biglogo className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden>
          <div data-biglogo-inner className="relative opacity-0">
            <div className="absolute -inset-[35%] rounded-full bg-[radial-gradient(closest-side,rgb(0_0_0/0.7),transparent)]" />
            <Logo height={260} priority className="relative h-[clamp(150px,30svh,300px)]! w-auto! drop-shadow-[0_6px_30px_rgb(0_0_0/0.6)]" />
          </div>
        </div>

        {/* ── îndemnul de scroll ── */}
        <div data-hint className="absolute inset-x-0 bottom-8 z-10 text-crema">
          <div data-hint-inner className="invisible flex flex-col items-center gap-3 opacity-0">
            <span className="eyebrow">{dict.home.enter}</span>
            <span className="block h-10 w-px origin-top animate-pulse bg-crema/70" aria-hidden />
          </div>
        </div>

        {/* ── titlul ── */}
        <div data-headline className="pointer-events-none absolute inset-x-0 bottom-[11svh] z-10 px-4 text-center">
          <h1 id="intro-title" className="mx-auto max-w-5xl text-[clamp(2rem,5vw,4.4rem)] leading-[1.05] text-crema">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <span data-hw className="inline-block opacity-0">
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </span>
              </span>
            ))}
          </h1>
        </div>

        {/* ── Riservato. ── */}
        <div data-riservato className="absolute left-[6vw] top-[28svh] z-10 max-w-xl text-crema">
          <p className="font-display text-[clamp(3rem,8vw,7.5rem)] italic leading-[0.95] tracking-[-0.03em] opacity-0">{dict.home.riservato}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5 opacity-0">
            <Link href={`/${locale}/rezervare`} className="btn btn-brass min-h-10 px-5 text-[0.8rem]">
              {dict.home.reserve}
            </Link>
            <Link href={`/${locale}/meniu`} className="eyebrow underline-offset-4 hover:underline">
              {dict.home.viewMenu}
            </Link>
          </div>
        </div>

        {/* ── panoul de meniu ── */}
        <MenuPanel active={active} setActive={setActive} setPreview={setPreview} />
      </section>
    </div>
  );
}

function MenuPanel({
  active,
  setActive,
  setPreview,
}: {
  active: CategoryId | null;
  setActive: (c: CategoryId) => void;
  setPreview: (id: string | null) => void;
}) {
  const { locale, dict } = useI18n();
  return (
    <aside
      data-panel
      className="invisible absolute inset-x-0 bottom-0 z-20 h-[74svh] bg-carta text-inchiostro lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[44%]"
      aria-labelledby="panel-title"
    >
      <div className="flex h-full flex-col overflow-y-auto px-6 pb-10 pt-8 sm:px-10 lg:pt-28" data-lenis-prevent>
        <div data-panel-item className="flex items-start justify-between gap-6">
          <div>
            <h2 id="panel-title" className="text-[clamp(1.8rem,2.6vw,2.6rem)] leading-none">{dict.home.menuTitle}</h2>
            <div className="mt-4 flex gap-5">
              <Link href={`/${locale}/meniu`} className="eyebrow text-inchiostro underline-offset-4 hover:underline">
                {dict.home.menuOrder}
              </Link>
              <Link href={`/${locale}/meniu`} className="eyebrow text-inchiostro-dim underline-offset-4 hover:underline">
                {dict.home.menuFull}
              </Link>
            </div>
          </div>
          <p className="shrink-0 pt-2 text-right font-display text-sm italic text-rosso">{dict.home.menuPrice}</p>
        </div>

        <ul className="mt-10 flex-1 space-y-1 lg:mt-16">
          {categories.map((c) => {
            const open = active === c.id;
            const items = itemsByCategory(c.id);
            return (
              <li key={c.id} data-panel-item className="border-b border-inchiostro/10 py-3">
                <button
                  type="button"
                  onMouseEnter={() => setActive(c.id)}
                  onFocus={() => setActive(c.id)}
                  onClick={() => setActive(c.id)}
                  aria-expanded={open}
                  className="group flex w-full items-center gap-4 text-left"
                >
                  <span className={`h-px bg-rosso transition-all duration-500 ${open ? "w-8" : "w-3 opacity-50"}`} aria-hidden />
                  <span className={`font-display text-[clamp(1.25rem,1.8vw,1.7rem)] transition-all duration-500 ${open ? "italic" : "text-inchiostro/75 group-hover:text-inchiostro"}`}>
                    {c.name[locale]}
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-oven)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="pb-2 pl-12 pt-3 text-[0.8rem] leading-[1.9] text-inchiostro-dim">
                      {items.map((it, i) => (
                        <span key={it.id}>
                          <Link
                            href={`/${locale}/meniu/${it.id}`}
                            tabIndex={open ? 0 : -1}
                            onMouseEnter={() => setPreview(it.image ? it.id : null)}
                            onFocus={() => setPreview(it.image ? it.id : null)}
                            onMouseLeave={() => setPreview(null)}
                            className="rounded-sm text-inchiostro underline-offset-4 hover:text-rosso hover:underline"
                          >
                            {it.name[locale]}
                          </Link>{" "}
                          <span className="text-rosso">{it.price}</span>
                          {i < items.length - 1 && <span aria-hidden> · </span>}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p data-panel-item className="mt-8 text-xs text-inchiostro-dim" aria-live="polite">
          {dict.home.menuHint}
        </p>
      </div>
    </aside>
  );
}
