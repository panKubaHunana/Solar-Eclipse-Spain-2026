// =====================================================================
//  Weather — živé počasí z Open-Meteo (zdarma, bez API klíče)
//  getWeather(lat, lon) -> Promise<{ current, daily, eclipseDay }>
//  Poslední úspěšný výsledek se cachuje (offline zobrazení).
// =====================================================================

(function () {
  const WMO = {
    0:  ["☀️", "Jasno"],
    1:  ["🌤️", "Skoro jasno"],
    2:  ["⛅", "Polojasno"],
    3:  ["☁️", "Zataženo"],
    45: ["🌫️", "Mlha"],
    48: ["🌫️", "Námraza"],
    51: ["🌦️", "Mrholení"],
    53: ["🌦️", "Mrholení"],
    55: ["🌦️", "Silné mrholení"],
    61: ["🌧️", "Slabý déšť"],
    63: ["🌧️", "Déšť"],
    65: ["🌧️", "Silný déšť"],
    71: ["🌨️", "Slabé sněžení"],
    73: ["🌨️", "Sněžení"],
    75: ["❄️", "Silné sněžení"],
    80: ["🌦️", "Přeháňky"],
    81: ["🌦️", "Přeháňky"],
    82: ["⛈️", "Silné přeháňky"],
    95: ["⛈️", "Bouřka"],
    96: ["⛈️", "Bouřka s kroupami"],
    99: ["⛈️", "Silná bouřka"]
  };
  function wmo(code) {
    return WMO[code] || ["🌡️", "—"];
  }

  const CACHE = "eclipse-weather:";

  async function getWeather(lat, lon) {
    const key = CACHE + lat.toFixed(2) + "," + lon.toFixed(2);
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + lat + "&longitude=" + lon +
      "&current=temperature_2m,relative_humidity_2m,cloud_cover,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,cloud_cover_mean,precipitation_probability_max,sunset" +
      "&timezone=auto&forecast_days=16";

    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const out = normalize(j);
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), out })); } catch (_) {}
      return out;
    } catch (e) {
      // offline / chyba → poslední známý stav
      try {
        const c = JSON.parse(localStorage.getItem(key) || "null");
        if (c) { c.out._cached = c.t; return c.out; }
      } catch (_) {}
      throw e;
    }
  }

  function normalize(j) {
    const c = j.current || {};
    const current = {
      temp: Math.round(c.temperature_2m),
      clouds: c.cloud_cover,
      code: c.weather_code,
      wind: Math.round(c.wind_speed_10m),
      humidity: c.relative_humidity_2m
    };
    const d = j.daily || {};
    const daily = (d.time || []).map((date, i) => ({
      date,
      code: d.weather_code[i],
      tmax: Math.round(d.temperature_2m_max[i]),
      tmin: Math.round(d.temperature_2m_min[i]),
      clouds: d.cloud_cover_mean ? d.cloud_cover_mean[i] : null,
      precip: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null,
      sunset: d.sunset ? d.sunset[i] : null
    }));
    const eclipseDay = daily.find((x) => x.date === "2026-08-12") || null;
    return { current, daily, eclipseDay };
  }

  window.Weather = { getWeather, wmo };
})();
