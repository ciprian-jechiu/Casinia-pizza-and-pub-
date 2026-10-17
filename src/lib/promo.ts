import { menuById } from "./menu";

/**
 * Oferta „Pizza 3+1”: la fiecare 3 pizza plătite, a patra e cadou.
 * Pizza cadou e Margherita (6+2, 9+3 …). Aceeași regulă e folosită în coș și pe server.
 */
export const PROMO = { buy: 3, giftId: "pizza-margherita" } as const;

export const isPromoItem = (id: string) => menuById.get(id)?.category === "pizza";

/** Câte pizza plătite sunt în comandă și câte cadouri revin. */
export function promoFor(lines: { id: string; qty: number }[]) {
  const pizzas = lines.reduce((n, l) => n + (isPromoItem(l.id) ? l.qty : 0), 0);
  const gifts = Math.floor(pizzas / PROMO.buy);
  const toNext = PROMO.buy - (pizzas % PROMO.buy);
  return { pizzas, gifts, toNext };
}
