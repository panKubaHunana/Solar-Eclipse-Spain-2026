// =====================================================================
//  ECLIPSE — konfigurace aplikace
// =====================================================================
//
//  SPOLEČNÝ (sdílený) DENÍK
//  ------------------------
//  Aby Jakub i Honza viděli stejné zápisky a fotky na obou telefonech,
//  je potřeba jednou zdarma založit projekt na https://supabase.com
//  a doplnit sem dvě hodnoty (nic tajného — patří do frontendu):
//
//     SUPABASE_URL      = "https://xxxxxxxx.supabase.co"
//     SUPABASE_ANON_KEY = "eyJhbGciOi..."   (klíč "anon public")
//
//  Dokud jsou prázdné, aplikace funguje čistě lokálně v telefonu
//  (data se ukládají do zařízení). Po vyplnění se automaticky zapne
//  synchronizace mezi telefony. Postup je popsán v souboru README.md.
// =====================================================================

window.ECLIPSE_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Kdo jsme — použije se u autorství zápisků.
  travelers: [
    { id: "jakub", name: "Jakub", color: "#b8863b" },
    { id: "honza", name: "Honza", color: "#2f6d6a" }
  ],

  trip: {
    title: "Solar Eclipse Spain 2026",
    departureISO: "2026-08-10",       // odlet z ČR
    // Začátek úplného zatmění (totalita) v Sorii — 12. 8. 2026, 18:29:07 UTC
    // (= 20:29 místního času ve Španělsku i v ČR, oba jsou v létě UTC+2).
    totalityISO: "2026-08-12T18:29:07Z"
  }
};
