import "server-only";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "./ro";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ro: () => import("./ro").then((m) => m.default),
  ru: () => import("./ru").then((m) => m.default),
  en: () => import("./en").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
export type { Dictionary };
