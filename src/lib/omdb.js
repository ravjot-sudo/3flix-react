/**
 * OMDb client — critics' and audiences' scores for a film, by IMDb id.
 *
 * TMDB gives us the IMDb id; OMDb turns it into IMDb, Rotten Tomatoes and
 * Metacritic scores, the age rating, awards and box office. Like TMDB, the
 * request goes to this site's /api/omdb and the server adds OMDB_KEY.
 * OMDb data is licensed CC BY-NC 4.0, so it is credited wherever it shows.
 */
const cache = new Map();

const present = (v) => (v && v !== "N/A" ? v : null);

export async function omdbRatings(imdbId, signal) {
  if (cache.has(imdbId)) return cache.get(imdbId);
  const res = await fetch(`/api/omdb?i=${encodeURIComponent(imdbId)}`, { signal });
  if (!res.ok) {
    const err = new Error(res.status === 503 ? "OMDb isn’t connected on the server yet." : `OMDb request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  const d = await res.json();
  if (d.Response !== "True") throw new Error(d.Error || "No OMDb record for this film.");

  const out = {
    imdbId,
    imdb: present(d.imdbRating) ? { score: d.imdbRating, votes: present(d.imdbVotes) } : null,
    rottenTomatoes: present(d.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value),
    metacritic: present(d.Metascore),
    rated: present(d.Rated),
    awards: present(d.Awards),
    boxOffice: present(d.BoxOffice),
  };
  cache.set(imdbId, out);
  return out;
}
