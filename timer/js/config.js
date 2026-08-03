// =====================================================================
//  Hodinové cinknutí — konfigurace
//  ---------------------------------------------------------------------
//  Aby appka uměla poslat notifikaci, i když je zavřená a telefon
//  zamčený, potřebuje malý server (Cloudflare Worker zdarma), který
//  jednou za hodinu pošle push zprávu. Návod na zprovoznění je
//  v README.md (sekce "Hodinové cinknutí — Push server").
//
//  Po zprovoznění serveru sem doplň dvě hodnoty — obě nejsou tajné,
//  patří do frontendu:
//
//     PUSH_SERVER_URL  = "https://hourly-chime.<tvuj-ucet>.workers.dev"
//     VAPID_PUBLIC_KEY = "B..." (veřejný klíč, vypíše ho "npx web-push
//                        generate-vapid-keys")
//
//  Dokud jsou prázdné, appka funguje jen jako klasická kuchyňská
//  minutka a lokální test cinknutí (appka musí být otevřená).
// =====================================================================

window.CHIME_CONFIG = {
  PUSH_SERVER_URL: "",
  VAPID_PUBLIC_KEY: "BL988SWnJV27mt2Hc7sk-6UQE9KLHakZOXlaialElIRj2USzYdJsAeK5a-5JC8Qe_-jlsQIwSsd6UgKwHOvNfzI"
};
