"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const QUERY = "(min-width: 1024px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Laptop: scenele animate. Telefon/tabletă: pagina mobilă.
 * Serverul le trimite pe amândouă (ascunse din CSS, fără sărituri la încărcare);
 * după hidratare rămâne montată doar cea potrivită ecranului, ca scenele GSAP
 * să nu ruleze degeaba pe telefon (și invers).
 */
export function HomeSwitch({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  const isDesktop = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => null);
  return (
    <>
      {isDesktop !== false && <div className={isDesktop ? undefined : "hidden lg:block"}>{desktop}</div>}
      {isDesktop !== true && <div className={isDesktop === false ? undefined : "lg:hidden"}>{mobile}</div>}
    </>
  );
}
