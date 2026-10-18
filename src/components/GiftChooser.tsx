"use client";

import Image from "next/image";
import { useI18n } from "./I18nProvider";
import { useCart } from "@/store/cart";
import { menuById, menuImage } from "@/lib/menu";
import { PROMO, normalizeGifts } from "@/lib/promo";

/**
 * Cadourile ofertei 3+1 din coș: câte un rând pentru fiecare 3 pizza,
 * în care clientul alege pizza gratis (Margherita, Pollo e Funghi sau B.B.Q).
 */
export function GiftChooser({ count, as: Tag = "li", className = "" }: { count: number; as?: "li" | "div"; className?: string }) {
  const { locale, dict } = useI18n();
  const stored = useCart((s) => s.gifts);
  const setGift = useCart((s) => s.setGift);
  const gifts = normalizeGifts(count, stored);
  const short = (id: string) => (menuById.get(id)?.name[locale] ?? id).replace(/^(Pizza|Пицца)\s+/i, "").replace(/\s+Pizza$/i, "");

  return (
    <>
      {gifts.map((chosen, i) => (
        <Tag key={i} className={`py-4 ${className}`}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-lg leading-tight">
              {count > 1 ? dict.promo.giftOf.replace("{n}", String(i + 1)) : dict.promo.giftChoose}
              <span className="ml-2 text-xs uppercase tracking-[0.18em] text-ottone">{dict.promo.giftLine}</span>
            </p>
            <span className="shrink-0 text-sm text-ottone">{dict.promo.free}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={dict.promo.giftChoose}>
            {PROMO.giftOptions.map((id) => {
              const item = menuById.get(id);
              const on = chosen === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setGift(i, id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center text-xs leading-tight transition-colors ${
                    on ? "border-ottone bg-ottone/15 text-crema" : "border-linia text-crema-dim hover:border-crema-dim"
                  }`}
                >
                  <span className="arch relative block size-11 bg-legno-2">
                    {item?.image && <Image src={menuImage(item.image, 160)} alt="" fill sizes="44px" className="object-cover" />}
                  </span>
                  {short(id)}
                </button>
              );
            })}
          </div>
        </Tag>
      ))}
    </>
  );
}
