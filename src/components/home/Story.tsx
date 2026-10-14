"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { menuById, menuImage } from "@/lib/menu";

gsap.registerPlugin(ScrollTrigger);

/** Textul „despre noi”: cuvintele se aprind pe rând, ca o lumină care se încălzește. */
export function Story() {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const burger = menuById.get("double-cheese-burger")!;

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const words = gsap.utils.toArray<HTMLElement>("[data-w]", root.current);
      gsap.fromTo(
        words,
        { opacity: 0.18 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: { trigger: root.current!.querySelector("[data-story]"), start: "top 75%", end: "bottom 45%", scrub: true },
        },
      );
      gsap.fromTo(
        root.current!.querySelector("[data-parallax]"),
        { yPercent: 8 },
        { yPercent: -8, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-8 md:grid-cols-[1fr_0.8fr] md:items-center md:py-36" aria-labelledby="story-title">
      <div>
        <h2 id="story-title" className="max-w-lg text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[1.02]">{dict.story.title}</h2>
        <div data-story className="mt-8 max-w-xl space-y-5 font-display text-[clamp(1.25rem,2vw,1.6rem)] leading-[1.45] text-crema">
          {dict.story.paragraphs.map((para, i) => (
            <p key={i}>
              {para.split(" ").map((w, j) => (
                <span key={j} data-w>
                  {w}{" "}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
      <div className="arch relative aspect-[4/5] w-full max-w-md justify-self-center bg-legno md:justify-self-end">
        <div data-parallax className="absolute -inset-y-[10%] inset-x-0">
          <Image src={menuImage(burger.image!, 1024)} alt={burger.name[locale]} fill sizes="(max-width: 768px) 90vw, 28rem" className="object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_30px_rgb(11_16_12/.75)]" />
      </div>
    </section>
  );
}
