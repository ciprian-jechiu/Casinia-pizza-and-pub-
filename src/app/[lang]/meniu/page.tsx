import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { MenuBoard } from "@/components/MenuBoard";

export async function generateMetadata({ params }: PageProps<"/[lang]/meniu">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.menuPage.title, alternates: { canonical: `/${lang}/meniu` } };
}

export default async function MenuPage({ params }: PageProps<"/[lang]/meniu">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <>
      <header className="mx-auto max-w-7xl px-4 pb-10 pt-36 sm:px-8">
        <h1 className="text-[clamp(3.4rem,9vw,7.5rem)] leading-[0.9]">{dict.menuPage.title}</h1>
        <p className="mt-5 max-w-xl text-crema-dim">{dict.menuPage.lead}</p>
      </header>
      <MenuBoard />
    </>
  );
}
