// Writes the README's animated artwork: docs/readme/hero.svg and stack.svg.
//
//   node scripts/readme-art.mjs
//
// GitHub shows SVGs in a README as images: no JavaScript, no web fonts, no
// outside requests. So everything here is self-contained — CSS keyframes and
// SMIL inside the file, system font stacks — and every animation stops under
// prefers-reduced-motion. Versions are read from package.json, so the stack
// card stays true when dependencies move.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const ver = (name) => {
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const m = String(all[name] ?? "").match(/(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2]}` : "";
};

const C = {
  ink: "#0c0c0b", surface: "#131312", raised: "#1b1b19", line: "#2a2a27",
  paper: "#f0eee6", fog: "#a8a79f", muted: "#74736b", gold: "#f6b519",
};
// The vivid accents "Now showing" grades to.
const ACCENTS = ["#2f96bc", "#7b61ff", "#ff4114", "#1ab8d1", "#ff2f9c", "#f6b519", "#3ecf8e", "#4356c8", "#e5231b", "#00c8ff"];
const SANS = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BASE_CSS = `
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .pulse-dot { display: none; }
  }`;

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
  const tileGrads = ACCENTS.map((c, i) =>
    `<linearGradient id="t${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".35"/></linearGradient>`).join("");

  const ring = "REACT 19 · FRAMER MOTION · VITE 8 · TMDB · SUPABASE · VERCEL · ";
  const accentKeys = ACCENTS.slice(0, 6).map((c, i) => `${Math.round((i / 6) * 100)}% { stop-color: ${c}; fill: ${c}; }`).join(" ") + ` 100% { stop-color: ${ACCENTS[0]}; fill: ${ACCENTS[0]}; }`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">3Flix — cinema that outlived its copyright</title>
<desc id="desc">Animated banner in the site's style: a gold navigation bar, the headline rising into view, a ring of the tech stack turning around a gold play button, and a strip of colour-graded film frames running along the bottom.</desc>
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
  ${tileGrads}
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
  .underline { transform-box: fill-box; transform-origin: left; animation: nav 9s cubic-bezier(.65,0,.35,1) infinite; }
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
<text class="mono fade" x="56" y="124" font-size="12.5" letter-spacing="3" fill="${C.gold}">PUBLIC DOMAIN · OPEN MOVIES · WHAT'S TRENDING</text>
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
/* STACK                                                              */
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
    { name: "Supabase", v: ver("@supabase/supabase-js"), role: "email-code sign-in · synced watchlist", c: "#3ecf8e" },
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

  // The scan light dwells on each layer in turn, top to bottom.
  const scanKeys = [];
  layers.forEach((_, i) => {
    const a = (i / n) * 100, b = a + (100 / n) * 0.72;
    const ty = i * (h + gap);
    scanKeys.push(`${a.toFixed(2)}%, ${b.toFixed(2)}% { transform: translateY(${ty}px); }`);
  });
  scanKeys.push(`100% { transform: translateY(0px); }`);

  // Architecture diagram
  const D = { x: 700, w: 444 };
  const browser = { x: D.x, y: 150, w: D.w, h: 70 };
  const api = { x: D.x + 60, y: 290, w: D.w - 120, h: 64 };
  const services = [
    { name: "TMDB", role: "catalogue · trailers" },
    { name: "OMDb", role: "IMDb · RT · Metacritic" },
    { name: "Watchmode", role: "a link per service" },
    { name: "Supabase", role: "sign-in · watchlist" },
  ].map((s, i) => ({ ...s, x: D.x + (i % 2) * 234, y: 424 + Math.floor(i / 2) * 62, w: 210, h: 50 }));
  const archive = { x: D.x, y: 570, w: D.w, h: 50 };

  const box = (b, fill = C.surface, stroke = C.line) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fill}" stroke="${stroke}"/>`;
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

  const connectors = paths.map((p) =>
    `<path id="${p.id}" d="${p.d}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <path d="${p.d}" fill="none" stroke="${p.id === "p5" ? "#3ecf8e" : C.gold}" stroke-width="1.5" class="flow"/>`).join("\n  ");

  const pulses = paths.map((p, i) =>
    `<circle class="pulse-dot" r="4" fill="${p.id === "p5" ? "#3ecf8e" : C.gold}">
    <animateMotion dur="${p.id === "p5" ? 3.2 : 2.4}s" begin="${(0.6 + i * 0.35).toFixed(2)}s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#${p.id}"/></animateMotion>
  </circle>`).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">3Flix tech stack and architecture</title>
<desc id="desc">Left: the stack, built up layer by layer — framer-motion, React Router, React, plain CSS, Vite, Vercel Functions and Supabase — with a gold light scanning down it. Right: requests flowing from the browser to the site's own /api routes on Vercel, which add the keys and call TMDB, OMDb, Watchmode and Supabase; video streams straight from the Internet Archive and Blender.</desc>
<style>${BASE_CSS}
  .bar { animation: slide .8s cubic-bezier(.16,1,.3,1) both; }
  @keyframes slide { from { opacity: 0; transform: translateX(-36px); } to { opacity: 1; transform: none; } }
  /* The light only switches on once the stack has finished building. */
  .scan { animation: scan-in .6s ease-out 1.4s both, scan 9.8s cubic-bezier(.65,0,.35,1) 1.4s infinite both; }
  @keyframes scan-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scan { ${scanKeys.join(" ")} }
  .flow { stroke-dasharray: 5 11; animation: flow 1.1s linear infinite; }
  @keyframes flow { to { stroke-dashoffset: -16; } }
  .appear { animation: appear .9s cubic-bezier(.16,1,.3,1) both; }
  @keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
</style>

<rect width="${W}" height="${H}" fill="${C.ink}"/>

<!-- section rail, as on the site -->
<line x1="56" y1="52" x2="356" y2="52" stroke="${C.line}"/>
<text class="mono" x="56" y="78" font-size="12" letter-spacing="2" fill="${C.gold}">02</text>
<text class="mono" x="356" y="78" font-size="12" letter-spacing="3" text-anchor="end" fill="${C.muted}">TECH STACK</text>
<text class="sans" x="400" y="86" font-size="40" font-weight="800" letter-spacing="-1.4" fill="${C.paper}">What 3Flix <tspan fill="${C.gold}">runs on.</tspan></text>
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
  ${connectors}
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
  <text class="sans" x="${archive.x + 16}" y="${archive.y + 22}" font-size="15" font-weight="700" fill="${C.paper}">Internet Archive · Blender</text>
  <text class="mono" x="${archive.x + 16}" y="${archive.y + 39}" font-size="10.5" letter-spacing="0.4" fill="#3ecf8e">full films stream straight to the player · no key</text>
  ${pulses}
</g>

<text class="mono" x="${x0}" y="${H - 22}" font-size="11" letter-spacing="1.6" fill="${C.muted}">KEYS NEVER REACH THE BROWSER — THE PAGE CALLS /api/*, THE SERVER ADDS THEM · LINT: OXLINT</text>
</svg>
`;
}

const out = new URL("../docs/readme/", import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL("hero.svg", out), hero());
writeFileSync(new URL("stack.svg", out), stack());
console.log("wrote docs/readme/hero.svg and docs/readme/stack.svg");
