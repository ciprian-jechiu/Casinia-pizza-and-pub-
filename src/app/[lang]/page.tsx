import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { Hero } from "@/components/home/Hero";
import { PizzaStrip } from "@/components/home/PizzaStrip";
import { Story } from "@/components/home/Story";
import { Bites } from "@/components/home/Bites";
import { Visit } from "@/components/home/Visit";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <>
      <Hero />
      <PizzaStrip />
      <Story />
      <Bites locale={lang} dict={dict} />
      <Visit locale={lang} dict={dict} />
    </>
  );
}
