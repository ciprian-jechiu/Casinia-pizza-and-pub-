import type { Dictionary } from "@/dictionaries/ro";
import type { Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

/** Recenzii (rezumat), adresă, program și hartă. */
export function Visit({ dict }: { locale: Locale; dict: Dictionary }) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <>
      <section className="border-y border-linia bg-legno/40" aria-labelledby="reviews-title">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 md:grid-cols-[auto_1fr] md:items-center md:gap-20">
          <div>
            <h2 id="reviews-title" className="sr-only">{dict.reviews.title}</h2>
            <p className="font-display text-[clamp(5rem,12vw,9rem)] leading-none text-ottone">
              {site.rating.value.toLocaleString("ro-MD")}
            </p>
            <div className="mt-2 flex gap-1 text-ottone" aria-hidden>
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="star-partial"><stop offset="70%" stopColor="#c8a078" /><stop offset="70%" stopColor="transparent" /></linearGradient>
                </defs>
              </svg>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i < 4 ? "currentColor" : "url(#star-partial)"}>
                  <path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8L12 2.5Z" stroke="currentColor" strokeWidth="1" />
                </svg>
              ))}
            </div>
            <p className="mt-3 text-sm text-crema-dim">{dict.reviews.summary.replace("{count}", String(site.rating.count))}</p>
          </div>
          <div>
            <p className="font-display text-3xl">{dict.reviews.title}</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {dict.reviews.points.map((p) => (
                <li key={p} className="rounded-full border border-linia px-4 py-2 text-sm text-crema">
                  {p}
                </li>
              ))}
            </ul>
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block text-sm text-ottone underline-offset-4 hover:underline">
              {dict.reviews.cta}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="visit-title">
        <div>
          <h2 id="visit-title" className="text-[clamp(2.2rem,4.5vw,3.8rem)] leading-none">{dict.visit.title}</h2>
          <dl className="mt-10 space-y-8">
            <div>
              <dt className="text-sm text-crema-dim">{dict.visit.address}</dt>
              <dd className="mt-1 font-display text-2xl">
                {site.address.street}, {site.address.city}
                <span className="block text-base text-crema-dim">{site.address.building}</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-crema-dim">{dict.visit.phone}</dt>
              <dd className="mt-1">
                <a href={site.phoneHref} className="font-display text-2xl hover:text-ottone">{site.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-crema-dim">{dict.visit.hours}</dt>
              <dd className="mt-2">
                <table className="w-full max-w-sm text-sm">
                  <tbody>
                    {order.map((d) => {
                      const h = site.hours.find((x) => x.day === d);
                      return (
                        <tr key={d} className="border-b border-linia/60">
                          <th scope="row" className="py-2 text-left font-normal text-crema-dim">{dict.visit.days[d]}</th>
                          <td className="py-2 text-right tabular-nums">{h ? `${h.open} – ${h.close}` : dict.visit.closed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 max-w-sm text-xs leading-relaxed text-crema-dim">{dict.visit.hoursNote}</p>
              </dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-brass">{dict.visit.directions}</a>
            <a href={site.phoneHref} className="btn btn-ghost">{dict.visit.call}</a>
          </div>
        </div>
        <div className="arch relative min-h-[420px] border border-linia bg-legno">
          <iframe
            title="Google Maps — Casinia Pizza Pub"
            src={site.mapsEmbed}
            className="absolute inset-0 h-full w-full"
            style={{ filter: "grayscale(0.6) invert(0.92) hue-rotate(180deg) sepia(0.25) contrast(0.9)" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
