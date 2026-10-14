import Link from "next/link";
import type { Dictionary } from "@/dictionaries/ro";
import type { Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { Year } from "./Year";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-linia">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-crema-dim">
            {site.address.building}, {site.address.street}, {site.address.city}
          </p>
          <a href={site.phoneHref} className="mt-2 inline-block text-sm text-crema hover:text-ottone">
            {site.phone}
          </a>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2 text-sm">
            <li><Link className="text-crema-dim hover:text-crema" href={`/${locale}/meniu`}>{dict.nav.menu}</Link></li>
            <li><Link className="text-crema-dim hover:text-crema" href={`/${locale}/rezervare`}>{dict.nav.reserve}</Link></li>
            <li><Link className="text-crema-dim hover:text-crema" href={`/${locale}/comanda`}>{dict.nav.order}</Link></li>
          </ul>
        </nav>
        <div className="text-sm text-crema-dim">
          <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-crema">
            {dict.visit.directions}
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-linia px-4 py-6 text-xs text-crema-dim/80 sm:flex-row sm:justify-between sm:px-8">
        <p>© <Year /> {site.name}. {dict.footer.rights}</p>
        <p>{dict.footer.madeBy}</p>
      </div>
    </footer>
  );
}
