import { menuById } from "./menu";

/**
 * Oferta „Pizza 3+1”: la fiecare 3 pizza plătite, a patra e cadou (6+2, 9+3 …).
 * Pizza cadou o alege clientul: Margherita, Pollo e Funghi sau B.B.Q.
 * Aceeași regulă e folosită în coș și pe server.
 */
export const PROMO = {
  buy: 3,
  giftOptions: ["pizza-margherita", "pizza-pollo", "pizza-bbq"],
  defaultGift: "pizza-margherita",
} as const;

export const isPromoItem = (id: string) => menuById.get(id)?.category === "pizza";
export const isGiftOption = (id: string): boolean => (PROMO.giftOptions as readonly string[]).includes(id);

/** Câte pizza plătite sunt în comandă și câte cadouri revin. */
export function promoFor(lines: { id: string; qty: number }[]) {
  const pizzas = lines.reduce((n, l) => n + (isPromoItem(l.id) ? l.qty : 0), 0);
  const gifts = Math.floor(pizzas / PROMO.buy);
  const toNext = PROMO.buy - (pizzas % PROMO.buy);
  return { pizzas, gifts, toNext };
}

/** Lista finală de cadouri: câte una pentru fiecare 3 pizza, alegerile invalide devin Margherita. */
export function normalizeGifts(count: number, chosen: readonly string[] = []): string[] {
  return Array.from({ length: count }, (_, i) => (chosen[i] && isGiftOption(chosen[i]) ? chosen[i] : PROMO.defaultGift));
}
