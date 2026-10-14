import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { CheckoutForm } from "@/components/forms/CheckoutForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/comanda">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[lang]/comanda">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-8">
      <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95]">{dict.checkout.title}</h1>
      <p className="mb-12 mt-4 max-w-xl text-crema-dim">{dict.checkout.lead}</p>
      <CheckoutForm />
    </div>
  );
}
