// =====================================================================
//  Hodinové cinknutí — logika appky
//  • Hodinové cinknutí (i na zamčeném telefonu) přes Web Push.
//  • Klasická kuchyňská minutka (odpočet), funguje lokálně bez serveru.
// =====================================================================

(function () {
  "use strict";

  const cfg = window.CHIME_CONFIG || {};
  const SERVER_URL = (cfg.PUSH_SERVER_URL || "").replace(/\/+$/, "");
  const VAPID_KEY = cfg.VAPID_PUBLIC_KEY || "";
  const SERVER_READY = !!(SERVER_URL && VAPID_KEY);

  const LS_QUIET_ON = "chime.quiet.on";
  const LS_QUIET_FROM = "chime.quiet.from";
  const LS_QUIET_TO = "chime.quiet.to";

  const $ = (id) => document.getElementById(id);
  const el = {
    offlinePill: $("offlinePill"),
    clock: $("clock"),
    nextChime: $("nextChime"),
    toggleHourly: $("toggleHourly"),
    hourlyStatus: $("hourlyStatus"),
    quietRow: $("quietRow"),
    toggleQuiet: $("toggleQuiet"),
    quietTimes: $("quietTimes"),
    quietFrom: $("quietFrom"),
    quietTo: $("quietTo"),
    btnTest: $("btnTest"),
    timerDisplay: $("timerDisplay"),
    presets: $("presets"),
    customMinutes: $("customMinutes"),
    btnStart: $("btnStart"),
    btnPause: $("btnPause"),
    btnReset: $("btnReset"),
    toast: $("toast")
  };

  let toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.textContent = ""; }, 3200);
  }

  // ---- Zvuk (Web Audio — bez souboru, funguje offline) --------------
  let actx = null;
  function chime() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const now = actx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.28, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
        osc.connect(gain).connect(actx.destination);
        osc.start(start);
        osc.stop(start + 1);
      });
    } catch (_) { /* Web Audio nedostupné — ignoruj */ }
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
  }

  // ---- Hodiny + odpočet do dalšího cinknutí --------------------------
  function tickClock() {
    const now = new Date();
    el.clock.textContent = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    const ms = next - now;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);

    if (el.toggleHourly.checked) {
      el.nextChime.textContent = `Další cinknutí za ${m} min ${s.toString().padStart(2, "0")} s`;
    } else {
      el.nextChime.textContent = "Hodinové cinknutí je vypnuté";
    }
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ---- Service worker -------------------------------------------------
  let swReg = null;
  async function initSW() {
    if (!("serviceWorker" in navigator)) {
      el.offlinePill.classList.add("off");
      el.offlinePill.querySelector(".txt").textContent = "Bez service workeru";
      return;
    }
    try {
      swReg = await navigator.serviceWorker.register("sw.js");
      el.offlinePill.querySelector(".txt").textContent = "Offline připraveno";
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data && e.data.type === "resubscribe" && el.toggleHourly.checked) {
          subscribeHourly().catch(() => {});
        }
      });
    } catch (err) {
      el.offlinePill.classList.add("off");
      el.offlinePill.querySelector(".txt").textContent = "Chyba service workeru";
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  function quietPayload() {
    return {
      quiet: el.toggleQuiet.checked,
      quietFrom: el.quietFrom.value || "23:00",
      quietTo: el.quietTo.value || "07:00",
      tzOffsetMinutes: new Date().getTimezoneOffset()
    };
  }

  async function postJSON(path, body) {
    const res = await fetch(SERVER_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("server " + res.status);
    return res.json().catch(() => ({}));
  }

  async function subscribeHourly() {
    if (!swReg) throw new Error("service worker není připravený");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("permission-denied");

    let sub = await swReg.pushManager.getSubscription();
    if (!sub) {
      sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
      });
    }
    await postJSON("/api/subscribe", { subscription: sub.toJSON(), ...quietPayload() });
    return sub;
  }

  async function unsubscribeHourly() {
    if (!swReg) return;
    const sub = await swReg.pushManager.getSubscription();
    if (sub) {
      try { await postJSON("/api/unsubscribe", { endpoint: sub.endpoint }); } catch (_) {}
      await sub.unsubscribe();
    }
  }

  function setHourlyStatus(text) { el.hourlyStatus.textContent = text; }

  async function refreshHourlyUI() {
    if (!SERVER_READY) {
      el.toggleHourly.disabled = true;
      setHourlyStatus("Push server ještě není nastavený — viz README.md, sekce „Hodinové cinknutí“.");
      el.quietRow.style.display = "none";
      return;
    }
    if (!("PushManager" in window) || !("Notification" in window)) {
      el.toggleHourly.disabled = true;
      setHourlyStatus("Tento prohlížeč neumí push notifikace.");
      el.quietRow.style.display = "none";
      return;
    }
    const sub = swReg ? await swReg.pushManager.getSubscription() : null;
    el.toggleHourly.disabled = false;
    el.toggleHourly.checked = !!sub;
    el.quietRow.style.display = sub ? "flex" : "none";
    setHourlyStatus(sub
      ? "Zapnuto — tento telefon dostane cinknutí každou celou hodinu."
      : "Vypnuto — appka nebude posílat žádné notifikace.");
  }

  el.toggleHourly.addEventListener("change", async () => {
    el.toggleHourly.disabled = true;
    try {
      if (el.toggleHourly.checked) {
        await subscribeHourly();
        toast("Hodinové cinknutí zapnuto 🔔");
      } else {
        await unsubscribeHourly();
        toast("Hodinové cinknutí vypnuto");
      }
    } catch (err) {
      el.toggleHourly.checked = false;
      if (err && err.message === "permission-denied") {
        toast("Notifikace jsou zakázané — povol je v nastavení telefonu/prohlížeče.");
      } else {
        toast("Nepovedlo se zapnout — zkontroluj připojení / server.");
      }
    }
    el.toggleHourly.disabled = !SERVER_READY;
    await refreshHourlyUI();
  });

  [el.toggleQuiet, el.quietFrom, el.quietTo].forEach((input) => {
    input.addEventListener("change", async () => {
      el.quietTimes.style.opacity = el.toggleQuiet.checked ? "1" : "0.45";
      el.quietFrom.disabled = el.quietTo.disabled = !el.toggleQuiet.checked;
      if (!el.toggleHourly.checked) return;
      try {
        const sub = swReg && (await swReg.pushManager.getSubscription());
        if (sub) await postJSON("/api/subscribe", { subscription: sub.toJSON(), ...quietPayload() });
      } catch (_) { /* zkusí se to znovu při dalším zapnutí */ }
    });
  });

  function loadQuietPrefs() {
    const on = localStorage.getItem(LS_QUIET_ON);
    if (on !== null) el.toggleQuiet.checked = on === "1";
    const from = localStorage.getItem(LS_QUIET_FROM);
    const to = localStorage.getItem(LS_QUIET_TO);
    if (from) el.quietFrom.value = from;
    if (to) el.quietTo.value = to;
    el.quietTimes.style.opacity = el.toggleQuiet.checked ? "1" : "0.45";
    el.quietFrom.disabled = el.quietTo.disabled = !el.toggleQuiet.checked;
  }
  [el.toggleQuiet, el.quietFrom, el.quietTo].forEach((input) => {
    input.addEventListener("change", () => {
      localStorage.setItem(LS_QUIET_ON, el.toggleQuiet.checked ? "1" : "0");
      localStorage.setItem(LS_QUIET_FROM, el.quietFrom.value);
      localStorage.setItem(LS_QUIET_TO, el.quietTo.value);
    });
  });

  el.btnTest.addEventListener("click", async () => {
    chime();
    if (swReg && Notification.permission === "granted") {
      swReg.showNotification("🔔 Zkušební cinknutí", {
        body: "Takhle bude vypadat hodinové upozornění.",
        icon: "assets/icon-192.png",
        vibrate: [200, 100, 200]
      });
    }
    if (SERVER_READY && el.toggleHourly.checked && swReg) {
      try {
        const sub = await swReg.pushManager.getSubscription();
        if (sub) postJSON("/api/test", { endpoint: sub.endpoint }).catch(() => {});
      } catch (_) {}
    }
  });

  // ---- Kuchyňská minutka ---------------------------------------------
  let remainingMs = 0;
  let running = false;
  let intervalId = null;
  let lastTick = 0;

  function fmt(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function renderTimer() {
    el.timerDisplay.textContent = fmt(remainingMs);
    document.title = running ? `${fmt(remainingMs)} · Minutka` : "Hodinové cinknutí";
  }

  function setMinutes(min) {
    if (running) return;
    remainingMs = min * 60000;
    el.customMinutes.value = min;
    [...el.presets.children].forEach((c) => c.classList.toggle("active", Number(c.dataset.min) === min));
    renderTimer();
  }

  el.presets.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    setMinutes(Number(btn.dataset.min));
  });

  el.customMinutes.addEventListener("change", () => {
    const min = Math.min(180, Math.max(1, Number(el.customMinutes.value) || 1));
    el.customMinutes.value = min;
    [...el.presets.children].forEach((c) => c.classList.remove("active"));
    setMinutes(min);
  });

  function startTimer() {
    if (remainingMs <= 0) setMinutes(Number(el.customMinutes.value) || 10);
    if (remainingMs <= 0) return;
    running = true;
    lastTick = Date.now();
    el.btnStart.disabled = true;
    el.btnPause.disabled = false;
    el.btnReset.disabled = false;
    el.customMinutes.disabled = true;
    intervalId = setInterval(() => {
      const now = Date.now();
      remainingMs -= now - lastTick;
      lastTick = now;
      if (remainingMs <= 0) {
        remainingMs = 0;
        stopTimer();
        chime();
        if (swReg && Notification.permission === "granted") {
          swReg.showNotification("⏱️ Minutka doběhla!", {
            body: "Čas vypršel.",
            icon: "assets/icon-192.png",
            vibrate: [250, 100, 250, 100, 250]
          });
        }
        toast("Minutka doběhla! ⏱️");
      }
      renderTimer();
    }, 250);
  }

  function stopTimer() {
    running = false;
    clearInterval(intervalId);
    el.btnStart.disabled = false;
    el.btnPause.disabled = true;
  }

  el.btnStart.addEventListener("click", startTimer);
  el.btnPause.addEventListener("click", stopTimer);
  el.btnReset.addEventListener("click", () => {
    stopTimer();
    el.btnReset.disabled = true;
    el.customMinutes.disabled = false;
    setMinutes(Number(el.customMinutes.value) || 10);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && running) {
      remainingMs -= Date.now() - lastTick;
      lastTick = Date.now();
      renderTimer();
    }
  });

  // ---- Start ------------------------------------------------------------
  loadQuietPrefs();
  setMinutes(10);
  renderTimer();
  initSW().then(refreshHourlyUI);
})();
