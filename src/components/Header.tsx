"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useI18n } from "./I18nProvider";
import { Logo } from "./Logo";
import { cartTotals, useCart } from "@/store/cart";
import { localeLabels, locales, type Locale } from "@/lib/i18n";
import { useHydrated } from "@/lib/useClient";
import { rememberLocale } from "@/lib/cookies";
import { site } from "@/lib/site";

function switchLocalePath(pathname: string, to: Locale) {
  const parts = pathname.split("/");
  parts[1] = to;
  return parts.join("/") || `/${to}`;
}

/**
 * Header subțire, transparent, ca în design: linkuri mici cu majuscule în stânga,
 * semnătura în centru, telefon + „Rezervă” în dreapta.
 * Culoarea se adaptează automat: secțiunile cu data-header-tone="light" (fundal crem) o fac închisă.
 */
export function Header() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const [tone, setTone] = useState<"dark" | "light">("dark");
  const [openFor, setOpenFor] = useState<string | null>(null);
  const menuOpen = openFor === pathname;
  const lines = useCart((s) => s.lines);
  const bump = useCart((s) => s.bump);
  const setOpen = useCart((s) => s.setOpen);
  const { count } = cartTotals(lines);
  const hydrated = useHydrated();
  const controls = useAnimationControls();
  const isHome = pathname === `/${locale}`;

  // tonul headerului = tonul secțiunii aflate sub el
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      let next: "dark" | "light" = "dark";
      document.querySelectorAll<HTMLElement>("[data-header-tone]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 34 && r.bottom > 34 && getComputedStyle(el).visibility !== "hidden" && Number(getComputedStyle(el).opacity) > 0.5)
          next = el.dataset.headerTone as "dark" | "light";
      });
      setTone(next);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (bump) controls.start({ scale: [1, 1.25, 0.95, 1], transition: { duration: 0.5 } });
  }, [bump, controls]);

  const anchor = (id: string) => (isHome ? `#${id}` : `/${locale}#${id}`);
  const links = [
    { href: `/${locale}/meniu`, label: dict.nav.menu },
    { href: anchor("poveste"), label: dict.nav.story },
    { href: anchor("evenimente"), label: dict.nav.events },
    { href: anchor("recenzii"), label: dict.nav.reviews },
  ];
  const ink = tone === "light" && !menuOpen;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ottone focus:px-4 focus:py-2 focus:text-notte">
        {dict.nav.skip}
      </a>
      <header
        data-site-header
        className={`site-header fixed inset-x-0 top-0 z-50 transition-[color,opacity] duration-500 ${ink ? "text-inchiostro" : "text-crema"}`}
      >
        <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-8">
          {/* stânga */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="eyebrow opacity-80 transition-opacity hover:opacity-100">
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="grid size-11 place-items-center justify-self-start lg:hidden"
            onClick={() => setOpenFor((v) => (v === pathname ? null : pathname))}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
          >
            <span className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-current transition-transform duration-300 ${menuOpen ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-6 bg-current transition-transform duration-300 ${menuOpen ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>

          {/* centru */}
          <Link href={`/${locale}`} aria-label="Casinia Pizza Pub" className="justify-self-center">
            <Logo tone={ink ? "light" : "dark"} />
          </Link>

          {/* dreapta */}
          <div className="flex items-center justify-self-end gap-4">
            <a href={site.phoneHref} className="eyebrow hidden opacity-80 hover:opacity-100 xl:inline">
              {site.phone}
            </a>
            <div className="hidden items-center gap-2 sm:flex" role="group" aria-label={dict.nav.language}>
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchLocalePath(pathname, l)}
                  onClick={() => rememberLocale(l)}
                  hrefLang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={`eyebrow transition-opacity ${l === locale ? "opacity-100 underline underline-offset-4" : "opacity-55 hover:opacity-100"}`}
                >
                  {localeLabels[l]}
                </Link>
              ))}
            </div>
            <motion.button
              animate={controls}
              type="button"
              onClick={() => setOpen(true)}
              className="relative grid size-10 place-items-center"
              aria-label={`${dict.nav.cart}${hydrated && count ? ` (${count})` : ""}`}
              data-cart-target
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M3 6h18l-1.6 11.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 6Z" />
                <path d="M8.5 9V5.5a3.5 3.5 0 0 1 7 0V9" />
              </svg>
              <AnimatePresence>
                {hydrated && count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-0.5 grid min-w-5 place-items-center rounded-full bg-pomodoro px-1 text-[0.68rem] font-bold leading-5 text-crema"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <Link
              href={`/${locale}/rezervare`}
              className="eyebrow hidden rounded-full border border-current px-4 py-2 opacity-90 transition-opacity hover:opacity-100 md:inline-block"
            >
              {dict.nav.reserve}
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="mobile-nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-notte text-crema lg:hidden"
              aria-label="Mobil"
            >
              <ul className="flex flex-col gap-1 px-6 pb-10 pt-6">
                {[...links, { href: `/${locale}/rezervare`, label: dict.nav.reserve }].map((l, i) => (
                  <motion.li key={l.href} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 + i * 0.05 }}>
                    <Link href={l.href} onClick={() => setOpenFor(null)} className="block py-2 font-display text-4xl">
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
                <li className="mt-8 flex gap-5">
                  {locales.map((l) => (
                    <Link
                      key={l}
                      href={switchLocalePath(pathname, l)}
                      onClick={() => rememberLocale(l)}
                      className={`eyebrow ${l === locale ? "text-ottone" : "opacity-60"}`}
                    >
                      {localeLabels[l]}
                    </Link>
                  ))}
                </li>
                <li className="mt-6">
                  <a href={site.phoneHref} className="eyebrow opacity-80">{site.phone}</a>
                </li>
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
