import type { Locale } from "./i18n";

const RESTORE_KEY = "casinia-restore-scroll";

/** Ține minte limba aleasă, ca proxy-ul să o folosească la următoarea vizită pe „/”. */
export function rememberLocale(l: Locale) {
  document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** La schimbarea limbii: salvează poziția curentă, ca pagina în noua limbă să rămână în același loc. */
export function switchLocale(l: Locale, toPath: string) {
  rememberLocale(l);
  try {
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ path: toPath, y: window.scrollY, at: Date.now() }));
  } catch {
    /* fără sessionStorage: pagina pornește de sus */
  }
}

/** Poziția salvată pentru calea dată (valabilă câteva secunde după schimbarea limbii), sau null. */
export function peekRestore(path: string): number | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY);
    if (!raw) return null;
    const { path: p, y, at } = JSON.parse(raw) as { path: string; y: number; at: number };
    return p === path && Date.now() - at < 15000 ? y : null;
  } catch {
    return null;
  }
}

export function clearRestore() {
  try {
    sessionStorage.removeItem(RESTORE_KEY);
  } catch {
    /* nimic de șters */
  }
}
