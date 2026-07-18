// =====================================================================
//  App — shell, router, stálý odpočet, pomocné funkce
// =====================================================================

const CFG = window.ECLIPSE_CONFIG;

// ---- Pomocné funkce (UI) --------------------------------------------
const UI = {
  h(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  },

  esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  },

  travelers: CFG.travelers,

  me() {
    const id = localStorage.getItem("eclipse-me") || CFG.travelers[0].id;
    return CFG.travelers.find((t) => t.id === id) || CFG.travelers[0];
  },
  setMe(id) {
    localStorage.setItem("eclipse-me", id);
    document.dispatchEvent(new CustomEvent("me-changed"));
  },
  traveler(id) {
    return CFG.travelers.find((t) => t.id === id) || { name: "?", color: "#888" };
  },

  fmtDateTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" }) +
      " · " + d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  },

  // Načte obrázek ze souboru a zmenší na max 1400 px (JPEG dataURL).
  fileToDataURL(file, max = 1400) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width: w, height: hh } = img;
        if (Math.max(w, hh) > max) {
          const s = max / Math.max(w, hh);
          w = Math.round(w * s); hh = Math.round(hh * s);
        }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = hh;
        cv.getContext("2d").drawImage(img, 0, 0, w, hh);
        resolve(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  // Debounce pro autosave formulářů.
  debounce(fn, ms = 500) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  },

  toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = UI.h("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("show"), 1800);
  },

  quote(text) {
    return `<div class="quote">„${text}"</div>`;
  },
  rule() {
    return `<div class="rule"><span class="gem"></span></div>`;
  }
};
window.UI = UI;

// ---- Odpočet: cílové okamžiky ---------------------------------------
const TOTALITY = new Date(CFG.trip.totalityISO);        // začátek totality (Soria)
const MAXPHASE = new Date(TOTALITY.getTime() + 51 * 1000); // max. fáze ≈ +51 s
const TOT_END = new Date(TOTALITY.getTime() + 101 * 1000);

function cdParts(target) {
  let diff = Math.floor((target - Date.now()) / 1000);
  const past = diff < 0;
  diff = Math.abs(diff);
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return { past, d, h, m, s };
}
window.cdParts = cdParts;
window.TOTALITY = TOTALITY;
window.MAXPHASE = MAXPHASE;

// ---- Stálý odpočtový proužek ----------------------------------------
function renderTicker() {
  const t = document.getElementById("ticker");
  if (!t) return;
  const now = Date.now();
  if (now >= TOTALITY.getTime() && now < TOT_END.getTime()) {
    t.className = "ticker past";
    t.innerHTML = `<span class="seg"><span class="sun">🌑</span><span class="vl">TOTALITA PRÁVĚ PROBÍHÁ</span></span>`;
    return;
  }
  if (now >= TOT_END.getTime()) {
    t.className = "ticker";
    t.innerHTML = `<span class="seg"><span class="sun">🌒</span><span class="lb">Zatmění 12. 8. 2026 —</span><span class="vl">vzpomínka navždy</span></span>`;
    return;
  }
  const a = cdParts(TOTALITY), b = cdParts(MAXPHASE);
  const fmt = (p) => (p.d > 0 ? p.d + "d " : "") +
    String(p.h).padStart(2, "0") + ":" + String(p.m).padStart(2, "0") + ":" + String(p.s).padStart(2, "0");
  t.className = "ticker";
  t.innerHTML =
    `<span class="seg"><span class="sun">🌘</span><span class="lb">Do totality</span><span class="vl">${fmt(a)}</span></span>` +
    `<span class="seg max"><span class="lb">Max. fáze</span><span class="vl">${fmt(b)}</span></span>`;
}

// ---- Router ----------------------------------------------------------
const ROUTES = {
  "": { view: "home", tab: "home" },
  "denik": { view: "denik", tab: "denik" },
  "fotky": { view: "fotky", tab: "fotky" },
  "itinerar": { view: "itinerar", tab: "plan" },
  "plan": { view: "plan", tab: "plan" },
  "plan/fakta": { view: "fakta", tab: "plan" },
  "plan/doprava": { view: "doprava", tab: "plan" },
  "plan/rozpocet": { view: "rozpocet", tab: "plan" },
  "plan/trasa": { view: "trasa", tab: "plan" },
  "plan/mapa": { view: "mapa", tab: "plan" },
  "plan/checklist": { view: "checklist", tab: "plan" },
  "plan/info": { view: "info", tab: "plan" },
  "tisk": { view: "tisk", tab: "plan" },
  "zatmeni": { view: "zatmeni", tab: "zatmeni" }
};

async function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const r = ROUTES[hash] || ROUTES[""];
  const main = document.getElementById("view");
  main.innerHTML = "";
  const el = UI.h("div", "view");
  main.appendChild(el);
  window.scrollTo(0, 0);
  // aktivní záložka
  document.querySelectorAll(".tabbar a").forEach((a) =>
    a.classList.toggle("active", a.dataset.tab === r.tab));
  try {
    await Views[r.view](el);
  } catch (e) {
    console.error(e);
    el.innerHTML = `<div class="empty"><div class="ic">⚠️</div><p>Něco se pokazilo.<br>${UI.esc(e.message)}</p></div>`;
  }
}

// ---- Instalace PWA ---------------------------------------------------
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.dispatchEvent(new CustomEvent("can-install"));
});
window.promptInstall = async function () {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  return true;
};
window.canInstall = () => !!deferredPrompt;

// ---- Start -----------------------------------------------------------
async function boot() {
  // horní lišta – přepínač cestovatele
  const who = document.getElementById("who");
  function paintWho() {
    const me = UI.me();
    who.innerHTML = `<span class="dot" style="background:${me.color}"></span>${me.name}`;
  }
  paintWho();
  who.onclick = () => {
    const others = CFG.travelers;
    const cur = UI.me().id;
    const next = others[(others.findIndex((t) => t.id === cur) + 1) % others.length];
    UI.setMe(next.id);
    UI.toast("Píšeš jako " + next.name);
  };
  document.addEventListener("me-changed", paintWho);

  // sync indikátor
  await Store.ready;
  const sp = document.getElementById("sync");
  if (Store.isShared()) { sp.classList.add("on"); sp.querySelector(".txt").textContent = "Sdíleno"; }
  else { sp.querySelector(".txt").textContent = "V telefonu"; }
  // Realtime: vzdálená změna (druhý telefon) → přenačti aktuální pohled.
  Store.onChange(() => route());

  renderTicker();
  setInterval(renderTicker, 1000);

  window.addEventListener("hashchange", route);
  await route();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", boot);
