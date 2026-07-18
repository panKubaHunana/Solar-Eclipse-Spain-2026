# 🌒 ECLIPSE — Solar Eclipse Spain 2026

Interaktivní cestovatelská kronika Jakuba a Honzy — roadtrip za úplným zatměním
Slunce ve Španělsku (okolí Sorie), srpen 2026.

Progresivní webová aplikace (PWA): nainstaluje se do telefonu jako appka,
funguje **offline** a data se dají **sdílet mezi oběma telefony**.

## Co appka umí

- **🏠 Domů** — titulní strana, velký odpočet do totality, živé počasí v Sorii.
- **📖 Deník** — společné zápisky (autor, místo, nálada, fotka) na časové ose.
- **📸 Fotoalbum** — vzpomínkové fotky (i z deníku).
- **📋 Plán** — základní fakta, doprava & ubytování, rozpočet (odhad vs. skutečnost),
  trasa (den · odkud–kam · km).
- **🗺️ Mapa** — trasa Španělskem (Canfranc, Burgos, Soria, Zaragoza, Madrid, Valencia)
  + ujeté kilometry.
- **🌒 Zatmění** — přesné časy fází pro Sorii i Burgos, počasí, deník okamžiku totality
  a mřížka počasí.
- **🌞 AR hledáček Slunce** — přes kameru a senzory telefonu ukáže **kam a jak vysoko**
  bude Slunce v okamžiku zatmění (azimut + výška nad obzorem). Pomůže vybrat místo
  pozorování podle nízké výšky Slunce (v Sorii jen ~7° nad západním obzorem).
- **⏱️ Stálý odpočet** — tenký proužek pod horní lištou vždy ukazuje čas do začátku
  totality i do maximální fáze.

## Spuštění / nasazení (GitHub Pages)

Aplikace je čistě statická (HTML/CSS/JS), takže ji GitHub Pages hostuje zdarma:

1. V repozitáři **Settings → Pages**.
2. **Source:** *Deploy from a branch*.
3. Vyber větev (např. `main` po sloučení) a složku **/ (root)**, ulož.
4. Za chvíli poběží na `https://<uživatel>.github.io/<repo>/`.
5. Na telefonu tuto adresu otevři a zvol **„Přidat na plochu"** — máš appku.

> Kamera (AR) a senzory fungují jen přes **HTTPS** — GitHub Pages HTTPS má, takže OK.
> Na iPhonu appka při prvním spuštění AR požádá o přístup k **pohybu** a **kameře**.

## Společný (sdílený) deník — Supabase

Bez nastavení appka ukládá data **lokálně v telefonu** (offline, soukromé).
Aby Jakub i Honza viděli stejné zápisky a fotky, zapni jednou zdarma Supabase:

1. Založ projekt na <https://supabase.com> (New project).
2. V **SQL Editoru** spusť:

   ```sql
   create table docs  (name text primary key, data jsonb);
   create table items (_key text primary key, collection text, ts bigint, value jsonb);

   alter table docs  enable row level security;
   alter table items enable row level security;

   -- jednoduchý společný přístup pro vás dva (bez přihlašování)
   create policy "anon rw docs"  on docs  for all using (true) with check (true);
   create policy "anon rw items" on items for all using (true) with check (true);
   ```

3. V **Project Settings → API** zkopíruj **Project URL** a klíč **anon public**.
4. Vlož je do `js/config.js`:

   ```js
   SUPABASE_URL: "https://xxxxxxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```

5. Commitni, pushni — hotovo. Appka se přepne do režimu **„Sdíleno"** (indikátor
   vpravo nahoře) a synchronizuje v reálném čase mezi oběma telefony.

> Klíč `anon public` je určený do frontendu — není to tajemství. Přístup hlídají
> pravidla (RLS) výše. Chceš-li soukromí jen pro vás dva, dá se doplnit heslo /
> přihlášení — napiš a doděláme.

## Technika

- Vanilla JS, bez build kroku. Service worker (`sw.js`) pro offline.
- Poloha Slunce: vlastní implementace algoritmu NOAA (`js/sun.js`) — ověřeno proti
  hodnotám z deníku (Burgos +8,3°, Soria +7,1°).
- Počasí: [Open-Meteo](https://open-meteo.com) (zdarma, bez klíče).
- Data: IndexedDB (lokálně) + volitelně Supabase (sdílení).

## Struktura

```
index.html            layout + registrace service workeru
manifest.webmanifest  PWA manifest
sw.js                 offline cache
css/styles.css        vzhled (pergamen / kartografie)
js/config.js          nastavení (Supabase, cestovatelé, časy)
js/sun.js             poloha Slunce (AR)
js/weather.js         živé počasí
js/eclipse.js         data o zatmění (časy fází)
js/store.js           datová vrstva (IndexedDB + Supabase)
js/ar.js              AR hledáček Slunce
js/views.js           obrazovky
js/app.js             router, odpočet, shell
assets/               titulní obrázek + ikony
```
