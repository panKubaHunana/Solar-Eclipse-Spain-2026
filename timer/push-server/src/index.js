// =====================================================================
//  Hodinové cinknutí — push server (Cloudflare Worker)
//  ---------------------------------------------------------------------
//  • POST /api/subscribe    { subscription, quiet, quietFrom, quietTo,
//                              tzOffsetMinutes } -> uloží/aktualizuje
//  • POST /api/unsubscribe  { endpoint } -> smaže
//  • POST /api/test         { endpoint } -> hned pošle jednu push zprávu
//  • scheduled (cron 0 * * * *) -> pošle push všem uloženým odběratelům,
//    kteří zrovna nemají "tichou noc"
//
//  Návod na nasazení: viz README.md v kořeni repozitáře.
// =====================================================================

import webpush from "web-push";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

async function sha256Hex(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isQuietNow(record, now) {
  if (!record.quiet) return false;
  const offset = Number.isFinite(record.tzOffsetMinutes) ? record.tzOffsetMinutes : 0;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = ((utcMinutes - offset) % 1440 + 1440) % 1440;

  const [fh, fm] = (record.quietFrom || "23:00").split(":").map(Number);
  const [th, tm] = (record.quietTo || "07:00").split(":").map(Number);
  const from = fh * 60 + fm;
  const to = th * 60 + tm;

  if (from === to) return false;
  if (from < to) return localMinutes >= from && localMinutes < to;
  return localMinutes >= from || localMinutes < to; // okno přes půlnoc
}

function vapidDetails(env) {
  return {
    subject: env.VAPID_SUBJECT || "mailto:example@example.com",
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  };
}

async function sendChime(env, record, payload) {
  try {
    await webpush.sendNotification(
      record.subscription,
      JSON.stringify(payload),
      { vapidDetails: vapidDetails(env), TTL: 3000 }
    );
    return { ok: true };
  } catch (err) {
    const status = err && err.statusCode;
    if (status === 404 || status === 410) return { ok: false, expired: true };
    return { ok: false, expired: false, error: String(err) };
  }
}

async function handleSubscribe(request, env) {
  const body = await request.json();
  const sub = body && body.subscription;
  if (!sub || !sub.endpoint) return json({ error: "chybí subscription" }, 400);

  const key = "sub:" + (await sha256Hex(sub.endpoint));
  const record = {
    subscription: sub,
    quiet: body.quiet !== false,
    quietFrom: body.quietFrom || "23:00",
    quietTo: body.quietTo || "07:00",
    tzOffsetMinutes: Number.isFinite(body.tzOffsetMinutes) ? body.tzOffsetMinutes : 0,
    updatedAt: Date.now()
  };
  await env.SUBS.put(key, JSON.stringify(record));
  return json({ ok: true });
}

async function handleUnsubscribe(request, env) {
  const body = await request.json();
  if (!body || !body.endpoint) return json({ error: "chybí endpoint" }, 400);
  const key = "sub:" + (await sha256Hex(body.endpoint));
  await env.SUBS.delete(key);
  return json({ ok: true });
}

async function handleTest(request, env) {
  const body = await request.json();
  if (!body || !body.endpoint) return json({ error: "chybí endpoint" }, 400);
  const key = "sub:" + (await sha256Hex(body.endpoint));
  const raw = await env.SUBS.get(key);
  if (!raw) return json({ error: "odběr nenalezen" }, 404);
  const record = JSON.parse(raw);
  const result = await sendChime(env, record, {
    title: "🔔 Testovací cinknutí",
    body: "Server ti umí poslat push i na zamčený telefon. Funguje to!"
  });
  if (result.expired) await env.SUBS.delete(key);
  return json(result, result.ok ? 200 : 502);
}

async function handleScheduled(env) {
  const now = new Date();
  const payload = {
    title: "🔔 Celá hodina",
    body: "Ding! Je " + now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC."
  };

  let cursor;
  const toDelete = [];
  do {
    const page = await env.SUBS.list({ prefix: "sub:", cursor });
    for (const entry of page.keys) {
      const raw = await env.SUBS.get(entry.name);
      if (!raw) continue;
      const record = JSON.parse(raw);
      if (isQuietNow(record, now)) continue;
      const result = await sendChime(env, record, payload);
      if (result.expired) toDelete.push(entry.name);
    }
    cursor = page.cursor;
    if (page.list_complete) break;
  } while (cursor);

  await Promise.all(toDelete.map((k) => env.SUBS.delete(k)));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (request.method === "POST" && url.pathname === "/api/subscribe") {
        return await handleSubscribe(request, env);
      }
      if (request.method === "POST" && url.pathname === "/api/unsubscribe") {
        return await handleUnsubscribe(request, env);
      }
      if (request.method === "POST" && url.pathname === "/api/test") {
        return await handleTest(request, env);
      }
      if (url.pathname === "/") {
        return json({ ok: true, service: "hourly-chime push server" });
      }
      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  }
};
