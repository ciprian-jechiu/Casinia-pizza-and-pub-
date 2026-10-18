# Casinia Pizza Pub

Site-ul pizzeriei Casinia Pizza Pub din Stăuceni: prezentare, meniu complet, comenzi online și rezervări de mese, în română, rusă și engleză.

## Ce face

- **Pagina principală**, construită ca o plimbare prin restaurant, la scroll:
  1. intrarea: fațada → prin ușă în sală, cu titlul „Pizza italiană autentică, în Stăuceni.”;
  2. masa rezervată — „Riservato.”, cu butoanele de rezervare și meniu;
  3. panoul crem de meniu: categoriile reale Casinia; la hover/tap se schimbă fotografia, iar orice preparat se adaugă în coș dintr-un click;
  4. povestea: text mare cu majuscule și cuvinte scrise de mână peste rânduri;
  5. evenimente private: cardul cu sala se transformă în cardul cu detalii și buton de contact;
  6. recenzii: ratingul Google mare și un perete 3D înclinat de recenzii și preparate;
  7. finalul: strada noaptea, văzută prin fereastră, cu adresa, programul și telefonul.
- **Meniu** (`/ro/meniu`) cu toate produsele, prețurile și gramajele.
- **Coș și comandă online** (`/ro/comanda`), **rezervări** (`/ro/rezervare`), **panou admin** (`/ro/admin`).
- Notificări opționale pe **Telegram**; SEO pe fiecare limbă (ro, ru, en).

## Tehnologii

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis · Motion · Zustand · Zod · Supabase (Postgres)

## Rulare locală

```bash
npm install
npm run dev
```

Deschide http://localhost:3000. Fără Supabase configurat, în dezvoltare comenzile și rezervările se salvează în `.data/store.json`, iar parola de admin este `casinia-dev`.

## Configurare pentru producție

1. Creează un proiect Supabase și rulează migrarea din `supabase/migrations/` (SQL Editor sau `supabase db push`).
2. Copiază `.env.example` în `.env.local` (local) sau setează variabilele în Netlify:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: cheia service_role stă doar pe server.
   - `ADMIN_PASSWORD`: parola panoului admin.
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (opțional).
   - `NEXT_PUBLIC_SITE_URL`: domeniul final.
3. Deploy pe Netlify: build-ul e configurat în `netlify.toml`.

În producție, fără Supabase configurat, formularele răspund cu un mesaj care roagă clientul să sune.

## Google Sheets — tabelul live cu rezervări și comenzi

Fiecare rezervare și comandă de pe site apare imediat ca rând nou în tabelul Google
„Casinia Pizza Pub — Rezervări și comenzi (site)”. Statusul se poate schimba și din tabel
(listă derulantă în coloana „Status”), iar panoul de administrare de pe site îl vede.

- Fără Supabase: tabelul **este** baza de date (admin-ul citește din el).
- Cu Supabase: Supabase rămâne baza principală, iar tabelul primește o copie a fiecărui rând
  și fiecare schimbare de status (dacă Google nu răspunde, rezervarea tot se salvează).

Instalare (o singură dată, ~5 minute):

1. Deschide tabelul → **Extensii → Apps Script**. Șterge codul existent și lipește tot conținutul
   din `google-sheets/Code.gs`. Salvează (Ctrl/Cmd + S).
2. **Setările proiectului** (rotița din stânga) → **Proprietăți script** → **Adaugă** →
   proprietate `SECRET`, valoare = o parolă lungă (aceeași ca `GOOGLE_SHEETS_SECRET`).
3. Înapoi la editor → alege funcția `setup` → **▶ Rulează** → acceptă permisiunile Google.
   Se creează foile „Rezervări” și „Comenzi”.
4. **Implementare → Implementare nouă** → tip **Aplicație web** → *Execută ca: Eu*,
   *Cine are acces: Oricine* → **Implementează**. Copiază URL-ul care se termină în `/exec`.
5. În `.env.local` (local) și în variabilele de mediu de la hosting:
   ```
   GOOGLE_SHEETS_URL=https://script.google.com/macros/s/…/exec
   GOOGLE_SHEETS_SECRET=aceeași-parolă-ca-la-pasul-2
   ```
6. Repornește site-ul. Fă o rezervare de test → apare în tabel.

„Oricine” înseamnă doar că site-ul poate apela scriptul; fără `SECRET` corect scriptul refuză
orice cerere, iar tabelul rămâne privat (îl vede doar cine are acces în Google Drive).
Dacă modifici `Code.gs`: Implementare → Gestionează implementările → ✏️ → Versiune nouă.

## Poster — comenzile ajung pe casă

Cu `POSTER_TOKEN` setat (tokenul „Personal integration” din Poster → Access → Integrations),
fiecare comandă de pe site e trimisă pe terminal ca **comandă online** (Orders → status Online → Accept).

- Produsele se potrivesc automat după nume (fără diacritice; „Pizza” nu contează). Ce nu se
  potrivește nu se pierde: apare în comentariul comenzii pe casă. Potriviri manuale: `POSTER_PRODUCT_MAP`.
- Pe casă ajung: produsele cu prețurile de pe site, pizzele cadou (0 lei), livrarea în afara Stăuceni
  (produsul „Livrare în afara Stăuceni”, dacă există), telefonul, numele, adresa și un comentariu
  cu ora, plata, totalul și detaliile ofertei 3+1.
- Verificare: `/ro/admin` → tabul **Poster** arată localul și ce produse s-au potrivit.
- Comanda e salvată și în tabel/admin; dacă Poster nu răspunde, comanda nu se pierde.

## Structură

```
src/
  app/[lang]/         paginile, câte una pe limbă (ro, ru, en)
  app/api/            orders, reservations, admin
  components/         header, coș, meniu, formulare, secțiunile paginii principale
  dictionaries/       textele în cele trei limbi
  lib/menu.ts         meniul (prețuri, ingrediente, imagini)
  lib/site.ts         adresă, telefon, program, reguli de rezervare
  lib/schedule.ts     intervale de rezervare și de comandă (ora Chișinăului)
  proxy.ts            redirecționare spre limba vizitatorului
supabase/migrations/  schema bazei de date
```

## Imagini și culori

- Paleta „Rosso e crema”: vișiniu `#2B0B10`, cremă `#F0E8DA`, coral `#E8A08A`; semnătura „Casinia” păstrează culoarea logo-ului `#C8A078`.
- Fotografiile de atmosferă de pe pagina principală (fațadă, sală, masă, candelabre, masa lungă, strada) sunt din **Unsplash** (Unsplash License, utilizare comercială liberă) și **țin locul pozelor reale Casinia** — lista e în `src/lib/scenes.ts`.
- `public/oven-pizza.jpg`: furnizată de client — de confirmat dreptul de utilizare.
- Fotografiile preparatelor vin de pe meniul oficial Casinia (img.ps.me).

## De confirmat cu proprietarul

- **Fotografii reale** pentru scenele pagina principală: intrarea, sala, o masă servită, sala seara, masa pentru grupuri, vederea de la fereastră.
- **Recenziile** de pe peretele 3D sunt fragmente din recenziile publice de pe Google — de confirmat că proprietarul vrea să le afișeze.

- **Programul de lucru**: valorile din `src/lib/site.ts` sunt provizorii (programul nu e public pe Google Maps).
- **Livrarea**: zona, costul și comanda minimă (setată provizoriu la 150 lei).
- **Fotografii**: imaginile vin de pe CDN-ul meniului oficial (img.ps.me). Pentru calitate maximă, fotografii la rezoluție mare ale localului și preparatelor.
- Textele de prezentare din `src/dictionaries/` (povestea localului).
