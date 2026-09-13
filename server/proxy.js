/**
 * The only code that ever sees an API key.
 *
 * The browser asks this site for /api/…; this adds the key on the server and
 * forwards the request. It runs as Vercel functions in production (api/*.js)
 * and as Vite middleware in development (vite.config.js), so both behave
 * identically.
 *
 *   GET  /api/tmdb       TMDB, for the allow-listed endpoints below
 *   GET  /api/omdb       OMDb scores, by IMDb id
 *   GET  /api/watchmode  direct links into streaming services
 *   POST /api/signin     email check, then a one-time code (Supabase)
 *
 * Keys come from server-side environment variables with NO VITE_ prefix, so
 * Vite never compiles them into the public JavaScript:
 *   TMDB_TOKEN                 TMDB's read-only key (short key or long token)
 *   OMDB_KEY                   OMDb's API key
 *   WATCHMODE_KEY              Watchmode's API key
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase's secret key (creates accounts)
 *
 * It is deliberately not an open relay: only the TMDB endpoints the site uses
 * are forwarded, and OMDb and Watchmode only answer lookups by film id.
 */
import https from "node:https";
import { promises as dns } from "node:dns";
import { DISPOSABLE } from "./disposableDomains.js";

const TMDB = "https://api.themoviedb.org/3";
const OMDB = "https://www.omdbapi.com/";

/* ---------- ISP DNS blocks (local development only) --------------------
 * Some internet providers (Reliance Jio, for one) answer the DNS lookup for
 * api.themoviedb.org with a blocking address, while TMDB's real servers stay
 * reachable. With TMDB_DNS=doh in .env.local, the dev server asks Cloudflare's
 * DNS-over-HTTPS for the real address and connects to it directly — the TLS
 * certificate is still checked against api.themoviedb.org, so this is exactly
 * as secure as a normal request. Vercel's servers never need it. */
const dohCache = new Map();

async function realAddress(host) {
  const hit = dohCache.get(host);
  if (hit && hit.until > Date.now()) return hit.ip;
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, {
    headers: { accept: "application/dns-json" },
  });
  const answer = ((await res.json()).Answer ?? []).find((r) => r.type === 1);
  if (!answer) throw new Error(`No DNS-over-HTTPS answer for ${host}`);
  dohCache.set(host, { ip: answer.data, until: Date.now() + (answer.TTL ?? 60) * 1000 });
  return answer.data;
}

function getVia(ip, url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      // servername drives both SNI and the certificate check, so the
      // connection is verified as api.themoviedb.org even though we dialled an IP.
      { host: ip, servername: u.hostname, path: u.pathname + u.search, headers: { ...headers, host: u.hostname }, timeout: 15000 },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => { body += c; });
        res.on("end", () => resolve({ ok: res.statusCode < 300, status: res.statusCode, text: async () => body }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("TMDB timed out")));
    req.on("error", reject);
    req.end();
  });
}

/** fetch(), unless TMDB_DNS=doh asks us to route round a DNS block. */
async function upstream(url, headers, env) {
  if (clean(env.TMDB_DNS) === "doh" && new URL(url).hostname === "api.themoviedb.org") {
    // Connections through a filtering ISP get reset now and then: look the
    // address up afresh and try again, three attempts in all.
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await getVia(await realAddress("api.themoviedb.org"), url, headers);
      } catch (err) {
        if (attempt === 3) throw err;
        dohCache.delete("api.themoviedb.org");
      }
    }
  }
  return fetch(url, { headers });
}

const TMDB_PATHS = [
  /^\/discover\/movie$/,
  /^\/trending\/movie\/(day|week)$/,
  /^\/search\/movie$/,
  /^\/movie\/now_playing$/,
  /^\/movie\/\d+$/,
  /^\/genre\/movie\/list$/,
  /^\/watch\/providers\/movie$/,
];

// Shared answers are cached at Vercel's edge, so a thousand visitors opening
// the same page cost one upstream request — which matters most for OMDb's
// 1,000-requests-a-day free tier.
const CACHE_TMDB = "public, s-maxage=3600, stale-while-revalidate=86400";
const CACHE_OMDB = "public, s-maxage=86400, stale-while-revalidate=604800";

const clean = (v) => (v ?? "").trim().replace(/^["']|["']$/g, "");

const reply = (status, body, cache = "no-store") => ({
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

export async function tmdb(url, env) {
  const path = url.searchParams.get("path") ?? "";
  if (!TMDB_PATHS.some((re) => re.test(path))) return reply(400, { error: "Unsupported TMDB request." });

  const token = clean(env.TMDB_TOKEN);
  if (!token) return reply(503, { error: "TMDB is not connected on the server." });

  const qs = new URLSearchParams(url.searchParams);
  qs.delete("path");
  qs.delete("api_key");                          // never let a caller supply one
  const shortKey = /^[a-f0-9]{32}$/i.test(token); // TMDB's short API key vs the long token
  if (shortKey) qs.set("api_key", token);

  const res = await upstream(
    `${TMDB}${path}?${qs}`,
    shortKey ? { accept: "application/json" } : { accept: "application/json", authorization: `Bearer ${token}` },
    env,
  );
  return reply(res.status, await res.text(), res.ok ? CACHE_TMDB : "no-store");
}

export async function omdb(url, env) {
  const id = url.searchParams.get("i") ?? "";
  if (!/^tt\d{7,10}$/.test(id)) return reply(400, { error: "Expected an IMDb id such as tt0468569." });

  const key = clean(env.OMDB_KEY);
  if (!key) return reply(503, { error: "OMDb is not connected on the server." });

  const res = await fetch(`${OMDB}?${new URLSearchParams({ i: id, apikey: key, plot: "short" })}`);
  const body = await res.text();
  // OMDb says 200 even for errors ({"Response":"False"}); only cache real answers.
  let found = false;
  try { found = JSON.parse(body).Response === "True"; } catch { /* not JSON */ }
  return reply(res.ok ? 200 : res.status, body, found ? CACHE_OMDB : "no-store");
}

/* ---------- Watchmode: direct links into each streaming service ---------
 * TMDB/JustWatch say WHICH services carry a film; Watchmode adds a link
 * straight to the film on each one. The free plan is 1,000 requests a month,
 * so answers are cached at the edge for a day and trimmed to one row per
 * service and kind (a film listed in SD, HD and 4K is still one "Rent"). */
const WATCHMODE = "https://api.watchmode.com/v1";
const CACHE_WATCHMODE = "public, s-maxage=86400, stale-while-revalidate=604800";
const KINDS = { sub: "Subscription", free: "Free", rent: "Rent", buy: "Buy", tve: "With TV login" };
const FORMAT_RANK = { "4K": 3, HD: 2, SD: 1 };

export async function watchmode(url, env) {
  const id = url.searchParams.get("id") ?? "";
  if (!/^(movie-\d{1,9}|tt\d{7,10})$/.test(id)) return reply(400, { error: "Expected movie-<TMDB id> or an IMDb id." });
  const region = (url.searchParams.get("region") ?? "US").toUpperCase();
  if (!/^[A-Z]{2}$/.test(region)) return reply(400, { error: "Expected a two-letter country code." });

  const key = clean(env.WATCHMODE_KEY);
  if (!key) return reply(503, { error: "Watchmode is not connected on the server." });

  const res = await fetch(`${WATCHMODE}/title/${id}/sources/?${new URLSearchParams({ apiKey: key, regions: region })}`);
  let rows;
  try { rows = JSON.parse(await res.text()); } catch { rows = null; }
  // Each plan covers a set of countries; outside them Watchmode answers 400
  // "XX is not enabled for your current plan". That is an answer, not a
  // fault — an empty list, cached like any other so it costs one request a day.
  if (res.status === 400 && /not enabled/i.test(rows?.statusMessage ?? "")) {
    return reply(200, { region, sources: [], covered: false }, CACHE_WATCHMODE);
  }
  // Not found, over quota, or a bad key: Watchmode answers with an object, not a list.
  if (!res.ok || !Array.isArray(rows)) {
    return reply(res.status === 404 ? 404 : 502, { error: "Watchmode had no answer for this film." });
  }

  const best = new Map();
  for (const r of rows) {
    const link = typeof r.web_url === "string" && r.web_url.startsWith("https://") ? r.web_url : null;
    if (!link || !KINDS[r.type] || r.region !== region) continue;
    const k = `${r.source_id}|${r.type}`;
    const row = {
      id: r.source_id, name: r.name, kind: r.type, label: KINDS[r.type], url: link,
      format: r.format ?? null, price: typeof r.price === "number" ? r.price : null,
    };
    const had = best.get(k);
    const better = !had
      || (row.price ?? Infinity) < (had.price ?? Infinity)
      || ((row.price ?? Infinity) === (had.price ?? Infinity) && (FORMAT_RANK[row.format] ?? 0) > (FORMAT_RANK[had.format] ?? 0));
    if (better) best.set(k, row);
  }
  const order = ["free", "sub", "tve", "rent", "buy"];
  const sources = [...best.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.name.localeCompare(b.name));
  return reply(200, { region, sources, covered: true }, CACHE_WATCHMODE);
}

/* ---------- Email check: no temporary addresses -------------------------
 * Runs on the server so it can't be edited away in the browser. Three tests:
 *   format      looks like an email address
 *   disposable  not one of 8,771 known temporary-mail domains (or a
 *               subdomain of one, e.g. x.mailinator.com)
 *   no-mail     the domain can actually receive mail (has MX records)
 * The address arrives in a POST body, never a URL, so it stays out of logs. */
const EMAIL = /^[^\s@]{1,64}@([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})$/;

export async function checkEmail(email) {
  const value = String(email ?? "").trim().toLowerCase();
  const match = value.length <= 254 && value.match(EMAIL);
  if (!match) return { ok: false, reason: "format" };

  const parts = match[1].split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE.has(parts.slice(i).join("."))) return { ok: false, reason: "disposable" };
  }

  try {
    const mx = await Promise.race([
      dns.resolveMx(match[1]),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), 4000)),
    ]);
    if (!mx.length) return { ok: false, reason: "no-mail" };
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") return { ok: false, reason: "no-mail" };
    // A DNS hiccup on our side is not the visitor's fault: let them through.
  }
  return { ok: true, email: value };
}

/* ---------- Sign-in, step one --------------------------------------------
 * POST /api/signin {"name": "…", "email": "…"}
 *   1. checkEmail: no temporary inboxes, no domains that can't receive mail
 *   2. with Supabase connected (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
 *      create the account if it is new — public sign-ups stay OFF in
 *      Supabase, so this check is the only way to get an account — then have
 *      Supabase email a one-time code. The browser verifies that code with
 *      Supabase itself (src/context/AuthContext.jsx).
 *   3. without Supabase: answer {mode: "local"}; the browser signs in on this
 *      device only. No code is sent, because nothing is set up to send one. */
const nameOk = (n) => n.length >= 2 && n.length <= 40 && !/[<>]/.test(n) && ![...n].some((c) => c.codePointAt(0) < 32);

// The new sb_… keys go in `apikey` alone; the older JWT keys also as a Bearer token.
const supaHeaders = (k) => ({
  apikey: k, "content-type": "application/json",
  ...(k.startsWith("eyJ") ? { authorization: `Bearer ${k}` } : {}),
});

export async function signin(body, env) {
  const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");
  if (!nameOk(name)) return reply(422, { ok: false, reason: "name" });
  const check = await checkEmail(body?.email);
  if (!check.ok) return reply(422, check);

  const base = clean(env.SUPABASE_URL || env.VITE_SUPABASE_URL).replace(/\/+$/, "");
  const secret = clean(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!base || !secret) return reply(200, { ok: true, mode: "local", email: check.email, name });
  const publicKey = clean(env.VITE_SUPABASE_ANON_KEY) || secret;

  const created = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers: supaHeaders(secret),
    body: JSON.stringify({ email: check.email, email_confirm: true, user_metadata: { name } }),
  });
  if (!created.ok) {
    const why = await created.json().catch(() => ({}));
    const exists = created.status === 422 && /exist|already/i.test(`${why.code ?? ""} ${why.error_code ?? ""} ${why.msg ?? ""} ${why.message ?? ""}`);
    if (!exists) return reply(502, { ok: false, reason: "service" });
  }

  const sent = await fetch(`${base}/auth/v1/otp`, {
    method: "POST",
    headers: supaHeaders(publicKey),
    body: JSON.stringify({ email: check.email, create_user: false }),
  });
  if (!sent.ok) {
    const why = await sent.json().catch(() => ({}));
    const said = `${why.code ?? ""} ${why.error_code ?? ""} ${why.msg ?? ""} ${why.message ?? ""}`;
    if (sent.status === 429 || /rate.?limit/i.test(said)) return reply(429, { ok: false, reason: "wait" });
    // Supabase's built-in mailer only writes to the project's own team; anyone
    // else needs a custom SMTP sender set up in the dashboard.
    if (/not.?authori[sz]ed/i.test(said)) return reply(503, { ok: false, reason: "sender" });
    return reply(502, { ok: false, reason: "send" });
  }
  return reply(200, { ok: true, mode: "code", email: check.email });
}

const tooLarge = () => Object.assign(new Error("Too large."), { status: 413 });

/** Read a small JSON body from a Node request (2 KB cap). */
function readJson(req) {
  // Vercel has already read the body (req.body is a getter that throws on
  // malformed JSON); Vite's dev server hands over the raw stream.
  let pre;
  try { pre = req.body; } catch { return Promise.reject(new Error("Malformed JSON.")); }
  if (pre != null) {
    const text = typeof pre === "string" ? pre : Buffer.isBuffer(pre) ? pre.toString("utf8") : null;
    if (text === null) return Promise.resolve(pre);
    if (text.length > 2048) return Promise.reject(tooLarge());
    return Promise.resolve().then(() => (text ? JSON.parse(text) : {}));
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    let over = false;
    req.setEncoding("utf8");
    // Past the cap, keep draining but stop storing, then answer 413 — cutting
    // the connection would leave the caller with no answer at all.
    req.on("data", (chunk) => {
      if (over) return;
      raw += chunk;
      if (raw.length > 2048) { over = true; raw = ""; }
    });
    req.on("end", () => {
      if (over) return reject(tooLarge());
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

/** Route a request URL (a URL object) to the right upstream. */
export function route(url, env) {
  if (url.pathname === "/api/tmdb") return tmdb(url, env);
  if (url.pathname === "/api/omdb") return omdb(url, env);
  if (url.pathname === "/api/watchmode") return watchmode(url, env);
  return Promise.resolve(reply(404, { error: "Not found." }));
}

/** Answer a Node request/response pair — used by Vercel and by Vite dev. */
export async function handle(req, res, env) {
  let out;
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/signin") {
    if (req.method !== "POST") {
      out = reply(405, { error: "POST only." });
    } else {
      let body = null;
      let status = 400;
      try { body = await readJson(req); } catch (err) { status = err.status ?? 400; }
      try {
        out = body && typeof body === "object"
          ? await signin(body, env)
          : reply(status, { error: status === 413 ? "Too large." : "Send JSON like {\"name\": \"…\", \"email\": \"…\"}." });
      } catch {
        out = reply(502, { ok: false, reason: "service" });
      }
    }
  } else if (req.method !== "GET") {
    out = reply(405, { error: "GET only." });
  } else {
    try {
      out = await route(url, env);
    } catch {
      out = reply(502, { error: "The film database did not answer." });
    }
  }
  res.statusCode = out.status;
  for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  res.end(out.body);
}
