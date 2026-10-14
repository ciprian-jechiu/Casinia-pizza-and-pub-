"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useCart } from "@/store/cart";
import { useI18n } from "./I18nProvider";

/**
 * Buton „Adaugă” care trimite o mică bilă de alamă în arc spre coș,
 * ca să se vadă unde a ajuns produsul.
 */
export function AddToCart({
  id,
  label,
  compact = false,
  className = "",
}: {
  id: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const add = useCart((s) => s.add);
  const ref = useRef<HTMLButtonElement>(null);
  const [done, setDone] = useState(false);

  const onClick = () => {
    add(id);
    setDone(true);
    window.setTimeout(() => setDone(false), 1400);

    const from = ref.current?.getBoundingClientRect();
    const target = document.querySelector("[data-cart-target]")?.getBoundingClientRect();
    if (!from || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    Object.assign(dot.style, {
      position: "fixed",
      left: `${from.left + from.width / 2 - 7}px`,
      top: `${from.top + from.height / 2 - 7}px`,
      width: "14px",
      height: "14px",
      borderRadius: "999px",
      background: "var(--color-ottone)",
      boxShadow: "0 0 18px 4px rgb(200 160 120 / .55)",
      zIndex: "90",
      pointerEvents: "none",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(dot);

    const dx = target.left + target.width / 2 - (from.left + from.width / 2);
    const dy = target.top + target.height / 2 - (from.top + from.height / 2);
    gsap
      .timeline({ onComplete: () => dot.remove() })
      .to(dot, { x: dx, duration: 0.75, ease: "power1.inOut" }, 0)
      .to(dot, { y: Math.min(dy, -80) - 60, duration: 0.35, ease: "power2.out" }, 0)
      .to(dot, { y: dy, duration: 0.4, ease: "power2.in" }, 0.35)
      .to(dot, { scale: 0.3, opacity: 0.4, duration: 0.2 }, 0.6);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`${compact ? "min-h-10 px-4 text-sm" : ""} btn ${done ? "bg-basilico text-crema" : "btn-brass"} ${className}`}
      aria-live="polite"
    >
      {done ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="m5 12 5 5L20 7" />
          </svg>
          {dict.menuPage.added}
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          {label ?? dict.menuPage.add}
        </>
      )}
    </button>
  );
}
