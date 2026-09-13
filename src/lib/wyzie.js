import { AETHER_KEY } from "./config.js";

/**
 * Fetch available subtitles from Wyzie for a given TMDB ID.
 * @param {number|string} tmdbId
 * @param {string} [lang="en"]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{ id: string, label: string, lang: string, url: string, isHearingImpaired: boolean }>>}
 */
export async function fetchWyzieSubtitles(tmdbId, lang = "en", signal) {
  if (!AETHER_KEY || !tmdbId) return [];

  try {
    const res = await fetch(
      `https://sub.wyzie.io/search?id=${encodeURIComponent(tmdbId)}&format=srt&language=${encodeURIComponent(lang)}&key=${encodeURIComponent(AETHER_KEY)}`,
      { signal },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const seen = new Set();
    const tracks = [];

    for (const item of data) {
      const language = item.language || "en";
      const display = item.display || "English";
      const variant = item.isHearingImpaired ? "cc" : "std";
      const key = `${language}-${variant}`;
      if (seen.has(key)) continue;
      seen.add(key);

      tracks.push({
        id: `wyzie-${item.id}`,
        label: `${display}${item.isHearingImpaired ? " (CC)" : ""} · Wyzie`,
        lang: language,
        url: item.url,
        isHearingImpaired: Boolean(item.isHearingImpaired),
      });
      if (tracks.length >= 4) break;
    }

    return tracks;
  } catch (err) {
    if (err.name === "AbortError") return [];
    console.warn("3Flix: Wyzie subtitle fetch failed", err);
    return [];
  }
}

/**
 * Convert SRT text into WebVTT text and return an Object URL blob.
 * @param {string} srtText
 * @returns {string} Blob URL
 */
export function srtToVttBlobUrl(srtText) {
  const vtt = "WEBVTT\n\n" + srtText.replace(/\r+/g, "").replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2").trim();
  const blob = new Blob([vtt], { type: "text/vtt" });
  return URL.createObjectURL(blob);
}

/**
 * Load an SRT file by URL and return a WebVTT Object URL.
 * @param {string} srtUrl
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
export async function loadSubAsVttUrl(srtUrl, signal) {
  const res = await fetch(srtUrl, { signal });
  if (!res.ok) throw new Error(`Failed to load subtitle file: ${res.status}`);
  const text = await res.text();
  return srtToVttBlobUrl(text);
}
