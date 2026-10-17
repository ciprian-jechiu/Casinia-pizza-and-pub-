import { z } from "zod";
import { locales } from "./i18n";
import { site } from "./site";

/** Telefon din Moldova sau internațional: acceptă 0XX XXX XXX, +373..., spații și cratime. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine((v) => /^(\+?\d{8,15})$/.test(v), { message: "phone" });

const nameSchema = z.string().trim().min(2, { message: "name" }).max(80);

export const orderSchema = z
  .object({
    locale: z.enum(locales),
    name: nameSchema,
    phone: phoneSchema,
    method: z.enum(["pickup", "delivery"]),
    address: z.string().trim().max(240).optional().default(""),
    when: z.enum(["asap", "scheduled"]),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    payment: z.enum(["cash", "card"]),
    notes: z.string().trim().max(500).optional().default(""),
    items: z
      .array(
        z.object({
          id: z.string().min(1).max(60),
          qty: z.number().int().min(1).max(30),
          /** pizzele alese pentru oferta 3+1 */
          choices: z.array(z.string().min(1).max(60)).max(8).optional(),
        }),
      )
      .min(1)
      .max(40),
    /** câmp capcană anti-spam: oamenii nu îl văd și nu îl completează */
    company: z.string().max(0).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.method === "delivery" && v.address.length < 5)
      ctx.addIssue({ code: "custom", path: ["address"], message: "address" });
    if (v.when === "scheduled" && !v.time)
      ctx.addIssue({ code: "custom", path: ["time"], message: "time" });
  });

export type OrderInput = z.input<typeof orderSchema>;

export const reservationSchema = z.object({
  locale: z.enum(locales),
  name: nameSchema,
  phone: phoneSchema,
  email: z.union([z.literal(""), z.email()]).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date" }),
  time: z.string().regex(/^\d{2}:\d{2}$/, { message: "time" }),
  guests: z.number().int().min(1).max(site.reservation.maxGuests),
  notes: z.string().trim().max(500).optional().default(""),
  company: z.string().max(0).optional().default(""),
});

export type ReservationInput = z.input<typeof reservationSchema>;

export const statusSchema = z.enum(["new", "confirmed", "done", "cancelled"]);
export type Status = z.infer<typeof statusSchema>;
