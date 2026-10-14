"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true doar după hidratare în browser — pentru date din localStorage sau ora curentă. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** O valoare calculată doar în browser (null pe server). Funcția trebuie să întoarcă o valoare primitivă. */
export function useClientValue<T extends string | number | boolean>(get: () => T): T | null {
  return useSyncExternalStore(noop, get, () => null);
}
