# Casinia Pizza Pub

Site-ul pizzeriei Casinia Pizza Pub din Stăuceni: prezentare, meniu complet, comenzi online și rezervări de mese, în română, rusă și engleză.

## Ce face

- **Pagina principală** cu animația de intrare (semnătura „Casinia” se scrie în alamă, scântei de cuptor) și arcada cuptorului care se deschide la scroll, banda orizontală cu toate pizzele, burgeri și gustări, recenzii, program și hartă.
- **Meniu** (`/ro/meniu`) cu toate produsele, prețurile și gramajele de pe meniul oficial, file de categorii lipite sus.
- **Coș și comandă online** (`/ro/comanda`): ridicare sau livrare, „cât mai repede” sau la o oră anume, plata numerar sau card. Prețurile se recalculează pe server din meniu.
- **Rezervări** (`/ro/rezervare`): zi, oră (doar intervalele din program, cu ora Chișinăului), număr de persoane.
- **Panou admin** (`/ro/admin`, cu parolă): comenzi și rezervări, cu schimbare de status și reîmprospătare automată.
- Notificări opționale pe **Telegram** pentru fiecare comandă și rezervare.
- SEO: metadate pe limbă, `hreflang`, sitemap, robots, date structurate `Restaurant`.

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

## De confirmat cu proprietarul

- **Programul de lucru**: valorile din `src/lib/site.ts` sunt provizorii (programul nu e public pe Google Maps).
- **Livrarea**: zona, costul și comanda minimă (setată provizoriu la 150 lei).
- **Fotografii**: imaginile vin de pe CDN-ul meniului oficial (img.ps.me). Pentru calitate maximă, fotografii la rezoluție mare ale localului și preparatelor.
- Textele de prezentare din `src/dictionaries/` (povestea localului).
