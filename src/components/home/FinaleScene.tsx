"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { SCENE } from "@/lib/scenes";
import { hoursSummary, site } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

/**
 * Finalul: din sala întunecată te apropii de fereastră și vezi strada noaptea,
 * cu „Ne vedem pe strada Unirii.”, adresa, programul și butonul de rezervare.
 */
export function FinaleScene() {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root.current);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=120%", pin: true, anticipatePin: 1, scrub: 1, invalidateOnRefresh: true },
        })
        .fromTo(q("[data-window]"), { scale: 0.42, borderRadius: 6 }, { scale: 1, borderRadius: 0, duration: 2.4, ease: "power2.inOut" }, 0)
        .fromTo(q("[data-night]"), { opacity: 0.85 }, { opacity: 0.2, duration: 2.2 }, 0.2)
        .fromTo(q("[data-frame]"), { opacity: 1 }, { opacity: 0.55, duration: 2.4 }, 0)
        .fromTo(q("[data-cta]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 2)
        .fromTo(q("[data-end] > *"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15 }, 2.1)
        .to({}, { duration: 0.6 });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(q("[data-night]"), { opacity: 0.2 });
      gsap.set(q("[data-cta], [data-end] > *"), { autoAlpha: 1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div>
      <section ref={root} id="contact" data-header-tone="dark" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#140407]" aria-labelledby="finale-title">
        <div data-window className="absolute inset-0 overflow-hidden will-change-transform">
          <Image src={SCENE.street.src} alt={SCENE.street.alt} fill sizes="100vw" className="object-cover" />
          {/* ramele ferestrei */}
          <div data-frame className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-y-0 left-[31%] w-[1.1vw] min-w-2 bg-[#140407]" />
            <div className="absolute inset-y-0 right-[31%] w-[1.1vw] min-w-2 bg-[#140407]" />
            <div className="absolute inset-x-0 top-[22%] h-[1.1vw] min-h-2 bg-[#140407]" />
          </div>
          <div data-night className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        <div data-cta className="invisible absolute inset-x-0 top-[44%] z-10 flex justify-center opacity-0">
          <Link href={`/${locale}/rezervare`} className="btn btn-brass min-h-10 px-6 text-[0.8rem]">
            {dict.home.reserve}
          </Link>
        </div>

        <div data-end className="absolute inset-x-0 bottom-[7svh] z-10 px-4 text-center text-crema">
          <h2 id="finale-title" className="text-[clamp(2.2rem,5.6vw,5rem)] leading-[1.02] opacity-0">
            {dict.home.finaleTitle}
          </h2>
          <p className="eyebrow mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-crema/85 opacity-0">
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ottone">
              {site.address.building}, {site.address.street}, {site.address.city}
            </a>
            <span>{hoursSummary(dict.home.daysShort).join("  ·  ")}</span>
            <a href={site.phoneHref} className="hover:text-ottone">
              {site.phone}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
