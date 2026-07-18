// =====================================================================
//  AR — hledáček Slunce
//  Přes obraz z fotoaparátu a senzory telefonu ukáže, KAM a JAK VYSOKO
//  bude Slunce v daný okamžik zatmění. Pomáhá vybrat místo pozorování
//  podle nízké výšky Slunce nad obzorem.
// =====================================================================

(function () {
  const HFOV = 62;                 // odhad horizontálního zorného úhlu kamery (°)
  const shortest = (a) => ((((a % 360) + 540) % 360) - 180); // -180..180

  let root, video, grid, gctx, marker, arrow, readout, altInfo, stream, rafId;
  let orient = null;               // {heading, pitch} ze senzorů
  let headingOffset = 0;           // ruční kalibrace
  let target = null;               // {az, alt, label}
  let loc = null;
  let sensorState = "idle";        // idle | pending | granted | denied | unsupported | silent
  let manualMode = false;          // ruční ovládání, když kompas nefunguje/není povolen
  let manual = { heading: 0, pitch: 10 };
  let statusEl, enableBtn, manualBox;

  function h(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  }

  async function open(location) {
    loc = location;
    headingOffset = 0;
    orient = null; manualMode = false; smoothed = null;
    buildTargets(location);
    render();
    root.classList.add("show");
    document.body.style.overflow = "hidden";

    if (typeof DeviceOrientationEvent === "undefined") {
      sensorState = "unsupported";
    } else if (needsExplicitPermission()) {
      sensorState = "idle"; // čeká na tap „Povolit kompas"
    } else {
      sensorState = "pending";
      attachOrientListeners();
      setTimeout(() => { if (!orient) { sensorState = "silent"; updateStatus(); } }, 2500);
    }
    updateStatus();
    startCamera();
    loop();
  }

  function needsExplicitPermission() {
    return typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function";
  }

  function close() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("deviceorientation", onOrient, true);
    window.removeEventListener("deviceorientationabsolute", onOrient, true);
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (root) root.classList.remove("show");
    document.body.style.overflow = "";
  }

  // --- cílové časy (fáze zatmění) → poloha Slunce -------------------
  let targetOptions = [];
  function buildTargets(location) {
    const map = [
      { key: "c1", label: "Začátek zatmění", timeIdx: 0 },
      { key: "c2", label: "Začátek totality", timeIdx: 1 },
      { key: "max", label: "Maximální fáze", timeIdx: 2 },
      { key: "set", label: "Západ Slunce", timeIdx: 4 }
    ];
    // Přesné UTC okamžiky z konfigurace/eclipse dat: použijeme čas totality
    // z configu jako referenci a ostatní dopočítáme z rozdílu časových značek.
    const baseUTC = new Date(window.ECLIPSE_CONFIG.trip.totalityISO);
    const phases = location.phases;
    // převedeme "HH:MM:SS" na sekundy pro odečtení posunů vůči totalitě (index 1)
    const secs = phases.map((p) => {
      const [H, M, S] = p.time.split(":").map(Number);
      return H * 3600 + M * 60 + S;
    });
    const totalitySec = secs[1];
    targetOptions = map.map((m) => {
      const deltaSec = secs[m.timeIdx] - totalitySec;
      const when = new Date(baseUTC.getTime() + deltaSec * 1000);
      const pos = window.Sun.sunPosition(when, location.lat, location.lon);
      return {
        key: m.key,
        label: m.label,
        az: pos.azimuth,
        alt: pos.altitude,
        time: phases[m.timeIdx].time
      };
    });
    target = targetOptions[1]; // výchozí: začátek totality
  }

  // --- senzory ------------------------------------------------------
  // DŮLEŽITÉ (iOS): DeviceOrientationEvent.requestPermission() musí být
  // zavoláno přímo z dotykového gesta uživatele (tap na tlačítko), jinak
  // ho Safari potichu zamítne. Proto se volá samostatně z tlačítka
  // „Povolit kompas", ne automaticky po startu kamery.
  async function requestOrientation() {
    sensorState = "pending"; updateStatus();
    try {
      const p = await DeviceOrientationEvent.requestPermission();
      if (p === "granted") {
        sensorState = "granted"; updateStatus();
        attachOrientListeners();
        setTimeout(() => { if (!orient) { sensorState = "silent"; updateStatus(); } }, 2500);
      } else {
        sensorState = "denied"; updateStatus();
      }
    } catch (e) {
      sensorState = "denied"; updateStatus();
    }
  }

  // Na Androidu (Chrome) firing OBOU událostí "deviceorientation" a
  // "deviceorientationabsolute" pro stejný fyzický pohyb vracelo dvě mírně
  // odlišné hodnoty azimutu těsně po sobě → viditelné problikávání/skákání
  // mřížky. Proto se poslouchá jen JEDEN typ události — přesnější
  // "absolute", pokud ho prohlížeč nabízí.
  function attachOrientListeners() {
    if ("ondeviceorientationabsolute" in window) {
      window.addEventListener("deviceorientationabsolute", onOrient, true);
    } else {
      window.addEventListener("deviceorientation", onOrient, true);
    }
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      root.classList.remove("nocam");
    } catch (e) {
      root.classList.add("nocam");
    }
  }

  // Vyhlazení syrového signálu ze senzorů (exponenciální filtr) — bez
  // něj drobný šum kompasu způsobuje, že se mřížka a značka Slunce chvějí
  // i při klidně drženém telefonu.
  let smoothed = null; // {heading, pitch}
  const SMOOTH = 0.25;

  function onOrient(e) {
    let heading = null;
    if (typeof e.webkitCompassHeading === "number") {
      heading = e.webkitCompassHeading;            // iOS: přímo od severu
    } else if (typeof e.alpha === "number") {
      heading = (360 - e.alpha) % 360;             // Android
    }
    if (heading == null) return;
    // sklon: telefon svisle (kamera vpřed) → beta ≈ 90; výška = beta - 90
    const pitch = (e.beta != null ? e.beta : 90) - 90;

    if (!smoothed) {
      smoothed = { heading, pitch };
    } else {
      smoothed.heading = (smoothed.heading + shortest(heading - smoothed.heading) * SMOOTH + 360) % 360;
      smoothed.pitch += (pitch - smoothed.pitch) * SMOOTH;
    }
    orient = { heading: smoothed.heading, pitch: smoothed.pitch };
    sensorState = "granted";
    updateStatus();
  }

  function updateStatus() {
    if (!statusEl) return;
    const map = {
      idle: { t: "🧭 Kompas: čeká na povolení", cls: "" },
      pending: { t: "🧭 Kompas: zjišťuji…", cls: "" },
      granted: { t: "🧭 Kompas: aktivní", cls: "ok" },
      denied: { t: "🧭 Kompas: zamítnut — povol v Nastavení telefonu, nebo použij ruční režim níže", cls: "warn" },
      unsupported: { t: "🧭 Kompas: telefon ho nepodporuje — použij ruční režim níže", cls: "warn" },
      silent: { t: "🧭 Kompas neodpovídá (zkus pohnout telefonem do tvaru osmičky), nebo použij ruční režim níže", cls: "warn" }
    };
    const s = map[sensorState] || map.idle;
    statusEl.textContent = s.t;
    statusEl.className = "ar-sensor-status " + s.cls;
    if (enableBtn) enableBtn.style.display = (sensorState === "idle" || sensorState === "denied") ? "block" : "none";
    if (manualBox) manualBox.style.display = (manualMode || sensorState === "denied" || sensorState === "silent" || sensorState === "unsupported") ? "block" : "none";
  }

  // --- vykreslování překrytí ---------------------------------------
  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  const COMPASS = { 0: "S", 45: "SV", 90: "V", 135: "JV", 180: "J", 225: "JZ", 270: "Z", 315: "SZ" };

  function drawGrid(w, hgt, pxPerDeg, eff) {
    const dpr = window.devicePixelRatio || 1;
    if (grid.width !== Math.round(w * dpr)) { grid.width = Math.round(w * dpr); grid.height = Math.round(hgt * dpr); }
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.clearRect(0, 0, w, hgt);
    gctx.font = "12px system-ui, sans-serif";
    gctx.lineWidth = 1;

    const heading = eff.heading + headingOffset;

    // výškové kružnice (vodorovné čáry)
    for (let alt = -10; alt <= 70; alt += 10) {
      const y = hgt / 2 - (alt - eff.pitch) * pxPerDeg;
      if (y < 20 || y > hgt - 20) continue;
      const horizon = alt === 0;
      gctx.strokeStyle = horizon ? "rgba(255,214,107,0.85)" : "rgba(255,255,255,0.28)";
      gctx.lineWidth = horizon ? 2 : 1;
      gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(w, y); gctx.stroke();
      gctx.fillStyle = horizon ? "rgba(255,214,107,0.95)" : "rgba(255,255,255,0.7)";
      gctx.fillText(horizon ? "obzor 0°" : (alt > 0 ? "+" : "") + alt + "°", 8, y - 4);
    }

    // azimutové čáry (svislé), po 10°
    for (let a = 0; a < 360; a += 10) {
      const dx = shortest(a - heading);
      if (Math.abs(dx) > HFOV / 2 + 6) continue;
      const x = w / 2 + dx * pxPerDeg;
      const major = a % 90 === 0;
      gctx.strokeStyle = major ? "rgba(255,214,107,0.5)" : "rgba(255,255,255,0.18)";
      gctx.lineWidth = major ? 1.5 : 1;
      gctx.beginPath(); gctx.moveTo(x, 26); gctx.lineTo(x, hgt); gctx.stroke();
      gctx.fillStyle = "rgba(255,255,255,0.8)";
      gctx.textAlign = "center";
      gctx.fillText(a + "°", x, 20);
      if (COMPASS[a]) {
        gctx.fillStyle = a % 90 === 0 ? "rgba(255,214,107,0.95)" : "rgba(255,255,255,0.85)";
        gctx.font = "bold 15px system-ui, sans-serif";
        gctx.fillText(COMPASS[a], x, hgt / 2 + 5);
        gctx.font = "12px system-ui, sans-serif";
      }
      gctx.textAlign = "left";
    }
  }

  function effectiveOrient() {
    if (manualMode) return manual;
    return orient;
  }

  function draw() {
    if (!target) return;
    const w = root.clientWidth, hgt = root.clientHeight;
    const pxPerDeg = w / HFOV;
    readout.querySelector(".r-az").textContent =
      Math.round(target.az) + "° " + window.Sun.compassName(target.az);
    readout.querySelector(".r-alt").textContent = target.alt.toFixed(1) + "°";

    const eff = effectiveOrient();
    if (!eff) {
      marker.style.opacity = 0; arrow.style.display = "none";
      if (grid.width) gctx.clearRect(0, 0, grid.width, grid.height);
      return;
    }

    drawGrid(w, hgt, pxPerDeg, eff);

    const dAz = shortest(target.az - (eff.heading + headingOffset));
    const dAlt = target.alt - eff.pitch;
    const x = w / 2 + dAz * pxPerDeg;
    const y = hgt / 2 - dAlt * pxPerDeg;

    const onScreen = x > 20 && x < w - 20 && y > 60 && y < hgt - 120;
    marker.style.opacity = onScreen ? 1 : 0.25;
    marker.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    marker.querySelector(".ar-sun-lbl").textContent =
      "výška " + target.alt.toFixed(1) + "° · " + Math.round(target.az) + "°";

    // navigační šipka, když je cíl mimo obraz
    if (!onScreen) {
      arrow.style.display = "flex";
      let dir = "";
      if (dAz > 3) dir = "Otoč se doprava →";
      else if (dAz < -3) dir = "← Otoč se doleva";
      else if (dAlt > 3) dir = "↑ Zvedni telefon";
      else if (dAlt < -3) dir = "↓ Skloň telefon";
      arrow.textContent = dir;
    } else {
      arrow.style.display = "none";
    }
  }

  // --- UI -----------------------------------------------------------
  function render() {
    if (root) root.remove();
    root = h("div", "ar-root");
    video = h("video");
    video.setAttribute("playsinline", "");
    video.muted = true;
    root.appendChild(video);

    const scrim = h("div", "ar-scrim");
    root.appendChild(scrim);

    // azimutová / výšková mřížka (kreslí se na canvas)
    grid = h("canvas", "ar-grid");
    root.appendChild(grid);
    gctx = grid.getContext("2d");

    marker = h("div", "ar-sun", '<div class="ar-sun-ring"></div><div class="ar-sun-lbl"></div>');
    root.appendChild(marker);

    arrow = h("div", "ar-arrow");
    root.appendChild(arrow);

    // horní lišta
    const top = h("div", "ar-top");
    top.appendChild(h("div", "ar-title", "🌞 Hledáček Slunce — " + loc.name));
    const closeBtn = h("button", "ar-x", "✕");
    closeBtn.onclick = close;
    top.appendChild(closeBtn);
    root.appendChild(top);

    // spodní panel
    const bottom = h("div", "ar-bottom");

    const tabs = h("div", "ar-times");
    targetOptions.forEach((o) => {
      const b = h("button", o === target ? "sel" : "", o.label + "<span>" + o.time + "</span>");
      b.onclick = () => {
        target = o;
        [...tabs.children].forEach((c) => c.classList.remove("sel"));
        b.classList.add("sel");
      };
      tabs.appendChild(b);
    });
    bottom.appendChild(tabs);

    readout = h("div", "ar-readout",
      '<div><span class="k">Azimut</span><span class="r-az">—</span></div>' +
      '<div><span class="k">Výška</span><span class="r-alt">—</span></div>');
    bottom.appendChild(readout);

    // kalibrace
    const cal = h("div", "ar-cal");
    cal.innerHTML = '<span>Kalibrace</span>';
    const minus = h("button", null, "−5°");
    const plus = h("button", null, "+5°");
    minus.onclick = () => (headingOffset -= 5);
    plus.onclick = () => (headingOffset += 5);
    cal.appendChild(minus); cal.appendChild(plus);
    bottom.appendChild(cal);

    // stav senzorů + tlačítko na explicitní povolení (nutné na iPhonu)
    statusEl = h("div", "ar-sensor-status", "");
    bottom.appendChild(statusEl);

    enableBtn = h("button", "ar-enable", "🧭 Povolit kompas a náklon");
    enableBtn.style.display = "none";
    enableBtn.onclick = () => {
      if (needsExplicitPermission()) requestOrientation();
      else { attachOrientListeners(); sensorState = "pending"; updateStatus(); }
    };
    bottom.appendChild(enableBtn);

    // ruční záložní režim (kompas nedostupný / nespolehlivý)
    manualBox = h("div", "ar-manual");
    manualBox.style.display = "none";
    manualBox.innerHTML = `
      <label class="ar-manual-toggle">
        <input type="checkbox" id="manualToggle"> Ruční nastavení (bez kompasu)
      </label>
      <div class="ar-manual-row">
        <span>Azimut</span>
        <input type="range" id="manualAz" min="0" max="359" value="${manual.heading}">
        <b id="manualAzVal">${manual.heading}°</b>
      </div>
      <div class="ar-manual-row">
        <span>Náklon</span>
        <input type="range" id="manualPitch" min="-20" max="80" value="${manual.pitch}">
        <b id="manualPitchVal">${manual.pitch}°</b>
      </div>
      <div class="install-hint" style="text-align:left;margin-top:4px">
        Zjisti si sever (kompas v jiné appce) a nastav azimut ručně, nebo prostě posouvej,
        dokud značka nesedí na skutečné Slunce.
      </div>`;
    bottom.appendChild(manualBox);

    manualBox.querySelector("#manualToggle").onchange = (e) => { manualMode = e.target.checked; };
    manualBox.querySelector("#manualAz").oninput = (e) => {
      manual.heading = +e.target.value;
      manualBox.querySelector("#manualAzVal").textContent = manual.heading + "°";
      manualBox.querySelector("#manualToggle").checked = true; manualMode = true;
    };
    manualBox.querySelector("#manualPitch").oninput = (e) => {
      manual.pitch = +e.target.value;
      manualBox.querySelector("#manualPitchVal").textContent = manual.pitch + "°";
      manualBox.querySelector("#manualToggle").checked = true; manualMode = true;
    };

    altInfo = h("div", "ar-note",
      "Namiř telefon na západní obzor. Značka ukazuje polohu Slunce v daný okamžik. " +
      "Zkontroluj, jestli výhled ve výšce Slunce neblokují kopce nebo budovy.");
    bottom.appendChild(altInfo);

    root.appendChild(bottom);
    document.body.appendChild(root);
  }

  window.AR = { open, close };
})();
