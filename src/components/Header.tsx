"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useI18n } from "./I18nProvider";
import { Logo } from "./Logo";
import { cartTotals, useCart } from "@/store/cart";
import { useHydrated } from "@/lib/useClient";
import { rememberLocale } from "@/lib/cookies";
import { localeLabels, locales, type Locale } from "@/lib/i18n";

function switchLocalePath(pathname: string, to: Locale) {
  const parts = pathname.split("/");
  parts[1] = to;
  return parts.join("/") || `/${to}`;
}

export function Header() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // meniul mobil e deschis doar pentru pagina pe care a fost deschis; se închide singur la navigare
  const [openFor, setOpenFor] = useState<string | null>(null);
  const menuOpen = openFor === pathname;
  const setMenuOpen = (fn: (v: boolean) => boolean) => setOpenFor(fn(menuOpen) ? pathname : null);
  const lines = useCart((s) => s.lines);
  const bump = useCart((s) => s.bump);
  const setOpen = useCart((s) => s.setOpen);
  const { count } = cartTotals(lines);
  const hydrated = useHydrated();
  const controls = useAnimationControls();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => {
    if (bump) controls.start({ scale: [1, 1.25, 0.95, 1], transition: { duration: 0.5 } });
  }, [bump, controls]);

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/meniu`, label: dict.nav.menu },
    { href: `/${locale}/rezervare`, label: dict.nav.reserve },
  ];
  const isActive = (href: string) => (href === `/${locale}` ? pathname === href : pathname.startsWith(href));

  const setLocaleCookie = rememberLocale;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ottone focus:px-4 focus:py-2 focus:text-notte">
        {dict.nav.skip}
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled || menuOpen ? "border-b border-linia/70 bg-notte/80 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-4 sm:px-8">
          <Link href={`/${locale}`} className="shrink-0" aria-label="Casinia Pizza Pub">
            <Logo />
          </Link>

          <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Principal">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative text-sm transition-colors hover:text-crema ${isActive(l.href) ? "text-crema" : "text-crema-dim"}`}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
                {isActive(l.href) && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 h-px w-full bg-ottone" />
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-4">
            <div className="hidden items-center rounded-full border border-linia p-0.5 sm:flex" role="group" aria-label={dict.nav.language}>
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchLocalePath(pathname, l)}
                  onClick={() => setLocaleCookie(l)}
                  hrefLang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    l === locale ? "bg-legno-2 text-ottone" : "text-crema-dim hover:text-crema"
                  }`}
                >
                  {localeLabels[l]}
                </Link>
              ))}
            </div>

            <motion.button
              animate={controls}
              type="button"
              onClick={() => setOpen(true)}
              className="relative ml-2 grid size-11 place-items-center rounded-full border border-linia text-crema transition-colors hover:border-ottone"
              aria-label={`${dict.nav.cart}${hydrated && count ? ` (${count})` : ""}`}
              data-cart-target
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
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
                    className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-pomodoro px-1 text-[0.7rem] font-bold leading-5 text-crema"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              type="button"
              className="ml-1 grid size-11 place-items-center md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            >
              <span className="relative block h-3 w-6">
                <span className={`absolute left-0 h-px w-6 bg-crema transition-transform duration-300 ${menuOpen ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-px w-6 bg-crema transition-transform duration-300 ${menuOpen ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden md:hidden"
              aria-label="Mobil"
            >
              <ul className="flex flex-col gap-1 px-4 pb-6 pt-2">
                {links.map((l, i) => (
                  <motion.li key={l.href} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 + i * 0.06 }}>
                    <Link href={l.href} className="block py-2 font-display text-4xl text-crema">
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
                <li className="mt-4 flex gap-2">
                  {locales.map((l) => (
                    <Link
                      key={l}
                      href={switchLocalePath(pathname, l)}
                      onClick={() => setLocaleCookie(l)}
                      className={`chip ${l === locale ? "!border-ottone !text-ottone" : ""}`}
                    >
                      {localeLabels[l]}
                    </Link>
                  ))}
                </li>
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
