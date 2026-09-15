// Writes the README's animated artwork into docs/readme/:
//
//   hero.svg    the banner
//   tour.svg    01 what's on the home page
//   stack.svg   02 the tech stack, and how a request travels
//   keys.svg    03 the three keys and what each switches on
//   signin.svg  04 the sign-in, from the end of the opening to "you're in"
//   routes.svg  05 the route map, and the gate in front of it
//   deploy.svg  06 push to main → live
//   contributors.svg  07 who built it — computed from the git history
//
//   node scripts/readme-art.mjs
//
// GitHub shows SVGs in a README as images: no JavaScript, no web fonts, no
// outside requests. So everything here is self-contained — CSS keyframes and
// SMIL inside the file, system font stacks — and every animation stops under
// prefers-reduced-motion, leaving a still frame that still tells the story.
// Versions are read from package.json, so the stack card stays true when
// dependencies move.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const ver = (name) => {
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const m = String(all[name] ?? "").match(/(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2]}` : "";
};

const C = {
  ink: "#0c0c0b", surface: "#131312", raised: "#1b1b19", line: "#2a2a27",
  paper: "#f0eee6", fog: "#a8a79f", muted: "#74736b", gold: "#f6b519",
  ember: "#d4552f", mint: "#4cd7a0",
};
// The vivid accents "Now showing" grades to.
const ACCENTS = ["#2f96bc", "#7b61ff", "#ff4114", "#1ab8d1", "#ff2f9c", "#f6b519", "#3ecf8e", "#4356c8", "#e5231b", "#00c8ff"];
const SANS = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const EASE = "cubic-bezier(.65,0,.35,1)";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BASE_CSS = `
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .pulse-dot { display: none; }
  }`;

/* ---------- shared pieces ------------------------------------------ */
const pc = (p) => `${+p.toFixed(2)}%`;
/** @keyframes from [[percent | [percents], "css"], …] */
const kf = (name, frames) =>
  `@keyframes ${name} { ${frames.map(([p, d]) => `${[].concat(p).map(pc).join(", ")} { ${d} }`).join(" ")} }`;

/** Dwell on each of n positions in turn (72% of each slot), then return to the first. */
const dwell = (name, n, decl, hold = 0.72) => {
  const frames = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * 100;
    frames.push([[a, a + (100 / n) * hold], decl(i)]);
  }
  frames.push([100, decl(0)]);
  return kf(name, frames);
};

const open = (W, H, title, desc) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>`;

/** The section rail every card opens with, as on the site. */
const rail = (num, label, title, gold) => `<line x1="56" y1="52" x2="356" y2="52" stroke="${C.line}"/>
<text class="mono" x="56" y="78" font-size="12" letter-spacing="2" fill="${C.gold}">${num}</text>
<text class="mono" x="356" y="78" font-size="12" letter-spacing="3" text-anchor="end" fill="${C.muted}">${esc(label)}</text>
<text class="sans" x="400" y="86" font-size="40" font-weight="800" letter-spacing="-1.4" fill="${C.paper}">${esc(title)} <tspan fill="${C.gold}">${esc(gold)}</tspan></text>`;

const caption = (H, text) =>
  `<text class="mono" x="56" y="${H - 22}" font-size="11" letter-spacing="1.6" fill="${C.muted}">${esc(text)}</text>`;

/** Poster stand-ins: colour-graded frames in the accents (no images to fetch). */
const posterDefs = () => ACCENTS.map((c, i) =>
  `<linearGradient id="t${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".35"/></linearGradient>`).join("");
const poster = (x, y, w, h, i, attrs = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#t${((i % 10) + 10) % 10})" ${attrs}/>`;

const box = (b, fill = C.surface, stroke = C.line) =>
  `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fill}" stroke="${stroke}"/>`;

/** A dashed connector with gold dashes flowing along it, and a travelling pulse. */
const wire = (id, d, colour = C.gold) => `<path id="${id}" d="${d}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <path d="${d}" fill="none" stroke="${colour}" stroke-width="1.5" class="flow"/>`;
const pulse = (id, dur, begin, colour = C.gold) => `<circle class="pulse-dot" r="4" fill="${colour}">
    <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#${id}"/></animateMotion>
  </circle>`;
const FLOW_CSS = `
  .flow { stroke-dasharray: 5 11; animation: flow 1.1s linear infinite; }
  @keyframes flow { to { stroke-dashoffset: -16; } }
  .appear { animation: appear .9s cubic-bezier(.16,1,.3,1) both; }
  @keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`;

/* ================================================================== */
/* HERO                                                               */
/* ================================================================== */
function hero() {
  const W = 1200, H = 440;
  const cx = 930, cy = 222;

  // Nav links with fixed positions, so the underline can glide between them.
  const links = [["HOME", 780], ["LIBRARY", 846], ["MOVIES", 942], ["WATCHLIST", 1028]];
  const cw = 9.8; // mono 12px + 2.6 tracking
  const widths = links.map(([t]) => t.length * cw - 2.6);
  const stops = links.map(([, x], i) => ({ tx: x - links[0][1], sx: widths[i] / widths[0] }));
  const navKeys = [];
  stops.forEach((s, i) => {
    const a = i * 25, b = a + 18;
    navKeys.push(`${a}%, ${b}% { transform: translateX(${s.tx}px) scaleX(${s.sx.toFixed(3)}); }`);
  });
  navKeys.push(`100% { transform: translateX(0px) scaleX(1); }`);

  // Film strip: 20 frames over two identical 1200px cycles, so it loops seamlessly.
  const period = 120, tileW = 106, tileH = 28, stripY = 396;
  const tiles = [];
  const holes = [];
  for (let i = 0; i < 20; i += 1) {
    const x = 12 + i * period;
    tiles.push(`<rect x="${x}" y="${stripY}" width="${tileW}" height="${tileH}" fill="url(#t${i % 10})"/>`);
  }
  for (let x = 4; x < 2400; x += 20) {
    holes.push(`<rect x="${x}" y="388" width="8" height="4" fill="${C.line}"/><rect x="${x}" y="428" width="8" height="4" fill="${C.line}"/>`);
  }

  const ring = "REACT 19 · FRAMER MOTION · VITE 8 · TMDB · OMDB · VERCEL · ";
  const accentKeys = ACCENTS.slice(0, 6).map((c, i) => `${Math.round((i / 6) * 100)}% { stop-color: ${c}; fill: ${c}; }`).join(" ") + ` 100% { stop-color: ${ACCENTS[0]}; fill: ${ACCENTS[0]}; }`;

  return `${open(W, H, "3Flix — cinema that outlived its copyright",
    "Animated banner in the site's style: a gold navigation bar, the headline rising into view, a ring of the tech stack turning around a gold play button, and a strip of colour-graded film frames running along the bottom.")}
<defs>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop class="accent" offset="0" stop-color="${ACCENTS[0]}" stop-opacity=".5"/>
    <stop offset="1" stop-color="${C.ink}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="aperture" cx="42%" cy="36%" r="75%">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".22"/>
    <stop offset="1" stop-color="#000000" stop-opacity=".35"/>
  </radialGradient>
  <clipPath id="line1"><rect x="40" y="140" width="780" height="70"/></clipPath>
  <clipPath id="line2"><rect x="40" y="210" width="780" height="74"/></clipPath>
  <path id="ring" d="M-120,0 a120,120 0 1,1 240,0 a120,120 0 1,1 -240,0"/>
  <linearGradient id="edgeFade" x1="0" x2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".08" stop-color="#fff"/>
    <stop offset=".92" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="edges"><rect width="${W}" height="${H}" fill="url(#edgeFade)"/></mask>
  ${posterDefs()}
</defs>
<style>${BASE_CSS}
  .accent { animation: accent 18s linear infinite; }
  @keyframes accent { ${accentKeys} }
  .rise { animation: rise 1.1s cubic-bezier(.16,1,.3,1) both; }
  .d1 { animation-delay: .15s; } .d2 { animation-delay: .32s; }
  @keyframes rise { from { transform: translateY(78px); } to { transform: none; } }
  .fade { animation: fade .9s cubic-bezier(.16,1,.3,1) both; }
  .d3 { animation-delay: .6s; } .d4 { animation-delay: .78s; } .d5 { animation-delay: .95s; }
  @keyframes fade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .spin { animation: spin 26s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .play { animation: pulse 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  @keyframes pulse { 50% { transform: scale(1.07); } }
  .strip { animation: strip 44s linear infinite; }
  @keyframes strip { to { transform: translateX(-1200px); } }
  .underline { transform-box: fill-box; transform-origin: left; animation: nav 9s ${EASE} infinite; }
  @keyframes nav { ${navKeys.join(" ")} }
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
<circle cx="${cx}" cy="${cy}" r="300" fill="url(#glow)"/>

<!-- nav bar -->
<rect x="24" y="18" width="1152" height="54" fill="${C.gold}"/>
<rect x="50" y="35" width="26" height="20" fill="none" stroke="${C.ink}" stroke-width="1.8"/>
<path d="M60 40.5v9l7.5-4.5z" fill="${C.ink}"/>
<text class="sans" x="86" y="53" font-size="22" font-weight="800" letter-spacing="-0.8" fill="${C.ink}">3Flix</text>
${links.map(([t, x]) => `<text class="mono" x="${x}" y="50" font-size="12" font-weight="600" letter-spacing="2.6" fill="${C.ink}">${t}</text>`).join("\n")}
<rect class="underline" x="${links[0][1]}" y="57" width="${widths[0].toFixed(1)}" height="2" fill="${C.ink}"/>

<!-- copy -->
<text class="mono fade" x="56" y="124" font-size="12.5" letter-spacing="3" fill="${C.gold}">PUBLIC DOMAIN · NEW RELEASES · WHAT'S TRENDING</text>
<g clip-path="url(#line1)"><text class="sans rise d1" x="54" y="198" font-size="62" font-weight="800" letter-spacing="-2.2" fill="${C.paper}">Cinema that outlived</text></g>
<g clip-path="url(#line2)"><text class="sans rise d2" x="54" y="264" font-size="62" font-weight="800" letter-spacing="-2.2" fill="${C.gold}">its copyright.</text></g>
<text class="sans fade d3" x="56" y="312" font-size="18" fill="${C.fog}">React 19 · React Router 7 · framer-motion · Vite 8 · Vercel · TMDB</text>
<g class="fade d4">
  <rect x="56" y="332" width="316" height="42" fill="${C.gold}"/>
  <path d="M76 346v14l11-7z" fill="${C.ink}"/>
  <text class="mono" x="98" y="358" font-size="13" font-weight="600" letter-spacing="2" fill="${C.ink}">3FLIX-REACT.VERCEL.APP</text>
</g>

<!-- the aperture: accent grade, turning ring, play button -->
<g transform="translate(${cx} ${cy})">
  <circle r="94" class="accent" fill="${ACCENTS[0]}"/>
  <circle r="94" fill="url(#aperture)"/>
  <g class="spin">
    <text class="mono" font-size="13" font-weight="600" letter-spacing="4" fill="${C.paper}">
      <textPath href="#ring" textLength="740" lengthAdjust="spacing">${esc(ring)}</textPath>
    </text>
  </g>
  <g class="play">
    <rect x="-32" y="-32" width="64" height="64" fill="${C.gold}"/>
    <path d="M-8 -12v24l19-12z" fill="${C.ink}"/>
  </g>
</g>

<!-- film strip -->
<rect x="0" y="384" width="${W}" height="52" fill="${C.surface}"/>
<g mask="url(#edges)">
  <g class="strip">
    ${holes.join("")}
    ${tiles.join("\n    ")}
  </g>
</g>
</svg>
`;
}

/* ================================================================== */
/* 01 TOUR — the home page, scrolled for you                          */
/* ================================================================== */
function tour() {
  const W = 1200, H = 560;
  const win = { x: 56, y: 124, w: 704, h: 400 };
  const vp = { x: 68, y: 176, w: 666, h: 336 };
  const S = vp.h;                   // one section per screen
  const sections = 5;
  const T = 16;                     // seconds for the whole tour

  const genres = ["Action", "Animation", "Comedy", "Crime", "Drama", "Horror", "Sci-Fi", "Thriller"];
  const top6 = ["DARK KNIGHT", "PARASITE", "INTERSTELLAR", "SPIDER-VERSE", "WHIPLASH", "INCEPTION"];
  const y0 = (i) => vp.y + i * S;

  // 0 · the opening
  const opening = `<rect x="${vp.x}" y="${y0(0)}" width="${vp.w}" height="${S}" fill="${C.ink}"/>
    <text class="mono" x="88" y="${y0(0) + 30}" font-size="10" letter-spacing="2.4" fill="${C.muted}">3FLIX · PUBLIC DOMAIN CINEMA</text>
    <text class="sans" x="401" y="${y0(0) + 146}" text-anchor="middle" font-size="36" font-weight="800" letter-spacing="-1.4" fill="${C.paper}">Twenty-four films outlived</text>
    <text class="sans" x="401" y="${y0(0) + 190}" text-anchor="middle" font-size="36" font-weight="800" letter-spacing="-1.4" fill="${C.gold}">their copyright.</text>
    <g transform="translate(401 ${y0(0) + 258})">
      <circle class="breathe" r="22" fill="none" stroke="${C.gold}" stroke-width="1.5"/>
      <path d="M-5 -8v16l13-8z" fill="${C.gold}"/>
    </g>
    <text class="mono" x="401" y="${y0(0) + 316}" text-anchor="middle" font-size="9.5" letter-spacing="2.4" fill="${C.muted}">SCROLL</text>`;

  // 1 · eight ways in
  const pw = 150, ph = 128;
  const panels = genres.map((g, k) => {
    const x = 88 + (k % 4) * 158, y = y0(1) + 58 + Math.floor(k / 4) * 136;
    const cx = x + pw / 2, by = y + 118;
    const card = (i, cls) => `<rect class="${cls}" style="animation-delay:${(k * 0.18).toFixed(2)}s" x="${cx - 16}" y="${by - 46}" width="32" height="46" fill="url(#t${(k + i) % 10})"/>`;
    return `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${C.surface}" stroke="${C.line}"/>
    <text class="mono" x="${x + 10}" y="${y + 18}" font-size="9.5" letter-spacing="1.4" fill="${C.gold}">${String(k + 1).padStart(2, "0")}</text>
    <text class="sans" x="${x + 10}" y="${y + 37}" font-size="14" font-weight="700" fill="${C.paper}">${g}</text>
    ${card(2, "fanL")}${card(4, "fanR")}${card(0, "front")}`;
  }).join("\n    ");
  const browse = `<text class="sans" x="88" y="${y0(1) + 40}" font-size="24" font-weight="800" letter-spacing="-0.8" fill="${C.paper}">Eight ways <tspan fill="${C.gold}">in.</tspan></text>
    <text class="mono" x="714" y="${y0(1) + 40}" text-anchor="end" font-size="10" letter-spacing="2" fill="${C.muted}">01 · BROWSE</text>
    ${panels}`;

  // 2 · now showing
  const cards = Array.from({ length: 6 }, (_, k) => {
    const x = 330 + k * 84, full = k === 1;
    return poster(x, y0(2) + 52, 74, full ? 168 : 84, k + 2, full ? `stroke="${C.paper}" stroke-opacity=".5"` : `opacity=".8"`);
  }).join("\n    ");
  const nowShowing = `<rect class="grade" x="${vp.x}" y="${y0(2)}" width="${vp.w}" height="${S}" fill="${ACCENTS[0]}"/>
    <rect x="${vp.x}" y="${y0(2)}" width="${vp.w}" height="${S}" fill="url(#shade)"/>
    <text class="mono" x="88" y="${y0(2) + 30}" font-size="10" letter-spacing="2.4" fill="${C.paper}" fill-opacity=".85">02 · NOW SHOWING · IN CINEMAS IN INDIA</text>
    ${cards}
    <text class="sans" x="88" y="${y0(2) + 250}" font-size="36" font-weight="800" letter-spacing="-1.2" fill="${C.paper}">Mutiny</text>
    <text class="mono" x="88" y="${y0(2) + 274}" font-size="10" letter-spacing="1.8" fill="${C.paper}" fill-opacity=".8">21 AUG 2026 · IN CINEMAS</text>
    <rect x="88" y="${y0(2) + 288}" width="164" height="28" fill="${C.ink}"/>
    <text class="mono" x="100" y="${y0(2) + 306}" font-size="9.5" font-weight="600" letter-spacing="1.6" fill="${C.paper}">TRAILER &amp; DETAILS ›</text>`;

  // 3 · top six
  const ranks = top6.map((t, k) => {
    const x = 88 + k * 104;
    return `<text class="sans" x="${x + 2}" y="${y0(3) + 232}" font-size="120" font-weight="800" fill="none" stroke="${C.gold}" stroke-width="1.5">${k + 1}</text>
    ${poster(x + 40, y0(3) + 112, 58, 86, k + 5)}
    <text class="mono" x="${x + 40}" y="${y0(3) + 216}" font-size="8" letter-spacing="0.8" fill="${C.fog}">${t}</text>`;
  }).join("\n    ");
  const topSix = `<text class="sans" x="88" y="${y0(3) + 40}" font-size="24" font-weight="800" letter-spacing="-0.8" fill="${C.paper}">The top six, <tspan fill="${C.gold}">since 2008.</tspan></text>
    <text class="mono" x="714" y="${y0(3) + 40}" text-anchor="end" font-size="10" letter-spacing="2" fill="${C.muted}">03 · TOP SIX</text>
    ${ranks}`;

  // 4 · trending
  const row = Array.from({ length: 6 }, (_, k) => {
    const x = 88 + k * 106, y = y0(4) + 62;
    return `${poster(x, y, 96, 144, k + 1)}
    <rect x="${x}" y="${y + 154}" width="72" height="7" fill="${C.paper}" fill-opacity=".8"/>
    <rect x="${x}" y="${y + 168}" width="44" height="5" fill="${C.muted}"/>`;
  }).join("\n    ");
  const trending = `<text class="sans" x="88" y="${y0(4) + 40}" font-size="24" font-weight="800" letter-spacing="-0.8" fill="${C.paper}">Trending <tspan fill="${C.gold}">this week.</tspan></text>
    <text class="mono" x="714" y="${y0(4) + 40}" text-anchor="end" font-size="10" letter-spacing="2" fill="${C.muted}">04 · TRENDING</text>
    ${row}`;

  const list = [
    ["Opening", "title sequence · then the sign-in"],
    ["Eight ways in", "top rated since 2000, by genre"],
    ["Now showing", "in cinemas where you are"],
    ["Top six", "highest rated since 2008"],
    ["Trending", "this week, worldwide"],
  ];
  const rowH = 64, listTop = 176;

  return `${open(W, H, "What's on the 3Flix home page",
    "A browser window scrolls through the home page on its own: the opening title sequence, Eight ways in (eight genres, each with a fanned deck of posters), Now showing (a filmstrip over a backdrop that changes colour), the top six since 2008, and this week's trending row. A list beside it marks the section on screen.")}
<defs>
  <clipPath id="vp"><rect x="${vp.x}" y="${vp.y}" width="${vp.w}" height="${vp.h}"/></clipPath>
  <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".55"/>
  </linearGradient>
  ${posterDefs()}
</defs>
<style>${BASE_CSS}
  .scroll { animation: scroll ${T}s ${EASE} infinite; }
  ${dwell("scroll", sections, (i) => `transform: translateY(${-i * S}px);`)}
  .thumb { animation: thumb ${T}s ${EASE} infinite; }
  ${dwell("thumb", sections, (i) => `transform: translateY(${(i * S) / sections}px);`)}
  .marker { animation: marker ${T}s ${EASE} infinite; }
  ${dwell("marker", sections, (i) => `transform: translateY(${i * rowH}px);`)}
  .grade { animation: grade 12s linear infinite; }
  ${kf("grade", [...ACCENTS.slice(0, 6).map((c, i) => [(i / 6) * 100, `fill: ${c};`]), [100, `fill: ${ACCENTS[0]};`]])}
  .fanL, .fanR, .front { transform-box: fill-box; transform-origin: 50% 100%; }
  .fanL { transform: rotate(-12deg); animation: fanL 4s ease-in-out infinite; }
  .fanR { transform: rotate(12deg); animation: fanR 4s ease-in-out infinite; }
  @keyframes fanL { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(-17deg) translateX(-4px); } }
  @keyframes fanR { 0%, 100% { transform: rotate(7deg); } 50% { transform: rotate(17deg) translateX(4px); } }
  .breathe { transform-box: fill-box; transform-origin: center; animation: breathe 2.6s ease-in-out infinite; }
  @keyframes breathe { 50% { transform: scale(1.18); opacity: .5; } }
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("01", "WHAT'S INSIDE", "A title sequence,", "then the menu.")}

<!-- the browser window -->
${box(win, C.surface, C.line)}
<rect x="68" y="136" width="680" height="30" fill="${C.gold}"/>
<rect x="80" y="144" width="18" height="14" fill="none" stroke="${C.ink}" stroke-width="1.4"/>
<path d="M87 148v6l5-3z" fill="${C.ink}"/>
<text class="sans" x="106" y="157" font-size="14" font-weight="800" letter-spacing="-0.4" fill="${C.ink}">3Flix</text>
${["HOME", "LIBRARY", "MOVIES", "WATCHLIST", "ABOUT"].reduce((acc, t) => {
  acc.out.push(`<text class="mono" x="${acc.x}" y="155" font-size="8.5" font-weight="600" letter-spacing="1.4" fill="${C.ink}">${t}</text>`);
  acc.x += t.length * 6.6 + 24;   // mono 8.5px + tracking, then a gap
  return acc;
}, { x: 356, out: [] }).out.join("")}
<rect x="712" y="141" width="20" height="20" fill="${C.ink}"/>
<text class="sans" x="722" y="156" text-anchor="middle" font-size="11" font-weight="800" fill="${C.gold}">R</text>

<g clip-path="url(#vp)">
  <g class="scroll">
    ${opening}
    ${browse}
    ${nowShowing}
    ${topSix}
    ${trending}
  </g>
</g>
<rect x="740" y="${vp.y}" width="3" height="${vp.h}" fill="${C.line}"/>
<rect class="thumb" x="740" y="${vp.y}" width="3" height="${(vp.h / sections).toFixed(1)}" fill="${C.gold}"/>

<!-- what's on screen -->
<text class="mono" x="800" y="150" font-size="11" letter-spacing="2.4" fill="${C.muted}">ON THE HOME PAGE</text>
<g class="marker">
  <rect x="784" y="${listTop}" width="360" height="${rowH - 10}" fill="${C.gold}" fill-opacity=".1"/>
  <rect x="784" y="${listTop}" width="3" height="${rowH - 10}" fill="${C.gold}"/>
</g>
${list.map(([name, what], i) => `<text class="sans" x="804" y="${listTop + i * rowH + 24}" font-size="18" font-weight="700" fill="${C.paper}">${esc(name)}</text>
<text class="mono" x="804" y="${listTop + i * rowH + 42}" font-size="11" letter-spacing="0.4" fill="${C.fog}">${esc(what)}</text>`).join("\n")}

${caption(H, "SIGNED OUT, THE PAGE ENDS AFTER THE OPENING AND THE SIGN-IN POPS UP · EVERY POSTER OPENS ITS FILM")}
</svg>
`;
}

/* ================================================================== */
/* 02 STACK                                                           */
/* ================================================================== */
function stack() {
  const W = 1200, H = 660;
  const layers = [
    { name: "framer-motion", v: ver("framer-motion"), role: "springs · scroll-linked motion · layout", c: "#ff2f9c" },
    { name: "React Router", v: ver("react-router-dom"), role: "nested + dynamic routes · URL state", c: "#ff6a3d" },
    { name: "React", v: ver("react"), role: "components · hooks · context · memo", c: "#2fb1d6" },
    { name: "Plain CSS", v: "tokens", role: "design tokens · grid · no framework", c: C.gold },
    { name: "Vite", v: ver("vite"), role: "dev server · HMR · production build", c: "#8b6cff" },
    { name: "Vercel Functions", v: "/api/*", role: "proxy · keys stay on the server", c: C.paper },
    { name: "GitHub Actions", v: "daily", role: "refreshes the saved lists every morning", c: "#3ecf8e" },
  ];
  const x0 = 56, x1 = 640, top = 150, h = 56, gap = 10;
  const n = layers.length;

  const bars = layers.map((l, i) => {
    const y = top + i * (h + gap);
    const delay = ((n - 1 - i) * 0.12 + 0.2).toFixed(2); // builds from the bottom up
    return `<g class="bar" style="animation-delay:${delay}s">
    <rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="${C.surface}" stroke="${C.line}"/>
    <rect x="${x0}" y="${y}" width="4" height="${h}" fill="${l.c}"/>
    <text class="sans" x="${x0 + 26}" y="${y + 25}" font-size="19" font-weight="700" letter-spacing="-0.4" fill="${C.paper}">${esc(l.name)}</text>
    <text class="mono" x="${x0 + 26}" y="${y + 44}" font-size="11.5" letter-spacing="0.6" fill="${C.fog}">${esc(l.role)}</text>
    <text class="mono" x="${x1 - 20}" y="${y + 34}" font-size="12" font-weight="600" letter-spacing="1" text-anchor="end" fill="${l.c}">${esc(l.v)}</text>
  </g>`;
  }).join("\n  ");

  // Architecture diagram
  const D = { x: 700, w: 444 };
  const browser = { x: D.x, y: 150, w: D.w, h: 70 };
  const api = { x: D.x + 60, y: 290, w: D.w - 120, h: 64 };
  const services = [
    { name: "TMDB", role: "catalogue · trailers" },
    { name: "OMDb", role: "IMDb · RT · Metacritic" },
    { name: "Watchmode", role: "a link per service" },
    { name: "DNS (MX)", role: "sign-in: a real inbox?" },
  ].map((s, i) => ({ ...s, x: D.x + (i % 2) * 234, y: 424 + Math.floor(i / 2) * 62, w: 210, h: 50 }));
  const archive = { x: D.x, y: 570, w: D.w, h: 50 };
  const mid = (b) => b.x + b.w / 2;

  // Top-row services are reached with a curve; the bottom row is reached down
  // the gutter between the columns, so no line (or pulse) crosses a box.
  const gutter = mid(api);
  const toService = (s, i) => (i < 2
    ? `M${gutter} ${api.y + api.h} C${gutter} ${api.y + api.h + 30} ${mid(s)} ${s.y - 30} ${mid(s)} ${s.y}`
    : `M${gutter} ${api.y + api.h} V${s.y + s.h / 2} H${i === 2 ? s.x + s.w : s.x}`);
  const paths = [
    { id: "p0", d: `M${mid(browser)} ${browser.y + browser.h} V${api.y}` },
    ...services.map((s, i) => ({ id: `p${i + 1}`, d: toService(s, i) })),
    // Streams bypass the server: round the right edge, straight to the archive.
    { id: "p5", d: `M${browser.x + browser.w} ${browser.y + browser.h / 2} H${browser.x + browser.w + 26} V${archive.y + archive.h / 2} H${archive.x + archive.w}` },
  ];

  return `${open(W, H, "3Flix tech stack and architecture",
    "Left: the stack, built up layer by layer — framer-motion, React Router, React, plain CSS, Vite, Vercel Functions and GitHub Actions — with a gold light scanning down it. Right: requests flowing from the browser to the site's own /api routes on Vercel, which add the keys and call TMDB, OMDb, Watchmode and a DNS lookup for sign-in; the classics stream straight from the Internet Archive.")}
<style>${BASE_CSS}${FLOW_CSS}
  .bar { animation: slide .8s cubic-bezier(.16,1,.3,1) both; }
  @keyframes slide { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }
  /* The light only switches on once the stack has finished building. */
  .scan { animation: scan-in .6s ease-out 1.4s both, scan 9.8s ${EASE} 1.4s infinite both; }
  @keyframes scan-in { from { opacity: 0; } to { opacity: 1; } }
  ${dwell("scan", n, (i) => `transform: translateY(${i * (h + gap)}px);`)}
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("02", "TECH STACK", "What 3Flix", "runs on.")}
<text class="mono" x="${x0}" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">THE STACK</text>
<text class="mono" x="${D.x}" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">HOW A REQUEST TRAVELS</text>

<!-- the stack -->
<g class="scan">
  <rect x="${x0}" y="${top}" width="${x1 - x0}" height="${h}" fill="${C.gold}" fill-opacity=".1"/>
  <rect x="${x0 - 8}" y="${top}" width="3" height="${h}" fill="${C.gold}"/>
</g>
  ${bars}

<!-- the architecture -->
<g class="appear" style="animation-delay:.5s">
  ${paths.map((p) => wire(p.id, p.d, p.id === "p5" ? "#3ecf8e" : C.gold)).join("\n  ")}
  ${box(browser, C.raised, C.line)}
  <text class="sans" x="${browser.x + 20}" y="${browser.y + 30}" font-size="19" font-weight="700" fill="${C.paper}">Browser</text>
  <text class="mono" x="${browser.x + 20}" y="${browser.y + 52}" font-size="11.5" letter-spacing="0.6" fill="${C.fog}">React 19 · Router 7 · framer-motion</text>

  ${box(api, C.gold, C.gold)}
  <text class="sans" x="${api.x + 20}" y="${api.y + 28}" font-size="18" font-weight="800" fill="${C.ink}">/api/* on Vercel</text>
  <text class="mono" x="${api.x + 20}" y="${api.y + 48}" font-size="11" letter-spacing="0.6" fill="${C.ink}">server/proxy.js adds the keys</text>

  ${services.map((s) => `${box(s)}
  <text class="sans" x="${s.x + 16}" y="${s.y + 22}" font-size="15" font-weight="700" fill="${C.paper}">${esc(s.name)}</text>
  <text class="mono" x="${s.x + 16}" y="${s.y + 39}" font-size="10.5" letter-spacing="0.4" fill="${C.fog}">${esc(s.role)}</text>`).join("\n  ")}

  ${box(archive, C.surface, "#3ecf8e")}
  <text class="sans" x="${archive.x + 16}" y="${archive.y + 22}" font-size="15" font-weight="700" fill="${C.paper}">Internet Archive</text>
  <text class="mono" x="${archive.x + 16}" y="${archive.y + 39}" font-size="10.5" letter-spacing="0.4" fill="#3ecf8e">the 24 classics stream straight to the player · no key</text>
  ${paths.map((p, i) => pulse(p.id, p.id === "p5" ? 3.2 : 2.4, (0.6 + i * 0.35).toFixed(2), p.id === "p5" ? "#3ecf8e" : C.gold)).join("\n  ")}
</g>

${caption(H, "KEYS NEVER REACH THE BROWSER — THE PAGE CALLS /api/*, THE SERVER ADDS THEM · LINT: OXLINT")}
</svg>
`;
}

/* ================================================================== */
/* 03 KEYS — three switches, three features                            */
/* ================================================================== */
function keys() {
  const W = 1200, H = 480;
  const T = 9;
  const rows = [
    { key: "TMDB_TOKEN", from: "themoviedb.org → Settings → API", title: "The catalogue", what: "trending · in cinemas · top rated · trailers" },
    { key: "OMDB_KEY", from: "omdbapi.com → API key", title: "Critics' scores", what: "IMDb · Rotten Tomatoes · Metacritic" },
    { key: "WATCHMODE_KEY", from: "api.watchmode.com → free plan", title: "Where to watch", what: "a link straight to the film on each service" },
  ];
  const top = 150, step = 84, rh = 72;
  const left = { x: 56, w: 504 }, right = { x: 620, w: 524 };

  // Each switch flips on in turn, holds, then all switch off together and
  // the cycle starts again. The resting (reduced-motion) frame is all on.
  const at = (i) => ((0.9 + i * 1.1) / T) * 100;
  const cycle = (i, off, on) => [[[0, at(i)], off], [[at(i) + 3, 84], on], [[90, 100], off]];
  const css = rows.map((_, i) => `
  .track${i} { fill: ${C.gold}; animation: track${i} ${T}s ease-in-out infinite; }
  ${kf(`track${i}`, cycle(i, `fill: ${C.line};`, `fill: ${C.gold};`))}
  .knob${i} { transform: translateX(24px); animation: knob${i} ${T}s ${EASE} infinite; }
  ${kf(`knob${i}`, cycle(i, "transform: translateX(0px);", "transform: translateX(24px);"))}
  .lit${i} { opacity: 1; animation: lit${i} ${T}s ease-in-out infinite; }
  ${kf(`lit${i}`, cycle(i, "opacity: 0;", "opacity: 1;"))}
  .card${i} { opacity: 1; animation: card${i} ${T}s ease-in-out infinite; }
  ${kf(`card${i}`, cycle(i, "opacity: .28;", "opacity: 1;"))}`).join("");

  const extras = [
    // mini posters
    (y) => [0, 1, 2, 3].map((k) => poster(1016 + k * 28, y + 18, 22, 36, k + 3)).join(""),
    // score chips
    (y) => [["IMDb", "9.1"], ["RT", "94%"], ["MC", "85"]].map(([s, v], k) => {
      const x = 978 + k * 52;
      return `<rect x="${x}" y="${y + 20}" width="46" height="32" fill="${C.raised}" stroke="${C.line}"/>
      <text class="mono" x="${x + 23}" y="${y + 32}" text-anchor="middle" font-size="7.5" letter-spacing="1" fill="${C.muted}">${s}</text>
      <text class="sans" x="${x + 23}" y="${y + 47}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.paper}">${v}</text>`;
    }).join(""),
    // service chips
    (y) => [["APPLE TV", 70], ["PRIME", 52], ["HOTSTAR", 66]].reduce((acc, [s, w]) => {
      const x = acc.x - w;
      acc.out.push(`<rect x="${x}" y="${y + 24}" width="${w - 6}" height="24" fill="${C.raised}" stroke="${C.line}"/>
      <text class="mono" x="${x + (w - 6) / 2}" y="${y + 40}" text-anchor="middle" font-size="9" letter-spacing="1" fill="${C.paper}">${s} ↗</text>`);
      acc.x = x;
      return acc;
    }, { x: 1134, out: [] }).out.join(""),
  ];

  const body = rows.map((r, i) => {
    const y = top + i * step;
    return `<!-- ${r.key} -->
  <rect x="${left.x}" y="${y}" width="${left.w}" height="${rh}" fill="${C.surface}" stroke="${C.line}"/>
  <text class="mono" x="${left.x + 20}" y="${y + 31}" font-size="15" font-weight="700" letter-spacing="0.6" fill="${C.paper}">${r.key}</text>
  <text class="mono" x="${left.x + 20}" y="${y + 52}" font-size="10.5" letter-spacing="0.4" fill="${C.fog}">${esc(r.from)}</text>
  <rect class="track${i}" x="480" y="${y + 22}" width="52" height="28" rx="14"/>
  <circle class="knob${i}" cx="494" cy="${y + 36}" r="10" fill="${C.paper}"/>
  <path class="lit${i} flow" d="M540 ${y + 36} H${right.x}" fill="none" stroke="${C.gold}" stroke-width="1.5"/>
  <g class="card${i}">
    <rect x="${right.x}" y="${y}" width="${right.w}" height="${rh}" fill="${C.surface}" stroke="${C.line}" stroke-opacity=".6"/>
    <text class="sans" x="${right.x + 20}" y="${y + 31}" font-size="18" font-weight="700" fill="${C.paper}">${esc(r.title)}</text>
    <text class="mono" x="${right.x + 20}" y="${y + 52}" font-size="10.5" letter-spacing="0.4" fill="${C.fog}">${esc(r.what)}</text>
    ${extras[i](y)}
  </g>
  <rect class="lit${i}" x="${right.x}" y="${y}" width="${right.w}" height="${rh}" fill="none" stroke="${C.gold}"/>`;
  }).join("\n  ");

  return `${open(W, H, "The three keys 3Flix uses",
    "Three switches — TMDB_TOKEN, OMDB_KEY and WATCHMODE_KEY — flip on one after another, and each lights up what it powers: the catalogue, critics' scores, and direct links to where each film streams. Beneath: the page itself holds no keys, and without one the site falls back to lists saved each morning.")}
<defs>${posterDefs()}</defs>
<style>${BASE_CSS}${FLOW_CSS}${css}
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("03", "KEYS", "Three keys,", "all on the server.")}
<text class="mono" x="${left.x}" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">.ENV.LOCAL · VERCEL ENVIRONMENT VARIABLES</text>
<text class="mono" x="${right.x}" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">WHAT EACH ONE SWITCHES ON</text>
  ${body}

<!-- the page holds none of them -->
<g transform="translate(56 408)">
  <path d="M6 12v-5a7 7 0 0 1 14 0v5" fill="none" stroke="${C.gold}" stroke-width="2"/>
  <rect x="2" y="12" width="22" height="16" fill="${C.gold}"/>
</g>
<text class="mono" x="94" y="422" font-size="11" letter-spacing="1.4" fill="${C.paper}">THE PAGE HOLDS 0 KEYS — IT CALLS /api/*, AND THE SERVER ADDS THEM</text>
<text class="mono" x="94" y="440" font-size="11" letter-spacing="1.4" fill="${C.muted}">NO KEY, OR NO ANSWER? NOW SHOWING AND TRENDING FALL BACK TO LISTS SAVED EACH MORNING</text>
</svg>
`;
}

/* ================================================================== */
/* 04 SIGN-IN — end of the opening → "you're in"                      */
/* ================================================================== */
function signin() {
  const W = 1200, H = 520;
  const T = 12;
  const stage = { x: 56, y: 124, w: 648, h: 368 };
  const cx = stage.x + stage.w / 2;            // 380
  const card = { x: cx - 144, y: 148, w: 288, h: 322 };
  const cardFill = "#171715";
  const field = { x: card.x + 20, y: 336, w: 248 };

  const steps = [
    ["The opening ends", "the sign-in pops up over it"],
    ["A name and an email", "no password, no code"],
    ["Checked on the server", "format · 8,771 temp domains · MX record"],
    ["You're in", "remembered here · prefilled next time"],
  ];
  const stepTop = 170, stepGap = 78;

  // The wall of posters behind the card: seven columns drifting upwards.
  const wall = Array.from({ length: 7 }, (_, c) => Array.from({ length: 4 }, (_, r) =>
    poster(stage.x + 8 + c * 92, stage.y - 20 + r * 128, 80, 118, c * 3 + r, `opacity=".45"`)).join("")).join("");

  const genres = ["Action", "Animation", "Comedy", "Crime", "Drama", "Horror", "Sci-Fi", "Thriller"];

  return `${open(W, H, "How signing in to 3Flix works",
    "A browser window: the opening's last line scrolls away and a sign-in card pops up over a wall of posters. A temporary address is typed and turned away in red; a real Gmail address is typed and accepted in green — the server found the domain's mail record — and the card gives way to the signed-in home page. Beside it, the four steps light up in turn.")}
<defs>
  <clipPath id="stage"><rect x="${stage.x + 1}" y="${stage.y + 1}" width="${stage.w - 2}" height="${stage.h - 2}"/></clipPath>
  <clipPath id="field"><rect x="${field.x}" y="${field.y}" width="${field.w}" height="20"/></clipPath>
  <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
    <stop offset="0" stop-color="${C.ink}" stop-opacity=".55"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".9"/>
  </radialGradient>
  ${posterDefs()}
</defs>
<style>${BASE_CSS}
  .intro { animation: intro ${T}s ${EASE} infinite; }
  ${kf("intro", [[[0, 14], "opacity: 1; transform: none;"], [[20, 96], "opacity: 0; transform: translateY(-60px);"], [100, "opacity: 1; transform: none;"]])}
  .wall { animation: wall ${T}s ease-in-out infinite; }
  ${kf("wall", [[[0, 15], "opacity: 0;"], [[21, 80], "opacity: 1;"], [[85, 100], "opacity: 0;"]])}
  .drift { animation: drift ${T}s linear infinite; }
  @keyframes drift { to { transform: translateY(-40px); } }
  .card { transform-box: fill-box; transform-origin: center; animation: card ${T}s cubic-bezier(.16,1,.3,1) infinite; }
  ${kf("card", [[[0, 16], "opacity: 0; transform: translateY(24px) scale(.93);"], [[22, 78], "opacity: 1; transform: none;"], [[83, 100], "opacity: 0; transform: scale(.98);"]])}
  .ta { animation: ta ${T}s steps(1, end) infinite; }
  ${kf("ta", [[[0, 24], "opacity: 0;"], [[24.5, 50], "opacity: 1;"], [[51, 100], "opacity: 0;"]])}
  .ca { animation: ca ${T}s infinite; }
  ${kf("ca", [[[0, 24], "transform: translateX(0px); animation-timing-function: steps(18, end);"], [[33, 100], `transform: translateX(${field.w}px);`]])}
  .tb { animation: tb ${T}s steps(1, end) infinite; }
  ${kf("tb", [[[0, 51.9], "opacity: 0;"], [[52, 100], "opacity: 1;"]])}
  .cb { transform: translateX(${field.w}px); animation: cb ${T}s infinite; }
  ${kf("cb", [[[0, 51], `transform: translateX(${field.w}px);`], [[51.5, 52], "transform: translateX(0px); animation-timing-function: steps(13, end);"], [[60, 100], `transform: translateX(${field.w}px);`]])}
  .err { animation: err ${T}s infinite; }
  ${kf("err", [[[0, 36], "opacity: 0;"], [[37, 50], "opacity: 1;"], [[51, 100], "opacity: 0;"]])}
  .uline { animation: uline ${T}s infinite; }
  ${kf("uline", [[[0, 36], `stroke: ${C.line};`], [[37, 50], `stroke: ${C.ember};`], [[51, 63], `stroke: ${C.line};`], [[64, 100], `stroke: ${C.mint};`]])}
  .uline { stroke: ${C.mint}; }
  .ok { animation: ok ${T}s infinite; }
  ${kf("ok", [[[0, 63], "opacity: 0;"], [[64, 100], "opacity: 1;"]])}
  .press { transform-box: fill-box; transform-origin: center; animation: press ${T}s infinite; }
  ${kf("press", [[[0, 34.5, 36.5, 62, 64, 100], "transform: none;"], [[35.5, 63], "transform: scale(.96);"]])}
  .inside { animation: inside ${T}s ease-out infinite; }
  ${kf("inside", [[[0, 83], "opacity: 0; transform: translateY(12px);"], [[88, 96], "opacity: 1; transform: none;"], [100, "opacity: 0;"]])}
  .hl { transform: translateY(${2 * stepGap}px); animation: hl ${T}s ${EASE} infinite; }
  ${kf("hl", [[[0, 22], "transform: translateY(0px);"], [[24, 34], `transform: translateY(${stepGap}px);`], [[37, 78], `transform: translateY(${2 * stepGap}px);`], [[82, 96], `transform: translateY(${3 * stepGap}px);`], [100, "transform: translateY(0px);"]])}
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("04", "SIGNING IN", "One card,", "after the opening.")}

<!-- the stage -->
${box(stage, C.ink, C.line)}
<g clip-path="url(#stage)">
  <g class="wall">
    <g class="drift">${wall}</g>
    <rect x="${stage.x}" y="${stage.y}" width="${stage.w}" height="${stage.h}" fill="url(#vignette)"/>
  </g>

  <g class="intro" opacity="0">
    <text class="sans" x="${cx}" y="300" text-anchor="middle" font-size="38" font-weight="800" letter-spacing="-1.4" fill="${C.paper}">Now they belong</text>
    <text class="sans" x="${cx}" y="344" text-anchor="middle" font-size="38" font-weight="800" letter-spacing="-1.4" fill="${C.gold}">to everyone.</text>
  </g>

  <g class="card">
    <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" fill="${cardFill}" stroke="${C.line}"/>
    <text class="sans" x="${card.x + 20}" y="${card.y + 32}" font-size="16" font-weight="800" letter-spacing="-0.4" fill="${C.paper}">3<tspan fill="${C.gold}">Flix</tspan></text>
    <text class="mono" x="${card.x + card.w - 20}" y="${card.y + 32}" text-anchor="end" font-size="8.5" letter-spacing="1.6" fill="${C.muted}">MEMBERS</text>
    <text class="sans" x="${card.x + 20}" y="${card.y + 68}" font-size="22" font-weight="800" letter-spacing="-0.8" fill="${C.paper}">Sign in to</text>
    <text class="sans" x="${card.x + 20}" y="${card.y + 94}" font-size="22" font-weight="800" letter-spacing="-0.8" fill="${C.gold}">start watching.</text>

    <text class="mono" x="${field.x}" y="${card.y + 124}" font-size="8.5" letter-spacing="1.6" fill="${C.muted}">YOUR NAME</text>
    <text class="mono" x="${field.x + 4}" y="${card.y + 146}" font-size="13" fill="${C.paper}">Ravjot</text>
    <line x1="${field.x}" y1="${card.y + 154}" x2="${field.x + field.w}" y2="${card.y + 154}" stroke="${C.line}"/>

    <text class="mono" x="${field.x}" y="${field.y - 10}" font-size="8.5" letter-spacing="1.6" fill="${C.muted}">EMAIL</text>
    <g clip-path="url(#field)">
      <g class="ta" opacity="0">
        <text class="mono" x="${field.x + 4}" y="${field.y + 14}" font-size="13" fill="${C.paper}">you@mailinator.com</text>
        <rect class="ca" x="${field.x}" y="${field.y}" width="${field.w}" height="20" fill="${cardFill}"/>
      </g>
      <g class="tb">
        <text class="mono" x="${field.x + 4}" y="${field.y + 14}" font-size="13" fill="${C.paper}">you@gmail.com</text>
        <rect class="cb" x="${field.x}" y="${field.y}" width="${field.w}" height="20" fill="${cardFill}"/>
      </g>
    </g>
    <line class="uline" x1="${field.x}" y1="${field.y + 22}" x2="${field.x + field.w}" y2="${field.y + 22}" stroke-width="1.5"/>
    <text class="mono err" x="${field.x}" y="${field.y + 40}" font-size="9" letter-spacing="0.6" fill="${C.ember}" opacity="0">✕ TEMPORARY ADDRESSES AREN'T ACCEPTED</text>
    <text class="mono ok" x="${field.x}" y="${field.y + 40}" font-size="9" letter-spacing="0.6" fill="${C.mint}">✓ A REAL INBOX — MAIL RECORD FOUND</text>

    <g class="press">
      <rect x="${field.x}" y="${field.y + 56}" width="${field.w}" height="38" fill="${C.gold}"/>
      <text class="mono" x="${cx}" y="${field.y + 79}" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="2" fill="${C.ink}">CONTINUE ›</text>
    </g>
    <text class="mono" x="${field.x}" y="${field.y + 116}" font-size="8" letter-spacing="1.2" fill="${C.muted}">NO PASSWORD · NO CODE · NO TEMP MAIL</text>
  </g>

  <g class="inside" opacity="0">
    <rect x="${stage.x + 12}" y="${stage.y + 12}" width="${stage.w - 24}" height="28" fill="${C.gold}"/>
    <text class="sans" x="${stage.x + 26}" y="${stage.y + 31}" font-size="13" font-weight="800" fill="${C.ink}">3Flix</text>
    <rect x="${stage.x + stage.w - 118}" y="${stage.y + 16}" width="20" height="20" fill="${C.ink}"/>
    <text class="sans" x="${stage.x + stage.w - 108}" y="${stage.y + 31}" text-anchor="middle" font-size="11" font-weight="800" fill="${C.gold}">R</text>
    <text class="mono" x="${stage.x + stage.w - 92}" y="${stage.y + 30}" font-size="9" font-weight="600" letter-spacing="1.4" fill="${C.ink}">RAVJOT ▾</text>
    <text class="sans" x="${stage.x + 28}" y="${stage.y + 84}" font-size="24" font-weight="800" letter-spacing="-0.8" fill="${C.paper}">Eight ways <tspan fill="${C.gold}">in.</tspan></text>
    ${genres.map((g, k) => {
      const x = stage.x + 28 + (k % 4) * 150, y = stage.y + 104 + Math.floor(k / 4) * 122;
      return `<rect x="${x}" y="${y}" width="140" height="112" fill="${C.surface}" stroke="${C.line}"/>
    <text class="mono" x="${x + 10}" y="${y + 18}" font-size="9" fill="${C.gold}">${String(k + 1).padStart(2, "0")}</text>
    <text class="sans" x="${x + 10}" y="${y + 36}" font-size="13" font-weight="700" fill="${C.paper}">${g}</text>
    ${poster(x + 54, y + 52, 32, 48, k)}`;
    }).join("\n    ")}
  </g>
</g>

<!-- the steps -->
<text class="mono" x="744" y="150" font-size="11" letter-spacing="2.4" fill="${C.muted}">WHAT HAPPENS</text>
<g class="hl">
  <rect x="728" y="${stepTop}" width="416" height="${stepGap - 12}" fill="${C.gold}" fill-opacity=".1"/>
  <rect x="728" y="${stepTop}" width="3" height="${stepGap - 12}" fill="${C.gold}"/>
</g>
${steps.map(([name, what], i) => `<text class="mono" x="748" y="${stepTop + i * stepGap + 26}" font-size="11" letter-spacing="1.6" fill="${C.gold}">${String(i + 1).padStart(2, "0")}</text>
<text class="sans" x="780" y="${stepTop + i * stepGap + 27}" font-size="18" font-weight="700" fill="${C.paper}">${esc(name)}</text>
<text class="mono" x="780" y="${stepTop + i * stepGap + 47}" font-size="11" letter-spacing="0.4" fill="${C.fog}">${esc(what)}</text>`).join("\n")}

${caption(H, "EVERY PAGE BUT THE OPENING IS BEHIND THIS · A LINK FROM OUTSIDE LANDS ON /signin, THEN GOES WHERE IT WAS HEADED")}
</svg>
`;
}

/* ================================================================== */
/* 05 ROUTES — two ways in, then the gate                              */
/* ================================================================== */
function routes() {
  const W = 1200, H = 600;
  const pub = [
    { path: "/", title: "Home", what: "the opening, then the sign-in", x: 56, y: 176 },
    { path: "/signin", title: "Sign in", what: "for links from outside", x: 56, y: 300 },
  ].map((n) => ({ ...n, w: 250, h: 76 }));
  const gate = { x: 380, y: 200, w: 190, h: 170 };
  const rows = [
    { path: "/library", what: "new & popular · search · genres" },
    { path: "/library/:filmId", what: "a classic's player", nested: 0 },
    { path: "/movies", what: "the TMDB catalogue" },
    { path: "/movies/:movieId", what: "trailer · scores · where to watch", nested: 2 },
    { path: "/watchlist", what: "the films you saved" },
    { path: "/about", what: "where everything comes from" },
    { path: "/films", what: "↪ redirects to /library" },
    { path: "*", what: "404 · no such page" },
  ].map((r, i) => {
    const indent = r.nested === undefined ? 0 : 30;
    return { ...r, x: 640 + indent, y: 150 + i * 52, w: 504 - indent, h: 44 };
  });

  const gx = gate.x + gate.w, gy = gate.y + gate.h / 2;
  const paths = [
    ...pub.map((n, i) => ({ id: `in${i}`, d: `M${n.x + n.w} ${n.y + n.h / 2} C${n.x + n.w + 40} ${n.y + n.h / 2} ${gate.x - 40} ${gy + (i ? 26 : -26)} ${gate.x} ${gy + (i ? 26 : -26)}` })),
    ...rows.map((r, i) => {
      if (r.nested !== undefined) {
        const p = rows[r.nested];
        return { id: `r${i}`, d: `M${p.x + 14} ${p.y + p.h} V${r.y + r.h / 2} H${r.x}` };
      }
      return { id: `r${i}`, d: `M${gx} ${gy} C${gx + 36} ${gy} ${r.x - 36} ${r.y + r.h / 2} ${r.x} ${r.y + r.h / 2}` };
    }),
  ];

  return `${open(W, H, "The 3Flix route map",
    "Two public routes — the home page and /signin — lead into a gold ProtectedRoute gate whose padlock opens and closes. Behind it: the library and a classic's player nested inside it, the movies catalogue and a film's page nested inside that, the watchlist, the about page, a redirect from /films to /library, and a 404 for anything else. Pulses of light travel along every connection.")}
<style>${BASE_CSS}${FLOW_CSS}
  .shackle { animation: unlock 4.8s ${EASE} infinite; }
  @keyframes unlock { 0%, 30% { transform: none; } 42%, 82% { transform: translateY(-7px); } 94%, 100% { transform: none; } }
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("05", "ROUTES", "Two ways in,", "then the gate.")}
<text class="mono" x="56" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">PUBLIC</text>
<text class="mono" x="640" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">BEHIND THE GATE</text>

<g class="appear" style="animation-delay:.3s">
  ${paths.map((p) => wire(p.id, p.d)).join("\n  ")}

  ${pub.map((n) => `${box(n, C.raised)}
  <text class="mono" x="${n.x + 18}" y="${n.y + 24}" font-size="13" font-weight="700" fill="${C.gold}">${esc(n.path)}</text>
  <text class="sans" x="${n.x + 18}" y="${n.y + 47}" font-size="17" font-weight="700" fill="${C.paper}">${esc(n.title)}</text>
  <text class="mono" x="${n.x + 18}" y="${n.y + 64}" font-size="10.5" letter-spacing="0.3" fill="${C.fog}">${esc(n.what)}</text>`).join("\n  ")}

  ${box(gate, C.gold, C.gold)}
  <g transform="translate(${gate.x + gate.w / 2} ${gate.y + 58})">
    <path class="shackle" d="M-11 -4v-10a11 11 0 0 1 22 0v10" fill="none" stroke="${C.ink}" stroke-width="3.5"/>
    <rect x="-17" y="-4" width="34" height="26" fill="${C.ink}"/>
    <circle cx="0" cy="7" r="3.5" fill="${C.gold}"/>
  </g>
  <text class="mono" x="${gate.x + gate.w / 2}" y="${gate.y + 112}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.ink}">&lt;ProtectedRoute&gt;</text>
  <text class="mono" x="${gate.x + gate.w / 2}" y="${gate.y + 134}" text-anchor="middle" font-size="9.5" letter-spacing="0.3" fill="${C.ink}">signed in? straight through</text>
  <text class="mono" x="${gate.x + gate.w / 2}" y="${gate.y + 150}" text-anchor="middle" font-size="9.5" letter-spacing="0.3" fill="${C.ink}">if not → /signin</text>

  ${rows.map((r) => `${box(r)}
  <text class="mono" x="${r.x + 16}" y="${r.y + 27}" font-size="13" font-weight="600" fill="${C.paper}">${esc(r.path)}</text>
  <text class="mono" x="${r.x + r.w - 16}" y="${r.y + 27}" text-anchor="end" font-size="10.5" letter-spacing="0.3" fill="${C.fog}">${esc(r.what)}</text>`).join("\n  ")}

  ${paths.map((p, i) => pulse(p.id, 2.2, (0.4 + i * 0.28).toFixed(2))).join("\n  ")}
</g>

${caption(H, "FILTERS, TABS AND SEARCH LIVE IN THE URL, SO BACK RETURNS TO THE SAME LIST AND ANY VIEW CAN BE SHARED")}
</svg>
`;
}

/* ================================================================== */
/* 06 DEPLOY — push to main, and it's live                            */
/* ================================================================== */
function deploy() {
  const W = 1200, H = 500;
  const T = 8;
  const A = { x: 56, y: 176, w: 196, h: 96 };
  const B = { x: 300, y: 150, w: 300, h: 150 };
  const C1 = { x: 646, y: 150, w: 252, h: 64 };
  const C2 = { x: 646, y: 236, w: 252, h: 64 };
  const D = { x: 944, y: 176, w: 200, h: 96 };
  const lane = 380;
  const E = { x: 56, y: lane, w: 250, h: 56 };
  const F = { x: 340, y: lane, w: 300, h: 56 };
  const G = { x: 674, y: lane, w: 270, h: 56 };

  const paths = [
    { id: "a", d: `M${A.x + A.w} ${A.y + A.h / 2} H${B.x}` },
    { id: "b1", d: `M${B.x + B.w} ${B.y + 40} C${B.x + B.w + 26} ${B.y + 40} ${C1.x - 26} ${C1.y + C1.h / 2} ${C1.x} ${C1.y + C1.h / 2}` },
    { id: "b2", d: `M${B.x + B.w} ${B.y + 110} C${B.x + B.w + 26} ${B.y + 110} ${C2.x - 26} ${C2.y + C2.h / 2} ${C2.x} ${C2.y + C2.h / 2}` },
    { id: "c1", d: `M${C1.x + C1.w} ${C1.y + C1.h / 2} C${C1.x + C1.w + 26} ${C1.y + C1.h / 2} ${D.x - 26} ${D.y + 34} ${D.x} ${D.y + 34}` },
    { id: "c2", d: `M${C2.x + C2.w} ${C2.y + C2.h / 2} C${C2.x + C2.w + 26} ${C2.y + C2.h / 2} ${D.x - 26} ${D.y + 62} ${D.x} ${D.y + 62}` },
    { id: "e", d: `M${E.x + E.w} ${lane + 28} H${F.x}` },
    { id: "f", d: `M${F.x + F.w} ${lane + 28} H${G.x}` },
    // the refreshed lists are a push of their own, so they deploy too
    { id: "g", d: `M${G.x + G.w / 2} ${lane} V336 H${A.x + A.w / 2} V${A.y + A.h}` },
  ];
  const logs = ["$ npm run build", "✓ vite build · pages, styles, lists", "✓ api/*.js → 4 functions"];

  return `${open(W, H, "How 3Flix deploys",
    "A push to main travels into a Vercel build, whose log fills in line by line while a progress bar runs; the build splits into the static site and four /api functions, and the live address switches from Building to Ready. Below, a GitHub Action refreshes the saved film lists every morning and commits them, which deploys the site again.")}
<style>${BASE_CSS}${FLOW_CSS}
  ${logs.map((_, i) => `.log${i} { animation: log${i} ${T}s steps(1, end) infinite; }
  ${kf(`log${i}`, [[[0, 10 + i * 14], "opacity: 0;"], [[11 + i * 14, 100], "opacity: 1;"]])}`).join("\n  ")}
  .prog { transform-box: fill-box; transform-origin: left; animation: prog ${T}s ease-in-out infinite; }
  ${kf("prog", [[[0, 8], "transform: scaleX(0);"], [[58, 100], "transform: scaleX(1);"]])}
  .building { opacity: 0; animation: building ${T}s steps(1, end) infinite; }
  ${kf("building", [[[0, 63], "opacity: 1;"], [[64, 100], "opacity: 0;"]])}
  .ready { animation: ready ${T}s steps(1, end) infinite; }
  ${kf("ready", [[[0, 63], "opacity: 0;"], [[64, 100], "opacity: 1;"]])}
  .blink { animation: blink 1s ease-in-out infinite; }
  @keyframes blink { 50% { opacity: .3; } }
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("06", "DEPLOYING", "Push to main,", "and it's live.")}
<text class="mono" x="56" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">EVERY PUSH</text>

<g class="appear" style="animation-delay:.3s">
  ${paths.map((p) => wire(p.id, p.d, p.id === "g" || p.id === "e" || p.id === "f" ? "#3ecf8e" : C.gold)).join("\n  ")}

  ${box(A, C.raised)}
  <text class="sans" x="${A.x + 18}" y="${A.y + 34}" font-size="18" font-weight="700" fill="${C.paper}">git push</text>
  <text class="mono" x="${A.x + 18}" y="${A.y + 56}" font-size="11" letter-spacing="0.4" fill="${C.gold}">origin main</text>
  <text class="mono" x="${A.x + 18}" y="${A.y + 76}" font-size="10" letter-spacing="0.3" fill="${C.fog}">nothing else to run</text>

  ${box(B)}
  <text class="sans" x="${B.x + 20}" y="${B.y + 30}" font-size="18" font-weight="700" fill="${C.paper}">Vercel builds it</text>
  ${logs.map((l, i) => `<text class="mono log${i}" x="${B.x + 20}" y="${B.y + 58 + i * 22}" font-size="11" letter-spacing="0.3" fill="${i ? C.fog : C.paper}">${esc(l)}</text>`).join("\n  ")}
  <rect x="${B.x + 20}" y="${B.y + 128}" width="${B.w - 40}" height="4" fill="${C.line}"/>
  <rect class="prog" x="${B.x + 20}" y="${B.y + 128}" width="${B.w - 40}" height="4" fill="${C.gold}"/>

  ${box(C1)}
  <text class="sans" x="${C1.x + 16}" y="${C1.y + 26}" font-size="16" font-weight="700" fill="${C.paper}">dist/</text>
  <text class="mono" x="${C1.x + 16}" y="${C1.y + 46}" font-size="10.5" letter-spacing="0.3" fill="${C.fog}">pages · styles · saved lists</text>
  ${box(C2)}
  <text class="sans" x="${C2.x + 16}" y="${C2.y + 26}" font-size="16" font-weight="700" fill="${C.gold}">/api/*</text>
  <text class="mono" x="${C2.x + 16}" y="${C2.y + 46}" font-size="10.5" letter-spacing="0.3" fill="${C.fog}">tmdb · omdb · watchmode · signin</text>

  ${box(D, C.raised, C.gold)}
  <text class="sans" x="${D.x + 18}" y="${D.y + 32}" font-size="16" font-weight="800" fill="${C.paper}">3flix-react</text>
  <text class="mono" x="${D.x + 18}" y="${D.y + 50}" font-size="11" fill="${C.fog}">.vercel.app</text>
  <g class="building">
    <circle class="blink" cx="${D.x + 24}" cy="${D.y + 73}" r="5" fill="${C.gold}"/>
    <text class="mono" x="${D.x + 36}" y="${D.y + 77}" font-size="10.5" font-weight="600" letter-spacing="1.6" fill="${C.gold}">BUILDING</text>
  </g>
  <g class="ready">
    <circle cx="${D.x + 24}" cy="${D.y + 73}" r="5" fill="${C.mint}"/>
    <text class="mono" x="${D.x + 36}" y="${D.y + 77}" font-size="10.5" font-weight="600" letter-spacing="1.6" fill="${C.mint}">READY</text>
  </g>

  <text class="mono" x="56" y="${lane - 12}" font-size="11" letter-spacing="2.4" fill="${C.muted}">EVERY MORNING</text>
  ${box(E)}
  <text class="sans" x="${E.x + 16}" y="${E.y + 24}" font-size="15" font-weight="700" fill="${C.paper}">GitHub Actions</text>
  <text class="mono" x="${E.x + 16}" y="${E.y + 42}" font-size="10.5" letter-spacing="0.3" fill="#3ecf8e">daily · 05:17 UTC</text>
  ${box(F)}
  <text class="mono" x="${F.x + 16}" y="${F.y + 24}" font-size="12" font-weight="700" fill="${C.paper}">node scripts/snapshots.mjs</text>
  <text class="mono" x="${F.x + 16}" y="${F.y + 42}" font-size="10.5" letter-spacing="0.3" fill="${C.fog}">in cinemas + trending, from TMDB</text>
  ${box(G)}
  <text class="mono" x="${G.x + 16}" y="${G.y + 24}" font-size="12" font-weight="700" fill="${C.paper}">commit public/snapshots</text>
  <text class="mono" x="${G.x + 16}" y="${G.y + 42}" font-size="10.5" letter-spacing="0.3" fill="${C.fog}">a push of its own → redeploys</text>

  ${paths.map((p, i) => pulse(p.id, p.id === "g" ? 3.4 : 1.8, (0.4 + i * 0.3).toFixed(2), p.id === "g" || p.id === "e" || p.id === "f" ? "#3ecf8e" : C.gold)).join("\n  ")}
</g>

${caption(H, "KEYS LIVE IN VERCEL → SETTINGS → ENVIRONMENT VARIABLES · THE FUNCTIONS READ THEM WHEN THEY RUN")}
</svg>
`;
}


/* ================================================================== */
/* 07 CONTRIBUTORS — who built it, straight from git                  */
/* ================================================================== */
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const day = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const num = (n) => n.toLocaleString("en-US");

/**
 * package.json "contributors", npm-style: { name, url } plus `git` — the name
 * that person's commits (or Co-Authored-By lines) carry — and an optional
 * `role`. Plain strings are names that commit as themselves.
 */
const TEAM = (pkg.contributors ?? []).map((c) => {
  if (typeof c === "string") { const n = c.replace(/\s*[<(].*$/, "").trim(); return { name: n, git: n }; }
  return { name: c?.name, git: c?.git ?? c?.name, url: c?.url, role: c?.role, compact: Boolean(c?.compact) };
}).filter((c) => c.name);
const member = (gitName) => TEAM.find((c) => c.git === gitName);
const githubHandle = (url) => /github\.com\/([A-Za-z0-9-]+)\/?$/.exec(url ?? "")?.[1] ?? null;

/** A GitHub profile picture, inlined — a README image may not fetch anything itself. */
async function avatar(handle) {
  try {
    const res = await fetch(`https://github.com/${handle}.png?size=96`);
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(png|jpe?g|gif|webp)$/.test(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length < 150_000 ? `data:${type};base64,${bytes.toString("base64")}` : null;
  } catch {
    return null;   // offline: the initial stands in
  }
}
const AVATARS = new Map();

/**
 * Who did the work, counted — never typed in by hand, so it can't flatter
 * anyone. Authors and their lines come from `git log`; co-authors from the
 * Co-Authored-By trailers. Bots (the daily snapshot refresh) are left out
 * entirely: they are not contributors. Teammates listed in package.json "contributors" are
 * shown even before their first commit, with whatever they have done so far.
 */
function history() {
  try {
    const people = new Map();
    const coauthors = new Map();
    const days = new Map();
    let bots = 0, total = 0;
    const isBot = (n) => /\[bot\]$/i.test(n);
    const shown = (gitName) => member(gitName)?.name ?? gitName;
    const log = git(["log", "--no-merges", "--date=short",
      "--format=%aN%x09%ad%x09%(trailers:key=Co-Authored-By,valueonly,separator=%x7C)"]);
    for (const line of log.split("\n").filter(Boolean)) {
      const [name, date, trailers = ""] = line.split("\t");
      total += 1;
      if (isBot(name)) { bots += 1; continue; }
      days.set(date, (days.get(date) ?? 0) + 1);
      const p = people.get(shown(name)) ?? { name: shown(name), git: name, commits: 0, add: 0, del: 0, biggest: 0 };
      p.commits += 1;
      people.set(p.name, p);
      for (const who of trailers.split("|").map((t) => t.replace(/<.*$/, "").trim()).filter(Boolean)) {
        coauthors.set(who, (coauthors.get(who) ?? 0) + 1);
      }
    }
    // Lines changed, per commit: credited to its author, and to each of its
    // co-authors. Bots' lines count towards neither.
    const coLines = new Map();
    let humanLines = 0, author = null, co = [], edited = 0;
    // A commit's size in lines edited: a changed line is +1 −1 but one edit.
    const close = () => { const q = author && people.get(shown(author)); if (q) q.biggest = Math.max(q.biggest, edited); edited = 0; };
    const numstat = git(["log", "--no-merges", "--numstat",
      "--format=@%aN%x09%(trailers:key=Co-Authored-By,valueonly,separator=%x7C)"]);
    for (const line of numstat.split("\n")) {
      if (line.startsWith("@")) {
        close();
        const [a, t = ""] = line.slice(1).split("\t");
        author = a;
        co = t.split("|").map((x) => x.replace(/<.*$/, "").trim()).filter(Boolean);
        continue;
      }
      const m = line.match(/^(\d+)\t(\d+)\t/);
      if (!m || isBot(author)) continue;
      const changed = Number(m[1]) + Number(m[2]);
      humanLines += changed;
      const p = people.get(shown(author));
      if (p) { p.add += Number(m[1]); p.del += Number(m[2]); edited += Math.max(Number(m[1]), Number(m[2])); }
      for (const c of co) coLines.set(c, (coLines.get(c) ?? 0) + changed);
    }
    close();
    for (const c of TEAM) {
      if (!people.has(c.name) && !coauthors.has(c.git)) people.set(c.name, { name: c.name, git: c.git, commits: 0, add: 0, del: 0, biggest: 0 });
    }
    const dates = [...days.keys()].sort();
    const calendar = [];
    if (dates.length) {
      for (let d = new Date(`${dates[0]}T12:00:00Z`); d <= new Date(`${dates.at(-1)}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);
        calendar.push([iso, days.get(iso) ?? 0]);   // a quiet day shows as 0, not as a gap
      }
    }
    return {
      people: [...people.values()].sort((a, b) => b.commits - a.commits || b.add - a.add),
      coauthors: [...coauthors.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => [name, n, coLines.get(name) ?? 0]),
      humanLines,
      days: calendar,
      bots, total,
    };
  } catch {
    return null;   // not a git checkout: leave the old picture in place
  }
}

function contributors() {
  const h = history();
  if (!h) return null;
  const CLAY = "#d97757";
  const humans = h.total - h.bots;
  // Honest at both ends: 0.01% is not "0%", and 99.99% is not "100%".
  const pct = (x) => (x <= 0 ? "0%" : x < 0.001 ? "<0.1%" : x < 0.1 ? `${(x * 100).toFixed(1)}%`
    : x > 0.999 && x < 1 ? ">99.9%" : `${Math.round(x * 100)}%`);
  const lines = h.humanLines || 1;
  const personRow = (p) => {
    const share = (p.add + p.del) / lines;
    const m = member(p.git);
    const handle = githubHandle(m?.url);
    const commits = `${p.commits} ${p.commits === 1 ? "commit" : "commits"}`;
    // "One line each" only when git agrees: every commit edited a single line.
    const oneLiners = p.commits > 0 && p.biggest <= 1;
    return {
      name: p.name, tag: (m?.role ?? "author").toUpperCase(), c: C.gold, initial: p.name.trim().charAt(0).toUpperCase(), share,
      handle: handle ? `@${handle}` : p.git !== p.name ? p.git : "", picture: AVATARS.get(p.name), compact: Boolean(m?.compact),
      stat: m?.compact && oneLiners
        ? `${commits}, ${p.commits === 1 ? "one line" : "one line each"}`
        : `${commits} · +${num(p.add)} −${num(p.del)} lines`,
      label: `${pct(share)} OF LINES CHANGED`,
    };
  };
  const everyone = h.people.map(personRow);
  const rows = [
    ...everyone.filter((r) => !r.compact),
    ...h.coauthors.map(([name, n, coLines]) => {
      const m = member(name);
      const claude = /claude/i.test(name);
      return {
        name: m?.name ?? (claude ? "Claude" : name), tag: (m?.role ?? (claude ? "AI pair programmer" : "co-author")).toUpperCase(),
        c: CLAY, initial: claude ? "✳" : (m?.name ?? name).charAt(0).toUpperCase(), share: coLines / lines,
        handle: name !== (m?.name ?? name) ? name : "", picture: AVATARS.get(m?.name),
        stat: `co-author on ${n} of ${humans} commits`,
        label: `${pct(coLines / lines)} OF LINES CO-AUTHORED`,
      };
    }),
    ...everyone.filter((r) => r.compact),
  ];

  const top = 150, rowH = 82, slimH = 44, barX = 122, barW = 518;
  let next = top;
  for (const r of rows) { r.y = next; next += r.compact ? slimH : rowH; }
  const W = 1200, H = Math.max(470, next + 70);
  const shown = h.days.slice(-14);
  const most = Math.max(...shown.map(([, n]) => n), 1);
  const colW = Math.min(120, 444 / shown.length);
  const base = H - 90, tall = Math.min(150, base - 290);
  const added = h.people.reduce((sum, p) => sum + p.add, 0);
  const first = h.days[0]?.[0] ?? "", last = h.days.at(-1)?.[0] ?? "";

  return `${open(W, H, "Who built 3Flix",
    `Counted from the git history: ${rows.map((r) => `${r.name} — ${r.stat}`).join("; ")}. Beside it, ${humans} commits and ${num(added)} lines added, with a bar for every day's commits from ${first} to ${last}.`)}
<style>${BASE_CSS}
  .grow { transform-box: fill-box; transform-origin: left; animation: grow 1.4s cubic-bezier(.16,1,.3,1) both; }
  @keyframes grow { from { transform: scaleX(0); } to { transform: none; } }
  .rise { transform-box: fill-box; transform-origin: bottom; animation: rise 1s cubic-bezier(.16,1,.3,1) both; }
  @keyframes rise { from { transform: scaleY(0); } to { transform: none; } }
  .appear { animation: appear .9s cubic-bezier(.16,1,.3,1) both; }
  @keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .shine { animation: shine 3.2s ease-in-out 1.6s infinite; }
  @keyframes shine { 0%, 100% { opacity: 0; } 50% { opacity: .35; } }
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>
${rail("07", "CONTRIBUTORS", "Who built", "3Flix.")}
<text class="mono" x="56" y="132" font-size="11" letter-spacing="2.4" fill="${C.muted}">FROM THE GIT HISTORY · BARS ARE SHARE OF LINES CHANGED</text>

${rows.map((r, i) => {
    const y = r.y, d = (0.2 + i * 0.18).toFixed(2);
    if (r.compact) {
      return `<g class="appear" style="animation-delay:${d}s">
  <rect x="76" y="${y}" width="28" height="28" fill="${r.c}"/>
  ${r.picture
    ? `<image href="${r.picture}" x="77" y="${y + 1}" width="26" height="26" preserveAspectRatio="xMidYMid slice"/>`
    : `<text class="sans" x="90" y="${y + 20}" text-anchor="middle" font-size="14" font-weight="800" fill="${C.ink}">${esc(r.initial)}</text>`}
  <text class="sans" x="${barX}" y="${y + 19}" font-size="15" font-weight="700" fill="${C.paper}">${esc(r.name)}${r.handle ? `<tspan class="mono" dx="8" font-size="10.5" font-weight="500" fill="${C.fog}">${esc(r.handle)}</tspan>` : ""}<tspan class="mono" dx="14" font-size="11" font-weight="400" fill="${C.fog}">${esc(r.stat)}</tspan></text>
  <text class="mono" x="640" y="${y + 19}" text-anchor="end" font-size="9.5" letter-spacing="1.6" fill="${r.c}">${esc(r.tag)}</text>
</g>`;
    }
    return `<g class="appear" style="animation-delay:${d}s">
  <rect x="56" y="${y}" width="48" height="48" fill="${r.c}"/>
  ${r.picture
    ? `<image href="${r.picture}" x="58" y="${y + 2}" width="44" height="44" preserveAspectRatio="xMidYMid slice"/>`
    : `<text class="sans" x="80" y="${y + 32}" text-anchor="middle" font-size="22" font-weight="800" fill="${C.ink}">${esc(r.initial)}</text>`}
  <text class="sans" x="${barX}" y="${y + 20}" font-size="20" font-weight="700" fill="${C.paper}">${esc(r.name)}${r.handle ? `<tspan class="mono" dx="10" font-size="11" font-weight="500" fill="${C.fog}">${esc(r.handle)}</tspan>` : ""}</text>
  <text class="mono" x="640" y="${y + 20}" text-anchor="end" font-size="9.5" letter-spacing="1.6" fill="${r.c}">${esc(r.tag)}</text>
  <text class="mono" x="${barX}" y="${y + 40}" font-size="11" letter-spacing="0.3" fill="${C.fog}">${esc(r.stat)}</text>
  <text class="mono" x="640" y="${y + 40}" text-anchor="end" font-size="10.5" font-weight="600" letter-spacing="1" fill="${r.c}">${esc(r.label)}</text>
  <rect x="${barX}" y="${y + 52}" width="${barW}" height="6" fill="${C.line}"/>
  <rect class="grow" style="animation-delay:${(Number(d) + 0.3).toFixed(2)}s" x="${barX}" y="${y + 52}" width="${Math.max(2, barW * r.share).toFixed(1)}" height="6" fill="${r.c}"/>
  <rect class="shine" x="${barX}" y="${y + 52}" width="${Math.max(2, barW * r.share).toFixed(1)}" height="6" fill="#fff"/>
</g>`;
  }).join("\n")}

<!-- the totals, and every day's commits -->
<g class="appear" style="animation-delay:.4s">
  <text class="mono" x="700" y="150" font-size="11" letter-spacing="2.4" fill="${C.muted}">COMMITS</text>
  <text class="sans" x="700" y="204" font-size="52" font-weight="800" letter-spacing="-2" fill="${C.gold}">${humans}</text>
  <text class="mono" x="900" y="150" font-size="11" letter-spacing="2.4" fill="${C.muted}">LINES ADDED</text>
  <text class="sans" x="900" y="204" font-size="52" font-weight="800" letter-spacing="-2" fill="${C.paper}">+${num(added)}</text>
  <text class="mono" x="700" y="${base - tall - 24}" font-size="11" letter-spacing="2.4" fill="${C.muted}">EVERY COMMIT, BY DAY</text>
  <line x1="700" y1="${base}" x2="1144" y2="${base}" stroke="${C.line}"/>
</g>
${shown.map(([date, n], i) => {
    const bh = Math.max(n ? 4 : 2, (n / most) * tall), x = 700 + i * colW, bw = Math.min(56, colW * 0.62);
    return `<rect class="rise" style="animation-delay:${(0.6 + i * 0.12).toFixed(2)}s" x="${x.toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${C.gold}"/>
<text class="mono appear" style="animation-delay:${(1 + i * 0.12).toFixed(2)}s" x="${(x + bw / 2).toFixed(1)}" y="${(base - bh - 8).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="${C.paper}">${n}</text>
<text class="mono" x="${(x + bw / 2).toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="9" letter-spacing="0.8" fill="${C.muted}">${day(date)}</text>`;
  }).join("\n")}

${caption(H, `FROM ${first} TO ${last} · RE-COUNTED EVERY TIME node scripts/readme-art.mjs RUNS`)}
</svg>
`;
}

const out = new URL("../docs/readme/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const c of TEAM) {
  const handle = githubHandle(c.url);
  const picture = handle && await avatar(handle);
  if (picture) AVATARS.set(c.name, picture);
}
const art = { hero, tour, stack, keys, signin, routes, deploy, contributors };
const wrote = [];
for (const [name, draw] of Object.entries(art)) {
  const svg = draw();
  if (!svg) continue;          // contributors, outside a git checkout
  writeFileSync(new URL(`${name}.svg`, out), svg);
  wrote.push(`${name}.svg`);
}
console.log(`wrote docs/readme/: ${wrote.join(", ")}`);
