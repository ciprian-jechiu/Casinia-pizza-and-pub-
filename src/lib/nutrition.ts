/**
 * Valori nutriționale estimate, calculate din rețeta fiecărui produs:
 * gramajul fiecărui ingredient × valorile de referință la 100 g ale ingredientului (preparat).
 *
 * Unde meniul dă gramajul, rețeta îl respectă exact; pentru pizze (Ø 32 cm) și garnituri,
 * gramajele sunt estimări uzuale de bucătărie. Valorile sunt orientative.
 * TODO: de confirmat gramajele cu bucătăria Casinia.
 */

type Per100 = { kcal: number; p: number; f: number; c: number };

/** Valori de referință la 100 g (ingrediente gătite / gata de servit). */
const ING = {
  aluat: { kcal: 270, p: 9, f: 4, c: 50 }, // blat de pizza copt
  sosRosii: { kcal: 30, p: 1.3, f: 0.2, c: 6 },
  mozzarella: { kcal: 280, p: 22, f: 20, c: 3 },
  parmezan: { kcal: 431, p: 38, f: 29, c: 4 },
  prosciuttoCrudo: { kcal: 250, p: 26, f: 16, c: 0 },
  prosciuttoCotto: { kcal: 145, p: 20, f: 6, c: 1.5 },
  rosiiCherry: { kcal: 18, p: 0.9, f: 0.2, c: 3.9 },
  rosii: { kcal: 18, p: 0.9, f: 0.2, c: 3.9 },
  salata: { kcal: 25, p: 2.6, f: 0.7, c: 3.7 },
  pesto: { kcal: 450, p: 5, f: 45, c: 6 },
  guanciale: { kcal: 600, p: 10, f: 62, c: 0 },
  smantanaVeg: { kcal: 200, p: 1, f: 19, c: 6 },
  salamAfumat: { kcal: 400, p: 22, f: 34, c: 1 },
  salamPicant: { kcal: 500, p: 22, f: 44, c: 1 },
  bacon: { kcal: 470, p: 33, f: 37, c: 1 },
  pui: { kcal: 165, p: 31, f: 3.6, c: 0 }, // file de pui gătit
  puiPulpaGrill: { kcal: 180, p: 25, f: 9, c: 0 },
  busuioc: { kcal: 23, p: 3, f: 0.6, c: 2.7 },
  ciuperci: { kcal: 22, p: 3.1, f: 0.3, c: 3.3 },
  masline: { kcal: 115, p: 0.8, f: 10.7, c: 6 },
  ardei: { kcal: 26, p: 1, f: 0.3, c: 6 },
  brie: { kcal: 334, p: 21, f: 28, c: 0.5 },
  gorgonzola: { kcal: 353, p: 21, f: 29, c: 2 },
  sosBbq: { kcal: 172, p: 0.8, f: 0.6, c: 41 },
  ceapaRosie: { kcal: 40, p: 1.1, f: 0.1, c: 9.3 },
  ceapaCaramel: { kcal: 100, p: 1.5, f: 5, c: 13 },
  chifla: { kcal: 270, p: 9, f: 4.5, c: 49 },
  vita: { kcal: 250, p: 26, f: 16, c: 0 }, // chiftea de vită gătită
  sosBurger: { kcal: 400, p: 1, f: 40, c: 8 },
  cheddar: { kcal: 403, p: 25, f: 33, c: 1.3 },
  sosCheddar: { kcal: 200, p: 6, f: 15, c: 10 },
  castraveti: { kcal: 11, p: 0.3, f: 0.2, c: 2.3 },
  iceberg: { kcal: 14, p: 0.9, f: 0.1, c: 3 },
  puiPanko: { kcal: 260, p: 20, f: 13, c: 15 },
  aripiBbq: { kcal: 250, p: 23, f: 17, c: 0 },
  aripiCrispy: { kcal: 290, p: 20, f: 19, c: 10 },
  sosUsturoi: { kcal: 450, p: 1, f: 48, c: 4 },
  nuggets: { kcal: 296, p: 15, f: 19, c: 17 },
  creveti: { kcal: 230, p: 13, f: 11, c: 19 },
  ineleCeapa: { kcal: 330, p: 4.5, f: 19, c: 38 },
  fries: { kcal: 312, p: 3.4, f: 15, c: 41 },
  bileCartof: { kcal: 280, p: 3, f: 15, c: 34 },
  wedges: { kcal: 200, p: 3, f: 9, c: 27 },
  cartofRozmarin: { kcal: 150, p: 2.2, f: 6, c: 22 },
  cartofCasa: { kcal: 170, p: 2.5, f: 8, c: 22 },
  piure: { kcal: 110, p: 2, f: 4.2, c: 16 },
  piureBroccoli: { kcal: 70, p: 3, f: 3.5, c: 7 },
  legumeCoapte: { kcal: 75, p: 1.5, f: 4.5, c: 8 },
  omleta: { kcal: 154, p: 11, f: 12, c: 1 },
  clatita: { kcal: 220, p: 7, f: 8, c: 30 },
} satisfies Record<string, Per100>;

type Ing = keyof typeof ING;

export type Allergen = "gluten" | "milk" | "eggs" | "nuts" | "crustaceans" | "mustard";

/** Alergeni pe ingredient (după compoziția uzuală). */
const ALLERGENS: Partial<Record<Ing, Allergen[]>> = {
  aluat: ["gluten"],
  chifla: ["gluten"],
  mozzarella: ["milk"],
  parmezan: ["milk"],
  brie: ["milk"],
  gorgonzola: ["milk"],
  cheddar: ["milk"],
  sosCheddar: ["milk"],
  pesto: ["nuts", "milk"],
  sosBurger: ["eggs", "mustard"],
  sosUsturoi: ["eggs"],
  puiPanko: ["gluten", "eggs"],
  aripiCrispy: ["gluten"],
  nuggets: ["gluten", "eggs"],
  creveti: ["crustaceans", "gluten", "eggs"],
  ineleCeapa: ["gluten"],
  piure: ["milk"],
  omleta: ["eggs", "milk"],
  clatita: ["gluten", "eggs", "milk"],
};

type Recipe = { parts: [Ing, number][]; estimated?: boolean };

const PIZZA_BASE: [Ing, number] = ["aluat", 230];

/** Rețetele: [ingredient, grame]. `estimated` = gramajul total nu apare în meniu. */
const RECIPES: Record<string, Recipe> = {
  "pizza-casinia": { estimated: true, parts: [PIZZA_BASE, ["mozzarella", 120], ["prosciuttoCrudo", 60], ["rosiiCherry", 60], ["salata", 20], ["pesto", 25], ["parmezan", 15]] },
  "pizza-carbonara": { estimated: true, parts: [PIZZA_BASE, ["guanciale", 70], ["mozzarella", 120], ["parmezan", 20], ["smantanaVeg", 60]] },
  "pizza-di-carne": { estimated: true, parts: [PIZZA_BASE, ["salamAfumat", 40], ["bacon", 40], ["pui", 50], ["prosciuttoCotto", 40], ["mozzarella", 120], ["parmezan", 15]] },
  "pizza-quattro-formaggi": { estimated: true, parts: [PIZZA_BASE, ["mozzarella", 100], ["brie", 40], ["gorgonzola", 40], ["parmezan", 20], ["smantanaVeg", 50]] },
  "pizza-pepperoni": { estimated: true, parts: [PIZZA_BASE, ["salamPicant", 60], ["sosRosii", 80], ["mozzarella", 120], ["busuioc", 3], ["parmezan", 15]] },
  "pizza-capricciosa": { estimated: true, parts: [PIZZA_BASE, ["prosciuttoCotto", 60], ["ciuperci", 50], ["masline", 25], ["ardei", 40], ["mozzarella", 120], ["parmezan", 15]] },
  "pizza-pollo": { estimated: true, parts: [PIZZA_BASE, ["pui", 80], ["ciuperci", 60], ["mozzarella", 120], ["parmezan", 15]] },
  // 595 g în meniu
  "pizza-bbq": { parts: [PIZZA_BASE, ["sosRosii", 70], ["mozzarella", 120], ["puiPulpaGrill", 90], ["sosBbq", 40], ["parmezan", 15], ["ceapaRosie", 30]] },
  "pizza-margherita": { estimated: true, parts: [PIZZA_BASE, ["mozzarella", 130], ["pesto", 25], ["parmezan", 15], ["busuioc", 3]] },

  // 450 g
  "double-cheese-burger": { parts: [["chifla", 90], ["vita", 220], ["sosBurger", 25], ["sosCheddar", 25], ["bacon", 25], ["iceberg", 15], ["ceapaCaramel", 25], ["castraveti", 25]] },
  // 300 g
  "cheeseburger-clasic": { parts: [["chifla", 80], ["vita", 110], ["cheddar", 20], ["sosBurger", 20], ["sosCheddar", 15], ["rosii", 20], ["castraveti", 15], ["iceberg", 10], ["ceapaRosie", 10]] },
  // 280 g
  "burger-clasic": { parts: [["chifla", 80], ["vita", 110], ["sosBurger", 25], ["rosii", 25], ["castraveti", 15], ["iceberg", 15], ["ceapaRosie", 10]] },
  // 300 g
  "burger-krispy": { parts: [["chifla", 80], ["puiPanko", 150], ["rosii", 25], ["castraveti", 20], ["ceapaRosie", 10], ["iceberg", 15]] },
  "aripi-bbq": { parts: [["aripiBbq", 250], ["sosBbq", 50]] },
  "aripi-krispy": { parts: [["aripiCrispy", 280], ["sosUsturoi", 55]] },
  "chicken-nuggets": { parts: [["nuggets", 200], ["sosUsturoi", 50]] },
  "nuggets-copii": { parts: [["nuggets", 200], ["sosUsturoi", 50]] },
  "creveti-tempura": { parts: [["creveti", 180], ["sosUsturoi", 55]] },
  "asorti-cartofi": { parts: [["fries", 150], ["bileCartof", 150], ["wedges", 150], ["sosUsturoi", 100]] },
  "inele-ceapa": { parts: [["ineleCeapa", 150], ["sosUsturoi", 50]] },

  "cartofi-fries": { parts: [["fries", 200], ["sosUsturoi", 50]] },
  "cartofi-wedges": { parts: [["wedges", 200], ["sosUsturoi", 50]] },
  "cartofi-rozmarin": { estimated: true, parts: [["cartofRozmarin", 200]] },
  "cartof-ca-acasa": { estimated: true, parts: [["cartofCasa", 200]] },
  "cartof-ca-acasa-bacon": { estimated: true, parts: [["cartofCasa", 170], ["bacon", 30]] },
  "piure-cartof": { estimated: true, parts: [["piure", 200]] },
  "piure-broccoli": { estimated: true, parts: [["piureBroccoli", 200]] },
  "legume-coapte": { estimated: true, parts: [["legumeCoapte", 200]] },

  "omleta-clasica": { estimated: true, parts: [["omleta", 200]] },
  "clatite-pui-ciuperci": { estimated: true, parts: [["clatita", 150], ["pui", 60], ["ciuperci", 40]] },
};

export type Nutrition = {
  grams: number;
  estimatedWeight: boolean;
  portion: { kcal: number; p: number; f: number; c: number };
  per100: { kcal: number; p: number; f: number; c: number };
  allergens: Allergen[];
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function nutritionFor(id: string): Nutrition | null {
  const recipe = RECIPES[id];
  if (!recipe) return null;
  let grams = 0;
  const sum = { kcal: 0, p: 0, f: 0, c: 0 };
  const allergens = new Set<Allergen>();
  for (const [ing, g] of recipe.parts) {
    const v: Per100 = ING[ing];
    grams += g;
    sum.kcal += (v.kcal * g) / 100;
    sum.p += (v.p * g) / 100;
    sum.f += (v.f * g) / 100;
    sum.c += (v.c * g) / 100;
    ALLERGENS[ing]?.forEach((a) => allergens.add(a));
  }
  return {
    grams,
    estimatedWeight: !!recipe.estimated,
    portion: { kcal: Math.round(sum.kcal), p: r1(sum.p), f: r1(sum.f), c: r1(sum.c) },
    per100: {
      kcal: Math.round((sum.kcal / grams) * 100),
      p: r1((sum.p / grams) * 100),
      f: r1((sum.f / grams) * 100),
      c: r1((sum.c / grams) * 100),
    },
    allergens: [...allergens],
  };
}
