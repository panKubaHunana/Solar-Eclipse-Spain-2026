// =====================================================================
//  Sun — poloha Slunce na obloze (azimut + výška)
//  Algoritmus podle NOAA Solar Calculator. Bez externích knihoven.
//  sunPosition(date, lat, lon) -> { altitude, azimuth }
//     date     : JS Date (bere se UTC)
//     lat      : zeměpisná šířka (° N kladně)
//     lon      : zeměpisná délka (° V kladně, tj. Z záporně)
//     altitude : výška nad obzorem ve stupních
//     azimuth  : azimut od severu po směru hodin (0 = S, 90 = V, 180 = J, 270 = Z)
// =====================================================================

(function () {
  const rad = Math.PI / 180;
  const mod = (a, n) => ((a % n) + n) % n;
  const clamp = (x) => Math.min(1, Math.max(-1, x));

  function sunPosition(date, lat, lon) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545) / 36525;

    const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const Mr = M * rad;

    const C =
      Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
      Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) +
      Math.sin(3 * Mr) * 0.000289;

    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * rad);

    const obliq = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const obliqCorr = obliq + 0.00256 * Math.cos(omega * rad);

    const decl = Math.asin(Math.sin(obliqCorr * rad) * Math.sin(appLong * rad)) / rad;

    const y = Math.tan((obliqCorr / 2) * rad) ** 2;
    const eot =
      (4 *
        (y * Math.sin(2 * L0 * rad) -
          2 * e * Math.sin(Mr) +
          4 * e * y * Math.sin(Mr) * Math.cos(2 * L0 * rad) -
          0.5 * y * y * Math.sin(4 * L0 * rad) -
          1.25 * e * e * Math.sin(2 * Mr))) /
      rad; // minuty

    const minutes =
      date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    const tst = mod(minutes + eot + 4 * lon, 1440); // pravý sluneční čas (lon V kladně)
    const ha = tst / 4 - 180; // hodinový úhel

    const latR = lat * rad;
    const declR = decl * rad;
    const haR = ha * rad;

    const zenith =
      Math.acos(
        clamp(
          Math.sin(latR) * Math.sin(declR) +
            Math.cos(latR) * Math.cos(declR) * Math.cos(haR)
        )
      ) / rad;

    const altitude = 90 - zenith;

    let azimuth;
    const azArg = clamp(
      (Math.sin(latR) * Math.cos(zenith * rad) - Math.sin(declR)) /
        (Math.cos(latR) * Math.sin(zenith * rad))
    );
    if (ha > 0) azimuth = mod(Math.acos(azArg) / rad + 180, 360);
    else azimuth = mod(540 - Math.acos(azArg) / rad, 360);

    return { altitude, azimuth };
  }

  // Světová strana z azimutu (české zkratky).
  function compassName(az) {
    const dirs = ["S", "SSV", "SV", "VSV", "V", "VJV", "JV", "JJV",
                  "J", "JJZ", "JZ", "ZJZ", "Z", "ZSZ", "SZ", "SSZ"];
    return dirs[Math.round(mod(az, 360) / 22.5) % 16];
  }

  window.Sun = { sunPosition, compassName };
})();
