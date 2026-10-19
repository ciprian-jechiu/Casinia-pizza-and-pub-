import { menuImage, type CategoryId } from "./menu";

/**
 * Fotografiile scenelor de pe pagina principală.
 * Atmosfera (fațadă, sală, stradă) vine din Unsplash (Unsplash License, utilizare comercială liberă)
 * și ține locul fotografiilor reale Casinia — TODO: înlocuite cu poze din local înainte de lansare.
 */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2400&q=80`;

export const SCENE = {
  /** uși de sticlă luminate, noaptea — punctul de plecare al „intrării” */
  facade: { src: u("1652196140815-99d54d124dab"), alt: "Intrarea în restaurant, seara", door: "48% 50%" },
  /** sala cu fețe de masă albe și banchete roșii */
  interior: { src: u("1543520788-f17401c3a3bd"), alt: "Sala de mese", table: "62% 78%" },
  /** masa rezervată: pizza, paste, lumânare, vin */
  table: { src: u("1769458313865-769e3740cca5"), alt: "Masă cu pizza, paste și un pahar de vin" },
  /** sală întunecată cu candelabre — fundalul poveștii */
  story: { src: u("1780909557160-d8098883bd52"), alt: "Sala luminată de candelabre" },
  /** masa lungă pentru grupuri */
  events: { src: u("1765021098997-9dad0afba661"), alt: "Masă lungă pregătită pentru un grup" },
  /** strada udă, noaptea — finalul */
  street: { src: u("1752486345389-ed3b299f34af"), alt: "Strada noaptea, după ploaie" },
} as const;

/** Imaginea din stânga panoului de meniu, pe categorie (fotografiile Casinia unde există). */
export const CATEGORY_IMAGE: Record<CategoryId, { src: string; alt: string }> = {
  oferte: { src: "/oferte/pizza-3-plus-1.jpg", alt: "Oferta Pizza 3+1 gratis" },
  pizza: { src: "/oven-pizza.jpg", alt: "Pizza pe lopată, în gura cuptorului" },
  fastfood: { src: menuImage("e3150c0a-08ae-4829-b71a-6dbd49e3bbbf_image.png", 1600), alt: "Double Cheese Burger" },
  garnituri: { src: menuImage("244b4fb9-4c39-43ce-a1e2-c6fa6a38476b_image.png", 1600), alt: "Asorti de cartofi" },
};

/** Fotografii de preparate pentru peretele de recenzii (din meniul oficial Casinia). */
export const WALL_PHOTOS = [
  "e3150c0a-08ae-4829-b71a-6dbd49e3bbbf_image.png",
  "c19b4ae3-bad6-4356-988d-117440984073_image.png",
  "244b4fb9-4c39-43ce-a1e2-c6fa6a38476b_image.png",
  "3e37430d-5b3d-432c-bd35-1549a36c7efb_image.jpeg",
  "3da7f865-d0f8-4d8c-8c9d-4ff6bd37f696_image.png",
  "ad047d01-800d-4286-84a5-157aeabf7ad6_image.jpeg",
  "bec49214-9fa2-43e8-a068-819ea202af13_image.jpeg",
  "872b5806-6284-41ff-b710-54a29af851be_image.png",
].map((f) => menuImage(f, 640));

/** Fragmente scurte din recenziile publice de pe Google (în limba originală). */
export const REVIEWS = [
  { text: "Pastele carbonara au fost foarte delicioase, iar cafeaua – excelentă.", author: "Sorina F." },
  { text: "Mâncarea este proaspătă și foarte gustoasă, personalul este foarte amabil.", author: "Denis V." },
  { text: "Foarte gustos.", author: "Anastasia I." },
  { text: "Comenzile au venit la timp. Servirea a fost atentă și atmosfera plăcută.", author: "Sorina F." },
  { text: "O atmosferă liniștită. Cu siguranță voi mai reveni.", author: "Denis V." },
];
