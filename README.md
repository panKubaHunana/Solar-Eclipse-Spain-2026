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

## 📱 QR Generátor (samostatná appka)

Ve složce `qr/` je druhá, zcela nezávislá PWA appka — jednoduchý generátor QR
kódů, offline a bez sledování:

- **Typy kódů:** text, odkaz (URL), Wi-Fi (SSID + heslo + zabezpečení),
  kontakt (vCard), e-mail, SMS, telefonní číslo, kalendářní událost.
- **Vzhled:** vlastní barva kódu i pozadí, úroveň korekce chyb (L/M/Q/H)
  a volitelné **logo/obrázek uprostřed** kódu (korekce chyb se pak
  automaticky přepne na nejvyšší, aby kód zůstal čitelný).
- **Stažení / sdílení:** tlačítko *Stáhnout* uloží PNG do telefonu,
  *Sdílet* otevře systémové sdílení (WhatsApp, AirDrop, e-mail…),
  *Kopírovat obrázek* dá QR kód rovnou do schránky.
- **Historie** posledních kódů se ukládá jen lokálně v telefonu.
- Instaluje se na plochu stejně jako appka ECLIPSE (**„Přidat na plochu"**)
  a funguje kompletně offline — žádná data neopouští zařízení.

Nasazení: v **Settings → Pages** stačí stejná větev, appka běží na
`https://<uživatel>.github.io/solar-eclipse-spain-2026/qr/`.

Zdrojový QR encoder je vendorovaná knihovna
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
(MIT, Kazuhiko Arase) v `qr/js/qrcode-lib.js`.

## ⏰ Hodinové cinknutí (samostatná appka + push server)

Ve složce `timer/` je třetí, opět zcela nezávislá PWA appka — kuchyňská
minutka:

- **Klasický odpočet** — vyber přednastavený čas (1/5/10/15/30 min) nebo
  vlastní počet minut, appka odpočítává a na konci cinkne (zvuk + vibrace
  + notifikace). Funguje čistě lokálně, appka ale musí zůstat otevřená.
- **Hodinové cinknutí** — navíc umí jednou za hodinu poslat cinknutí
  **i když je appka zavřená a telefon zamčený**. Prohlížeče to bez
  serveru neumí (neexistuje způsob, jak appce naplánovat opakovanou
  notifikaci sama v telefonu), proto appka posílá skutečnou **push
  notifikaci** přes malý server. Bez nastaveného serveru appka funguje
  jen jako běžná minutka.
- **Tichá noc** — volitelně appka mezi zvoleným rozmezím (výchozí
  23:00–07:00) hodinové cinknutí přeskočí, ať tě nebudí přes noc.

### 1) Appka samotná

Stejně jako appky výše — stačí stejná GitHub Pages větev, appka poběží na
`https://<uživatel>.github.io/solar-eclipse-spain-2026/timer/`.

### 2) Push server (jednorázové nastavení, ~10 minut)

Server je zdarma [Cloudflare Worker](https://workers.cloudflare.com) ve
složce `timer/push-server/`. Potřebuješ na počítači nainstalovaný
[Node.js](https://nodejs.org) a zdarma účet na
[cloudflare.com](https://cloudflare.com) (bez platební karty).

```bash
cd timer/push-server
npm install
npx wrangler login                       # přihlásí tě přes prohlížeč

npx wrangler kv namespace create SUBS     # vypíše "id" — vlož ho do
                                           # wrangler.toml místo
                                           # REPLACE_WITH_KV_ID

npx web-push generate-vapid-keys          # vypíše Public/Private Key
```

Vygenerovaný **Public Key** vlož na dvě místa:
- `timer/push-server/wrangler.toml` → `VAPID_PUBLIC_KEY`
- `timer/js/config.js` → `VAPID_PUBLIC_KEY`

**Private Key** (tajný, nikam do repozitáře) nastav jako serverový secret:

```bash
npx wrangler secret put VAPID_PRIVATE_KEY   # appka se zeptá na hodnotu, vlož Private Key

npx wrangler deploy                         # nasadí server, vypíše jeho adresu
                                             # (https://hourly-chime.<účet>.workers.dev)
```

Vypsanou adresu vlož do `timer/js/config.js` → `PUSH_SERVER_URL`, ulož a
`git push` (appka se sama znovu nasadí na GitHub Pages).

### 3) Zapnutí v appce

V appce `timer/` zapni přepínač **„Hodinové cinknutí"**, telefon se
zeptá na povolení notifikací — potvrď. Hotovo, tenhle telefon bude
každou celou hodinu cinkat, i zamčený.

> **iPhone/Safari:** appku je potřeba nejdřív přidat na plochu
> (**„Přidat na plochu"**) a otevřít ji odtud — teprve pak jde v appce
> povolit notifikace (funguje od iOS 16.4). V běžné kartě Safari
> notifikace nefungují.
>
> Server si u sebe uchovává jen technickou adresu, na kterou mu
> prohlížeč řekne doručovat zprávy (tzv. push endpoint), a nastavení
> tiché noci — žádné jiné osobní údaje.

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
qr/                   samostatná PWA appka — QR Generátor (viz sekce výše)
timer/                samostatná PWA appka — Hodinové cinknutí (viz sekce výše)
  push-server/         Cloudflare Worker — posílá hodinovou push notifikaci
```
