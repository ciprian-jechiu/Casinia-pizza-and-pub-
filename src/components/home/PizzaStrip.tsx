"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { AddToCart } from "../AddToCart";
import { itemsByCategory, menuImage } from "@/lib/menu";
import { formatPrice } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

/** Toate pizzele, într-o bandă orizontală fixată la scroll (desktop) sau derulabilă cu degetul (mobil). */
export function PizzaStrip() {
  const { locale, dict } = useI18n();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const pizzas = itemsByCategory("pizza");

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const el = track.current!;
      const distance = () => el.scrollWidth - window.innerWidth + 64;
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      // fiecare pizza se rotește puțin pe măsură ce trece prin cadru
      gsap.utils.toArray<HTMLElement>("[data-pizza-img]", el).forEach((img) => {
        gsap.fromTo(
          img,
          { rotate: -6, scale: 1.12 },
          {
            rotate: 6,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} className="relative overflow-hidden py-20 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0" aria-labelledby="pizza-title">
      <div className="mx-auto mb-10 flex w-full max-w-7xl items-end justify-between gap-6 px-4 sm:px-8">
        <div>
          <h2 id="pizza-title" className="text-[clamp(2.4rem,5vw,4.2rem)] leading-none">{dict.signatures.title}</h2>
          <p className="mt-3 text-crema-dim">{dict.signatures.lead}</p>
        </div>
        <Link href={`/${locale}/meniu`} className="btn btn-ghost hidden shrink-0 sm:inline-flex">
          {dict.signatures.viewAll}
        </Link>
      </div>

      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 will-change-transform sm:px-8 lg:snap-none lg:overflow-visible lg:pb-0"
        data-lenis-prevent-touch
      >
        {pizzas.map((p) => (
          <li key={p.id} className="group w-[82vw] shrink-0 snap-start sm:w-[26rem] lg:w-[30rem]">
            <article className="flex h-full flex-col rounded-[28px] border border-linia bg-legno/60 p-5 transition-colors duration-500 hover:border-ottone-soft">
              <div className="relative aspect-[2.2/1] overflow-hidden rounded-[20px] bg-[#121212]">
                {p.image && (
                  <div data-pizza-img className="absolute inset-0">
                    <Image
                      src={menuImage(p.image, 1024)}
                      alt={p.name[locale]}
                      fill
                      sizes="(max-width: 640px) 82vw, 30rem"
                      className="object-cover"
                      style={{ objectPosition: "17% 50%" }}
                    />
                  </div>
                )}
                {p.signature && (
                  <span className="absolute left-3 top-3 rounded-full bg-notte/80 px-3 py-1 text-xs text-ottone backdrop-blur">
                    {dict.menuPage.signature}
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <h3 className="font-display text-[1.9rem] leading-none">{p.name[locale]}</h3>
                <span className="leader" aria-hidden />
                <span className="font-display text-2xl text-ottone tabular-nums">{formatPrice(p.price, locale)}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-crema-dim">{p.description?.[locale]}</p>
              <div className="mt-5">
                <AddToCart id={p.id} compact label={dict.signatures.add} />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
