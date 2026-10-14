import type { Locale } from "./i18n";

/** Ține minte limba aleasă, ca proxy-ul să o folosească la următoarea vizită pe „/”. */
export function rememberLocale(l: Locale) {
  document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
}
