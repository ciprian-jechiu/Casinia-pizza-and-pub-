"use client";

import { useClientValue } from "@/lib/useClient";

/** Anul curent, calculat în browser ca pagina să rămână statică. */
export function Year() {
  const year = useClientValue(() => new Date().getFullYear());
  return <>{year ?? ""}</>;
}
