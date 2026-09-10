import { useEffect, useState } from "react";
import { img } from "../lib/tmdb.js";

/**
 * POSTER ACCENTS — the colour a backdrop grades to when a film takes focus.
 *
 * Each poster is drawn once, tiny (24×36), onto a canvas and averaged, with
 * saturated mid-tone pixels weighted up so the result is the poster's colour
 * rather than its grey average. TMDB's image CDN sends CORS headers, which is
 * what allows reading the pixels back.
 *
 * The raw average is cached (memory + localStorage, versioned) and graded at
 * read time, so the grading can change without re-sampling a single poster.
 */
const STORE = "3flix:accents:v2";
const NEUTRAL = "hsl(222 16% 24%)";   // for black-and-white posters
const cache = new Map(Object.entries(read()));

function read() {
  try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { return {}; }
}
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(cache))); } catch { /* storage full or blocked */ }
}

function sample(path) {
  return new Promise((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.decoding = "async";
    im.onerror = () => resolve(null);
    im.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 24;
        c.height = 36;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(im, 0, 0, 24, 36);
        const d = ctx.getImageData(0, 0, 24, 36).data;
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const max = Math.max(d[i], d[i + 1], d[i + 2]);
          const min = Math.min(d[i], d[i + 1], d[i + 2]);
          const sat = max ? (max - min) / max : 0;
          const lum = (max + min) / 510;
          const wt = 0.1 + sat * sat * 3 * (lum > 0.1 && lum < 0.9 ? 1 : 0.15);
          r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
        }
        resolve([Math.round(r / w), Math.round(g / w), Math.round(b / w)]);
      } catch {
        resolve(null); // tainted canvas or decode failure: caller falls back
      }
    };
    im.src = img(path, "w92");
  });
}

/**
 * RGB → a vivid accent in the demo's register: high saturation, mid lightness,
 * so the whole backdrop reads as a colour, not a tint. Greys stay neutral
 * rather than inventing a hue a black-and-white poster never had.
 */
export function vivid([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max - min < 0.06) return NEUTRAL;
  const dd = max - min;
  const s = l > 0.5 ? dd / (2 - max - min) : dd / (max + min);
  let h = max === r ? (g - b) / dd + (g < b ? 6 : 0) : max === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
  h *= 60;
  if (s < 0.14) return NEUTRAL;
  // Yellows and greens are optically bright: sit them a little lower so white
  // type stays readable on them.
  const light = h > 40 && h < 170 ? 38 : 46;
  const sat = Math.round(Math.min(Math.max(s * 1.35, 0.6), 0.92) * 100);
  return `hsl(${Math.round(h)} ${sat}% ${light}%)`;
}

/** Map of poster path → vivid accent, filling in as samples arrive. */
export function useAccents(paths) {
  const [, setVersion] = useState(0);
  const key = paths.filter(Boolean).join("|");

  useEffect(() => {
    let alive = true;
    const todo = key ? key.split("|").filter((p) => !cache.has(p)) : [];
    todo.forEach((p) =>
      sample(p).then((rgb) => {
        cache.set(p, rgb);
        persist();
        if (alive) setVersion((v) => v + 1);
      }));
    return () => { alive = false; };
  }, [key]);

  return (path) => {
    const rgb = cache.get(path);
    return rgb ? vivid(rgb) : null;
  };
}
