"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "./I18nProvider";
import { cartTotals, useCart } from "@/store/cart";
import { menuById, menuImage } from "@/lib/menu";
import { formatPrice } from "@/lib/i18n";
import { getLenis } from "./SmoothScroll";

export function CartDrawer() {
  const { locale, dict } = useI18n();
  const { lines, open, setOpen, setQty, remove } = useCart();
  const { total } = cartTotals(lines);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="panel"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={dict.cart.title}
            data-lenis-prevent
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col border-l border-linia bg-legno outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-linia px-6 py-5">
              <h2 className="text-3xl">{dict.cart.title}</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-legno-2" aria-label={dict.cart.close}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-6 px-6">
                <p className="max-w-xs text-crema-dim">{dict.cart.empty}</p>
                <Link href={`/${locale}/meniu`} onClick={() => setOpen(false)} className="btn btn-brass">
                  {dict.cart.browse}
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-linia overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const item = menuById.get(l.id);
                      if (!item) return null;
                      return (
                        <motion.li
                          key={l.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-4 py-4"
                        >
                          <div className="arch relative size-16 shrink-0 bg-legno-2">
                            {item.image && <Image src={menuImage(item.image, 256)} alt="" fill sizes="64px" className="object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-display text-xl leading-tight">{item.name[locale]}</p>
                              <p className="shrink-0 text-sm text-ottone tabular-nums">{formatPrice(item.price * l.qty, locale)}</p>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex items-center rounded-full border border-linia">
                                <button type="button" className="grid size-9 place-items-center text-lg" onClick={() => setQty(l.id, l.qty - 1)} aria-label={`${dict.cart.decrease}: ${item.name[locale]}`}>
                                  −
                                </button>
                                <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">{l.qty}</span>
                                <button type="button" className="grid size-9 place-items-center text-lg" onClick={() => setQty(l.id, l.qty + 1)} aria-label={`${dict.cart.increase}: ${item.name[locale]}`}>
                                  +
                                </button>
                              </div>
                              <button type="button" onClick={() => remove(l.id)} className="text-xs text-crema-dim underline-offset-4 hover:text-pomodoro hover:underline">
                                {dict.cart.remove}
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-linia px-6 py-5">
                  <div className="mb-4 flex items-baseline justify-between">
                    <span className="text-crema-dim">{dict.cart.subtotal}</span>
                    <span className="font-display text-3xl text-ottone tabular-nums">{formatPrice(total, locale)}</span>
                  </div>
                  <Link href={`/${locale}/comanda`} onClick={() => setOpen(false)} className="btn btn-brass w-full">
                    {dict.cart.checkout}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
