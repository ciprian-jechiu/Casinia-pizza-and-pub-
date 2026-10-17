import type { Metadata } from "next";
import Image from "next/image";
import { PromoBadge } from "@/components/PromoBanner";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { formatPrice, hasLocale } from "@/lib/i18n";
import { categories, imageSize, itemsByCategory, menu, menuById, menuImage } from "@/lib/menu";
import { nutritionFor } from "@/lib/nutrition";
import { CATEGORY_IMAGE } from "@/lib/scenes";
import { AddToCart } from "@/components/AddToCart";

export function generateStaticParams() {
  return menu.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/meniu/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const item = menuById.get(id);
  if (!hasLocale(lang) || !item) return {};
  return {
    title: item.name[lang],
    description: item.description?.[lang],
    alternates: { canonical: `/${lang}/meniu/${id}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/meniu/[id]">) {
  const { lang, id } = await params;
  const item = menuById.get(id);
  if (!hasLocale(lang) || !item) notFound();
  const dict = await getDictionary(lang);
  const t = dict.product;
  const n = nutritionFor(id);
  const category = categories.find((c) => c.id === item.category)!;
  const related = itemsByCategory(item.category).filter((m) => m.id !== id).slice(0, 4);
  const ingredients = item.description?.[lang].split(/,\s*/).filter(Boolean) ?? [];
  const [w, h] = imageSize(item.id);
  const imgSrc = item.image ? menuImage(item.image, 1600) : CATEGORY_IMAGE[item.category].src;

  const rows = n
    ? ([
        [t.energy, `${n.portion.kcal} kcal`, `${n.per100.kcal} kcal`],
        [t.protein, `${n.portion.p} g`, `${n.per100.p} g`],
        [t.fat, `${n.portion.f} g`, `${n.per100.f} g`],
        [t.carbs, `${n.portion.c} g`, `${n.per100.c} g`],
      ] as const)
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-8 lg:pt-32">
      <Link href={`/${lang}/meniu#${item.category}`} className="eyebrow text-crema-dim hover:text-crema">
        ← {t.back}
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* imaginea */}
        {item.image ? (
          // fotografia întreagă, în proporțiile ei reale, cât să încapă pe ecran fără scroll
          <div className="flex items-start justify-center lg:sticky lg:top-28 lg:self-start">
            <Image
              src={imgSrc}
              alt={item.name[lang]}
              width={w}
              height={h}
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="block h-auto max-h-[min(68svh,640px)] w-auto max-w-full rounded-[14px] bg-black object-contain shadow-[0_30px_70px_-35px_rgb(0_0_0/.9)]"
            />
          </div>
        ) : (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-black">
            <Image src={imgSrc} alt={item.name[lang]} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
        )}

        {/* detalii */}
        <div>
          <p className="eyebrow text-ottone">{category.name[lang]}</p>
          <h1 className="mt-3 text-[clamp(2.4rem,5vw,4rem)] leading-[1]">{item.name[lang]}</h1>
          <p className="mt-4 font-display text-3xl text-ottone">{formatPrice(item.price, lang)}</p>

          {item.category === "pizza" && (
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-ottone/40 bg-legno/70 p-4">
              <PromoBadge size="md" />
              <p className="text-sm leading-relaxed">
                <span className="block font-display text-lg text-ottone">{dict.promo.title}</span>
                {dict.promo.product}
              </p>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="mt-8">
              <h2 className="eyebrow text-crema-dim">{t.ingredients}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {ingredients.map((ing) => (
                  <li key={ing} className="rounded-full border border-linia px-3 py-1.5 text-sm">
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(item.weight || n) && (
            <p className="mt-6 text-sm text-crema-dim">
              {t.weight}: <span className="text-crema">{item.weight ?? `~${n!.grams} g`}</span>
              {!item.weight && n?.estimatedWeight && <span> ({t.weightEstimated})</span>}
            </p>
          )}

          <div className="mt-8">
            <AddToCart id={item.id} />
          </div>
        </div>
      </div>

      {n && (
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="nutri">
            <h2 id="nutri" className="text-3xl">{t.nutritionTitle}</h2>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-linia text-left text-crema-dim">
                  <th className="py-2 font-normal" />
                  <th className="py-2 text-right font-normal">
                    {t.perPortion} ({n.grams} g)
                  </th>
                  <th className="py-2 text-right font-normal">{t.per100}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b]) => (
                  <tr key={label} className="border-b border-linia/60">
                    <th scope="row" className="py-3 text-left font-normal">{label}</th>
                    <td className="py-3 text-right tabular-nums">{a}</td>
                    <td className="py-3 text-right tabular-nums text-crema-dim">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-relaxed text-crema-dim">{t.nutritionNote}</p>
          </section>

          <section aria-labelledby="alerg">
            <h2 id="alerg" className="text-3xl">{t.allergensTitle}</h2>
            {n.allergens.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {n.allergens.map((a) => (
                  <li key={a} className="rounded-full bg-legno-2 px-3 py-1.5 text-sm">
                    {t.allergenNames[a]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm">{t.allergensNone}</p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-crema-dim">{t.allergensNote}</p>
          </section>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="more">
          <h2 id="more" className="text-3xl">{t.more}</h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/${lang}/meniu/${r.id}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-black">
                    {r.image ? (
                      <Image
                        src={menuImage(r.image, 640)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, 45vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-legno font-display text-xl text-crema-dim">{r.name[lang]}</div>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg leading-tight group-hover:text-ottone">{r.name[lang]}</span>
                    <span className="shrink-0 text-sm text-ottone">{formatPrice(r.price, lang)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
