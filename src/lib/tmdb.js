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
  cinema: { label: "In cinemas", filters: false },
  free: { label: "Free to watch", filters: true },
  netflix: { label: "On Netflix", filters: true },
};

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
