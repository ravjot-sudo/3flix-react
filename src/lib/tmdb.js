/**
 * TMDB client — the catalogue of what is streaming on Netflix.
 *
 * TMDB (themoviedb.org) supplies the metadata: titles, posters, synopses,
 * ratings, cast, trailers, and — via JustWatch — which services carry a film
 * in which country. It does NOT supply the films themselves: Netflix titles
 * only play inside Netflix, so every Netflix film here links out to it.
 *
 * The token comes from VITE_TMDB_TOKEN in .env.local. Vite inlines it into
 * the bundle, so use TMDB's read-only "API Read Access Token" — it can read
 * the catalogue and nothing else.
 *
 * Demonstrates: fetch with async/await, AbortController, a module-level
 * cache (Map), URLSearchParams, and normalising a third-party payload into
 * the shape our components want.
 */
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export const tmdbToken = () =>
  (import.meta.env.VITE_TMDB_TOKEN ?? "").trim().replace(/^["']|["']$/g, "");
export const hasTmdb = () => tmdbToken().length >= 32;

// TMDB issues two credentials and either works here: the long "API Read
// Access Token" goes in an Authorization header; the short 32-character
// "API Key" goes in the query string. Both are read-only.
const isShortKey = (t) => /^[a-f0-9]{32}$/i.test(t);

/** Poster / backdrop / logo URL at a given TMDB size, or null. */
export const img = (path, size = "w500") => (path ? `${IMG}/${size}${path}` : null);

// Responses are cached by URL for the session: going back to a list, or
// reopening a film, costs nothing.
const cache = new Map();

async function get(path, params = {}, signal) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  // The cache key never contains the credential, even when it rides in the URL.
  const key = `${path}?${qs}`;
  if (cache.has(key)) return cache.get(key);

  const token = tmdbToken();
  if (isShortKey(token)) qs.set("api_key", token);
  const res = await fetch(`${BASE}${path}${qs.size ? `?${qs}` : ""}`, {
    signal,
    headers: isShortKey(token)
      ? { accept: "application/json" }
      : { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!res.ok) {
    const err = new Error(
      res.status === 401
        ? "TMDB rejected the key. Check VITE_TMDB_TOKEN in .env.local."
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

/** This week's (or today's) most-watched films worldwide. */
export async function trending({ window = "week", page = 1 }, signal) {
  return toPage(await get(`/trending/movie/${window}`, { page }, signal));
}

/** Playing in cinemas in `region` now. */
export async function nowPlaying({ region, page = 1 }, signal) {
  return toPage(await get("/movie/now_playing", { region, page }, signal));
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
