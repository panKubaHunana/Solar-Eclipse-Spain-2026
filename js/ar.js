// =====================================================================
//  AR — hledáček Slunce
//  Přes obraz z fotoaparátu a senzory telefonu ukáže, KAM a JAK VYSOKO
//  bude Slunce v daný okamžik zatmění. Pomáhá vybrat místo pozorování
//  podle nízké výšky Slunce nad obzorem.
// =====================================================================

(function () {
  const HFOV = 62;                 // odhad horizontálního zorného úhlu kamery (°)
  const shortest = (a) => ((((a % 360) + 540) % 360) - 180); // -180..180

  let root, video, marker, arrow, readout, altInfo, stream, rafId;
  let orient = null;               // {heading, pitch}
  let headingOffset = 0;           // ruční kalibrace
  let target = null;               // {az, alt, label}
  let loc = null;

  function h(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  }

  async function open(location) {
    loc = location;
    headingOffset = 0;
    buildTargets(location);
    render();
    root.classList.add("show");
    document.body.style.overflow = "hidden";
    await startSensors();
    loop();
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
  async function startSensors() {
    // kamera
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
    // orientace
    try {
      if (typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function") {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p !== "granted") throw new Error("orientace zamítnuta");
      }
      window.addEventListener("deviceorientationabsolute", onOrient, true);
      window.addEventListener("deviceorientation", onOrient, true);
    } catch (e) {
      root.classList.add("noorient");
    }
  }

  function onOrient(e) {
    let heading = null;
    if (typeof e.webkitCompassHeading === "number") {
      heading = e.webkitCompassHeading;            // iOS: přímo od severu
    } else if (e.absolute && typeof e.alpha === "number") {
      heading = (360 - e.alpha) % 360;             // Android absolute
    } else if (typeof e.alpha === "number") {
      heading = (360 - e.alpha) % 360;
    }
    if (heading == null) return;
    // sklon: telefon svisle (kamera vpřed) → beta ≈ 90; výška = beta - 90
    const pitch = (e.beta != null ? e.beta : 90) - 90;
    orient = { heading, pitch };
    root.classList.remove("noorient");
  }

  // --- vykreslování překrytí ---------------------------------------
  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function draw() {
    if (!target) return;
    const w = root.clientWidth, hgt = root.clientHeight;
    const pxPerDeg = w / HFOV;
    readout.querySelector(".r-az").textContent =
      Math.round(target.az) + "° " + window.Sun.compassName(target.az);
    readout.querySelector(".r-alt").textContent = target.alt.toFixed(1) + "°";

    if (!orient) { marker.style.opacity = 0; arrow.style.display = "none"; return; }

    const dAz = shortest(target.az - (orient.heading + headingOffset));
    const dAlt = target.alt - orient.pitch;
    const x = w / 2 + dAz * pxPerDeg;
    const y = hgt / 2 - dAlt * pxPerDeg;

    const onScreen = x > 20 && x < w - 20 && y > 60 && y < hgt - 120;
    marker.style.opacity = onScreen ? 1 : 0.25;
    marker.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

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

    // horizont + výškové rysky
    const horizon = h("div", "ar-horizon");
    root.appendChild(horizon);

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

    altInfo = h("div", "ar-note",
      "Namiř telefon na západní obzor. Značka ukazuje polohu Slunce v daný okamžik. " +
      "Zkontroluj, jestli výhled ve výšce Slunce neblokují kopce nebo budovy.");
    bottom.appendChild(altInfo);

    const fbNote = h("div", "ar-fallback",
      "Kamera nebo senzory nejsou dostupné — použij azimut a výšku výše a namiř podle kompasu. " +
      "Na iPhonu je potřeba povolit přístup k pohybu a kameře.");
    bottom.appendChild(fbNote);

    root.appendChild(bottom);
    document.body.appendChild(root);
  }

  window.AR = { open, close };
})();
