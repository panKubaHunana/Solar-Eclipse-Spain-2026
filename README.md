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

1. V repozitáři nahoře **Settings → Pages**.
2. **Build and deployment → Source:** *Deploy from a branch*.
3. **Branch:** `claude/travel-diary-pwa-app-o56sl3` (výchozí větev), složka **/ (root)** → **Save**.
4. Za ~1 minutu poběží na adrese, kterou Pages nahoře ukáže
   (`https://<uživatel>.github.io/solar-eclipse-spain-2026/`).
5. Na telefonu adresu otevři a zvol **„Přidat na plochu"** — máš appku. Každý další
   `push` do větve web automaticky přenasadí.

> Kamera (AR) a senzory fungují jen přes **HTTPS** — GitHub Pages HTTPS má, takže OK.
> Na iPhonu appka při prvním spuštění AR požádá o přístup k **pohybu** a **kameře**.
> Soubor `.nojekyll` zajišťuje, že Pages servíruje soubory beze změn.

## Společný (sdílený) deník — Supabase

Bez nastavení appka ukládá data **lokálně v telefonu** (offline, soukromé).
Aby Jakub i Honza viděli stejné zápisky a fotky, není potřeba editovat kód —
vše se nastaví přímo v aplikaci:

1. V appce otevři **Plán → Sdílení deníku** (nebo klikni na indikátor vpravo nahoře).
2. Postupuj podle návodu na obrazovce: založ zdarma projekt na
   <https://supabase.com>, v **SQL Editoru** spusť připravený SQL (tlačítko
   *Zkopírovat SQL*) a v **Project Settings → API** zkopíruj **Project URL** a klíč
   **anon public**.
3. Obojí vlož do formuláře a klikni **Připojit a synchronizovat**. Appka ověří
   spojení a přepne se na **„Sdíleno"**.
4. Na **druhém telefonu** zadej stejné dvě hodnoty. Hotovo — společný deník. ✅

> Klíč `anon public` je určený do frontendu — není to tajemství, a přístup hlídají
> pravidla RLS z připraveného SQL. Údaje se ukládají jen v telefonu (localStorage),
> nikam se nepublikují. Chceš-li soukromí jen pro vás dva (heslo/přihlášení), napiš
> a doděláme. Alternativně jde vyplnit `SUPABASE_URL`/`SUPABASE_ANON_KEY` v
> `js/config.js`.

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
js/trip.js            data cesty (itinerář, rozpočet, checklist, info)
js/store.js           datová vrstva (IndexedDB + Supabase)
js/ar.js              AR hledáček Slunce
js/views.js           obrazovky
js/app.js             router, odpočet, shell
assets/               titulní obrázek + ikony
```
