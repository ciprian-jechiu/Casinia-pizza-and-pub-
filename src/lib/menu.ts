import type { Locale } from "./i18n";

export type L10n = Record<Locale, string>;

export type CategoryId = "pizza" | "fastfood" | "garnituri" | "micdejun";

export type MenuItem = {
  id: string;
  category: CategoryId;
  name: L10n;
  description?: L10n;
  /** gramaj, cum apare în meniul original */
  weight?: string;
  /** preț în lei (MDL) */
  price: number;
  /** fișierul imaginii de pe CDN-ul meniului oficial */
  image?: string;
  signature?: boolean;
};

const CDN = "https://img.ps.me/cdn-cgi/image";
const ORIGIN = "https://img.ps.me/30836";

/** URL optimizat de pe CDN-ul meniului (Cloudflare Images) */
export function menuImage(file: string, width = 800) {
  return `${CDN}/width=${width},format=webp/${ORIGIN}/${file}`;
}

/** Cardul promo „Pizza Polo e Funghi” (1024×682, fundal negru, pizza în stânga). */
export const HERO_IMAGE = "192b0215-deaa-4f2d-a86b-f21be8a10688_image.png";

/**
 * Pozele de pizza din meniul oficial sunt bannere late (≈1024×285) cu textul în dreapta.
 * Într-un cadru 2.2:1 cu object-position 17% se vede doar pizza.
 */
export const isBanner = (item: MenuItem) => item.category === "pizza";

export const categories: { id: CategoryId; name: L10n }[] = [
  { id: "pizza", name: { ro: "Pizza", ru: "Пицца", en: "Pizza" } },
  { id: "fastfood", name: { ro: "Burgeri și gustări", ru: "Бургеры и закуски", en: "Burgers & bites" } },
  { id: "garnituri", name: { ro: "Garnituri", ru: "Гарниры", en: "Sides" } },
  { id: "micdejun", name: { ro: "Mic dejun", ru: "Завтрак", en: "Breakfast" } },
];

const same = (s: string): L10n => ({ ro: s, ru: s, en: s });

export const menu: MenuItem[] = [
  // ───────────── PIZZA ─────────────
  {
    id: "pizza-casinia",
    category: "pizza",
    signature: true,
    name: { ro: "Pizza Casinia", ru: "Пицца Casinia", en: "Pizza Casinia" },
    description: {
      ro: "Prosciutto crudo, mozzarella, roșii cherry, mix de salată, sos pesto, parmigiano",
      ru: "Прошутто крудо, моцарелла, томаты черри, микс салата, соус песто, пармиджано",
      en: "Prosciutto crudo, mozzarella, cherry tomatoes, mixed greens, pesto, parmigiano",
    },
    price: 145,
    image: "2aef8cb2-f64b-4f45-af0e-a9aeca9e93b3_image.png",
  },
  {
    id: "pizza-carbonara",
    category: "pizza",
    signature: true,
    name: same("Pizza Carbonara"),
    description: {
      ro: "Guanciale, mozzarella, parmigiano, smântână vegetală",
      ru: "Гуанчале, моцарелла, пармиджано, растительные сливки",
      en: "Guanciale, mozzarella, parmigiano, plant-based cream",
    },
    price: 155,
    image: "8f725e36-d0d4-4bb9-a9e9-9ca986d4a646_image.png",
  },
  {
    id: "pizza-di-carne",
    category: "pizza",
    signature: true,
    name: same("Pizza di Carne"),
    description: {
      ro: "Salam afumat, bacon, file de pui, prosciutto cotto, mozzarella, parmigiano",
      ru: "Копчёная салями, бекон, куриное филе, прошутто котто, моцарелла, пармиджано",
      en: "Smoked salami, bacon, chicken fillet, prosciutto cotto, mozzarella, parmigiano",
    },
    price: 165,
    image: "3d7d7897-42b0-42dc-912d-ad9e30b6b724_image.png",
  },
  {
    id: "pizza-quattro-formaggi",
    category: "pizza",
    signature: true,
    name: same("Quattro Formaggi"),
    description: {
      ro: "Mozzarella, brie, gorgonzola, parmigiano, smântână vegetală",
      ru: "Моцарелла, бри, горгонзола, пармиджано, растительные сливки",
      en: "Mozzarella, brie, gorgonzola, parmigiano, plant-based cream",
    },
    price: 150,
    image: "cea86805-b969-43e2-b1f2-fe117506ac9b_image.png",
  },
  {
    id: "pizza-pepperoni",
    category: "pizza",
    name: same("Pepperoni"),
    description: {
      ro: "Salam picant, sos de roșii, mozzarella, busuioc, parmigiano",
      ru: "Острая салями, томатный соус, моцарелла, базилик, пармиджано",
      en: "Spicy salami, tomato sauce, mozzarella, basil, parmigiano",
    },
    price: 145,
    image: "4e48372b-eac2-49e3-b1fd-fd5f3921ff64_image.png",
  },
  {
    id: "pizza-capricciosa",
    category: "pizza",
    name: { ro: "Pizza Capricioasa", ru: "Пицца Капричоза", en: "Pizza Capricciosa" },
    description: {
      ro: "Șuncă, ciuperci, măsline, ardei, mozzarella, parmigiano",
      ru: "Ветчина, грибы, оливки, перец, моцарелла, пармиджано",
      en: "Ham, mushrooms, olives, peppers, mozzarella, parmigiano",
    },
    price: 150,
    image: "9a6ffe9c-e934-431a-b9bd-492bd59eb647_image.png",
  },
  {
    id: "pizza-pollo",
    category: "pizza",
    name: { ro: "Pizza Pollo", ru: "Пицца Полло", en: "Pizza Pollo" },
    description: {
      ro: "File de pui, ciuperci, mozzarella, parmigiano",
      ru: "Куриное филе, грибы, моцарелла, пармиджано",
      en: "Chicken fillet, mushrooms, mozzarella, parmigiano",
    },
    price: 150,
    image: "07dbbe82-2956-4555-94dd-4c33b5565279_image.png",
  },
  {
    id: "pizza-bbq",
    category: "pizza",
    name: { ro: "Pizza B.B.Q", ru: "Пицца B.B.Q", en: "B.B.Q Pizza" },
    description: {
      ro: "Sos pizza, mozzarella, pulpă de pui la grill, sos B.B.Q, parmigiano, ceapă roșie",
      ru: "Соус для пиццы, моцарелла, куриное бедро гриль, соус B.B.Q, пармиджано, красный лук",
      en: "Pizza sauce, mozzarella, grilled chicken thigh, B.B.Q sauce, parmigiano, red onion",
    },
    weight: "595 g",
    price: 140,
    image: "501931c4-71ff-4d15-970f-3d424f347bb7_image.png",
  },
  {
    id: "pizza-margherita",
    category: "pizza",
    name: same("Pizza Margherita"),
    description: {
      ro: "Mozzarella, sos pesto, parmigiano, busuioc",
      ru: "Моцарелла, соус песто, пармиджано, базилик",
      en: "Mozzarella, pesto, parmigiano, basil",
    },
    price: 100,
    image: "f98767b5-4062-48bf-bd6a-fab49bc0d57b_image.png",
  },

  // ───────────── BURGERI ȘI GUSTĂRI ─────────────
  {
    id: "double-cheese-burger",
    category: "fastfood",
    signature: true,
    name: same("Double Cheese Burger"),
    description: {
      ro: "Chiflă neagră, două chiftele de vită, sos burger, sos cheddar, bacon, iceberg, ceapă caramelizată, castraveți murați",
      ru: "Чёрная булочка, две говяжьи котлеты, соус бургер, соус чеддер, бекон, айсберг, карамелизированный лук, маринованные огурцы",
      en: "Black bun, two beef patties, burger sauce, cheddar sauce, bacon, iceberg, caramelised onion, pickles",
    },
    weight: "450 g",
    price: 170,
    image: "e3150c0a-08ae-4829-b71a-6dbd49e3bbbf_image.png",
  },
  {
    id: "cheeseburger-clasic",
    category: "fastfood",
    name: { ro: "Cheeseburger clasic", ru: "Классический чизбургер", en: "Classic cheeseburger" },
    description: {
      ro: "Chiflă, chiftea de vită, cheddar, sos burger, sos cheddar, roșii, castraveți murați, iceberg, ceapă roșie",
      ru: "Булочка, говяжья котлета, чеддер, соус бургер, соус чеддер, томаты, маринованные огурцы, айсберг, красный лук",
      en: "Bun, beef patty, cheddar, burger sauce, cheddar sauce, tomato, pickles, iceberg, red onion",
    },
    weight: "300 g",
    price: 130,
    image: "3e37430d-5b3d-432c-bd35-1549a36c7efb_image.jpeg",
  },
  {
    id: "burger-clasic",
    category: "fastfood",
    name: { ro: "Burger clasic", ru: "Классический бургер", en: "Classic burger" },
    description: {
      ro: "Chiflă, chiftea de vită, sos burger, roșii, castraveți murați, iceberg, ceapă roșie",
      ru: "Булочка, говяжья котлета, соус бургер, томаты, маринованные огурцы, айсберг, красный лук",
      en: "Bun, beef patty, burger sauce, tomato, pickles, iceberg, red onion",
    },
    weight: "280 g",
    price: 110,
    image: "872b5806-6284-41ff-b710-54a29af851be_image.png",
  },
  {
    id: "burger-krispy",
    category: "fastfood",
    name: same("Burger Krispy"),
    description: {
      ro: "Chiflă, file de pui în pesmet panko, roșii, castraveți murați, ceapă roșie, iceberg",
      ru: "Булочка, куриное филе в панко, томаты, маринованные огурцы, красный лук, айсберг",
      en: "Bun, panko-crusted chicken fillet, tomato, pickles, red onion, iceberg",
    },
    weight: "300 g",
    price: 110,
    image: "0b228bb2-3455-46e5-adb7-8cf73339834b_image.png",
  },
  {
    id: "aripi-bbq",
    category: "fastfood",
    name: { ro: "Aripioare B.B.Q", ru: "Крылышки B.B.Q", en: "B.B.Q wings" },
    description: {
      ro: "Aripioare de pui cu sos B.B.Q",
      ru: "Куриные крылышки с соусом B.B.Q",
      en: "Chicken wings with B.B.Q sauce",
    },
    weight: "250 g + 50 g",
    price: 120,
    image: "c19b4ae3-bad6-4356-988d-117440984073_image.png",
  },
  {
    id: "aripi-krispy",
    category: "fastfood",
    name: { ro: "Aripioare Krispy", ru: "Крылышки Krispy", en: "Krispy wings" },
    description: {
      ro: "Aripioare de pui crocante, sos de usturoi",
      ru: "Хрустящие куриные крылышки, чесночный соус",
      en: "Crispy chicken wings, garlic sauce",
    },
    weight: "280 g + 55 g",
    price: 120,
    image: "3da7f865-d0f8-4d8c-8c9d-4ff6bd37f696_image.png",
  },
  {
    id: "chicken-nuggets",
    category: "fastfood",
    name: same("Chicken Nuggets"),
    description: {
      ro: "File de pui în pesmet, sos de usturoi",
      ru: "Куриное филе в панировке, чесночный соус",
      en: "Breaded chicken fillet, garlic sauce",
    },
    weight: "250 g",
    price: 130,
    image: "9f7c4747-1c82-45af-aae1-a42cc79c8de7_image.png",
  },
  {
    id: "nuggets-copii",
    category: "fastfood",
    name: { ro: "Nuggets pentru copii", ru: "Детские наггетсы", en: "Kids' nuggets" },
    description: {
      ro: "File de pui, sos de usturoi",
      ru: "Куриное филе, чесночный соус",
      en: "Chicken fillet, garlic sauce",
    },
    weight: "200 g + 50 g",
    price: 110,
    image: "a52202f0-0029-4936-baba-a09bdffe1325_image.png",
  },
  {
    id: "creveti-tempura",
    category: "fastfood",
    name: { ro: "Creveți tempura", ru: "Креветки темпура", en: "Tempura prawns" },
    description: {
      ro: "Creveți în aluat tempura, sos de usturoi",
      ru: "Креветки в темпуре, чесночный соус",
      en: "Prawns in tempura batter, garlic sauce",
    },
    weight: "180 g + 55 g",
    price: 165,
    image: "ad047d01-800d-4286-84a5-157aeabf7ad6_image.jpeg",
  },
  {
    id: "asorti-cartofi",
    category: "fastfood",
    name: { ro: "Asorti de cartofi", ru: "Картофельное ассорти", en: "Potato platter" },
    description: {
      ro: "Cartofi fri, cartofi bile, cartofi felii, sos de usturoi sau ketchup",
      ru: "Картофель фри, картофельные шарики, дольки, чесночный соус или кетчуп",
      en: "Fries, potato bites and wedges, garlic sauce or ketchup",
    },
    weight: "450 g + 100 g",
    price: 120,
    image: "244b4fb9-4c39-43ce-a1e2-c6fa6a38476b_image.png",
  },
  {
    id: "inele-ceapa",
    category: "fastfood",
    name: { ro: "Inele de ceapă", ru: "Луковые кольца", en: "Onion rings" },
    description: {
      ro: "Ceapă pané, sos de usturoi",
      ru: "Лук в панировке, чесночный соус",
      en: "Breaded onion, garlic sauce",
    },
    weight: "150 g + 50 g",
    price: 60,
    image: "3ae366a9-9f1b-45c4-804c-7308a6413028_image.jpeg",
  },

  // ───────────── GARNITURI ─────────────
  {
    id: "cartofi-fries",
    category: "garnituri",
    name: { ro: "Cartofi fries", ru: "Картофель фри", en: "French fries" },
    description: { ro: "Cu sos de usturoi", ru: "С чесночным соусом", en: "With garlic sauce" },
    weight: "200 g + 50 g",
    price: 55,
    image: "bec49214-9fa2-43e8-a068-819ea202af13_image.jpeg",
  },
  {
    id: "cartofi-wedges",
    category: "garnituri",
    name: { ro: "Cartofi wedges", ru: "Картофельные дольки", en: "Potato wedges" },
    description: { ro: "Cu sos de usturoi", ru: "С чесночным соусом", en: "With garlic sauce" },
    weight: "200 g + 50 g",
    price: 55,
    image: "d65279be-6038-4336-956c-3879d130e603_image.jpeg",
  },
  { id: "cartofi-rozmarin", category: "garnituri", name: { ro: "Cartofi cu rozmarin", ru: "Картофель с розмарином", en: "Rosemary potatoes" }, price: 80 },
  { id: "cartof-ca-acasa", category: "garnituri", name: { ro: "Cartofi ca acasă", ru: "Картофель по-домашнему", en: "Home-style potatoes" }, price: 80 },
  { id: "cartof-ca-acasa-bacon", category: "garnituri", name: { ro: "Cartofi ca acasă cu bacon", ru: "Картофель по-домашнему с беконом", en: "Home-style potatoes with bacon" }, price: 90 },
  { id: "piure-cartof", category: "garnituri", name: { ro: "Piure de cartofi", ru: "Картофельное пюре", en: "Mashed potatoes" }, price: 90 },
  { id: "piure-broccoli", category: "garnituri", name: { ro: "Piure de broccoli", ru: "Пюре из брокколи", en: "Broccoli purée" }, price: 90 },
  { id: "legume-coapte", category: "garnituri", name: { ro: "Legume coapte", ru: "Запечённые овощи", en: "Roasted vegetables" }, price: 85 },

  // ───────────── MIC DEJUN ─────────────
  { id: "omleta-clasica", category: "micdejun", name: { ro: "Omletă clasică", ru: "Классический омлет", en: "Classic omelette" }, price: 90 },
  { id: "clatite-pui-ciuperci", category: "micdejun", name: { ro: "Clătite cu pui și ciuperci", ru: "Блины с курицей и грибами", en: "Crêpes with chicken and mushrooms" }, price: 130 },
];

export const menuById = new Map(menu.map((m) => [m.id, m]));

export function itemsByCategory(category: CategoryId) {
  return menu.filter((m) => m.category === category);
}
