import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
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
  return (
    <div className="mx-auto grid max-w-7xl gap-16 px-4 pb-24 pt-36 sm:px-8 lg:grid-cols-[minmax(0,1fr)_0.55fr]">
      <div className="min-w-0">
        <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95]">{dict.reservation.title}</h1>
        <p className="mb-12 mt-4 max-w-xl text-crema-dim">{dict.reservation.lead}</p>
        <ReservationForm />
      </div>
      <div className="relative hidden lg:block">
        {/* plăcuța „Rezervat” de pe masă */}
        <div className="arch sticky top-28 aspect-square w-full bg-[#3b2f2a] shadow-[0_30px_70px_-35px_rgb(0_0_0/.9)]">
          <Image src="/rezervat.jpg" alt={dict.home.riservato.replace(/\.$/, "")} fill sizes="(min-width: 1024px) 30vw, 1px" className="object-cover" />
        </div>
      </div>
    </div>
  );
}
