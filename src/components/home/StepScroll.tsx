"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis, setStepMode } from "../SmoothScroll";

/** Scenele fixate la scroll și etichetele lor („s1”, „s2”…) devin opriri. */
const PINNED = ["intro", "story", "events", "finale"];
/** Secțiuni obișnuite la al căror început se oprește pagina. */
const SECTIONS = ["#recenzii"];

/** Pozițiile de scroll la care se oprește pagina, în ordine. */
function computeStops() {
  const raw: number[] = [0];
  for (const id of PINNED) {
    const st = ScrollTrigger.getById(id);
    if (!st) continue;
    raw.push(st.start, st.end);
    const tl = st.animation as gsap.core.Timeline | undefined;
    if (tl?.labels) {
      const d = tl.duration() || 1;
      for (const t of Object.values(tl.labels)) raw.push(st.start + (t / d) * (st.end - st.start));
    }
  }
  for (const sel of SECTIONS) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) raw.push(el.getBoundingClientRect().top + window.scrollY);
  }
  raw.push(ScrollTrigger.maxScroll(window));
  const sorted = raw.map((v) => Math.round(v)).sort((a, b) => a - b);
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1] > 40);
}

/** Un element cu scroll propriu (ex. panoul de meniu) care încă poate derula în direcția dată. */
function scrollableAncestor(target: EventTarget | null, dir: number) {
  let el = target instanceof Element ? target.closest<HTMLElement>("[data-lenis-prevent]") : null;
  while (el) {
    const canScroll = el.scrollHeight > el.clientHeight + 1;
    if (canScroll && (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0)) return el;
    el = el.parentElement?.closest<HTMLElement>("[data-lenis-prevent]") ?? null;
  }
  return null;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Derulare „pas cu pas” pe pagina principală: un gest de scroll (rotiță, trackpad, swipe, tastă)
 * = o singură mișcare până la oprirea următoare, oricât de tare ai da.
 * Inerția trackpad-ului e ignorată: un pas nou pornește doar după o pauză în evenimente.
 */
export function StepScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animating = false;
    let lastWheel = 0;
    let touchY: number | null = null;
    let raf = 0;
    let active = false;
    let token = 0;

    const go = (dir: number) => {
      const lenis = getLenis();
      if (!lenis || animating) return;
      // în timpul deschiderii ușilor, primul gest doar grăbește animația
      if (document.documentElement.dataset.intro === "facade") {
        window.dispatchEvent(new Event("casinia:skip-intro"));
        return;
      }
      const stops = computeStops();
      const cur = lenis.scroll;
      const target = dir > 0 ? stops.find((s) => s > cur + 8) : [...stops].reverse().find((s) => s < cur - 8);
      if (target === undefined) return;
      const dist = Math.abs(target - cur) / window.innerHeight;
      animating = true;
      const my = ++token;
      lenis.scrollTo(target, {
        duration: Math.min(2.2, Math.max(1.1, 0.9 + dist * 0.35)),
        easing: easeInOutCubic,
        force: true,
        lock: true,
        onComplete: () => {
          if (my === token) animating = false;
        },
      });
      // plasă de siguranță dacă onComplete nu mai vine (ex. redimensionare)
      window.setTimeout(() => {
        if (my === token) animating = false;
      }, 2600);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // zoom cu trackpad-ul
      const dir = Math.sign(e.deltaY);
      if (!dir) return;
      if (scrollableAncestor(e.target, dir)) return; // lasă panoul să deruleze
      e.preventDefault();
      const now = performance.now();
      const fresh = now - lastWheel > 220;
      lastWheel = now;
      if (fresh && Math.abs(e.deltaY) > 2) go(dir);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (scrollableAncestor(e.target, Math.sign(dy) || 1)) return;
      if (e.cancelable) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      if (Math.abs(dy) < 40) return;
      if (scrollableAncestor(e.target, Math.sign(dy))) return;
      go(Math.sign(dy));
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable]") || (e.key === " " && t.closest("button, a")))) return;
      const down = ["ArrowDown", "PageDown", " "].includes(e.key);
      const up = ["ArrowUp", "PageUp"].includes(e.key);
      if (!down && !up) return;
      e.preventDefault();
      go(down ? 1 : -1);
    };

    // așteaptă până există Lenis (pornește în layout)
    const start = () => {
      if (!getLenis()) {
        raf = requestAnimationFrame(start);
        return;
      }
      active = true;
      setStepMode(true);
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("keydown", onKey);
    };
    start();

    return () => {
      cancelAnimationFrame(raf);
      if (!active) return;
      setStepMode(false);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
