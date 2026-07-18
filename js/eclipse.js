// =====================================================================
//  Data k úplnému zatmění Slunce — 12. srpna 2026
//  Hodnoty převzaté z cestovního deníku (strana "Total Solar Eclipse").
//  Časy jsou uvedené v místním čase (SELČ / CEST = UTC+2).
// =====================================================================

window.ECLIPSE_DATA = {
  date: "12. srpna 2026",
  locations: [
    {
      id: "soria",
      name: "SORIA",
      primary: true,
      coords: "41,7757° N, 2,5873° Z — bod C (~9 km Z od Sorie)",
      lat: 41.7757, lon: -2.5873,
      maxPhase: "1 min 41,2 s",
      phases: [
        { label: "Začátek částečného zatmění", time: "19:34:28", alt: "+17,3°" },
        { label: "Začátek úplného zatmění", time: "20:29:07", alt: "+7,1°", highlight: true },
        { label: "Maximální fáze zatmění", time: "20:29:58", alt: "+7,1°" },
        { label: "Konec úplné fáze", time: "20:30:49", alt: "+6,9°" },
        { label: "Západ Slunce", time: "21:21:41", alt: "−0,8°" },
        { label: "Konec částečného zatmění", time: "21:22:03", alt: "−2,2°" }
      ]
    },
    {
      id: "burgos",
      name: "BURGOS",
      primary: false,
      coords: "42,3380° N, 3,7003° Z",
      lat: 42.3380, lon: -3.7003,
      maxPhase: "1 min 43,2 s",
      phases: [
        { label: "Začátek částečného zatmění", time: "19:33:23", alt: "+18,4°" },
        { label: "Začátek úplného zatmění", time: "20:28:25", alt: "+8,3°", highlight: true },
        { label: "Maximální fáze zatmění", time: "20:29:17", alt: "+8,2°" },
        { label: "Konec úplné fáze", time: "20:30:08", alt: "+8,0°" },
        { label: "Západ Slunce", time: "21:21:00", alt: "−0,3°" },
        { label: "Konec částečného zatmění", time: "21:21:43", alt: "−1,1°" }
      ]
    }
  ],
  // Deníkové otázky ke dni zatmění (ze strany 7).
  journalQuestions: [
    "Jak vypadala korona?",
    "Jak reagovali ostatní?",
    "Jak reagovala příroda?",
    "Jak se změnil horizont?",
    "Byly vidět hvězdy?"
  ],
  weatherRows: ["09:00", "14:00", "18:00"],
  weatherOptions: [
    { id: "sunny", label: "Jasno", icon: "☀️" },
    { id: "partly", label: "Polojasno", icon: "⛅" },
    { id: "rain", label: "Déšť", icon: "🌧️" },
    { id: "storm", label: "Bouřka", icon: "⛈️" }
  ]
};
