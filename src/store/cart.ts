"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { menuById } from "@/lib/menu";

/**
 * Un rând din coș. `choices` = pizzele alese pentru oferta 3+1 (în ordine sortată),
 * iar `key` deosebește rândurile cu același produs dar alegeri diferite.
 */
export type CartLine = { key: string; id: string; qty: number; choices?: string[]; gift?: string };

export const lineKey = (id: string, choices?: string[], gift?: string) =>
  choices?.length ? `${id}:${[...choices].sort().join(",")}${gift ? `+${gift}` : ""}` : id;

type CartState = {
  lines: CartLine[];
  /** pizza cadou aleasă pentru fiecare 3 pizza din coș (oferta 3+1) */
  gifts: string[];
  open: boolean;
  /** crește la fiecare adăugare, ca iconița coșului să poată reacționa */
  bump: number;
  add: (id: string, qty?: number, choices?: string[], gift?: string) => void;
  setGift: (index: number, id: string) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      gifts: [],
      open: false,
      bump: 0,
      add: (id, qty = 1, choices, gift) =>
        set((s) => {
          const sorted = choices?.length ? [...choices].sort() : undefined;
          const key = lineKey(id, sorted, gift);
          const existing = s.lines.find((l) => l.key === key);
          const lines = existing
            ? s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(30, l.qty + qty) } : l))
            : [...s.lines, { key, id, qty, ...(sorted ? { choices: sorted } : {}), ...(gift ? { gift } : {}) }];
          return { lines, bump: s.bump + 1 };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(30, qty) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setGift: (index, id) =>
        set((s) => {
          const gifts = Array.from({ length: Math.max(s.gifts.length, index + 1) }, (_, i) => s.gifts[i] ?? "");
          gifts[index] = id;
          return { gifts };
        }),
      clear: () => set({ lines: [], gifts: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "casinia-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, gifts: s.gifts }),
      // aruncă produsele care nu mai există în meniu; coșurile vechi primesc `key`
      merge: (persisted, current) => {
        const raw = ((persisted as Partial<CartState>)?.lines ?? []) as Partial<CartLine>[];
        const lines = raw
          .filter((l): l is CartLine => typeof l.id === "string" && typeof l.qty === "number" && menuById.has(l.id))
          // pachete 3+1 salvate după reguli vechi (alt număr de pizza / fără cadou) se scot
          .filter((l) => {
            const o = menuById.get(l.id)?.offer;
            if (!o?.choose) return true;
            return l.choices?.length === o.choose.count && (!o.gift || (!!l.gift && o.gift.includes(l.gift)));
          })
          .map((l) => ({ ...l, key: l.key ?? lineKey(l.id, l.choices, l.gift) }));
        // păstrează pozițiile (Cadou 1, Cadou 2 …); golurile devin Margherita la afișare
        const gifts = ((persisted as Partial<CartState>)?.gifts ?? []).map((g) => (typeof g === "string" ? g : ""));
        return { ...current, lines, gifts };
      },
    },
  ),
);

export function cartTotals(lines: CartLine[]) {
  let count = 0;
  let total = 0;
  for (const l of lines) {
    const item = menuById.get(l.id);
    if (!item) continue;
    count += l.qty;
    total += item.price * l.qty;
  }
  return { count, total };
}

/** Coșul conține oferte care se pot comanda doar cu livrare. */
export const hasDeliveryOnly = (lines: CartLine[]) => lines.some((l) => menuById.get(l.id)?.offer?.deliveryOnly);
