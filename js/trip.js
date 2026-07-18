// =====================================================================
//  TRIP — data cesty (Roadtrip Španělsko 2026, verze 2)
//  Zdroj: roadtrip_spanelsko_2026_v2 (opravené vydání 12. 7. 2026)
// =====================================================================

window.TRIP = {
  gps: { lat: 41.7757, lon: -2.5873, label: "41,7757° N, 2,5873° Z — bod C (~9 km Z od Sorie)" },

  // ---- Denní harmonogram --------------------------------------------
  days: [
    {
      n: 1, date: "po 10. 8.", place: "Madrid / Tetuán",
      title: "Přílet Madrid → Tetuán → odpočinek",
      items: [
        { t: "09:35", a: "Odlet Praha Ruzyně — Ryanair FR 2767" },
        { t: "12:40", a: "Přílet Madrid Barajas T4" },
        { t: "12:40", a: "Transfer T4 → Tetuán: metro L8 → Nuevos Ministerios → L10 (~40 min, ~5 €) / taxi 25–35 €" },
        { t: "13:15", a: "Check-in bytu Tetuán, odpočinek, svačina" },
        { t: "15:00", a: "Santiago Bernabéu (exteriér, zdarma) + Cuatro Caminos" },
        { t: "17:00", a: "Mercado de Maravillas (Bravo Murillo 122) — po siestě, otevřeno 17–20 h" },
        { t: "18:30", a: "Mirador de Tetuán / procházka čtvrtí" },
        { t: "20:00", a: "Večeře — madridské tapas (Calle Bravo Murillo)" },
        { t: "21:30", a: "Odpočinek — zítra brzy vstávat!" }
      ]
    },
    {
      n: 2, date: "út 11. 8.", place: "Tetuán → Zaragoza → Soria",
      title: "Vlak, vyzvednutí auta a přejezd do Sorie",
      items: [
        { t: "06:30", a: "Snídaně, balení, úklid bytu" },
        { t: "07:30", a: "Metro Tetuán → Atocha Renfe (L1 přímo, ~15–20 min)" },
        { t: "08:30", a: "Vlak Avlo/Ouigo/Iryo Madrid Atocha → Zaragoza Delicias (koupit předem!)" },
        { t: "09:45", a: "Příjezd Zaragoza Delicias — káva" },
        { t: "11:00", a: "★ Vyzvednutí auta — Centauro, Škoda Kamiq (Premium bez kauce)", hi: true },
        { t: "11:15", a: "Nákup potravin (Mercadona/Carrefour) — zásoby na 3 dny, 15. 8. je svátek!" },
        { t: "12:00", a: "Zaragoza → Soria: N-122 přes Ágredu (~157 km, ~2 h)" },
        { t: "14:00", a: "Soria — check-in ubytování, oběd z vlastních zásob" },
        { t: "15:00", a: "★ Průzkum bodu C (41.7757, −2.5873) — ověřit volný výhled na Z/JZ!", hi: true },
        { t: "17:00", a: "Soria — San Juan de Duero, San Saturio, Castillo de Soria" },
        { t: "19:30", a: "Večeře — tapas (migas sorianas!)" },
        { t: "20:30", a: "Večerní astrofoto — Perseidy (bezměsíčná noc)" }
      ]
    },
    {
      n: 3, date: "st 12. 8.", place: "Soria — bod C", eclipse: true,
      title: "🌒 ZATMĚNÍ SLUNCE + PERSEIDY — hlavní den!",
      items: [
        { t: "07:00", a: "Snídaně, kontrola počasí (AEMET, Windy, Meteoblue)" },
        { t: "09:00", a: "Numancia (7 km, keltiberské hradiště) / příp. Medinaceli (75 km)" },
        { t: "12:30", a: "Oběd / piknik, odpočinek ve stínu (30–35 °C!)" },
        { t: "14:00", a: "Přesun na bod C — stativy, dalekohledy, filtry" },
        { t: "16:00", a: "Rozhodovací bod: při oblačnosti přesun na východ k Zaragoze (~2 h)" },
        { t: "19:34", a: "▶ Začátek částečné fáze — nasadit brýle ISO 12312-2 a filtr!", hi: true },
        { t: "20:28", a: "▶ Diamantový prsten — sundat filtry!", hi: true },
        { t: "20:29", a: "▶ TOTALITA — 1 min 41 s! Koróna, Venuše, hvězdy (bez filtrů)", hi: true },
        { t: "20:31", a: "▶ Konec totality — OKAMŽITĚ nasadit filtry zpět!", hi: true },
        { t: "21:10", a: "Západ Slunce — konec pozorování" },
        { t: "21:30", a: "Perseidy — maximum roje, astrofoto" },
        { t: "00:00", a: "Noc venku pod hvězdami (spacák, karimatka)" }
      ]
    },
    {
      n: 4, date: "čt 13. 8.", place: "Soria → Zaragoza → Canfranc",
      title: "Pyreneje a historická stanice Canfranc",
      items: [
        { t: "07:00", a: "Vstávání po noci venku, snídaně, balení tábora (Leave No Trace!)" },
        { t: "09:00", a: "Soria → Zaragoza: A-15 na Tudelu → AP-68 (~170 km, ~2 h)" },
        { t: "11:00", a: "Zaragoza — Basílica del Pilar (zdarma), čtvrť El Tubo" },
        { t: "12:30", a: "Oběd — Mercado Central" },
        { t: "13:30", a: "Zaragoza → Canfranc: A-23 na Huescu, N-330 přes Jacu (~160 km, nádherná trasa!)" },
        { t: "17:00", a: "Canfranc — prohlídka historické mezinárodní stanice, focení" },
        { t: "20:00", a: "Večeře v okolí Jacy" },
        { t: "21:00", a: "Check-in Jaca / Canfranc" }
      ]
    },
    {
      n: 5, date: "pá 14. 8.", place: "Jaca → Zaragoza",
      title: "Zaragoza — památky a vrácení auta",
      items: [
        { t: "08:30", a: "Klidná snídaně, balení — žádný spěch" },
        { t: "09:30", a: "Jaca → Zaragoza (A-23, ~140 km, ~1,5 h)" },
        { t: "10:45", a: "Zaragoza — Basílica del Pilar, Plaza del Pilar, focení" },
        { t: "12:30", a: "Oběd — El Tubo (ternasco aragonés!)" },
        { t: "14:00", a: "Palác Aljafería — maurský palác (UNESCO, ~10 €)" },
        { t: "15:30", a: "Odpočinek, doplnit palivo (Full-Full) u Delicias" },
        { t: "17:30", a: "Procházka po nábřeží Ebra — krásné světlo" },
        { t: "20:00", a: "★ Vrácení auta — Centauro Zaragoza Delicias", hi: true },
        { t: "20:30", a: "Večeře — poslední tapas v Zaragoze" },
        { t: "21:30", a: "Check-in hotel Zaragoza" }
      ]
    },
    {
      n: 6, date: "so 15. 8.", place: "Zaragoza → Madrid",
      title: "Pohodový den v Madridu (státní svátek)",
      items: [
        { t: "07:30", a: "Snídaně v hotelu, check-out" },
        { t: "08:30", a: "AVE/Avlo Zaragoza → Madrid Atocha (~1,25 h, koupit předem — svátek!)" },
        { t: "10:00", a: "Metro Atocha → Tetuán (L1), odložit zavazadla" },
        { t: "10:30", a: "SVÁTEK Asunción: Retiro, Puerta del Sol, Plaza Mayor, Prado / Reina Sofía (rezervovat!)" },
        { t: "13:00", a: "Oběd — bocadillo de calamares u Plaza Mayor" },
        { t: "15:00", a: "Volno — prohlížení fotek z cesty, káva" },
        { t: "18:00", a: "Procházka po Castellaně" },
        { t: "20:00", a: "Večeře — poslední madridský večer" },
        { t: "21:30", a: "★ Sbalit, REZERVOVAT TAXI na ráno, budík 04:15!", hi: true }
      ]
    },
    {
      n: 7, date: "ne 16. 8.", place: "Madrid → Praha",
      title: "Odlet domů — brzy ráno!",
      items: [
        { t: "04:15", a: "★ Vstávání! Let odlétá 06:25", hi: true },
        { t: "04:40", a: "Taxi Tetuán → Barajas T4 (metro v tuto dobu NEJEZDÍ!)" },
        { t: "05:10", a: "Letiště T4 — online check-in hotový, bezpečnostní kontrola" },
        { t: "06:25", a: "Odlet FR 2766 Madrid → Praha" },
        { t: "09:20", a: "Přílet Praha Ruzyně — vítejte zpátky! 🎉" }
      ]
    }
  ],

  // ---- Rezervace ----------------------------------------------------
  reservations: [
    { ic: "✈️", t: "Ryanair PRG → MAD", d: "Po 10. 8. · 09:35 → 12:40 · FR 2767 · ~120 €/os" },
    { ic: "✈️", t: "Ryanair MAD → PRG", d: "Ne 16. 8. · 06:25 → 09:20 · FR 2766 · ~101 €/os" },
    { ic: "🚗", t: "Centauro — Škoda Kamiq", d: "Vyzvednutí 11. 8. 11:00 · vrácení 14. 8. 20:00 · Zaragoza Delicias · Premium bez kauce" }
  ],
  bagWarn: "Tarif Basic = jen malá taška 40×20×25 cm. S foto výbavou a spacáky dokupte 10kg kabinové zavazadlo předem!",

  // ---- Rozpočet (Kč, 2 osoby) --------------------------------------
  budgetRows: [
    { cat: "Let PRG → MAD (2 os)", est: "5860", real: "" },
    { cat: "Let MAD → PRG (2 os)", est: "4930", real: "" },
    { cat: "Auto Centauro (4 dny)", est: "5895", real: "" },
    { cat: "Benzín (~650 km)", est: "2075", real: "" },
    { cat: "Ubytování Soria (2 noci)", est: "5860", real: "" },
    { cat: "Ubytování Zaragoza (1 noc)", est: "1460", real: "" },
    { cat: "Ubytování Jaca/Canfranc", est: "2200", real: "" },
    { cat: "Vlaky Madrid ↔ Zaragoza", est: "2440", real: "" },
    { cat: "Jídlo (supermarket, 7 dní)", est: "4390", real: "" },
    { cat: "Restaurace (speciality)", est: "1465", real: "" },
    { cat: "Vstupné (Aljafería…)", est: "730", real: "" },
    { cat: "Brýle ISO 12312-2 (2×)", est: "490", real: "" },
    { cat: "Metro Madrid", est: "370", real: "" },
    { cat: "Taxi na letiště (16. 8.)", est: "730", real: "" },
    { cat: "Rezerva 10 %", est: "3890", real: "" }
  ],
  budgetNote: "Odhad ~32 000–43 000 Kč pro 2 osoby vč. letenek (kurz 24,40 Kč/€). Byt v Madridu je zdarma.",

  // ---- Předvyplnění formulářů --------------------------------------
  facts: {
    datum: "10.–16. srpna 2026",
    lokalita: "Španělsko — Madrid, Zaragoza, Soria, Pyreneje",
    mise: "Pozorovat úplné zatmění Slunce 12. 8. u Sorie (bod C)",
    tesime: "Totalita 1 min 41 s · koróna · Perseidy · Pyreneje a Canfranc",
    vyzva: "Volný výhled na Z/JZ obzor (Slunce jen ~7° nad obzorem) · vedro 30–35 °C",
    minout: "Bod C · Numancia · Canfranc · Basílica del Pilar · Aljafería",
    obavy: "Oblačnost na západě při totalitě · ranní taxi na letiště 16. 8."
  },
  transport: {
    doba: "7 dní (10.–16. 8. 2026)",
    lokalita: "Madrid → Zaragoza → Soria → Pyreneje → Zaragoza → Madrid",
    prilet: "10. 8. 12:40 — Madrid Barajas T4 (FR 2767)",
    odlet: "16. 8. 06:25 — Madrid Barajas T4 (FR 2766)",
    doprava: "Ryanair PRG↔MAD · vlak Madrid↔Zaragoza (Avlo/Ouigo/Iryo) · auto Centauro Škoda Kamiq (11.–14. 8.)",
    ubytovani: "Madrid/Tetuán — vlastní byt (10./11. a 15./16.)\nSoria — 2 noci (11.–13.)\nNoc venku u bodu C (12./13.)\nJaca/Canfranc — 1 noc (13./14.)\nZaragoza — 1 noc (14./15.)",
    trasa: "Madrid → (vlak) Zaragoza → Soria (bod C, zatmění) → Zaragoza → Canfranc/Jaca → Zaragoza → (vlak) Madrid"
  },
  route: [
    { day: "2", fromto: "Zaragoza → Soria", mode: "auto N-122", dist: "157" },
    { day: "4", fromto: "Soria → Zaragoza", mode: "auto A-15/AP-68", dist: "170" },
    { day: "4", fromto: "Zaragoza → Canfranc", mode: "auto A-23/N-330", dist: "160" },
    { day: "5", fromto: "Jaca → Zaragoza", mode: "auto A-23", dist: "140" }
  ],

  // ---- Checklist zavazadel -----------------------------------------
  checklist: [
    { g: "📄 Doklady a finance", items: [
      "Pas nebo občanský průkaz (2×)", "Řidičský průkaz", "Kreditní karta na jméno řidiče (rezerva ~500 €)",
      "Cestovní pojištění (asistenční služba)", "Rezervace ubytování (offline)", "Letenky Ryanair (+ zaplacené zavazadlo!)",
      "Jízdenky vlak (Renfe/Ouigo/Iryo)", "EHIC — evropský průkaz pojištění", "Rezervace Centauro (offline)"
    ]},
    { g: "👕 Oblečení", items: [
      "Trička 4–5 ks", "Kraťasy 2–3 ks", "Tenké kalhoty (chladné večery v horách)", "Lehká bunda / mikina",
      "Ponožky 5–6, spodní prádlo 5–6", "Trekové boty / tenisky", "Žabky / sandály",
      "Klobouk / kšiltovka (klíčové při čekání!)", "Sluneční brýle běžné (ne na zatmění!)"
    ]},
    { g: "💊 Hygiena a zdraví", items: [
      "Opalovací krém SPF 50+", "Repelent (komáři u Sorie)", "Základní léky (ibuprofen, náplasti…)",
      "Osobní hygiena (tekutiny do 100 ml)", "Pinzeta / karta na klíšťata"
    ]},
    { g: "📷 Astrofoto a zatmění", items: [
      "BRÝLE ISO 12312-2 (2×) — NUTNÉ!", "Fóliový sluneční filtr na objektiv", "Fotoaparát + nabíječka + baterie",
      "Teleobjektiv 200–500 mm", "Druhé tělo / telefon na širokoúhlý záběr", "Pevný stativ",
      "Dálková spoušť / intervalometr", "Plán expozic pro totalitu (bracketing)", "Dalekohled (jen s filtrem!)",
      "Červená čelovka", "Náhradní SD karty (2× 64 GB)", "Powerbanka", "Spacák (komfort ~5 °C)",
      "Karimatka + sedátko", "Lehký stan / bivak (záloha pro déšť)"
    ]},
    { g: "🎒 Ostatní", items: [
      "Telefon + nabíječka (adaptér není nutný)", "Offline mapy Španělska (stáhnout předem!)",
      "Termoska na kávu", "Nůž / multitool (jen do zavazadla!)", "Pytle na odpadky (Leave No Trace)",
      "Voda 2–3 l/os na den zatmění"
    ]}
  ],

  // ---- Bezpečnost a info -------------------------------------------
  safety: [
    "NIKDY se nedívej do Slunce bez certifikovaného filtru — hrozí trvalé poškození zraku!",
    "Brýle ISO 12312-2 — jen certifikované, běžné sluneční brýle NEchrání.",
    "Filtr na objektiv (sluneční fólie / ND 5.0) je nutný pro všechny fáze KROMĚ totality.",
    "Ochranu sundej až při diamantovém prstenu (2. kontakt), nasaď zpět při 3. kontaktu (~1 min 41 s).",
    "Vedro 30–35 °C: pít 2–3 l vody denně, stín 13–17 h, SPF 50+ každé 2 h.",
    "Noc venku: klíšťata, přísný zákaz ohně (srpen = vrchol požárů), sdílej polohu s někým doma."
  ],
  photoPlan: [
    "Částečné fáze: sluneční filtr + brýle, teleobjektiv 200–500 mm, stativ.",
    "Totalita (1:41): filtry dolů! Bracketing ~1/1000 s – 1 s, ISO 100–400, f/8.",
    "Druhé tělo/telefon: širokoúhlý záběr obzoru a atmosféry totality (Venuše, hvězdy).",
    "Slunce jen ~7–10° nad Z/JZ obzorem — použij AR hledáček a zkontroluj volný výhled předem!"
  ],
  emergency: [
    { n: "112", d: "Tísňová linka EU — vše (záchranka, hasiči, policie)" },
    { n: "061", d: "Zdravotní záchranná služba (Urgencias)" },
    { n: "062", d: "Guardia Civil — policie mimo město" },
    { n: "091", d: "Policía Nacional — ve městě" },
    { n: "080", d: "Hasiči (Bomberos)" },
    { n: "Nemocnice", d: "Hospital Santa Bárbara, Soria" }
  ],
  apps: [
    { t: "AEMET", d: "Oficiální španělská předpověď — nejpřesnější lokální oblačnost" },
    { t: "Windy.com", d: "Modely oblačnosti (ECMWF/ICON) — klíčové pro zatmění" },
    { t: "Solar Eclipse Timer", d: "Přesné časy kontaktů pro GPS polohu" },
    { t: "Stellarium", d: "Mapa oblohy (Perseidy, planety při totalitě)" },
    { t: "Google Maps (offline)", d: "Stáhnout Španělsko předem!" },
    { t: "Bolt / Cabify / Free Now", d: "Taxi na letiště 16. 8. — rezervovat večer!" }
  ],
  links: [
    { t: "TimeAndDate — Soria", u: "https://www.timeanddate.com/eclipse/solar/2026-august-12" },
    { t: "Interaktivní mapa (X. Jubier)", u: "http://xjubier.free.fr/en/site_pages/solar_eclipses/TSE_2026_GoogleMapFull.html" },
    { t: "IGN Španělsko (oficiální)", u: "https://astronomia.ign.es/en/eclipses-de-sol-y-luna/eclipse-total-sol-de-12-de-agosto-2026" },
    { t: "NASA — Eclipse 2026", u: "https://science.nasa.gov/eclipses/future-eclipses/total-solar-eclipse-on-august-12-2026" },
    { t: "Eclipsophile — meteorologie", u: "https://eclipsophile.com/tse2026" },
    { t: "AEMET — počasí", u: "https://www.aemet.es" }
  ]
};
