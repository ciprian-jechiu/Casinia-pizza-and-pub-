"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { fill, useI18n } from "./I18nProvider";
import { cartTotals, useCart } from "@/store/cart";
import { formatPrice } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useHydrated } from "@/lib/useClient";

/**
 * Bara fixă de jos, doar pe telefon/tabletă: Sună · Rezervă · Comandă.
 * Când coșul are produse, „Comandă” devine butonul coșului (număr + total).
 * Nu apare pe finalizarea comenzii și în admin.
 */
export function MobileActionBar() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const hydrated = useHydrated();
  const { count, total } = cartTotals(lines);
  const hidden = /\/(comanda|admin)(\/|$)/.test(pathname);
  if (hidden) return null;
  const hasCart = hydrated && count > 0;

  return (
    <>
      {/* loc liber sub subsol, ca bara să nu acopere ultimele linkuri */}
      <div className="h-24 lg:hidden" aria-hidden />
      <nav
        aria-label={dict.nav.order}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex h-16 items-center gap-1.5 rounded-full border border-linia bg-legno/95 px-2 shadow-[0_16px_34px_-14px_rgb(0_0_0/.85)] backdrop-blur lg:hidden"
      >
        <a href={site.phoneHref} aria-label={dict.mobile.call} className="grid size-12 shrink-0 place-items-center rounded-full border border-linia text-crema">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          </svg>
        </a>
        <Link href={`/${locale}/rezervare`} className="grid h-12 flex-1 place-items-center rounded-full border border-crema/40 text-sm font-semibold text-crema">
          {dict.home.reserve.split(" ")[0]}
        </Link>
        {hasCart ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 flex-[1.4] items-center justify-between gap-2 rounded-full bg-ottone px-4 text-sm font-bold text-notte"
          >
            <span>{fill(dict.mobile.cartBar, { count })}</span>
            <span className="tabular-nums">{formatPrice(total, locale)}</span>
          </button>
        ) : (
          <Link href={`/${locale}/meniu`} className="grid h-12 flex-[1.4] place-items-center rounded-full bg-ottone text-sm font-bold text-notte">
            {dict.nav.order}
          </Link>
        )}
      </nav>
    </>
  );
}
