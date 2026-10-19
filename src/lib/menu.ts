import type { Locale } from "./i18n";

export type L10n = Record<Locale, string>;

export type CategoryId = "oferte" | "pizza" | "fastfood" | "garnituri";

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
  /** produs-ofertă (rubrica „Oferte”) */
  offer?: {
    /** se poate comanda doar cu livrare */
    deliveryOnly: boolean;
    /** clientul alege `count` pizza din lista `from` (pot fi și repetate) */
    choose?: { count: number; from: string[] };
    /** pizza gratuită, aleasă de client din această listă */
    gift?: string[];
  };
};

const CDN = "https://img.ps.me/cdn-cgi/image";
const ORIGIN = "https://img.ps.me/30836";

/** URL optimizat de pe CDN-ul meniului (Cloudflare Images) */
export function menuImage(file: string, width = 800) {
  // fotografii refăcute local (fără textul de afiș) — servite din /public/menu
  if (file.startsWith("/")) return file;
  return `${CDN}/width=${width},format=webp/${ORIGIN}/${file}`;
}

/** Cardul promo „Pizza Polo e Funghi” (1024×682, fundal negru, pizza în stânga). */
export const HERO_IMAGE = "192b0215-deaa-4f2d-a86b-f21be8a10688_image.png";

/**
 * Pozele de pizza din meniul oficial sunt bannere late (≈1024×285) cu textul în dreapta.
 * Într-un cadru 2.2:1 cu object-position 17% se vede doar pizza.
 */

/** Dimensiunile reale ale fotografiilor (lățime × înălțime), ca să fie afișate fără tăieturi. */
const IMAGE_SIZE: Record<string, [number, number]> = {
  "pizza-casinia": [1200, 900],
  "pizza-carbonara": [1200, 900],
  "pizza-di-carne": [1239, 1269],
  "pizza-quattro-formaggi": [1200, 900],
  "pizza-pepperoni": [1448, 1086],
  "pizza-capricciosa": [1200, 900],
  "pizza-pollo": [1200, 900],
  "pizza-bbq": [1254, 1254],
  "pizza-margherita": [1254, 1254],
  "pizza-di-funghi": [1200, 900],
  "pizza-rancho": [1200, 900],
  "double-cheese-burger": [1402, 1122],
  "cheeseburger-clasic": [1000, 667],
  "burger-clasic": [1403, 1121],
  "burger-krispy": [1461, 1077],
  "aripi-bbq": [1254, 1254],
  "aripi-krispy": [1219, 1290],
  "chicken-nuggets": [1000, 625],
  "nuggets-copii": [1145, 1374],
  "creveti-tempura": [1000, 560],
  "asorti-cartofi": [1145, 1374],
  "inele-ceapa": [1000, 664],
  "cartofi-fries": [800, 1000],
  "cartofi-wedges": [1000, 667],
  "combo-burger-clasic": [423, 634],
  "combo-cheeseburger": [423, 634],
  "combo-burger-krispy": [423, 639],
  "combo-double-cheeseburger": [423, 639],
  "pizza-3-plus-1": [624, 1280],
};

/** Lățime × înălțime pentru fotografia produsului (4:3 dacă nu e cunoscută). */
export const imageSize = (id: string): [number, number] => IMAGE_SIZE[id] ?? [1200, 900];

export const categories: { id: CategoryId; name: L10n }[] = [
  { id: "oferte", name: { ro: "Oferte", ru: "Акции", en: "Offers" } },
  { id: "pizza", name: { ro: "Pizza", ru: "Пицца", en: "Pizza" } },
  { id: "fastfood", name: { ro: "Burgeri și gustări", ru: "Бургеры и закуски", en: "Burgers & bites" } },
  { id: "garnituri", name: { ro: "Garnituri", ru: "Гарниры", en: "Sides" } },
];

const same = (s: string): L10n => ({ ro: s, ru: s, en: s });

export const menu: MenuItem[] = [
  // ───────────── OFERTE (afișele Casinia; doar cu livrare) ─────────────
  {
    id: "pizza-3-plus-1",
    category: "oferte",
    name: { ro: "Pizza 3+1 gratis", ru: "Пицца 3+1 в подарок", en: "Pizza 3+1 free" },
    description: {
      ro: "Alegi 3 pizza, iar a 4-a e gratis: Margherita, Pollo e Funghi sau B.B.Q",
      ru: "Выберите 3 пиццы, а четвёртая — бесплатно: Маргарита, Полло э Фунги или B.B.Q",
      en: "Pick 3 pizzas and get the 4th free: Margherita, Pollo e Funghi or B.B.Q",
    },
    price: 465,
    image: "/oferte/pizza-3-plus-1.jpg",
    offer: {
      deliveryOnly: true,
      gift: ["pizza-margherita", "pizza-pollo", "pizza-bbq"],
      choose: {
        count: 3,
        from: [
          "pizza-margherita",
          "pizza-quattro-formaggi",
          "pizza-capricciosa",
          "pizza-di-carne",
          "pizza-pollo",
          "pizza-bbq",
          "pizza-carbonara",
          "pizza-pepperoni",
          "pizza-casinia",
        ],
      },
    },
  },
  {
    id: "combo-burger-clasic",
    category: "oferte",
    name: { ro: "Combo Burger Clasic", ru: "Комбо Классический бургер", en: "Classic Burger combo" },
    description: {
      ro: "Burger clasic + cartofi pai + Pepsi cadou",
      ru: "Классический бургер + картофель фри + Pepsi в подарок",
      en: "Classic burger + fries + a free Pepsi",
    },
    price: 170,
    image: "/oferte/combo-burger-clasic.jpg",
    offer: { deliveryOnly: true },
  },
  {
    id: "combo-cheeseburger",
    category: "oferte",
    name: { ro: "Combo Cheeseburger", ru: "Комбо Чизбургер", en: "Cheeseburger combo" },
    description: {
      ro: "Cheeseburger + cartofi pai + Pepsi cadou",
      ru: "Чизбургер + картофель фри + Pepsi в подарок",
      en: "Cheeseburger + fries + a free Pepsi",
    },
    price: 170,
    image: "/oferte/combo-cheeseburger.jpg",
    offer: { deliveryOnly: true },
  },
  {
    id: "combo-burger-krispy",
    category: "oferte",
    name: { ro: "Combo Burger Krispy", ru: "Комбо Бургер Krispy", en: "Krispy Burger combo" },
    description: {
      ro: "Burger Krispy + cartofi pai + Pepsi cadou",
      ru: "Бургер Krispy + картофель фри + Pepsi в подарок",
      en: "Krispy burger + fries + a free Pepsi",
    },
    price: 170,
    image: "/oferte/combo-burger-krispy.jpg",
    offer: { deliveryOnly: true },
  },
  {
    id: "combo-double-cheeseburger",
    category: "oferte",
    name: { ro: "Combo Double Cheeseburger", ru: "Комбо Двойной чизбургер", en: "Double Cheeseburger combo" },
    description: {
      ro: "Double Cheeseburger + cartofi pai + Pepsi cadou",
      ru: "Двойной чизбургер + картофель фри + Pepsi в подарок",
      en: "Double cheeseburger + fries + a free Pepsi",
    },
    price: 220,
    image: "/oferte/combo-double-cheeseburger.jpg",
    offer: { deliveryOnly: true },
  },

  // ───────────── PIZZA ─────────────
  {
    id: "pizza-casinia",
    category: "pizza",
    signature: true,
    name: { ro: "Pizza Casinia", ru: "Пицца Casinia", en: "Pizza Casinia" },
    description: {
      ro: "Sos alb, mozzarella, bacon, file de pui, roșii cherry, sos de usturoi, parmezan",
      ru: "Белый соус, моцарелла, бекон, куриное филе, томаты черри, чесночный соус, пармезан",
      en: "White sauce, mozzarella, bacon, chicken fillet, cherry tomatoes, garlic sauce, parmesan",
    },
    weight: "470 g",
    price: 145,
    image: "/menu/pizza-casinia.jpg",
  },
  {
    id: "pizza-carbonara",
    category: "pizza",
    signature: true,
    name: same("Pizza Carbonara"),
    description: {
      ro: "Pancetta, mozzarella, frișcă vegetală, parmezan",
      ru: "Панчетта, моцарелла, растительные сливки, пармезан",
      en: "Pancetta, mozzarella, plant-based cream, parmesan",
    },
    weight: "470 g",
    price: 155,
    image: "/menu/pizza-carbonara.jpg",
  },
  {
    id: "pizza-di-carne",
    category: "pizza",
    signature: true,
    name: same("Pizza di Carne"),
    description: {
      ro: "Mozzarella, salam afumat, bacon, file de pui, prosciutto cotto, parmezan",
      ru: "Моцарелла, копчёная салями, бекон, куриное филе, прошутто котто, пармезан",
      en: "Mozzarella, smoked salami, bacon, chicken fillet, prosciutto cotto, parmesan",
    },
    weight: "550 g",
    price: 165,
    image: "3d7d7897-42b0-42dc-912d-ad9e30b6b724_image.png",
  },
  {
    id: "pizza-quattro-formaggi",
    category: "pizza",
    signature: true,
    name: same("Quattro Formaggi"),
    description: {
      ro: "Cașcavaluri: mozzarella, brie, gorgonzola, parmezan",
      ru: "Сыры: моцарелла, бри, горгонзола, пармезан",
      en: "Cheeses: mozzarella, brie, gorgonzola, parmesan",
    },
    weight: "500 g",
    price: 150,
    image: "/menu/pizza-quattro-formaggi.jpg",
  },
  {
    id: "pizza-pepperoni",
    category: "pizza",
    name: same("Pepperoni"),
    description: {
      ro: "Salam picant, mozzarella, parmezan, busuioc proaspăt",
      ru: "Острая салями, моцарелла, пармезан, свежий базилик",
      en: "Spicy salami, mozzarella, parmesan, fresh basil",
    },
    weight: "450 g",
    price: 145,
    image: "4e48372b-eac2-49e3-b1fd-fd5f3921ff64_image.png",
  },
  {
    id: "pizza-capricciosa",
    category: "pizza",
    name: { ro: "Pizza Capricioasa", ru: "Пицца Капричоза", en: "Pizza Capricciosa" },
    description: {
      ro: "Prosciutto cotto, ardei, olive, ciuperci, roșii",
      ru: "Прошутто котто, перец, оливки, грибы, помидоры",
      en: "Prosciutto cotto, peppers, olives, mushrooms, tomatoes",
    },
    weight: "540 g",
    price: 150,
    image: "/menu/pizza-capricciosa.jpg",
  },
  {
    id: "pizza-pollo",
    category: "pizza",
    name: { ro: "Pizza Pollo e Funghi", ru: "Пицца Полло э Фунги", en: "Pizza Pollo e Funghi" },
    description: {
      ro: "Frișcă vegetală, file de pui, ciuperci, mozzarella, parmezan",
      ru: "Растительные сливки, куриное филе, грибы, моцарелла, пармезан",
      en: "Plant-based cream, chicken fillet, mushrooms, mozzarella, parmesan",
    },
    weight: "520 g",
    price: 150,
    image: "/menu/pizza-pollo.jpg",
  },
  {
    id: "pizza-di-funghi",
    category: "pizza",
    name: same("Pizza di Funghi"),
    description: {
      ro: "Mozzarella, mix de ciuperci, parmigiano, frișcă vegetală",
      ru: "Моцарелла, микс грибов, пармиджано, растительные сливки",
      en: "Mozzarella, mixed mushrooms, parmigiano, plant-based cream",
    },
    weight: "470 g",
    price: 130,
    image: "/menu/pizza-di-funghi.jpg",
  },
  {
    id: "pizza-rancho",
    category: "pizza",
    name: { ro: "Pizza Rancho", ru: "Пицца Ранчо", en: "Pizza Rancho" },
    description: {
      ro: "Sos, mozzarella, carne de pui, ciuperci, ardei kapia",
      ru: "Соус, моцарелла, курица, грибы, перец капия",
      en: "Sauce, mozzarella, chicken, mushrooms, kapia peppers",
    },
    weight: "470 g",
    price: 135,
    image: "/menu/pizza-rancho.jpg",
  },
  {
    id: "pizza-bbq",
    category: "pizza",
    name: { ro: "Pizza B.B.Q", ru: "Пицца B.B.Q", en: "B.B.Q Pizza" },
    description: {
      ro: "Sos B.B.Q, file de pui, parmezan, mozzarella, ceapă roșie",
      ru: "Соус B.B.Q, куриное филе, пармезан, моцарелла, красный лук",
      en: "B.B.Q sauce, chicken fillet, parmesan, mozzarella, red onion",
    },
    weight: "490 g",
    price: 140,
    image: "501931c4-71ff-4d15-970f-3d424f347bb7_image.png",
  },
  {
    id: "pizza-margherita",
    category: "pizza",
    name: same("Pizza Margherita"),
    description: {
      ro: "Mozzarella, sos de roșii, ulei de măsline, busuioc",
      ru: "Моцарелла, томатный соус, оливковое масло, базилик",
      en: "Mozzarella, tomato sauce, olive oil, basil",
    },
    weight: "450 g",
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

];

export const menuById = new Map(menu.map((m) => [m.id, m]));

export function itemsByCategory(category: CategoryId) {
  return menu.filter((m) => m.category === category);
}
