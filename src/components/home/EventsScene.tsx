"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { getLenis } from "../SmoothScroll";
import { SCENE } from "@/lib/scenes";
import { site } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

/**
 * Evenimente private: fundal crem, un card cu fotografia sălii care, la scroll,
 * se transformă într-un card vișiniu cu detaliile și butonul de contact.
 */
export function EventsScene() {
  const { dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [step, setStep] = useState(0);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root.current);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=140%",
            pin: true,
            anticipatePin: 1,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setStep(self.progress > 0.5 ? 1 : 0),
          },
        })
        .fromTo(q("[data-card]"), { scale: 0.9, y: 40 }, { scale: 1, y: 0, duration: 1.2, ease: "power2.out" }, 0)
        .fromTo(q("[data-photo] img"), { scale: 1.15 }, { scale: 1, duration: 3 }, 0)
        .fromTo(q("[data-detail]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power2.inOut" }, 1.6)
        .fromTo(q("[data-detail-item]"), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.12 }, 2.4)
        .to({}, { duration: 0.8 });
      stRef.current = tl.scrollTrigger ?? null;
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(q("[data-detail]"), { clipPath: "inset(0% 0% 0% 0%)" });
      setStep(1);
    });
    return () => mm.revert();
  }, []);

  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st) return setStep(i);
    const y = st.start + (st.end - st.start) * (i === 0 ? 0.15 : 0.95);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div>
      <section ref={root} id="evenimente" data-header-tone="light" className="relative flex h-[100svh] min-h-[600px] flex-col items-center justify-center bg-carta px-4 text-inchiostro" aria-labelledby="events-title">
        <p className="eyebrow mb-6 text-rosso">{dict.home.eventsLabel}</p>

        <div data-card className="relative aspect-[4/5] w-[min(92vw,62rem)] overflow-hidden rounded-[14px] shadow-[0_30px_80px_-30px_rgb(42_16_19/.45)] will-change-transform sm:aspect-[16/9]">
          {/* fața 1: sala */}
          <div data-photo className="absolute inset-0">
            <Image src={SCENE.events.src} alt={SCENE.events.alt} fill sizes="(min-width: 1024px) 62rem, 92vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/30" />
            <p className="absolute inset-x-0 top-[10%] px-6 text-center font-display text-[clamp(1.7rem,3.6vw,3.2rem)] leading-tight text-crema">
              {dict.home.eventsCardTitle}
            </p>
          </div>
          {/* fața 2: detaliile */}
          <div data-detail className="absolute inset-0 flex flex-col items-center justify-center bg-notte px-8 text-center text-crema" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
            <h2 id="events-title" data-detail-item className="text-[clamp(1.9rem,4vw,3.4rem)] leading-tight">
              {dict.home.eventsTitle}
            </h2>
            <p data-detail-item className="mt-5 max-w-lg text-sm leading-relaxed text-crema-dim sm:text-base">
              {dict.home.eventsBody}
            </p>
            <a data-detail-item href={site.phoneHref} className="btn btn-brass mt-8 min-h-10 px-5 text-[0.8rem]">
              {dict.home.eventsCta}
            </a>
          </div>
        </div>

        <div className="mt-8 flex gap-8" role="tablist" aria-label={dict.home.eventsLabel}>
          {dict.home.eventsTabs.map((t, i) => (
            <button key={t} type="button" role="tab" aria-selected={step === i} onClick={() => goTo(i)} className="flex items-center gap-3">
              <span className={`h-px transition-all duration-500 ${step === i ? "w-8 bg-rosso" : "w-4 bg-inchiostro/30"}`} aria-hidden />
              <span className={`eyebrow transition-colors ${step === i ? "text-inchiostro" : "text-inchiostro-dim"}`}>{t}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
