"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { menuById } from "@/lib/menu";

export type CartLine = { id: string; qty: number };

type CartState = {
  lines: CartLine[];
  open: boolean;
  /** crește la fiecare adăugare, ca iconița coșului să poată reacționa */
  bump: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      bump: 0,
      add: (id, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === id);
          const lines = existing
            ? s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(30, l.qty + qty) } : l))
            : [...s.lines, { id, qty }];
          return { lines, bump: s.bump + 1 };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(30, qty) } : l)),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "casinia-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      // aruncă produsele care nu mai există în meniu
      merge: (persisted, current) => {
        const lines = ((persisted as Partial<CartState>)?.lines ?? []).filter((l) => menuById.has(l.id));
        return { ...current, lines };
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
