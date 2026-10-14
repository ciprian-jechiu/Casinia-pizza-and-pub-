import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { AdminPanel } from "@/components/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage({ params }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-8">
      <h1 className="mb-10 text-5xl">{dict.admin.title}</h1>
      <AdminPanel />
    </div>
  );
}
