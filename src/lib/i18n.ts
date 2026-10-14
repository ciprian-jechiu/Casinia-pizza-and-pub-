export const locales = ["ro", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ro";

export const localeLabels: Record<Locale, string> = {
  ro: "RO",
  ru: "RU",
  en: "EN",
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const intlLocale: Record<Locale, string> = {
  ro: "ro-MD",
  ru: "ru-MD",
  en: "en-GB",
};

export function formatPrice(value: number, locale: Locale) {
  const n = new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 0 }).format(value);
  return locale === "ru" ? `${n} лей` : `${n} lei`;
}
