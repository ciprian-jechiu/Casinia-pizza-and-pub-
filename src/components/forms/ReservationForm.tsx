"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fill, useI18n } from "../I18nProvider";
import { Field, errorText } from "./Field";
import { addDays, nowInChisinau, reservationSlots } from "@/lib/schedule";
import { intlLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useClientValue } from "@/lib/useClient";

type Errors = Partial<Record<"name" | "phone" | "date" | "time" | "email" | "form", string>>;

export function ReservationForm() {
  const { locale, dict } = useI18n();
  // ziua de azi (ora Chișinăului) se știe doar în browser
  const today = useClientValue(() => nowInChisinau().date);
  const [picked, setDate] = useState<string>("");
  const [pickedTime, setTime] = useState<string>("");
  const [guests, setGuests] = useState(2);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ date: string; time: string; guests: number; phone: string } | null>(null);

  const date = picked || (today ? (reservationSlots(today).length ? today : addDays(today, 1)) : "");
  const days = useMemo(() => (today ? Array.from({ length: 14 }, (_, i) => addDays(today, i)) : []), [today]);
  const slots = useMemo(() => (date ? reservationSlots(date) : []), [date]);

  // o oră aleasă pentru altă zi nu mai e valabilă
  const time = slots.includes(pickedTime) ? pickedTime : "";

  const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale[locale], { timeZone: "UTC", ...opts }).format(new Date(`${iso}T12:00:00Z`));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      locale,
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      date,
      time,
      guests,
      notes: String(fd.get("notes") ?? ""),
      company: String(fd.get("company") ?? ""),
    };
    const local: Errors = {};
    if (!date) local.date = dict.errors.date;
    if (!time) local.time = dict.errors.time;
    if (payload.name.trim().length < 2) local.name = dict.errors.name;
    if (!/^\+?\d{8,15}$/.test(payload.phone.replace(/[\s().-]/g, ""))) local.phone = dict.errors.phone;
    setErrors(local);
    if (Object.keys(local).length) return;

    setSending(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({ date, time, guests, phone: payload.phone });
        window.scrollTo({ top: 0 });
        return;
      }
      if (res.status === 400 && Array.isArray(data.fields)) {
        const next: Errors = {};
        for (const f of data.fields as { path: string; code: string }[]) next[f.path as keyof Errors] = errorText(f.code, dict.errors);
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

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl" role="status">
        <h2 className="text-5xl">{dict.reservation.successTitle}</h2>
        <p className="mt-4 text-lg text-crema-dim">
          {fill(dict.reservation.successBody, {
            date: fmtDay(done.date, { weekday: "long", day: "numeric", month: "long" }),
            time: done.time,
            guests: done.guests,
            phone: done.phone,
          })}
        </p>
        <button type="button" className="btn btn-ghost mt-8" onClick={() => { setDone(null); setTime(""); }}>
          {dict.reservation.another}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-10">
      <fieldset>
        <legend className="mb-3 text-sm text-crema-dim">{dict.reservation.date}</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" data-lenis-prevent-touch role="radiogroup" aria-label={dict.reservation.date}>
          {days.map((d) => {
            const has = reservationSlots(d).length > 0;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={date === d}
                disabled={!has}
                onClick={() => setDate(d)}
                className="chip min-w-[4.5rem] shrink-0 flex-col !items-center !justify-center py-2 leading-tight disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-[0.7rem] opacity-80">{fmtDay(d, { weekday: "short" })}</span>
                <span className="font-display text-xl">{fmtDay(d, { day: "numeric" })}</span>
                <span className="text-[0.7rem] opacity-80">{fmtDay(d, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
        {errors.date && <p role="alert" className="mt-1.5 text-sm text-[#e0836c]">{errors.date}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm text-crema-dim">{dict.reservation.time}</legend>
        <AnimatePresence mode="wait">
          <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-wrap gap-2" role="radiogroup" aria-label={dict.reservation.time}>
            {slots.length === 0 && date ? (
              <p className="text-crema-dim">{dict.reservation.noSlots}</p>
            ) : (
              slots.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={time === s} onClick={() => setTime(s)} className="chip tabular-nums">
                  {s}
                </button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
        {errors.time && <p role="alert" className="mt-1.5 text-sm text-[#e0836c]">{errors.time}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm text-crema-dim">{dict.reservation.guests}</legend>
        <div className="inline-flex items-center rounded-full border border-linia">
          <button type="button" className="grid size-12 place-items-center text-xl disabled:opacity-30" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="−1">
            −
          </button>
          <output className="w-12 text-center font-display text-3xl tabular-nums" aria-live="polite">{guests}</output>
          <button type="button" className="grid size-12 place-items-center text-xl disabled:opacity-30" onClick={() => setGuests((g) => Math.min(site.reservation.maxGuests, g + 1))} disabled={guests >= site.reservation.maxGuests} aria-label="+1">
            +
          </button>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="r-name" label={dict.reservation.name} error={errors.name}>
          <input id="r-name" name="name" autoComplete="name" className="field" aria-invalid={!!errors.name} />
        </Field>
        <Field id="r-phone" label={dict.reservation.phone} error={errors.phone}>
          <input id="r-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="068 488 488" className="field" aria-invalid={!!errors.phone} />
        </Field>
        <Field id="r-email" label={dict.reservation.email} error={errors.email}>
          <input id="r-email" name="email" type="email" autoComplete="email" className="field" />
        </Field>
      </div>

      <Field id="r-notes" label={dict.reservation.notes}>
        <textarea id="r-notes" name="notes" rows={3} placeholder={dict.reservation.notesPlaceholder} className="field resize-y" maxLength={500} />
      </Field>

      <div className="hidden" aria-hidden>
        <input name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form && <p role="alert" className="text-sm text-[#e0836c]">{errors.form}</p>}
      <button type="submit" disabled={sending} className="btn btn-brass min-w-56 disabled:opacity-50">
        {sending ? dict.reservation.submitting : dict.reservation.submit}
      </button>
    </form>
  );
}
