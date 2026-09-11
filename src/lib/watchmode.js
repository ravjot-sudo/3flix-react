/**
 * Watchmode client — a direct link to a film on each service that carries it.
 *
 * TMDB (via JustWatch) says WHERE a film streams; Watchmode adds the link
 * straight to the film on that service, and the rent/buy price. Requests go
 * to this site's /api/watchmode, which holds the key (server/proxy.js).
 *
 * Answers are cached for the session: Watchmode's free plan allows 1,000
 * requests a month, so the same film is never asked for twice.
 */
const cache = new Map();

/** { region, covered, sources: [{ id, name, kind, label, url, format, price }] } */
export async function watchLinks(tmdbId, region, signal) {
  const key = `${tmdbId}|${region}`;
  if (cache.has(key)) return cache.get(key);
  const res = await fetch(`/api/watchmode?${new URLSearchParams({ id: `movie-${tmdbId}`, region })}`, { signal });
  if (!res.ok) {
    const err = new Error("No direct links for this film.");
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  cache.set(key, data);
  return data;
}

const CURRENCY = { IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR" };

/** "₹119" — a rent or buy price in the country's own currency. */
export function price(amount, region) {
  if (typeof amount !== "number") return "";
  const currency = CURRENCY[region];
  if (!currency) return String(amount);
  // ₹119, not ₹119.00 — but $3.99 keeps its cents.
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(`en-${region}`, {
    style: "currency", currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}
