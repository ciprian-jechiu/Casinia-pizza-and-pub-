import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { menuById, menuImage } from "@/lib/menu";
import { ReservationForm } from "@/components/forms/ReservationForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/rezervare">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.reservation.title, alternates: { canonical: `/${lang}/rezervare` } };
}

export default async function ReservationPage({ params }: PageProps<"/[lang]/rezervare">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const pizza = menuById.get("pizza-quattro-formaggi")!;
  return (
    <div className="mx-auto grid max-w-7xl gap-16 px-4 pb-24 pt-36 sm:px-8 lg:grid-cols-[1fr_0.55fr]">
      <div>
        <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95]">{dict.reservation.title}</h1>
        <p className="mb-12 mt-4 max-w-xl text-crema-dim">{dict.reservation.lead}</p>
        <ReservationForm />
      </div>
      <div className="relative hidden lg:block">
        <div className="arch sticky top-28 aspect-[3/4] w-full bg-[#121212]">
          <Image src={menuImage(pizza.image!, 1024)} alt={pizza.name[lang]} fill sizes="30vw" className="scale-[1.6] object-cover" style={{ objectPosition: "22% 50%" }} />
        </div>
      </div>
    </div>
  );
}
