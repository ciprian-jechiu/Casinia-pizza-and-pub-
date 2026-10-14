"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/dictionaries/ro";
import type { Locale } from "@/lib/i18n";

type Ctx = { locale: Locale; dict: Dictionary };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, dict, children }: Ctx & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Înlocuiește {cheie} în textele din dicționar. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`));
}
