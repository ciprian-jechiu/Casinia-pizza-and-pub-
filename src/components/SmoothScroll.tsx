"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { clearRestore, peekRestore } from "@/lib/cookies";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Cât poate „fugi” ținta scroll-ului înaintea poziției afișate (fracțiune din înălțimea ecranului). */
const MAX_LEAD = 0.2;
/** Cel mai mare pas acceptat dintr-un singur eveniment de rotiță/trackpad (px). */
const MAX_DELTA = 110;

/**
 * Scroll fin (Lenis), sincronizat cu ScrollTrigger, cu viteză limitată:
 * un scroll puternic nu mai aruncă pagina departe — mișcarea rămâne lină și continuă,
 * iar ținta nu poate depăși poziția curentă cu mai mult de ~o cincime de ecran
 * (viteza maximă ≈ un ecran pe secundă, oricât de tare ai da).
 * Dezactivat la „reduce motion”.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.2,
      virtualScroll: (data) => {
        const l = lenis;
        if (!l || !data.event.type.includes("wheel")) return true;
        const dir = Math.sign(data.deltaY);
        // limitează fiecare impuls
        if (Math.abs(data.deltaY) > MAX_DELTA) data.deltaY = dir * MAX_DELTA;
        // dacă ținta a luat-o deja mult înainte în aceeași direcție, impulsurile noi sunt ignorate
        const lead = l.targetScroll - l.animatedScroll;
        if (dir && Math.sign(lead) === dir && Math.abs(lead) > window.innerHeight * MAX_LEAD) {
          data.deltaY = dir * 0.01; // aproape zero, dar Lenis tot blochează scroll-ul nativ
        }
        return true;
      },
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    // după schimbarea limbii rămânem în același loc; altfel pagina nouă pornește de sus
    const y = peekRestore(pathname);
    const go = (top: number) => {
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo(0, top);
      ScrollTrigger.update();
    };
    go(0);
    let t = 0;
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const hashEl = y === null && window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
      if (hashEl) {
        // link cu ancoră (ex. /ro/meniu#pizza sau /ro#poveste)
        t = window.setTimeout(() => {
          ScrollTrigger.refresh();
          go(Math.max(0, hashEl.getBoundingClientRect().top + window.scrollY - 150));
        }, 120);
      } else if (y !== null) {
        go(y);
        // a doua trecere, după ce scenele fixate și-au calculat înălțimile
        t = window.setTimeout(() => {
          ScrollTrigger.refresh();
          go(y);
          clearRestore();
        }, 350);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
