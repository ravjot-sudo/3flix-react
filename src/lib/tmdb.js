/**
 * TMDB client — the catalogue of new and popular films.
 *
 * TMDB (themoviedb.org) supplies the metadata: titles, posters, synopses,
 * ratings, cast, trailers, and — via JustWatch — which services carry a film
 * in which country. It does NOT supply the films themselves: new releases
 * only play on the services that license them, so every one links out.
 *
 * The key never reaches the browser: requests go to /api/tmdb, and the server
 * (server/proxy.js) adds TMDB_TOKEN from its own environment.
 *
 * Demonstrates: fetch with async/await, AbortController, a module-level
 * cache (Map), URLSearchParams, and normalising a third-party payload into
 * the shape our components want.
 */
// Requests go to this site's own /api/tmdb, which adds the key on the server
// (server/proxy.js). The browser never holds a TMDB credential.
const API = "/api/tmdb";
const IMG = "https://image.tmdb.org/t/p";

/**
 * Whether to use TMDB at all. The key lives on the server, so the browser
 * can't check it; if the server has none, requests answer 503 and each page
 * falls back (snapshots, or setup instructions). VITE_TMDB=off disables it.
 */
export const hasTmdb = () => import.meta.env.VITE_TMDB !== "off";

/** Poster / backdrop / logo URL at a given TMDB size, or null. */
export const img = (path, size = "w500") => (path ? `${IMG}/${size}${path}` : null);

// Responses are cached by URL for the session: going back to a list, or
// reopening a film, costs nothing.
const cache = new Map();

async function get(path, params = {}, signal) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  const key = `${path}?${qs}`;
  if (cache.has(key)) return cache.get(key);

  qs.set("path", path);
  const res = await fetch(`${API}?${qs}`, { signal, headers: { accept: "application/json" } });
  if (!res.ok) {
    const err = new Error(
      res.status === 503 ? "TMDB isn’t connected on the server yet."
        : res.status === 401 ? "TMDB rejected the server’s key."
          : `TMDB request failed (${res.status}).`,
    );
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  cache.set(key, data);
  return data;
}

/* ---------- region -------------------------------------------------- */
/** Best guess at the visitor's country from the browser's language tags. */
export function detectRegion() {
  const tags = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];
  for (const tag of tags) {
    const region = tag?.split("-")[1];
    if (region && /^[A-Z]{2}$/i.test(region)) return region.toUpperCase();
  }
  return "US";
}

export const REGIONS = [
  "US", "GB", "CA", "IN", "AU", "IE", "NZ", "SG", "AE", "ZA",
  "DE", "FR", "ES", "IT", "NL", "SE", "BR", "MX", "JP", "KR",
];

const regionNames = typeof Intl !== "undefined" && Intl.DisplayNames
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;
export const regionName = (code) => regionNames?.of(code) ?? code;

// Names that take "the" in a sentence: "in the United States", not "in United States".
const WITH_THE = new Set(["US", "GB", "AE", "NL", "PH", "DO", "BS", "GM", "CD", "CG", "KY", "MV", "VA"]);
/** A country as it reads after "in": "the United Kingdom", "India". */
export const inRegion = (code) => `${WITH_THE.has(code) ? "the " : ""}${regionName(code)}`;

/* ---------- Netflix -------------------------------------------------- */
/**
 * Netflix's provider id, looked up per region rather than hard-coded
 * (it is 8 almost everywhere, which is the fallback).
 */
async function netflixId(region, signal) {
  const data = await get("/watch/providers/movie", { watch_region: region }, signal);
  const hit = data.results?.find((p) => p.provider_name === "Netflix");
  return hit?.provider_id ?? 8;
}

export const SORTS = {
  popular: { label: "Popular", sort_by: "popularity.desc" },
  rated: { label: "Top rated", sort_by: "vote_average.desc", "vote_count.gte": 300 },
  newest: { label: "Newest", sort_by: "primary_release_date.desc" },
  title: { label: "A–Z", sort_by: "title.asc" },
};

/** One page of films streaming on Netflix (subscription) in `region`. */
export async function discoverNetflix({ region, genre, sort = "popular", page = 1 }, signal) {
  const provider = await netflixId(region, signal);
  const { label: _label, ...order } = SORTS[sort] ?? SORTS.popular;
  const data = await get("/discover/movie", {
    watch_region: region,
    with_watch_providers: provider,
    with_watch_monetization_types: "flatrate",
    with_genres: genre,
    include_adult: "false",
    page,
    ...order,
  }, signal);
  return toPage(data);
}

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
/** "11 Sep 2026", for the date a saved list was taken. */
export const savedOn = (iso) => (iso ? DAY.format(new Date(`${iso}T12:00:00`)) : "");

/* ---------- saved lists: when TMDB can't be reached ------------------- */
/**
 * If a live list fails — no key on the server, TMDB down, or a network that
 * blocks it — its first page falls back to a copy saved with the site
 * (public/snapshots/, refreshed by scripts/snapshots.mjs). The page then
 * carries `saved` (the date it was taken) so the UI can say it isn't live.
 */
const files = new Map();
function savedFile(name) {
  if (!files.has(name)) {
    const load = fetch(`/snapshots/${name}.json`).then((res) => {
      if (!res.ok) throw new Error(`No saved ${name} list.`);
      return res.json();
    });
    load.catch(() => files.delete(name));          // retried next time, not cached
    files.set(name, load);
  }
  return files.get(name);
}

async function orSaved(live, name, pick, page) {
  try {
    return await live();
  } catch (err) {
    if (err.name === "AbortError" || page > 1) throw err;
    let fallback;
    try {
      const file = await savedFile(name);
      const { results, region } = pick(file);
      if (results?.length) fallback = { ...toPage({ results, total_results: results.length, total_pages: 1 }), saved: file.taken, region };
    } catch { /* no saved copy either: report the original failure */ }
    if (!fallback) throw err;
    return fallback;
  }
}

/** This week's (or today's) most-watched films worldwide. */
export async function trending({ window = "week", page = 1 }, signal) {
  return orSaved(
    async () => toPage(await get(`/trending/movie/${window}`, { page }, signal)),
    "trending", (file) => ({ results: file.results }), page,
  );
}

/** Playing in cinemas in `region` now. */
export async function nowPlaying({ region, page = 1 }, signal) {
  return orSaved(
    async () => ({ ...toPage(await get("/movie/now_playing", { region, page }, signal)), region }),
    "now-playing",
    // Saved for India, the US and the UK; anywhere else gets the US list, labelled as such.
    (file) => {
      const r = file.regions?.[region] ? region : "US";
      return { results: file.regions?.[r], region: r };
    },
    page,
  );
}

/**
 * Films that stream FREE and legally in `region` — ad-supported or free
 * services such as Tubi, Pluto TV, Plex or YouTube, whichever operate there.
 */
export async function discoverFree({ region, genre, sort = "popular", page = 1 }, signal) {
  const { label: _label, ...order } = SORTS[sort] ?? SORTS.popular;
  const data = await get("/discover/movie", {
    watch_region: region,
    with_watch_monetization_types: "free|ads",
    with_genres: genre,
    include_adult: "false",
    page,
    ...order,
  }, signal);
  return toPage(data);
}

/** The four shelves the Movies page can show. */
export const LISTS = {
  trending: { label: "Trending", filters: false },
  top: { label: "Top rated", filters: true, sort: false },
  cinema: { label: "In cinemas", filters: false },
  free: { label: "Free to watch", filters: true },
  netflix: { label: "On Netflix", filters: true },
};

/* ---------- top rated ------------------------------------------------ */
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Highest-rated films released between `from` and today. `minVotes` keeps a
 * small, enthusiastic audience from outranking films millions have judged.
 */
export async function topRated({ genre, page = 1, from = "2000-01-01", minVotes = 5000 } = {}, signal) {
  const data = await get("/discover/movie", {
    sort_by: "vote_average.desc",
    "vote_count.gte": minVotes,
    "primary_release_date.gte": from,
    "primary_release_date.lte": today(),
    with_genres: genre,
    include_adult: "false",
    page,
  }, signal);
  return toPage(data);
}

/** Genres for "Eight ways in": claim order (scarcest first) and display order. */
const CLAIM = [[27, "Horror"], [16, "Animation"], [35, "Comedy"], [80, "Crime"],
  [878, "Science Fiction"], [53, "Thriller"], [28, "Action"], [18, "Drama"]];
const SHOW = [28, 16, 35, 80, 18, 27, 878, 53];

/** "Dune" and "Dune: Part Two" are one franchise; so is every Spider-Verse. */
const family = (m) => m.title.split(":")[0].trim().toLowerCase();

let picks = null;

/**
 * Everything the home page ranks, computed together so nothing repeats:
 *   six     the top six of 2008 onward (15,000+ votes)
 *   genres  eight genres × the top three of 2000 onward (5,000+ votes),
 *           skipping any film — or franchise — already on the page
 * One shared promise per session, so both sections reuse a single set of
 * requests. Deliberately not tied to one caller's AbortSignal.
 */
export function homePicks() {
  if (picks) return picks;
  picks = (async () => {
    const top = await topRated({ from: "2008-01-01", minVotes: 15000 });
    const six = top.results.slice(0, 6);
    const taken = new Set(six.map((m) => m.id));
    const families = new Set(six.map(family));
    const pages = await Promise.all(CLAIM.map(([id]) => topRated({ genre: id })));
    const decks = new Map();
    CLAIM.forEach(([id, name], k) => {
      const films = [];
      for (const m of pages[k].results) {
        if (films.length === 3) break;
        if (taken.has(m.id) || families.has(family(m))) continue;
        films.push(m);
        taken.add(m.id);
        families.add(family(m));
      }
      decks.set(id, { id, name, total: pages[k].total, films });
    });
    return { six, genres: SHOW.map((id) => decks.get(id)) };
  })();
  picks.catch(() => { picks = null; });   // a failure is retried next time, not cached
  return picks;
}

/* ---------- Library: new & popular ------------------------------------ */
/**
 * A TMDB result in the Library's own film shape, so the same grid, search and
 * genre filter work on it. `tmdbId` marks it as a catalogue title: it opens
 * its /movies page (trailer, where to watch) rather than the player.
 */
export const libraryFilm = (m, names) => ({
  id: `tmdb-${m.id}`,
  tmdbId: m.id,
  title: m.title ?? m.original_title ?? "Untitled",
  year: Number((m.release_date || "").slice(0, 4)) || null,
  director: "",
  genres: (m.genre_ids ?? []).map((id) => names.get(id)).filter(Boolean),
  runtime: null,
  rating: Math.round((m.vote_average ?? 0) * 10) / 10,
  votes: m.vote_count ?? 0,
  hue: (m.id * 47) % 360,
  synopsis: m.overview ?? "",
  video: null,
  tmdb: { poster: m.poster_path, backdrop: m.backdrop_path },
});

let newest = null;
const snapshot = async () => {
  const res = await fetch("/new-releases.json");
  if (!res.ok) throw new Error("Could not load the new releases.");
  return res.json();
};

/**
 * The 100 most popular films of 2023–2025 with 1,000+ votes, live from TMDB.
 * Pages that fail are skipped rather than failing the lot; with no key, or if
 * TMDB gives too little back, the snapshot in /new-releases.json is used.
 */
export function newReleases() {
  if (newest) return newest;
  newest = (async () => {
    if (!hasTmdb()) return snapshot();
    const [genres, ...pages] = await Promise.allSettled([
      movieGenres(),
      ...[1, 2, 3, 4, 5].map((page) => get("/discover/movie", {
        sort_by: "popularity.desc",
        "vote_count.gte": 1000,
        "primary_release_date.gte": "2023-01-01",
        "primary_release_date.lte": "2025-12-31",
        include_adult: "false",
        page,
      })),
    ]);
    const names = new Map((genres.value ?? []).map((g) => [g.id, g.name === "Science Fiction" ? "Sci-Fi" : g.name]));
    const seen = new Set();
    const films = pages
      .flatMap((p) => (p.status === "fulfilled" ? p.value.results ?? [] : []))
      .filter((m) => m.poster_path && !seen.has(m.id) && seen.add(m.id))
      .map((m) => libraryFilm(m, names));
    return films.length >= 20 && names.size ? films : snapshot();
  })();
  newest.catch(() => { newest = null; });   // retried next visit, not cached
  return newest;
}

/** Search every film TMDB knows, not just Netflix's. */
export async function searchMovies({ query, page = 1 }, signal) {
  const data = await get("/search/movie", { query, include_adult: "false", page }, signal);
  return toPage(data);
}

export async function movieGenres(signal) {
  const data = await get("/genre/movie/list", { language: "en" }, signal);
  return data.genres ?? [];
}

/** Everything the detail page needs, in one request. */
export async function movieDetail(id, region, signal) {
  const m = await get(`/movie/${id}`, { append_to_response: "videos,credits,watch/providers" }, signal);
  const here = m["watch/providers"]?.results?.[region] ?? {};
  const videos = (m.videos?.results ?? []).filter((v) => v.site === "YouTube");
  const trailer =
    videos.find((v) => v.type === "Trailer" && v.official) ??
    videos.find((v) => v.type === "Trailer") ??
    videos.find((v) => v.type === "Teaser") ??
    null;
  const asProvider = (p) => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path });
  const stream = (here.flatrate ?? []).map(asProvider);
  // Free and ad-supported services, de-duplicated (a service can be in both).
  const free = [...(here.free ?? []), ...(here.ads ?? [])]
    .map(asProvider)
    .filter((p, i, all) => all.findIndex((q) => q.id === p.id) === i);

  return {
    ...toFilm(m),
    runtime: m.runtime ?? 0,
    tagline: m.tagline ?? "",
    genres: (m.genres ?? []).map((g) => g.name),
    director: m.credits?.crew?.find((c) => c.job === "Director")?.name ?? "",
    cast: (m.credits?.cast ?? []).slice(0, 8).map((c) => ({ id: c.id, name: c.name, character: c.character })),
    trailerKey: trailer?.key ?? null,
    stream,
    free,
    imdbId: m.imdb_id || null,
    onNetflix: stream.some((p) => p.name === "Netflix"),
    providersLink: here.link ?? `https://www.themoviedb.org/movie/${m.id}/watch?locale=${region}`,
  };
}

/* ---------- normalising ---------------------------------------------- */
function toPage(data) {
  return {
    results: (data.results ?? []).map(toFilm),
    total: data.total_results ?? 0,
    // TMDB serves at most 500 pages of any list.
    totalPages: Math.min(data.total_pages ?? 0, 500),
  };
}

function toFilm(m) {
  return {
    id: m.id,
    title: m.title ?? m.original_title ?? "Untitled",
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    released: m.release_date ?? null,
    overview: m.overview ?? "",
    rating: typeof m.vote_average === "number" ? m.vote_average : null,
    votes: m.vote_count ?? 0,
    poster: m.poster_path ?? null,
    backdrop: m.backdrop_path ?? null,
  };
}

/** Stand-in for our generated <Poster/> when TMDB has no artwork. */
export const posterStandIn = (f) => ({
  id: `tmdb-${f.id}`,
  title: f.title,
  year: f.year ?? "",
  director: "",
  rating: f.rating ?? 0,
  hue: (f.id * 47) % 360,
  genres: [],
});

/** Netflix has no public deep links; its own search lands on the title. */
export const netflixUrl = (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`;
