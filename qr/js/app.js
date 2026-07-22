(() => {
  "use strict";

  // Knihovna ve výchozím stavu kóduje text jako Latin-1 (ztrácí diakritiku).
  // Přepneme na její vestavěný UTF-8 převodník, aby čeština fungovala správně.
  if (window.qrcode && window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs["UTF-8"]) {
    window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
  }

  // ---------------------------------------------------------------------
  // Definice typů QR kódu a jejich formulářových polí
  // ---------------------------------------------------------------------
  const TYPES = [
    {
      id: "text", label: "Text", icon: "📝",
      fields: [
        { key: "text", label: "Text", type: "textarea", placeholder: "Napiš cokoliv…" },
      ],
    },
    {
      id: "url", label: "Odkaz", icon: "🔗",
      fields: [
        { key: "url", label: "Webová adresa", type: "text", placeholder: "https://example.com" },
      ],
    },
    {
      id: "wifi", label: "Wi-Fi", icon: "📶",
      fields: [
        { key: "ssid", label: "Název sítě (SSID)", type: "text" },
        { key: "password", label: "Heslo", type: "text" },
        { key: "enc", label: "Zabezpečení", type: "select", options: [["WPA", "WPA/WPA2"], ["WEP", "WEP"], ["nopass", "Bez hesla"]], default: "WPA" },
        { key: "hidden", label: "Skrytá síť", type: "checkbox" },
      ],
    },
    {
      id: "contact", label: "Kontakt", icon: "👤",
      fields: [
        { key: "firstName", label: "Jméno", type: "text" },
        { key: "lastName", label: "Příjmení", type: "text" },
        { key: "phone", label: "Telefon", type: "tel" },
        { key: "email", label: "E-mail", type: "email" },
        { key: "org", label: "Organizace", type: "text" },
        { key: "url", label: "Web", type: "text" },
      ],
    },
    {
      id: "email", label: "E-mail", icon: "✉️",
      fields: [
        { key: "to", label: "Adresát", type: "email" },
        { key: "subject", label: "Předmět", type: "text" },
        { key: "body", label: "Zpráva", type: "textarea" },
      ],
    },
    {
      id: "sms", label: "SMS", icon: "💬",
      fields: [
        { key: "phone", label: "Telefon", type: "tel" },
        { key: "message", label: "Zpráva", type: "textarea" },
      ],
    },
    {
      id: "tel", label: "Telefon", icon: "📞",
      fields: [
        { key: "phone", label: "Telefonní číslo", type: "tel" },
      ],
    },
    {
      id: "event", label: "Událost", icon: "📅",
      fields: [
        { key: "title", label: "Název", type: "text" },
        { key: "location", label: "Místo", type: "text" },
        { key: "start", label: "Začátek", type: "datetime-local" },
        { key: "end", label: "Konec", type: "datetime-local" },
        { key: "description", label: "Popis", type: "textarea" },
      ],
    },
  ];

  const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.id, t]));

  // ---------------------------------------------------------------------
  // Stav
  // ---------------------------------------------------------------------
  const state = {
    type: "text",
    values: Object.fromEntries(TYPES.map((t) => [t.id, {}])),
    fg: "#0b1220",
    bg: "#ffffff",
    ec: "M",
    logoImage: null,
    logoScale: 20,
  };

  // ---------------------------------------------------------------------
  // Pomocné funkce pro escapování hodnot do jednotlivých formátů
  // ---------------------------------------------------------------------
  const escWifi = (s) => String(s || "").replace(/([\\;,:"])/g, "\\$1");
  const escVCard = (s) => String(s || "").replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");
  const escICal = (s) => String(s || "").replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");

  function icalDate(local) {
    if (!local) return "";
    const d = new Date(local);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  }

  // ---------------------------------------------------------------------
  // Sestavení textového obsahu QR kódu podle vybraného typu
  // ---------------------------------------------------------------------
  function buildPayload() {
    const v = state.values[state.type];

    switch (state.type) {
      case "text":
        return (v.text || "").trim();

      case "url": {
        let u = (v.url || "").trim();
        if (!u) return "";
        if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = "https://" + u;
        return u;
      }

      case "wifi": {
        if (!v.ssid) return "";
        const enc = v.enc || "WPA";
        const parts = [`WIFI:T:${enc === "nopass" ? "nopass" : enc};S:${escWifi(v.ssid)};`];
        if (enc !== "nopass") parts.push(`P:${escWifi(v.password)};`);
        if (v.hidden) parts.push("H:true;");
        parts.push(";");
        return parts.join("");
      }

      case "contact": {
        if (!v.firstName && !v.lastName && !v.phone && !v.email) return "";
        const lines = ["BEGIN:VCARD", "VERSION:3.0"];
        lines.push(`N:${escVCard(v.lastName)};${escVCard(v.firstName)};;;`);
        lines.push(`FN:${escVCard([v.firstName, v.lastName].filter(Boolean).join(" "))}`);
        if (v.org) lines.push(`ORG:${escVCard(v.org)}`);
        if (v.phone) lines.push(`TEL;TYPE=CELL:${escVCard(v.phone)}`);
        if (v.email) lines.push(`EMAIL:${escVCard(v.email)}`);
        if (v.url) lines.push(`URL:${escVCard(v.url)}`);
        lines.push("END:VCARD");
        return lines.join("\n");
      }

      case "email": {
        if (!v.to) return "";
        const params = [];
        if (v.subject) params.push("subject=" + encodeURIComponent(v.subject));
        if (v.body) params.push("body=" + encodeURIComponent(v.body));
        return `mailto:${v.to}${params.length ? "?" + params.join("&") : ""}`;
      }

      case "sms": {
        if (!v.phone) return "";
        return `SMSTO:${v.phone}:${v.message || ""}`;
      }

      case "tel":
        return v.phone ? `tel:${v.phone.replace(/\s+/g, "")}` : "";

      case "event": {
        if (!v.title || !v.start) return "";
        const lines = [
          "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
          `SUMMARY:${escICal(v.title)}`,
        ];
        if (v.location) lines.push(`LOCATION:${escICal(v.location)}`);
        if (v.description) lines.push(`DESCRIPTION:${escICal(v.description)}`);
        lines.push(`DTSTART:${icalDate(v.start)}`);
        if (v.end) lines.push(`DTEND:${icalDate(v.end)}`);
        lines.push("END:VEVENT", "END:VCALENDAR");
        return lines.join("\n");
      }

      default:
        return "";
    }
  }

  // ---------------------------------------------------------------------
  // Vykreslení formuláře pro aktuální typ
  // ---------------------------------------------------------------------
  const typesNav = document.getElementById("types");
  const form = document.getElementById("qrForm");

  function renderTypeNav() {
    typesNav.textContent = "";
    for (const t of TYPES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-btn" + (t.id === state.type ? " active" : "");
      btn.dataset.type = t.id;
      const ic = document.createElement("span");
      ic.textContent = t.icon;
      const lbl = document.createElement("span");
      lbl.textContent = t.label;
      btn.append(ic, lbl);
      btn.addEventListener("click", () => {
        state.type = t.id;
        renderTypeNav();
        renderForm();
        renderPreview();
      });
      typesNav.appendChild(btn);
    }
  }

  function renderForm() {
    form.textContent = "";
    const type = TYPE_MAP[state.type];
    const values = state.values[type.id];

    for (const f of type.fields) {
      const label = document.createElement("label");
      label.className = "field" + (f.type === "checkbox" ? " checkbox-field" : "");

      let input;
      if (f.type === "textarea") {
        input = document.createElement("textarea");
      } else if (f.type === "select") {
        input = document.createElement("select");
        for (const [val, text] of f.options) {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = text;
          input.appendChild(opt);
        }
      } else {
        input = document.createElement("input");
        input.type = f.type === "checkbox" ? "checkbox" : f.type;
      }
      input.id = "f_" + f.key;
      if (f.placeholder) input.placeholder = f.placeholder;

      const current = values[f.key];
      if (f.type === "checkbox") {
        input.checked = !!current;
      } else {
        input.value = current !== undefined ? current : (f.default || "");
        if (values[f.key] === undefined && f.default) values[f.key] = f.default;
      }

      const eventName = (f.type === "checkbox" || f.type === "select") ? "change" : "input";
      input.addEventListener(eventName, () => {
        values[f.key] = f.type === "checkbox" ? input.checked : input.value;
        renderPreview();
      });

      if (f.type === "checkbox") {
        label.append(input, Object.assign(document.createElement("span"), { textContent: f.label }));
      } else {
        const span = document.createElement("span");
        span.textContent = f.label;
        label.append(span, input);
      }

      form.appendChild(label);
    }
  }

  // ---------------------------------------------------------------------
  // Vykreslení QR kódu do canvasu
  // ---------------------------------------------------------------------
  const canvas = document.getElementById("qrCanvas");
  const emptyHint = document.getElementById("emptyHint");
  const btnDownload = document.getElementById("btnDownload");
  const btnShare = document.getElementById("btnShare");
  const btnCopy = document.getElementById("btnCopy");

  let lastPayload = "";

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function renderPreview() {
    const payload = buildPayload();
    lastPayload = payload;

    if (!payload) {
      canvas.classList.remove("visible");
      emptyHint.style.display = "block";
      btnDownload.disabled = true;
      btnShare.disabled = true;
      btnCopy.disabled = true;
      return;
    }

    let qr;
    try {
      const ec = state.logoImage && state.ec !== "H" ? "H" : state.ec;
      qr = window.qrcode(0, ec);
      qr.addData(payload);
      qr.make();
    } catch (err) {
      canvas.classList.remove("visible");
      emptyHint.textContent = "Obsah je příliš dlouhý na QR kód. Zkus ho zkrátit.";
      emptyHint.style.display = "block";
      btnDownload.disabled = true;
      btnShare.disabled = true;
      btnCopy.disabled = true;
      return;
    }

    emptyHint.style.display = "none";
    canvas.classList.add("visible");

    const count = qr.getModuleCount();
    const quiet = 4;
    const total = count + quiet * 2;
    const size = canvas.width; // 1024, fixed high-res export size
    const modSize = size / total;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = state.fg;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + quiet) * modSize;
          const y = (r + quiet) * modSize;
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(modSize) + 1, Math.ceil(modSize) + 1);
        }
      }
    }

    if (state.logoImage) {
      const logoSize = size * (state.logoScale / 100);
      const lx = (size - logoSize) / 2;
      const ly = (size - logoSize) / 2;
      const pad = logoSize * 0.14;
      ctx.fillStyle = state.bg;
      roundRectPath(ctx, lx - pad, ly - pad, logoSize + pad * 2, logoSize + pad * 2, logoSize * 0.16);
      ctx.fill();
      ctx.save();
      roundRectPath(ctx, lx, ly, logoSize, logoSize, logoSize * 0.14);
      ctx.clip();
      ctx.drawImage(state.logoImage, lx, ly, logoSize, logoSize);
      ctx.restore();
    }

    btnDownload.disabled = false;
    btnShare.disabled = false;
    btnCopy.disabled = !(navigator.clipboard && window.ClipboardItem);
  }

  // ---------------------------------------------------------------------
  // Akce: stažení, sdílení, kopírování
  // ---------------------------------------------------------------------
  const toast = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 3200);
  }

  function filenameFor() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return `qr-${state.type}-${stamp}`;
  }

  function toBlob() {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  btnDownload.addEventListener("click", async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filenameFor() + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    pushHistory();
    showToast("QR kód byl stažen.");
  });

  btnShare.addEventListener("click", async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], filenameFor() + ".png", { type: "image/png" });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "QR kód" });
      } else if (navigator.share) {
        await navigator.share({ title: "QR kód", text: lastPayload });
      } else {
        throw new Error("no-share-api");
      }
      pushHistory();
    } catch (err) {
      if (err && err.name === "AbortError") return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFor() + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("Sdílení není v tomto prohlížeči podporováno — QR kód byl místo toho stažen.");
    }
  });

  btnCopy.addEventListener("click", async () => {
    try {
      const blob = await toBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("Obrázek zkopírován do schránky.");
    } catch (err) {
      showToast("Kopírování se nezdařilo.");
    }
  });

  // ---------------------------------------------------------------------
  // Vzhled: barvy, korekce chyb, logo
  // ---------------------------------------------------------------------
  const fgColor = document.getElementById("fgColor");
  const bgColor = document.getElementById("bgColor");
  const ecLevel = document.getElementById("ecLevel");
  const logoInput = document.getElementById("logoInput");
  const logoScaleRow = document.getElementById("logoScaleRow");
  const logoScale = document.getElementById("logoScale");
  const btnRemoveLogo = document.getElementById("btnRemoveLogo");

  fgColor.addEventListener("input", () => { state.fg = fgColor.value; renderPreview(); });
  bgColor.addEventListener("input", () => { state.bg = bgColor.value; renderPreview(); });
  ecLevel.addEventListener("change", () => { state.ec = ecLevel.value; renderPreview(); });

  logoInput.addEventListener("change", () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.logoImage = img;
        logoScaleRow.hidden = false;
        btnRemoveLogo.hidden = false;
        if (state.ec !== "H") {
          state.ec = "H";
          ecLevel.value = "H";
        }
        renderPreview();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  logoScale.addEventListener("input", () => {
    state.logoScale = Number(logoScale.value);
    renderPreview();
  });

  btnRemoveLogo.addEventListener("click", () => {
    state.logoImage = null;
    logoInput.value = "";
    logoScaleRow.hidden = true;
    btnRemoveLogo.hidden = true;
    renderPreview();
  });

  // ---------------------------------------------------------------------
  // Historie (uloženo lokálně v telefonu)
  // ---------------------------------------------------------------------
  const HISTORY_KEY = "qr_history_v1";
  const historySection = document.getElementById("historySection");
  const historyList = document.getElementById("historyList");

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
  }

  function historyLabel() {
    const type = TYPE_MAP[state.type];
    const v = state.values[state.type];
    const primary = v[type.fields[0].key] || lastPayload;
    return String(primary).slice(0, 40);
  }

  function pushHistory() {
    if (!lastPayload) return;
    const items = loadHistory();
    items.unshift({
      type: state.type,
      values: { ...state.values[state.type] },
      label: historyLabel(),
      ts: Date.now(),
    });
    saveHistory(items);
    renderHistory();
  }

  function renderHistory() {
    const items = loadHistory();
    historySection.hidden = items.length === 0;
    historyList.textContent = "";
    for (const [i, item] of items.entries()) {
      const type = TYPE_MAP[item.type];
      const row = document.createElement("button");
      row.type = "button";
      row.className = "history-item";
      const ic = document.createElement("span");
      ic.className = "ic";
      ic.textContent = type ? type.icon : "🔳";
      const lbl = document.createElement("span");
      lbl.className = "lbl";
      lbl.textContent = `${type ? type.label : item.type}: ${item.label || "(bez obsahu)"}`;
      const rm = document.createElement("span");
      rm.className = "rm";
      rm.textContent = "✕";
      rm.addEventListener("click", (e) => {
        e.stopPropagation();
        const rest = loadHistory();
        rest.splice(i, 1);
        saveHistory(rest);
        renderHistory();
      });
      row.append(ic, lbl, rm);
      row.addEventListener("click", () => {
        state.type = item.type;
        state.values[item.type] = { ...item.values };
        renderTypeNav();
        renderForm();
        renderPreview();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      historyList.appendChild(row);
    }
  }

  // ---------------------------------------------------------------------
  // Inicializace
  // ---------------------------------------------------------------------
  renderTypeNav();
  renderForm();
  renderPreview();
  renderHistory();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
