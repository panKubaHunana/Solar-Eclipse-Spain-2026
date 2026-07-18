// =====================================================================
//  Views — jednotlivé obrazovky aplikace
// =====================================================================

const Views = {};

// ---- Sdílený widget počasí ------------------------------------------
async function weatherWidget(container, lat, lon, place, showDays) {
  container.innerHTML = `<div class="wx-err">Načítám počasí…</div>`;
  try {
    const w = await Weather.getWeather(lat, lon);
    const [ic, lbl] = Weather.wmo(w.current.code);
    let html =
      `<div class="wx">
        <div class="big">${ic}</div>
        <div>
          <div class="place">${UI.esc(place)}</div>
          <div class="t">${w.current.temp}°C</div>
          <div class="meta">${lbl} · oblačnost <b>${w.current.clouds}%</b> · vítr ${w.current.wind} km/h</div>
        </div>
      </div>`;
    if (showDays && w.daily.length) {
      html += `<div class="wx-days">` + w.daily.slice(0, 10).map((d) => {
        const [di] = Weather.wmo(d.code);
        const dt = new Date(d.date + "T12:00");
        const nm = dt.toLocaleDateString("cs-CZ", { weekday: "short" });
        const day = dt.getDate() + ".";
        const ecl = d.date === "2026-08-12" ? " ecl" : "";
        return `<div class="wx-day${ecl}">
          <div class="d">${nm} ${day}</div>
          <div class="i">${di}</div>
          <div class="tt">${d.tmax}°</div>
          <div class="cl">${d.clouds != null ? "☁ " + d.clouds + "%" : ""}</div>
        </div>`;
      }).join("") + `</div>`;
    }
    if (w._cached) html += `<div class="wx-err" style="margin-top:8px">Offline — poslední známé počasí.</div>`;
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="wx-err">Počasí se nepodařilo načíst (offline?).</div>`;
  }
}

// =====================================================================
//  HOME
// =====================================================================
Views.home = async function (el) {
  const install = window.canInstall()
    ? `<button class="btn gold block" id="installBtn">📲 Nainstalovat do telefonu</button>`
    : `<div class="install-hint">Tip: v prohlížeči zvol „Přidat na plochu" a měj kroniku jako aplikaci.</div>`;

  el.innerHTML = `
    <div class="cover"><img src="assets/cover.jpg" alt="Solar Eclipse Spain 2026"></div>

    <div class="card countdown" id="homeCd">
      <div class="lead">Do začátku úplného zatmění v Sorii</div>
      <div class="cd-grid" id="homeCdGrid"></div>
      <div class="install-hint" style="margin-top:12px">Maximální fáze potrvá <b>1 min 41 s</b> · 12. 8. 2026, 20:29 místního času</div>
    </div>

    <div style="margin:14px 0">${install}</div>

    <div class="card" id="homeWx"></div>
    ${UI.rule()}

    <div class="tiles">
      <a class="tile" href="#/itinerar"><span class="ic">📅</span><span class="t">Itinerář</span><span class="d">7 dní hodinu po hodině</span></a>
      <a class="tile" href="#/denik"><span class="ic">📖</span><span class="t">Deník</span><span class="d">Naše společné zápisky</span></a>
      <a class="tile" href="#/fotky"><span class="ic">📸</span><span class="t">Fotky</span><span class="d">Vzpomínkové album</span></a>
      <a class="tile" href="#/zatmeni"><span class="ic">🌒</span><span class="t">Zatmění</span><span class="d">Časy, počasí, AR hledáček</span></a>
      <a class="tile" href="#/plan/mapa"><span class="ic">🗺️</span><span class="t">Mapa cesty</span><span class="d">Naše trasa Španělskem</span></a>
      <a class="tile" href="#/plan"><span class="ic">📋</span><span class="t">Plán & vše ostatní</span><span class="d">Checklist, rozpočet, info</span></a>
    </div>

    <a class="card keepsake" href="#/tisk">
      <span class="ic">🖨️</span>
      <div>
        <div class="t">Kronika k tisku</div>
        <div class="d">Až se vrátíme, vytiskneme celý deník na památku 📖</div>
      </div>
      <span class="arr">→</span>
    </a>

    ${UI.quote("Sbaleno a připraveno na vše, co přinese zítřek.")}
  `;

  const grid = el.querySelector("#homeCdGrid");
  const paint = () => {
    const p = window.cdParts(window.TOTALITY);
    const cell = (n, u) => `<div class="cd-cell"><div class="n">${String(n).padStart(2, "0")}</div><div class="u">${u}</div></div>`;
    if (p.past) {
      el.querySelector("#homeCd").classList.add("done");
      grid.innerHTML = `<div class="cd-cell"><div class="n">🌑</div><div class="u">Je čas!</div></div>`;
    } else {
      grid.innerHTML = cell(p.d, "dní") + cell(p.h, "hodin") + cell(p.m, "minut") + cell(p.s, "sekund");
    }
  };
  paint();
  const iv = setInterval(() => { if (!document.body.contains(grid)) return clearInterval(iv); paint(); }, 1000);

  const ib = el.querySelector("#installBtn");
  if (ib) ib.onclick = () => window.promptInstall();

  weatherWidget(el.querySelector("#homeWx"), 41.7637, -2.8147, "Soria — místo pozorování", true);
};

// =====================================================================
//  DENÍK
// =====================================================================
Views.denik = async function (el) {
  const moods = ["😍", "🤩", "😌", "😂", "🚗", "🌄", "🍷", "😴", "🥵", "🌧️"];
  let mood = "", photo = "";

  el.innerHTML = `
    <div class="page-title">Deník</div>
    <div class="page-sub">Naše společná kronika</div>

    <div class="card">
      <span class="label">Nový zápis — píše ${UI.me().name}</span>
      <input id="dPlace" placeholder="Kde jsme? (např. Soria, Pyreneje…)">
      <div class="mood-picker" id="dMoods">${moods.map((m) => `<button data-m="${m}">${m}</button>`).join("")}</div>
      <textarea id="dText" placeholder="Co se stalo? Jak nám bylo?"></textarea>
      <div class="photo-input">
        <label class="btn ghost sm">📷 Přidat fotku<input type="file" accept="image/*" id="dPhoto" hidden></label>
        <img class="thumb" id="dThumb" style="display:none">
      </div>
      <button class="btn block" id="dSave">Uložit zápis</button>
    </div>

    <div id="dList" style="margin-top:18px"></div>
    ${UI.quote("Žij tak, abys jednou vyprávěl příběh, který bude stát za to.")}
  `;

  el.querySelector("#dMoods").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    [...e.currentTarget.children].forEach((c) => c.classList.remove("sel"));
    b.classList.add("sel"); mood = b.dataset.m;
  });

  const thumb = el.querySelector("#dThumb");
  el.querySelector("#dPhoto").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    photo = await UI.fileToDataURL(f);
    thumb.src = photo; thumb.style.display = "block";
  });

  el.querySelector("#dSave").onclick = async () => {
    const text = el.querySelector("#dText").value.trim();
    const place = el.querySelector("#dPlace").value.trim();
    if (!text && !photo) { UI.toast("Napiš pár slov nebo přidej fotku"); return; }
    await Store.add("diary", { author: UI.me().id, place, mood, text, image: photo });
    UI.toast("Uloženo ✓");
    mood = ""; photo = "";
    renderList();
    el.querySelector("#dText").value = ""; el.querySelector("#dPlace").value = "";
    thumb.style.display = "none";
    [...el.querySelectorAll("#dMoods button")].forEach((c) => c.classList.remove("sel"));
  };

  async function renderList() {
    const list = (await Store.list("diary")).slice().reverse();
    const box = el.querySelector("#dList");
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="ic">📖</div><p>Zatím prázdno.<br>První zápis napíšeme cestou. ✍️</p></div>`;
      return;
    }
    box.innerHTML = `<div class="timeline">` + list.map((e) => {
      const a = UI.traveler(e.author);
      return `<article class="entry">
        ${e.image ? `<img class="photo" src="${e.image}" alt="">` : ""}
        <div class="body">
          <button class="del" data-del="${e.id}">smazat</button>
          <div class="meta">
            <span class="author"><span class="dot" style="background:${a.color}"></span>${UI.esc(a.name)}</span>
            <span>${UI.fmtDateTime(e.ts)}</span>
            ${e.place ? `<span class="place">${UI.esc(e.place)}</span>` : ""}
            ${e.mood ? `<span class="mood">${e.mood}</span>` : ""}
          </div>
          ${e.text ? `<div class="text">${UI.esc(e.text)}</div>` : ""}
        </div>
      </article>`;
    }).join("") + `</div>`;

    box.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm("Smazat tento zápis?")) return;
        await Store.remove("diary", b.dataset.del);
        renderList();
      };
    });
  }
  renderList();
};

// =====================================================================
//  FOTKY
// =====================================================================
Views.fotky = async function (el) {
  el.innerHTML = `
    <div class="page-title">Fotoalbum</div>
    <div class="page-sub">Vzpomínky z cesty</div>
    <div class="btn-row" style="margin-bottom:16px">
      <label class="btn gold block">📷 Přidat fotku<input type="file" accept="image/*" id="fInput" hidden></label>
    </div>
    <div id="fGrid"></div>
    ${UI.quote("Cesty nejsou jen o kilometrech, ale o momentech, které si pamatuješ.")}
  `;

  el.querySelector("#fInput").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = await UI.fileToDataURL(f);
    const cap = prompt("Popisek (nepovinné):") || "";
    await Store.add("photos", { author: UI.me().id, caption: cap, image: img });
    UI.toast("Přidáno ✓");
    render();
  });

  async function render() {
    const photos = await Store.list("photos");
    const diary = (await Store.list("diary")).filter((d) => d.image)
      .map((d) => ({ id: d.id, ts: d.ts, author: d.author, caption: d.place || "", image: d.image, fromDiary: true }));
    const all = photos.concat(diary).sort((a, b) => b.ts - a.ts);
    const grid = el.querySelector("#fGrid");
    if (!all.length) {
      grid.innerHTML = `<div class="empty"><div class="ic">📸</div><p>Album je zatím prázdné.<br>Přidej první fotku! 🌅</p></div>`;
      return;
    }
    grid.innerHTML = `<div class="album">` + all.map((p) => {
      const a = UI.traveler(p.author);
      return `<div class="cell" data-id="${p.id}" data-diary="${p.fromDiary ? 1 : 0}">
        <img src="${p.image}" alt="">
        <div class="cap"><span class="a">${UI.esc(a.name)}</span>${p.caption ? " · " + UI.esc(p.caption) : ""}</div>
      </div>`;
    }).join("") + `</div>`;

    grid.querySelectorAll(".cell").forEach((c) => {
      c.onclick = async () => {
        if (c.dataset.diary === "1") { UI.toast("Fotku z deníku smažeš v Deníku"); return; }
        if (!confirm("Smazat fotku z alba?")) return;
        await Store.remove("photos", c.dataset.id);
        render();
      };
    });
  }
  render();
};

// =====================================================================
//  PLÁN (rozcestník)
// =====================================================================
Views.plan = async function (el) {
  el.innerHTML = `
    <div class="page-title">Plán cesty</div>
    <div class="page-sub">Vše na jednom místě</div>
    <div class="tiles">
      <a class="tile" href="#/itinerar"><span class="ic">📅</span><span class="t">Itinerář</span><span class="d">7 dní hodinu po hodině</span></a>
      <a class="tile" href="#/plan/checklist"><span class="ic">🎒</span><span class="t">Checklist</span><span class="d">Seznam zavazadel k odškrtání</span></a>
      <a class="tile" href="#/plan/mapa"><span class="ic">🗺️</span><span class="t">Mapa naší cesty</span><span class="d">Města a kilometry</span></a>
      <a class="tile" href="#/plan/trasa"><span class="ic">🧭</span><span class="t">Trasa</span><span class="d">Den · odkud–kam · km</span></a>
      <a class="tile" href="#/plan/rozpocet"><span class="ic">💰</span><span class="t">Rozpočet</span><span class="d">Odhad vs. skutečnost</span></a>
      <a class="tile" href="#/plan/doprava"><span class="ic">🚗</span><span class="t">Doprava & ubytování</span><span class="d">Lety, auto, kde spíme</span></a>
      <a class="tile" href="#/plan/fakta"><span class="ic">📌</span><span class="t">Základní fakta</span><span class="d">Mise, obavy, co nesmíme minout</span></a>
      <a class="tile" href="#/plan/info"><span class="ic">ℹ️</span><span class="t">Info & bezpečnost</span><span class="d">Tísňová čísla, foto plán, aplikace</span></a>
      <a class="tile" href="#/tisk"><span class="ic">🖨️</span><span class="t">Kronika k tisku</span><span class="d">Vytisknout deník na památku</span></a>
    </div>
    ${UI.quote("Dobrodružství začíná tam, kde končí tvá komfortní zóna.")}
  `;
};

// ---- Pomocník: autosave dokumentového formuláře ----------------------
function bindDocForm(el, docName, hintSel) {
  const inputs = el.querySelectorAll("[data-f]");
  const save = UI.debounce(async () => {
    const obj = {};
    inputs.forEach((i) => (obj[i.dataset.f] = i.value));
    await Store.setDoc(docName, obj);
    const hint = el.querySelector(hintSel);
    if (hint) { hint.textContent = "Uloženo ✓"; hint.style.opacity = 1; setTimeout(() => (hint.style.opacity = 0), 1200); }
  }, 500);
  inputs.forEach((i) => i.addEventListener("input", save));
}

// =====================================================================
//  ZÁKLADNÍ FAKTA
// =====================================================================
Views.fakta = async function (el) {
  const d = Object.assign({}, window.TRIP.facts, await Store.getDoc("basics"));
  el.innerHTML = `
    <a class="back" href="#/plan">← Plán</a>
    <div class="page-title">Základní fakta</div>
    <div class="saved-hint" id="h"></div>
    <div class="card">
      <div class="field-2">
        <div><span class="label">Datum</span><input data-f="datum" value="${UI.esc(d.datum || "10.–16. 8. 2026")}"></div>
        <div><span class="label">Lokalita</span><input data-f="lokalita" value="${UI.esc(d.lokalita || "Španělsko — okolí Sorie")}"></div>
      </div>
      <span class="label">Hlavní mise cesty</span>
      <input data-f="mise" value="${UI.esc(d.mise || "Pozorovat úplné zatmění Slunce")}">
      <span class="label">Nejvíc se těšíme</span>
      <textarea data-f="tesime">${UI.esc(d.tesime || "")}</textarea>
      <span class="label">Největší výzva</span>
      <textarea data-f="vyzva">${UI.esc(d.vyzva || "")}</textarea>
      <span class="label">Nesmíme minout</span>
      <textarea data-f="minout">${UI.esc(d.minout || "")}</textarea>
      <span class="label">Z čeho máme obavy</span>
      <textarea data-f="obavy">${UI.esc(d.obavy || "")}</textarea>
    </div>
    ${UI.quote("Žij tak, abys jednou vyprávěl příběh, který bude stát za to.")}
  `;
  bindDocForm(el, "basics", "#h");
};

// =====================================================================
//  DOPRAVA & UBYTOVÁNÍ
// =====================================================================
Views.doprava = async function (el) {
  const d = Object.assign({}, window.TRIP.transport, await Store.getDoc("travelDetails"));
  el.innerHTML = `
    <a class="back" href="#/plan">← Plán</a>
    <div class="page-title">Doprava & ubytování</div>
    <div class="saved-hint" id="h"></div>
    <div class="card">
      <div class="field-2">
        <div><span class="label">Plánovaná doba cesty</span><input data-f="doba" value="${UI.esc(d.doba || "7 dní")}"></div>
        <div><span class="label">Lokalita</span><input data-f="lokalita" value="${UI.esc(d.lokalita || "Španělsko")}"></div>
      </div>
      <div class="field-2">
        <div><span class="label">Přílet</span><input data-f="prilet" value="${UI.esc(d.prilet || "10. 8. 2026")}"></div>
        <div><span class="label">Odlet</span><input data-f="odlet" value="${UI.esc(d.odlet || "")}"></div>
      </div>
      <span class="label">Dopravní prostředky</span>
      <textarea data-f="doprava" placeholder="Letadlo, půjčené auto…">${UI.esc(d.doprava || "")}</textarea>
      <span class="label">Ubytování</span>
      <textarea data-f="ubytovani" placeholder="Kde spíme jednotlivé noci…">${UI.esc(d.ubytovani || "")}</textarea>
      <span class="label">Trasa</span>
      <textarea data-f="trasa" placeholder="Hlavní zastávky trasy…">${UI.esc(d.trasa || "")}</textarea>
    </div>
    ${UI.quote("Dobrodružství začíná tam, kde končí tvá komfortní zóna.")}
  `;
  bindDocForm(el, "travelDetails", "#h");
};

// =====================================================================
//  ROZPOČET
// =====================================================================
Views.rozpocet = async function (el) {
  const def = {
    odhad: "35000", zaplaceno: "",
    rows: window.TRIP.budgetRows.map((r) => Object.assign({}, r))
  };
  const d = Object.assign({}, def, await Store.getDoc("budget"));
  if (!d.rows || !d.rows.length) d.rows = def.rows;

  const num = (v) => parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

  function draw() {
    const totEst = d.rows.reduce((s, r) => s + num(r.est), 0);
    const totReal = d.rows.reduce((s, r) => s + num(r.real), 0);
    el.innerHTML = `
      <a class="back" href="#/plan">← Plán</a>
      <div class="page-title">Rozpočet</div>
      <div class="page-sub">pro 2 osoby</div>
      <div class="saved-hint" id="h"></div>
      <div class="card">
        <div class="budget-top">
          <div><span class="label">Odhadovaný rozpočet</span><input id="odhad" value="${UI.esc(d.odhad)}" placeholder="€"></div>
          <div><span class="label">Celkem zaplaceno</span><input id="zaplaceno" value="${UI.esc(d.zaplaceno)}" placeholder="€"></div>
        </div>
        <table class="tbl">
          <thead><tr><th>Kategorie</th><th class="num">Odhad</th><th class="num">Skutečnost</th><th></th></tr></thead>
          <tbody>
            ${d.rows.map((r, i) => `<tr>
              <td><input data-i="${i}" data-k="cat" value="${UI.esc(r.cat)}"></td>
              <td class="num"><input class="num" data-i="${i}" data-k="est" value="${UI.esc(r.est)}" inputmode="decimal"></td>
              <td class="num"><input class="num" data-i="${i}" data-k="real" value="${UI.esc(r.real)}" inputmode="decimal"></td>
              <td><button class="row-del" data-del="${i}">✕</button></td>
            </tr>`).join("")}
          </tbody>
          <tfoot><tr><td>Celkem</td><td class="num">${totEst ? totEst.toLocaleString("cs-CZ") : "—"}</td><td class="num">${totReal ? totReal.toLocaleString("cs-CZ") : "—"}</td><td></td></tr></tfoot>
        </table>
        <div class="btn-row"><button class="btn ghost sm" id="addRow">+ Přidat řádek</button></div>
        <div class="install-hint" style="margin-top:10px;text-align:left">${window.TRIP.budgetNote}</div>
      </div>
      ${UI.quote("Cestování je jediná věc, kterou si koupíte, a díky které jste bohatší.")}
    `;

    const save = UI.debounce(async () => {
      await Store.setDoc("budget", d);
      const h = el.querySelector("#h"); h.textContent = "Uloženo ✓"; h.style.opacity = 1; setTimeout(() => (h.style.opacity = 0), 1200);
    }, 500);

    el.querySelector("#odhad").addEventListener("input", (e) => { d.odhad = e.target.value; save(); });
    el.querySelector("#zaplaceno").addEventListener("input", (e) => { d.zaplaceno = e.target.value; save(); });
    el.querySelectorAll("[data-k]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        d.rows[+e.target.dataset.i][e.target.dataset.k] = e.target.value;
        save();
        if (e.target.dataset.k !== "cat") updateTotals();
      });
    });
    function updateTotals() {
      const te = d.rows.reduce((s, r) => s + num(r.est), 0);
      const tr = d.rows.reduce((s, r) => s + num(r.real), 0);
      const cells = el.querySelectorAll("tfoot td");
      cells[1].textContent = te ? te.toLocaleString("cs-CZ") : "—";
      cells[2].textContent = tr ? tr.toLocaleString("cs-CZ") : "—";
    }
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      d.rows.splice(+b.dataset.del, 1); save(); draw();
    });
    el.querySelector("#addRow").onclick = () => { d.rows.push({ cat: "", est: "", real: "" }); save(); draw(); };
  }
  draw();
};

// =====================================================================
//  TRASA
// =====================================================================
Views.trasa = async function (el) {
  const d = Object.assign({ rows: [] }, await Store.getDoc("route"));
  if (!d.rows) d.rows = [];
  const num = (v) => parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

  function draw() {
    const totKm = d.rows.reduce((s, r) => s + num(r.dist), 0);
    el.innerHTML = `
      <a class="back" href="#/plan">← Plán</a>
      <div class="page-title">Trasa — přehled</div>
      <div class="saved-hint" id="h"></div>
      <div class="card">
        <table class="tbl">
          <thead><tr><th>Den</th><th>Odkud–kam</th><th>Prostředek</th><th class="num">km</th><th></th></tr></thead>
          <tbody>
            ${d.rows.map((r, i) => `<tr>
              <td style="width:44px"><input data-i="${i}" data-k="day" value="${UI.esc(r.day || "")}"></td>
              <td><input data-i="${i}" data-k="fromto" value="${UI.esc(r.fromto || "")}"></td>
              <td style="width:90px"><input data-i="${i}" data-k="mode" value="${UI.esc(r.mode || "")}"></td>
              <td class="num" style="width:60px"><input class="num" data-i="${i}" data-k="dist" value="${UI.esc(r.dist || "")}" inputmode="decimal"></td>
              <td><button class="row-del" data-del="${i}">✕</button></td>
            </tr>`).join("")}
          </tbody>
          <tfoot><tr><td colspan="3">Celkem</td><td class="num">${totKm ? totKm.toLocaleString("cs-CZ") + " km" : "—"}</td><td></td></tr></tfoot>
        </table>
        <div class="btn-row"><button class="btn ghost sm" id="addRow">+ Přidat etapu</button></div>
      </div>
      ${UI.quote("Život je buď odvážné dobrodružství, nebo nic.")}
    `;
    const save = UI.debounce(async () => {
      await Store.setDoc("route", d);
      const h = el.querySelector("#h"); h.textContent = "Uloženo ✓"; h.style.opacity = 1; setTimeout(() => (h.style.opacity = 0), 1200);
    }, 500);
    el.querySelectorAll("[data-k]").forEach((inp) => inp.addEventListener("input", (e) => {
      d.rows[+e.target.dataset.i][e.target.dataset.k] = e.target.value; save();
      if (e.target.dataset.k === "dist") {
        const t = d.rows.reduce((s, r) => s + num(r.dist), 0);
        el.querySelector("tfoot .num").textContent = t ? t.toLocaleString("cs-CZ") + " km" : "—";
      }
    }));
    el.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { d.rows.splice(+b.dataset.del, 1); save(); draw(); });
    el.querySelector("#addRow").onclick = () => { d.rows.push({ day: "", fromto: "", mode: "", dist: "" }); save(); draw(); };
  }
  if (!d.rows.length) d.rows = window.TRIP.route.map((r) => Object.assign({}, r));
  draw();
};

// =====================================================================
//  MAPA
// =====================================================================
const SPAIN_PATH = "M58.8 47.7 L147.1 57.2 L279.4 57.2 L375.0 76.3 L485.3 66.7 L573.5 76.3 L691.2 85.8 L757.4 143.0 L816.2 162.1 L941.2 171.6 L860.3 276.5 L772.1 305.1 L750.0 352.8 L705.9 400.5 L683.8 457.7 L691.2 514.9 L669.1 562.6 L647.1 629.3 L588.2 667.4 L551.5 705.6 L433.8 715.1 L382.4 715.1 L308.8 772.3 L272.1 762.8 L242.6 724.7 L235.3 677.0 L161.8 667.4 L154.4 600.7 L191.2 591.2 L191.2 505.3 L169.1 448.1 L191.2 381.4 L205.9 305.1 L102.9 219.3 L51.5 219.3 L44.1 152.6 L58.8 114.4 L29.4 95.3 L58.8 47.7 Z";
const CITIES = [
  { n: "Canfranc", x: 667.5, y: 141.8 },
  { n: "Burgos", x: 433.8, y: 177.5, ecl: true },
  { n: "Soria", x: 498.9, y: 232.3, ecl: true },
  { n: "Zaragoza", x: 640.5, y: 243.3 },
  { n: "Madrid", x: 433.5, y: 360.7 },
  { n: "Valencia", x: 678.2, y: 451.0 }
];

Views.mapa = async function (el) {
  const d = Object.assign({ rows: [] }, await Store.getDoc("mapkm"));
  if (!d.rows) d.rows = [];

  el.innerHTML = `
    <a class="back" href="#/plan">← Plán</a>
    <div class="page-title">Mapa naší cesty</div>
    <div class="page-sub">Španělsko 2026</div>
    <div class="card map-wrap">
      <svg viewBox="0 0 1000 820" xmlns="http://www.w3.org/2000/svg">
        <path d="${SPAIN_PATH}" fill="rgba(160,130,80,0.14)" stroke="#20262e" stroke-width="3" stroke-linejoin="round"/>
        ${CITIES.map((c) => `<g class="map-city${c.ecl ? " eclipse" : ""}">
            <circle cx="${c.x}" cy="${c.y}" r="9"></circle>
            <text x="${c.x + 15}" y="${c.y + 5}">${c.n}</text>
          </g>`).join("")}
      </svg>
      <div class="legend">
        <span><span class="d" style="background:var(--paper-2)"></span> zastávka</span>
        <span><span class="d" style="background:var(--terra);border-color:#7d2018"></span> pás totality</span>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <span class="label">Ujeté kilometry po dnech</span>
      <div class="saved-hint" id="h"></div>
      <table class="tbl">
        <thead><tr><th>Den</th><th class="num">km</th><th></th></tr></thead>
        <tbody id="kmBody"></tbody>
        <tfoot><tr><td>Celkem</td><td class="num" id="kmTot">—</td><td></td></tr></tfoot>
      </table>
      <div class="btn-row"><button class="btn ghost sm" id="addKm">+ Přidat den</button></div>
    </div>
    ${UI.quote("Cesty nejsou jen o kilometrech, ale o momentech, které si pamatuješ.")}
  `;

  const num = (v) => parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;
  const save = UI.debounce(async () => {
    await Store.setDoc("mapkm", d);
    const h = el.querySelector("#h"); h.textContent = "Uloženo ✓"; h.style.opacity = 1; setTimeout(() => (h.style.opacity = 0), 1200);
  }, 500);

  function drawRows() {
    const body = el.querySelector("#kmBody");
    body.innerHTML = d.rows.map((r, i) => `<tr>
      <td><input data-i="${i}" data-k="day" value="${UI.esc(r.day || "")}"></td>
      <td class="num"><input class="num" data-i="${i}" data-k="km" value="${UI.esc(r.km || "")}" inputmode="decimal"></td>
      <td><button class="row-del" data-del="${i}">✕</button></td>
    </tr>`).join("");
    el.querySelector("#kmTot").textContent = (() => {
      const t = d.rows.reduce((s, r) => s + num(r.km), 0); return t ? t.toLocaleString("cs-CZ") + " km" : "—";
    })();
    body.querySelectorAll("[data-k]").forEach((inp) => inp.addEventListener("input", (e) => {
      d.rows[+e.target.dataset.i][e.target.dataset.k] = e.target.value; save();
      const t = d.rows.reduce((s, r) => s + num(r.km), 0);
      el.querySelector("#kmTot").textContent = t ? t.toLocaleString("cs-CZ") + " km" : "—";
    }));
    body.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { d.rows.splice(+b.dataset.del, 1); save(); drawRows(); });
  }
  el.querySelector("#addKm").onclick = () => { d.rows.push({ day: String(d.rows.length + 1), km: "" }); save(); drawRows(); };
  if (!d.rows.length) d.rows.push({ day: "1", km: "" });
  drawRows();
};

// =====================================================================
//  ZATMĚNÍ
// =====================================================================
Views.zatmeni = async function (el) {
  const E = window.ECLIPSE_DATA;
  let locIdx = 0;
  const log = await Store.getDoc("eclipseLog");
  log.weather = log.weather || {};
  log.answers = log.answers || {};

  el.innerHTML = `
    <div class="ecl-hero">
      <div class="ring"></div>
      <h1>TOTAL SOLAR ECLIPSE</h1>
      <div class="date">${E.date}</div>
    </div>

    <div class="card countdown" id="eCd">
      <div class="lead">Do začátku úplného zatmění</div>
      <div class="cd-grid" id="eCdGrid"></div>
    </div>

    <button class="btn gold block" id="arBtn" style="margin:14px 0">🌞 AR hledáček Slunce (kde a jak vysoko)</button>

    <div class="loc-tabs" id="locTabs">
      ${E.locations.map((l, i) => `<button data-i="${i}" class="${i === 0 ? "sel" : ""}">${l.name}</button>`).join("")}
    </div>
    <div class="card" id="phaseCard"></div>

    <div class="card" id="eWx" style="margin-top:14px"></div>

    <div class="card" style="margin-top:14px">
      <span class="label">Jaké bylo počasí</span>
      <table class="weather-grid">
        <thead><tr><th></th>${E.weatherOptions.map((o) => `<th title="${o.label}">${o.icon}</th>`).join("")}</tr></thead>
        <tbody>
          ${E.weatherRows.map((t) => `<tr><td class="h">${t}</td>${E.weatherOptions.map((o) =>
            `<td class="opt${log.weather[t] === o.id ? " sel" : ""}" data-time="${t}" data-opt="${o.id}">${o.icon}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-top:14px">
      <span class="label">Deník okamžiku totality</span>
      <div class="q-list">
        ${E.journalQuestions.map((q, i) => `<div class="q">
          <div class="qq">${q}</div>
          <textarea data-q="${i}" placeholder="…">${UI.esc(log.answers[i] || "")}</textarea>
        </div>`).join("")}
      </div>
      <div class="saved-hint" id="h"></div>
    </div>

    ${UI.quote("Nejkrásnější pohled na svět je ten, který si musíte zasloužit výšlapem.")}
  `;

  // countdown
  const grid = el.querySelector("#eCdGrid");
  const paint = () => {
    const p = window.cdParts(window.TOTALITY);
    const cell = (n, u) => `<div class="cd-cell"><div class="n">${String(n).padStart(2, "0")}</div><div class="u">${u}</div></div>`;
    grid.innerHTML = p.past
      ? `<div class="cd-cell"><div class="n">🌑</div><div class="u">Totalita!</div></div>`
      : cell(p.d, "dní") + cell(p.h, "hod") + cell(p.m, "min") + cell(p.s, "s");
  };
  paint();
  const iv = setInterval(() => { if (!document.body.contains(grid)) return clearInterval(iv); paint(); }, 1000);

  // fáze
  function drawPhases() {
    const l = E.locations[locIdx];
    el.querySelector("#phaseCard").innerHTML = `
      <div style="text-align:center;margin-bottom:8px">
        <div style="font-weight:800;letter-spacing:.12em">${l.name}</div>
        <div style="font-size:12px;color:var(--ink-2)">${l.coords}</div>
      </div>
      <ul class="phase-list">
        ${l.phases.map((p) => `<li class="${p.highlight ? "hl" : ""}">
          <span class="lbl">${p.label}<span class="alt">výška ${p.alt}</span></span>
          <span class="tm">${p.time}</span>
        </li>`).join("")}
      </ul>
      <div class="maxphase">Maximální fáze: <b>${l.maxPhase}</b></div>
    `;
    weatherWidget(el.querySelector("#eWx"), l.lat, l.lon, "Počasí — " + l.name, true);
  }
  drawPhases();

  el.querySelector("#locTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    locIdx = +b.dataset.i;
    [...e.currentTarget.children].forEach((c) => c.classList.remove("sel"));
    b.classList.add("sel"); drawPhases();
  });

  // AR
  el.querySelector("#arBtn").onclick = () => window.AR.open(E.locations[locIdx]);

  // počasí log
  el.querySelectorAll(".weather-grid .opt").forEach((c) => c.onclick = async () => {
    const t = c.dataset.time;
    el.querySelectorAll(`.weather-grid .opt[data-time="${t}"]`).forEach((x) => x.classList.remove("sel"));
    c.classList.add("sel");
    log.weather[t] = c.dataset.opt;
    await Store.setDoc("eclipseLog", log);
  });

  // deníkové odpovědi
  const saveLog = UI.debounce(async () => {
    await Store.setDoc("eclipseLog", log);
    const h = el.querySelector("#h"); h.textContent = "Uloženo ✓"; h.style.opacity = 1; setTimeout(() => (h.style.opacity = 0), 1200);
  }, 500);
  el.querySelectorAll("[data-q]").forEach((t) => t.addEventListener("input", (e) => {
    log.answers[e.target.dataset.q] = e.target.value; saveLog();
  }));
};

// =====================================================================
//  ITINERÁŘ
// =====================================================================
Views.itinerar = async function (el) {
  const T = window.TRIP;
  const done = await Store.getDoc("itinDone");
  const todayKey = new Date().toISOString().slice(0, 10);

  el.innerHTML = `
    <a class="back" href="#/plan">← Plán</a>
    <div class="page-title">Itinerář</div>
    <div class="page-sub">10.–16. srpna 2026</div>

    <div class="card" style="margin-bottom:14px">
      <span class="label">Potvrzené rezervace</span>
      ${T.reservations.map((r) => `<div class="res"><span class="ic">${r.ic}</span><div><b>${UI.esc(r.t)}</b><div class="d">${UI.esc(r.d)}</div></div></div>`).join("")}
      <div class="install-hint" style="text-align:left;margin-top:8px">⚠️ ${T.bagWarn}</div>
    </div>

    <div id="days"></div>
    ${UI.quote("Život je buď odvážné dobrodružství, nebo nic.")}
  `;

  const box = el.querySelector("#days");
  box.innerHTML = T.days.map((day, di) => {
    const open = di === 0 ? " open" : "";
    return `<div class="day-card${day.eclipse ? " eclipse" : ""}">
      <button class="day-head${open}" data-day="${di}">
        <div class="day-n">${day.n}</div>
        <div class="day-info">
          <div class="day-date">${UI.esc(day.date)} · ${UI.esc(day.place)}</div>
          <div class="day-title">${UI.esc(day.title)}</div>
        </div>
        <span class="chev">▾</span>
      </button>
      <div class="day-body${open}">
        ${day.items.map((it, ii) => {
          const key = di + "-" + ii;
          return `<label class="it${it.hi ? " hi" : ""}">
            <input type="checkbox" data-k="${key}" ${done[key] ? "checked" : ""}>
            <span class="it-t">${UI.esc(it.t)}</span>
            <span class="it-a">${UI.esc(it.a)}</span>
          </label>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");

  box.querySelectorAll(".day-head").forEach((h) => h.onclick = () => {
    h.classList.toggle("open");
    h.parentElement.querySelector(".day-body").classList.toggle("open");
  });
  box.querySelectorAll("input[type=checkbox]").forEach((c) => c.onchange = async () => {
    done[c.dataset.k] = c.checked;
    await Store.setDoc("itinDone", done);
  });
};

// =====================================================================
//  CHECKLIST (zavazadla)
// =====================================================================
Views.checklist = async function (el) {
  const T = window.TRIP;
  const done = await Store.getDoc("packing");
  const all = T.checklist.reduce((s, g) => s + g.items.length, 0);
  const cnt = () => T.checklist.reduce((s, g, gi) => s + g.items.filter((_, i) => done[gi + "-" + i]).length, 0);

  el.innerHTML = `
    <a class="back" href="#/plan">← Plán</a>
    <div class="page-title">Checklist zavazadel</div>
    <div class="page-sub" id="prog">${cnt()} / ${all} sbaleno</div>
    ${T.checklist.map((g, gi) => `<div class="card" style="margin-bottom:12px">
      <span class="label">${UI.esc(g.g)}</span>
      ${g.items.map((it, i) => `<label class="chk">
        <input type="checkbox" data-k="${gi}-${i}" ${done[gi + "-" + i] ? "checked" : ""}>
        <span>${UI.esc(it)}</span>
      </label>`).join("")}
    </div>`).join("")}
    ${UI.quote("Sbaleno a připraveno na vše, co přinese zítřek.")}
  `;

  el.querySelectorAll("input[type=checkbox]").forEach((c) => c.onchange = async () => {
    done[c.dataset.k] = c.checked;
    await Store.setDoc("packing", done);
    el.querySelector("#prog").textContent = cnt() + " / " + all + " sbaleno";
  });
};

// =====================================================================
//  INFO & BEZPEČNOST
// =====================================================================
Views.info = async function (el) {
  const T = window.TRIP;
  el.innerHTML = `
    <a class="back" href="#/plan">← Plán</a>
    <div class="page-title">Info & bezpečnost</div>
    <div class="page-sub">Důležité pro cestu</div>

    <div class="card">
      <span class="label">☀️ Bezpečné pozorování zatmění</span>
      <ul class="info-list">${T.safety.map((s) => `<li>${UI.esc(s)}</li>`).join("")}</ul>
    </div>

    <div class="card" style="margin-top:14px">
      <span class="label">📷 Plán fotografování</span>
      <ul class="info-list">${T.photoPlan.map((s) => `<li>${UI.esc(s)}</li>`).join("")}</ul>
    </div>

    <div class="card" style="margin-top:14px">
      <span class="label">🚨 Tísňová čísla (Španělsko)</span>
      ${T.emergency.map((e) => `<div class="kv"><b>${UI.esc(e.n)}</b><span>${UI.esc(e.d)}</span></div>`).join("")}
    </div>

    <div class="card" style="margin-top:14px">
      <span class="label">📱 Doporučené aplikace</span>
      ${T.apps.map((a) => `<div class="kv"><b>${UI.esc(a.t)}</b><span>${UI.esc(a.d)}</span></div>`).join("")}
    </div>

    <div class="card" style="margin-top:14px">
      <span class="label">🔗 Užitečné odkazy</span>
      ${T.links.map((l) => `<a class="linkrow" href="${l.u}" target="_blank" rel="noopener">${UI.esc(l.t)} ↗</a>`).join("")}
    </div>
    ${UI.quote("Nejkrásnější pohled na svět je ten, který si musíte zasloužit výšlapem.")}
  `;
};

// =====================================================================
//  TISK — kompletní kronika k vytištění (památka)
// =====================================================================
Views.tisk = async function (el) {
  const T = window.TRIP;
  const E = window.ECLIPSE_DATA;
  const [diary, photos, basics, travel, budget, route, mapkm, eclog] = await Promise.all([
    Store.list("diary"), Store.list("photos"),
    Store.getDoc("basics"), Store.getDoc("travelDetails"),
    Store.getDoc("budget"), Store.getDoc("route"),
    Store.getDoc("mapkm"), Store.getDoc("eclipseLog")
  ]);

  const names = window.ECLIPSE_CONFIG.travelers.map((t) => t.name).join(" & ");
  const fullDate = (ts) => new Date(ts).toLocaleDateString("cs-CZ",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const num = (v) => parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

  // --- deník (chronologicky) ---
  const diaryHtml = diary.length ? diary.map((e) => {
    const a = UI.traveler(e.author);
    return `<div class="p-entry">
      <div class="p-entry-head">
        <span class="p-au" style="color:${a.color}">● ${UI.esc(a.name)}</span>
        <span>${fullDate(e.ts)}${e.place ? " · " + UI.esc(e.place) : ""} ${e.mood || ""}</span>
      </div>
      ${e.image ? `<img class="p-entry-img" src="${e.image}">` : ""}
      ${e.text ? `<div class="p-entry-text">${UI.esc(e.text)}</div>` : ""}
    </div>`;
  }).join("") : `<p class="p-empty">Zatím žádné zápisky — kronika se naplní během cesty.</p>`;

  // --- fotoalbum (i fotky z deníku) ---
  const allPhotos = photos.concat(
    diary.filter((d) => d.image).map((d) => ({ image: d.image, caption: d.place || "", author: d.author }))
  );
  const albumHtml = allPhotos.length ? `<div class="p-album">` + allPhotos.map((p) =>
    `<figure class="p-ph"><img src="${p.image}">${p.caption ? `<figcaption>${UI.esc(p.caption)}</figcaption>` : ""}</figure>`
  ).join("") + `</div>` : `<p class="p-empty">Fotky se doplní během cesty.</p>`;

  // --- rozpočet ---
  const bRows = (budget.rows && budget.rows.length) ? budget.rows : T.budgetRows;
  const totEst = bRows.reduce((s, r) => s + num(r.est), 0);
  const totReal = bRows.reduce((s, r) => s + num(r.real), 0);

  // --- trasa ---
  const rRows = (route.rows && route.rows.length) ? route.rows : T.route;
  const totKm = rRows.reduce((s, r) => s + num(r.dist), 0);

  // --- zatmění: počasí + odpovědi ---
  const wOpt = (id) => (E.weatherOptions.find((o) => o.id === id) || {}).label || "—";
  const weatherLog = (eclog.weather && Object.keys(eclog.weather).length)
    ? E.weatherRows.map((t) => `${t} — ${wOpt(eclog.weather[t])}`).join(" · ") : "—";
  const answers = E.journalQuestions.map((q, i) =>
    `<div class="p-qa"><b>${UI.esc(q)}</b><div>${UI.esc((eclog.answers && eclog.answers[i]) || "…")}</div></div>`).join("");

  const soria = E.locations[0];

  el.innerHTML = `
    <div class="no-print" style="text-align:center;margin-bottom:16px">
      <div class="page-title">Kronika k tisku</div>
      <p class="install-hint" style="margin:6px 0 14px">
        Náhled celé kroniky. Klikni na tlačítko a zvol <b>„Uložit jako PDF"</b> (nebo tiskárnu).
        PDF pak můžeš dát vytisknout jako fotoknihu na památku. 📖
      </p>
      <button class="btn gold" id="printBtn">🖨️ Vytisknout / uložit jako PDF</button>
    </div>

    <div class="print-doc">
      <!-- Titulní strana -->
      <section class="p-page p-cover">
        <img src="assets/cover.jpg" alt="">
        <div class="p-cover-cap">${UI.esc(names)}<br><small>Cestovatelská kronika</small></div>
      </section>

      <!-- Základní fakta -->
      <section class="p-page">
        <h2 class="p-h">Naše cesta</h2>
        <table class="p-facts">
          <tr><th>Datum</th><td>${UI.esc(basics.datum || T.facts.datum)}</td></tr>
          <tr><th>Lokalita</th><td>${UI.esc(basics.lokalita || T.facts.lokalita)}</td></tr>
          <tr><th>Mise cesty</th><td>${UI.esc(basics.mise || T.facts.mise)}</td></tr>
          <tr><th>Nejvíc jsme se těšili</th><td>${UI.esc(basics.tesime || T.facts.tesime)}</td></tr>
          <tr><th>Doprava</th><td>${UI.esc(travel.doprava || T.transport.doprava)}</td></tr>
          <tr><th>Ubytování</th><td>${UI.esc(travel.ubytovani || T.transport.ubytovani)}</td></tr>
        </table>
      </section>

      <!-- Itinerář -->
      <section class="p-page">
        <h2 class="p-h">Itinerář</h2>
        ${T.days.map((day) => `<div class="p-day">
          <div class="p-day-h"><b>Den ${day.n} · ${UI.esc(day.date)}</b> — ${UI.esc(day.place)}</div>
          <div class="p-day-t">${UI.esc(day.title)}</div>
          <ul class="p-day-items">
            ${day.items.map((it) => `<li><span>${UI.esc(it.t)}</span> ${UI.esc(it.a)}</li>`).join("")}
          </ul>
        </div>`).join("")}
      </section>

      <!-- Deník -->
      <section class="p-page">
        <h2 class="p-h">Deník</h2>
        ${diaryHtml}
      </section>

      <!-- Fotoalbum -->
      <section class="p-page">
        <h2 class="p-h">Fotoalbum</h2>
        ${albumHtml}
      </section>

      <!-- Zatmění -->
      <section class="p-page">
        <h2 class="p-h">Úplné zatmění Slunce · 12. 8. 2026</h2>
        <p class="p-lead">${UI.esc(soria.coords)} — maximální fáze ${soria.maxPhase}</p>
        <table class="p-facts">
          ${soria.phases.map((p) => `<tr><th>${UI.esc(p.label)}</th><td>${p.time} · výška ${p.alt}</td></tr>`).join("")}
        </table>
        <p class="p-lead" style="margin-top:10px"><b>Počasí:</b> ${weatherLog}</p>
        <h3 class="p-h3">Deník okamžiku totality</h3>
        ${answers}
      </section>

      <!-- Rozpočet & trasa -->
      <section class="p-page">
        <h2 class="p-h">Rozpočet</h2>
        <table class="p-tbl">
          <tr><th>Kategorie</th><th>Odhad</th><th>Skutečnost</th></tr>
          ${bRows.map((r) => `<tr><td>${UI.esc(r.cat)}</td><td class="r">${r.est ? num(r.est).toLocaleString("cs-CZ") : "—"}</td><td class="r">${r.real ? num(r.real).toLocaleString("cs-CZ") : "—"}</td></tr>`).join("")}
          <tr class="tot"><td>Celkem (Kč)</td><td class="r">${totEst.toLocaleString("cs-CZ")}</td><td class="r">${totReal ? totReal.toLocaleString("cs-CZ") : "—"}</td></tr>
        </table>
        <h2 class="p-h" style="margin-top:16px">Trasa</h2>
        <table class="p-tbl">
          <tr><th>Den</th><th>Odkud–kam</th><th>Prostředek</th><th>km</th></tr>
          ${rRows.map((r) => `<tr><td>${UI.esc(r.day || "")}</td><td>${UI.esc(r.fromto || "")}</td><td>${UI.esc(r.mode || "")}</td><td class="r">${UI.esc(r.dist || "")}</td></tr>`).join("")}
          <tr class="tot"><td colspan="3">Celkem</td><td class="r">${totKm ? totKm.toLocaleString("cs-CZ") + " km" : "—"}</td></tr>
        </table>
      </section>

      <!-- Závěr -->
      <section class="p-page p-end">
        <div class="p-end-ring"></div>
        <p class="p-end-q">„Cesty nejsou jen o kilometrech,<br>ale o momentech, které si pamatuješ."</p>
        <p class="p-end-sig">${UI.esc(names)} · Španělsko 2026</p>
      </section>
    </div>
  `;

  el.querySelector("#printBtn").onclick = () => window.print();
};

window.Views = Views;
