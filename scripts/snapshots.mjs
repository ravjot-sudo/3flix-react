/**
 * Refreshes the fallback lists in public/snapshots/ from TMDB.
 *
 *   node scripts/snapshots.mjs
 *
 * It calls TMDB through the same server code the site uses (server/proxy.js),
 * so it reads TMDB_TOKEN — and TMDB_DNS, on networks that block TMDB — from
 * .env.local. The site uses these files only when a live request fails.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmdb } from "../server/proxy.js";

const root = new URL("..", import.meta.url);
// .env.local exists on a developer machine; in CI the keys come from the
// environment instead, so a missing file is fine there.
let fileEnv = {};
try {
  fileEnv = Object.fromEntries(
    readFileSync(new URL(".env.local", root), "utf8")
      .split("\n")
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
} catch { /* no .env.local: process.env carries the keys */ }
const env = { ...fileEnv, ...process.env };

async function get(path, params = {}) {
  const url = new URL("http://localhost/api/tmdb");
  url.searchParams.set("path", path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await tmdb(url, env);
  if (res.status !== 200) throw new Error(`${path} answered ${res.status}`);
  return JSON.parse(res.body);
}

// Only the fields the site reads, so the files stay small.
const keep = (m) => ({
  id: m.id,
  title: m.title,
  release_date: m.release_date,
  overview: m.overview,
  vote_average: m.vote_average,
  vote_count: m.vote_count,
  poster_path: m.poster_path,
  backdrop_path: m.backdrop_path,
});
const withArt = (list) => list.filter((m) => m.poster_path && m.backdrop_path).map(keep);

const taken = new Date().toISOString().slice(0, 10);
const regions = {};
for (const region of ["IN", "US", "GB"]) {
  regions[region] = withArt((await get("/movie/now_playing", { region, page: 1 })).results).slice(0, 16);
}
const trending = withArt((await get("/trending/movie/week", { page: 1 })).results);

const out = new URL("public/snapshots/", root);
mkdirSync(out, { recursive: true });
writeFileSync(new URL("now-playing.json", out), `${JSON.stringify({ taken, regions })}\n`);
writeFileSync(new URL("trending.json", out), `${JSON.stringify({ taken, results: trending })}\n`);

console.log(`Saved ${taken}: now playing ${Object.entries(regions).map(([r, l]) => `${r} ${l.length}`).join(", ")}; trending ${trending.length}.`);
