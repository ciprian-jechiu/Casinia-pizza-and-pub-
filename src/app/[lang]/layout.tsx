import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary } from "@/dictionaries";
import { hasLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { I18nProvider } from "@/components/I18nProvider";
import { Header } from "@/components/Header";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { SmoothScroll } from "@/components/SmoothScroll";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casinia.md";

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: `%s · ${site.name}` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: site.name,
      locale: lang,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2b0b10",
  colorScheme: "dark",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    servesCuisine: ["Pizza", "Italian", "Burgers"],
    priceRange: site.priceRange,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.street}, ${site.address.building}`,
      addressLocality: site.address.city,
      addressCountry: "MD",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    aggregateRating: { "@type": "AggregateRating", ratingValue: site.rating.value, reviewCount: site.rating.count },
    acceptsReservations: true,
    hasMenu: `${SITE_URL}/${lang}/meniu`,
  };

  return (
    <html lang={lang}>
      <body>
        <I18nProvider locale={lang} dict={dict}>
          <SmoothScroll />
          <Header />
          <main id="main">{children}</main>
          <Footer locale={lang} dict={dict} />
          <MobileActionBar />
          <CartDrawer />
        </I18nProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
