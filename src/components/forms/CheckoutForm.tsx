"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fill, useI18n } from "../I18nProvider";
import { Field, errorText } from "./Field";
import { cartTotals, hasDeliveryOnly, useCart } from "@/store/cart";
import { menuById, menuImage } from "@/lib/menu";
import { normalizeGifts, promoFor } from "@/lib/promo";
import { GiftChooser } from "../GiftChooser";
import { ChoiceList } from "../CartDrawer";
import { formatPrice } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useHydrated } from "@/lib/useClient";

type Errors = Partial<Record<"name" | "phone" | "address" | "time" | "items" | "form", string>>;

export function CheckoutForm() {
  const { locale, dict } = useI18n();
  const { lines, gifts, clear } = useCart();
  const hydrated = useHydrated();
  const [methodChoice, setMethod] = useState<"pickup" | "delivery">("pickup");
  // ofertele (combo-uri, pizza 3+1) se comandă doar cu livrare
  const deliveryOnly = hasDeliveryOnly(lines);
  const method = deliveryOnly ? "delivery" : methodChoice;
  const [zone, setZone] = useState<"stauceni" | "outside">("stauceni");
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ id: string; phone: string } | null>(null);

  const { total } = cartTotals(lines);
  const promo = promoFor(lines);
  const belowMin = method === "delivery" && total < site.ordering.minOrderDelivery;
  // livrare gratuită în Stăuceni, 50 lei în afara Stăuceni
  const deliveryFee = method === "delivery" && zone === "outside" ? site.ordering.deliveryFeeOutside : 0;
  const grandTotal = total + deliveryFee;
  const feeText = formatPrice(site.ordering.deliveryFeeOutside, locale);
  const errMap = useMemo(
    () => ({
      ...dict.errors,
      offer_delivery: dict.offers.deliveryOnly,
      bad_choices: dict.offers.chooseError,
      min_order: fill(dict.checkout.minOrder, { amount: formatPrice(site.ordering.minOrderDelivery, locale) }),
    }),
    [dict, locale],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      locale,
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      method,
      zone,
      address: String(fd.get("address") ?? ""),
      // ora livrării/ridicării se stabilește la telefon, când restaurantul confirmă comanda
      when: "asap" as const,
      payment,
      notes: String(fd.get("notes") ?? ""),
      items: lines.map((l) => ({ id: l.id, qty: l.qty, ...(l.choices ? { choices: l.choices } : {}), ...(l.gift ? { gift: l.gift } : {}) })),
      gifts: normalizeGifts(promo.gifts, gifts),
      company: String(fd.get("company") ?? ""),
    };

    // validare rapidă în browser; serverul validează oricum tot
    const local: Errors = {};
    if (payload.name.trim().length < 2) local.name = dict.errors.name;
    if (!/^\+?\d{8,15}$/.test(payload.phone.replace(/[\s().-]/g, ""))) local.phone = dict.errors.phone;
    if (method === "delivery" && payload.address.trim().length < 5) local.address = dict.errors.address;
    setErrors(local);
    if (Object.keys(local).length || belowMin) return;

    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({ id: data.id, phone: payload.phone });
        clear();
        window.scrollTo({ top: 0 });
        return;
      }
      if (res.status === 400 && Array.isArray(data.fields)) {
        const next: Errors = {};
        for (const f of data.fields as { path: string; code: string }[]) {
          const key = f.path.split(".")[0] as keyof Errors;
          next[key] = errorText(f.code, errMap);
        }
        setErrors(next);
      } else if (res.status === 503) {
        setErrors({ form: fill(dict.errors.unavailable, { phone: site.phone }) });
      } else {
        setErrors({ form: fill(dict.errors.generic, { phone: site.phone }) });
      }
    } catch {
      setErrors({ form: fill(dict.errors.generic, { phone: site.phone }) });
    } finally {
      setSending(false);
    }
  }

  // Pagina rămâne „în memorie” când navighezi pe site; dacă după o comandă trimisă clientul pune
  // din nou produse în coș, trebuie să vadă formularul, nu mesajul de succes al comenzii vechi.
  if (done && lines.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl" role="status">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden className="text-basilico">
          <motion.circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
          <motion.path d="m17 29 7 7 15-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.5 }} />
        </svg>
        <h2 className="mt-6 text-5xl">{dict.checkout.successTitle}</h2>
        <p className="mt-4 text-lg text-crema-dim">{fill(dict.checkout.successBody, { id: done.id, phone: done.phone })}</p>
        <Link href={`/${locale}`} className="btn btn-ghost mt-8">
          {dict.checkout.backHome}
        </Link>
      </motion.div>
    );
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="max-w-md">
        <p className="text-crema-dim">{dict.checkout.emptyCart}</p>
        <Link href={`/${locale}/meniu`} className="btn btn-brass mt-6">
          {dict.cart.browse}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-sm text-crema-dim">{dict.checkout.method}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(["pickup", "delivery"] as const).map((m) => (
              <label key={m} className={`chip ${deliveryOnly && m === "pickup" ? "pointer-events-none opacity-40" : ""}`}>
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} disabled={deliveryOnly && m === "pickup"} className="sr-only" />
                {m === "pickup" ? dict.checkout.pickup : dict.checkout.delivery}
              </label>
            ))}
          </div>
          {deliveryOnly && <p className="mt-3 text-sm text-ottone">{dict.offers.deliveryOnly}</p>}
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="name" label={dict.checkout.name} error={errors.name}>
            <input id="name" name="name" autoComplete="name" className="field" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          </Field>
          <Field id="phone" label={dict.checkout.phone} error={errors.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="068 488 488" className="field" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
          </Field>
        </div>

        <AnimatePresence initial={false}>
          {method === "delivery" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 overflow-hidden">
              <fieldset>
                <legend className="mb-3 text-sm text-crema-dim">{dict.checkout.zone}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {(["stauceni", "outside"] as const).map((z) => (
                    <label key={z} className="chip">
                      <input type="radio" name="zone" value={z} checked={zone === z} onChange={() => setZone(z)} className="sr-only" />
                      {z === "stauceni" ? dict.checkout.zoneStauceni : dict.checkout.zoneOutside}
                      <span className="ml-2 opacity-70">{z === "stauceni" ? dict.checkout.zoneFree : `+${feeText}`}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-crema-dim">{dict.checkout.deliveryNote.replace("{fee}", feeText)}</p>
              </fieldset>
              <Field id="address" label={dict.checkout.address} error={errors.address}>
                <input id="address" name="address" autoComplete="street-address" placeholder={dict.checkout.addressPlaceholder} className="field" aria-invalid={!!errors.address} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>


        <fieldset>
          <legend className="mb-3 text-sm text-crema-dim">{dict.checkout.payment}</legend>
          <div className="flex flex-wrap gap-2">
            {(["cash", "card"] as const).map((p) => (
              <label key={p} className="chip">
                <input type="radio" name="payment" value={p} checked={payment === p} onChange={() => setPayment(p)} className="sr-only" />
                {p === "cash" ? dict.checkout.cash : dict.checkout.card}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="notes" label={dict.checkout.notes}>
          <textarea id="notes" name="notes" rows={3} placeholder={dict.checkout.notesPlaceholder} className="field resize-y" maxLength={500} />
        </Field>

        {/* capcană anti-spam, invizibilă pentru oameni */}
        <div className="hidden" aria-hidden>
          <input name="company" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      <aside className="h-fit rounded-[28px] border border-linia bg-legno/70 p-6 lg:sticky lg:top-28">
        <h2 className="text-3xl">{dict.checkout.summary}</h2>
        <ul className="mt-5 divide-y divide-linia">
          {hydrated &&
            lines.map((l) => {
              const it = menuById.get(l.id);
              if (!it) return null;
              return (
                <li key={l.key} className="flex items-center gap-3 py-3">
                  <div className="arch relative size-11 shrink-0 bg-legno-2">
                    {it.image && <Image src={menuImage(it.image, 160)} alt="" fill sizes="44px" className="object-cover" />}
                  </div>
                  <span className="flex-1 text-sm">
                    <span className="text-crema-dim tabular-nums">{l.qty} ×</span> {it.name[locale]}
                    {l.choices && <ChoiceList ids={l.choices} gift={l.gift} className="mt-0.5" />}
                  </span>
                  <span className="text-sm tabular-nums">{formatPrice(it.price * l.qty, locale)}</span>
                </li>
              );
            })}
          {hydrated && promo.gifts > 0 && <GiftChooser count={promo.gifts} />}
        </ul>
        {deliveryFee > 0 && (
          <div className="mt-4 space-y-1 border-t border-linia pt-4 text-sm">
            <div className="flex justify-between text-crema-dim">
              <span>{dict.checkout.subtotal}</span>
              <span className="tabular-nums">{formatPrice(total, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span>{dict.checkout.deliveryFeeLine}</span>
              <span className="tabular-nums">{formatPrice(deliveryFee, locale)}</span>
            </div>
          </div>
        )}
        <div className="mt-4 flex items-baseline justify-between border-t border-linia pt-4">
          <span className="text-crema-dim">{dict.checkout.total}</span>
          <span className="font-display text-4xl text-ottone tabular-nums">{hydrated ? formatPrice(grandTotal, locale) : "—"}</span>
        </div>
        {belowMin && (
          <p role="alert" className="mt-3 text-sm text-errore">
            {errMap.min_order}
          </p>
        )}
        {errors.items && <p role="alert" className="mt-3 text-sm text-errore">{errors.items}</p>}
        {errors.form && <p role="alert" className="mt-3 text-sm text-errore">{errors.form}</p>}
        <button type="submit" disabled={sending || belowMin || !hydrated} className="btn btn-brass mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? dict.checkout.submitting : dict.checkout.submit}
        </button>
      </aside>
    </form>
  );
}
