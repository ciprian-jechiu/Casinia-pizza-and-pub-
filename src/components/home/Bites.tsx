import Image from "next/image";
import type { Dictionary } from "@/dictionaries/ro";
import { formatPrice, type Locale } from "@/lib/i18n";
import { itemsByCategory, menuImage } from "@/lib/menu";
import { AddToCart } from "../AddToCart";

/** Burgeri și gustări, în rame arcuite, ca o tablă de tavernă. */
export function Bites({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = itemsByCategory("fastfood").filter((i) => i.image).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8" aria-labelledby="bites-title">
      <h2 id="bites-title" className="text-[clamp(2.2rem,4.5vw,3.8rem)] leading-none">{dict.bites.title}</h2>
      <p className="mt-3 text-crema-dim">{dict.bites.lead}</p>
      <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.id} className="group">
            <div className="arch relative aspect-[5/6] bg-legno">
              <Image
                src={menuImage(it.image!, 800)}
                alt={it.name[locale]}
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 26rem"
                className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-oven)] group-hover:scale-105"
              />
            </div>
            <div className="mt-5 flex items-baseline gap-3">
              <h3 className="font-display text-2xl leading-tight">{it.name[locale]}</h3>
              <span className="leader" aria-hidden />
              <span className="font-display text-xl text-ottone tabular-nums">{formatPrice(it.price, locale)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-crema-dim">
              {it.description?.[locale]}
              {it.weight && <span className="text-crema-dim/70"> · {it.weight}</span>}
            </p>
            <div className="mt-4">
              <AddToCart id={it.id} compact />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
