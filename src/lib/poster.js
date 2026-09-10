/**
 * Procedural poster art.
 *
 * Ported from the vanilla build, but returning an SVG *string* rather than a
 * DOM node — React owns the DOM here, so this module is reduced to pure
 * functions and the markup is rendered by <Poster />.
 *
 * ES6 features on show: modules, arrow functions, template literals,
 * destructuring, default parameters, and Array.from with a map callback.
 */

/** Deterministic PRNG (mulberry32): same seed, same sequence, every render. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash, so a film id can seed the generator. */
export function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const MOTIFS = {
  "Sci-Fi": (rand, c) => {
    const cy = 150 + rand() * 40;
    const rings = Array.from({ length: 4 }, (_, i) => {
      const r = 34 + i * 30;
      return `<circle cx="150" cy="${cy}" r="${r}" fill="none" stroke="${c}"
        stroke-width="${i === 1 ? 1.6 : 0.8}" opacity="${0.55 - i * 0.09}"/>`;
    }).join("");
    return `${rings}
      <circle cx="150" cy="${cy}" r="13" fill="${c}" opacity="0.85"/>
      <line x1="0" y1="${cy + 132}" x2="300" y2="${cy + 132}" stroke="${c}"
            stroke-width="0.9" opacity="0.5"/>`;
  },

  Horror: (rand, c) => {
    const w = 96 + rand() * 26;
    const x = 150 - w / 2;
    const top = 116;
    const r = w / 2;
    return `
      <path d="M${x} 322 L${x} ${top + r} A${r} ${r} 0 0 1 ${x + w} ${top + r} L${x + w} 322 Z"
            fill="${c}" opacity="0.13"/>
      <path d="M${x} 322 L${x} ${top + r} A${r} ${r} 0 0 1 ${x + w} ${top + r} L${x + w} 322"
            fill="none" stroke="${c}" stroke-width="1.4" opacity="0.6"/>
      <path d="M${x + 18} 322 L${x - 34} 450 L${x + w + 34} 450 L${x + w - 18} 322 Z"
            fill="${c}" opacity="0.07"/>`;
  },

  Noir: (rand, c) => {
    const slats = Array.from({ length: 11 }, (_, i) => {
      const y = 96 + i * 21;
      const inset = rand() * 34;
      return `<rect x="${26 + inset}" y="${y}" width="${248 - inset}" height="6"
        fill="${c}" opacity="${0.34 - i * 0.017}"/>`;
    }).join("");
    return `${slats}<circle cx="${112 + rand() * 76}" cy="212" r="30" fill="${c}" opacity="0.10"/>`;
  },

  Comedy: (rand, c) =>
    Array.from({ length: 3 }, (_, i) => {
      const o = i * 24;
      return `<rect x="${74 + o}" y="${132 + o}" width="112" height="112"
        fill="${i === 0 ? c : "none"}" fill-opacity="0.08" stroke="${c}"
        stroke-width="1.2" opacity="${0.6 - i * 0.15}"
        transform="rotate(${(rand() - 0.5) * 14} 150 195)"/>`;
    }).join(""),

  Documentary: (rand, c) => `
    <rect x="0" y="248" width="300" height="202" fill="${c}" opacity="0.08"/>
    <line x1="0" y1="248" x2="300" y2="248" stroke="${c}" stroke-width="1" opacity="0.55"/>
    <ellipse cx="${118 + rand() * 64}" cy="236" rx="7" ry="11" fill="${c}" opacity="0.7"/>`,

  default: (rand, c) => `
    <line x1="40" y1="216" x2="260" y2="216" stroke="${c}" stroke-width="1" opacity="0.55"/>
    <rect x="40" y="230" width="${76 + rand() * 90}" height="5" fill="${c}" opacity="0.45"/>`,
};

/**
 * Build the SVG innards for one film.
 * @param {{id:string, hue:number, genres:string[]}} film
 * @returns {string} SVG markup for a 300x450 viewBox
 */
export function buildPosterArt(film) {
  const { id, hue, genres } = film;          // destructuring
  const rand = seeded(hashId(id));
  const stroke = `hsl(${hue} 70% 72%)`;
  const key = genres.find((g) => g in MOTIFS);
  const draw = MOTIFS[key] ?? MOTIFS.default;
  return draw(rand, stroke);
}

/** Second hue for the gradient, derived so it is stable per film. */
export function secondHue(film) {
  const rand = seeded(hashId(film.id) ^ 0x9e3779b9);
  return Math.round((film.hue + 28 + rand() * 30) % 360);
}
