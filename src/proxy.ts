import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";

/**
 * Limba la prima vizită: româna, cu excepția browserelor setate pe rusă.
 * Engleza (sau altă limbă) se alege din comutatorul de pe site și rămâne salvată în cookie.
 */
function preferredLocale(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie;
  const headers = { "accept-language": req.headers.get("accept-language") ?? "" };
  const languages = new Negotiator({ headers }).languages();
  try {
    const best = match(languages, ["ro", "ru"], defaultLocale);
    // rusa doar dacă browserul o preferă înaintea românei
    const ruIdx = languages.findIndex((l) => l.toLowerCase().startsWith("ru"));
    const roIdx = languages.findIndex((l) => l.toLowerCase().startsWith("ro"));
    if (best === "ru" && ruIdx !== -1 && (roIdx === -1 || ruIdx < roIdx)) return "ru";
    return defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  req.nextUrl.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(req.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|.*\\..*).*)"],
};
