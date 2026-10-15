"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "../I18nProvider";
import { SCENE } from "@/lib/scenes";

gsap.registerPlugin(ScrollTrigger);

/** Desparte „{autentic} ÎNTÂLNEȘTE” în cuvântul scris de mână și restul rândului. */
function parseLine(line: string) {
  const m = line.match(/^(.*?)\{(.+?)\}(.*)$/);
  return m ? { before: m[1], script: m[2], after: m[3] } : { before: line, script: null, after: "" };
}

/**
 * Povestea: sală întunecată cu candelabre, text mare cu majuscule
 * și cuvinte scrise de mână, în coral, peste rânduri. La final textul urcă și sala se luminează.
 */
export function StoryScene() {
  const { dict } = useI18n();
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root.current);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=170%", pin: true, anticipatePin: 1, scrub: 1, invalidateOnRefresh: true },
        })
        .fromTo(q("[data-bg]"), { scale: 1.15 }, { scale: 1, duration: 10 }, 0)
        .fromTo(q("[data-label]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.3)
        .fromTo(q("[data-line]"), { yPercent: 105 }, { yPercent: 0, duration: 1, stagger: 0.45, ease: "power2.out" }, 0.6)
        .fromTo(
          q("[data-script]"),
          { clipPath: "inset(-20% 100% -20% 0)", autoAlpha: 1 },
          { clipPath: "inset(-20% -10% -20% 0)", duration: 1.1, stagger: 0.9, ease: "power1.inOut" },
          1.8,
        )
        .to(q("[data-text]"), { yPercent: -18, autoAlpha: 0, duration: 1.6, ease: "power1.in" }, 6.4)
        .to(q("[data-shade]"), { opacity: 0.25, duration: 2 }, 6.4)
        .to({}, { duration: 1.4 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div>
      <section ref={root} id="poveste" data-header-tone="dark" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-black" aria-labelledby="story-title">
        <div data-bg className="absolute inset-0 will-change-transform">
          <Image src={SCENE.story.src} alt={SCENE.story.alt} fill sizes="100vw" className="object-cover" />
        </div>
        <div data-shade className="absolute inset-0 bg-black opacity-70" />

        <div data-text className="relative z-10 flex h-full flex-col items-center justify-end px-4 pb-[10svh] text-center text-crema">
          <p data-label className="eyebrow mb-6 opacity-80">{dict.home.storyLabel}</p>
          <h2 id="story-title" className="font-sans text-[clamp(1.45rem,3.3vw,3.1rem)] font-extrabold uppercase leading-[1.04] tracking-[-0.015em]">
            {dict.home.story.map((line, i) => {
              const { before, script, after } = parseLine(line);
              return (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <span data-line className="relative inline-block">
                    {before}
                    {script && (
                      <span
                        data-script
                        className="relative z-10 mx-[0.08em] inline-block -rotate-6 font-script text-[1.55em] font-normal normal-case leading-[0.6] tracking-normal text-ottone"
                        style={{ textShadow: "0 2px 18px rgb(0 0 0 / .6)" }}
                      >
                        {script}
                      </span>
                    )}
                    {after}
                  </span>
                </span>
              );
            })}
          </h2>
        </div>
      </section>
    </div>
  );
}
