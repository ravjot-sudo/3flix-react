import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AnimatePresence, animate, motion, transform, useMotionValue, useReducedMotion,
} from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS, formatRuntime } from "../data/films.js";
import { useAccents } from "../hooks/useAccent.js";
import { useRegion, useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, inRegion, movieDetail, nowPlaying, savedOn } from "../lib/tmdb.js";

/**
 * NOW SHOWING — after crafterui's HeroCarousel on 21st.dev (MIT). Its source
 * was not available, so this reimplements the behaviour of its demo:
 *
 *   - cards sit in a filmstrip, sharing a common top edge
 *   - the focused card unfurls to full height; neighbours stay clipped to half
 *   - the whole backdrop grades to the focused card's accent colour — here
 *     sampled from the poster itself (see useAccents)
 *   - wheel, drag, click and arrow keys all navigate
 *
 * What it shows: films in cinemas now where the visitor is (TMDB), with their
 * official posters — see HeroCarousel below for what happens when TMDB can't
 * be reached.
 *
 * Adapted for a scrolling page: only HORIZONTAL wheel movement is captured
 * (capturing vertical would trap the visitor), and there is no second
 * brand/back/menu bar — the site nav already carries them.
 */
const SPRING = { type: "spring", stiffness: 260, damping: 34, mass: 0.9 };
const EASE = [0.16, 1, 0.3, 1];
const HALF = "inset(0% 0% 50% 0% round 2px)";
const FULL = "inset(0% 0% 0% 0% round 2px)";

/* ---------- items: one shape, two sources --------------------------- */
const curated = (f) => ({
  key: f.id,
  film: f,
  title: f.title,
  year: f.year,
  poster: f.tmdb?.poster ?? null,
  href: `/library/${f.id}`,
  cta: f.video ? "Watch now" : "Open the listing",
  credit: `By ${f.director}.`,
  meta: [String(f.year), formatRuntime(f.runtime), f.genres[0]],
});

const CURATED = (() => {
  const seen = new Set();
  const out = [];
  const add = (f) => { if (!seen.has(f.id)) { seen.add(f.id); out.push(f); } };
  FILMS.filter((f) => f.featured).forEach(add);
  [...FILMS].sort((a, b) => b.rating - a.rating).forEach(add);
  return out.slice(0, 12).map(curated);
})();

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const released = (iso) => (iso ? DAY.format(new Date(`${iso}T12:00:00`)).toUpperCase() : null);

const fromTmdb = (m) => ({
  key: `tmdb-${m.id}`,
  tmdbId: m.id,
  film: {
    id: `tmdb-${m.id}`, title: m.title, year: m.year ?? "", director: "", rating: m.rating ?? 0,
    hue: (m.id * 47) % 360, genres: [], tmdb: { poster: m.poster, backdrop: m.backdrop },
  },
  title: m.title,
  year: m.year,
  poster: m.poster,
  href: `/movies/${m.id}`,
  cta: "Trailer & details",
  credit: "In cinemas now.",
  meta: [released(m.released), m.rating ? `★ ${m.rating.toFixed(1)}` : null, "In cinemas"].filter(Boolean),
});

/** Split a title across two lines at the most balanced word boundary. */
function splitTitle(title) {
  const words = title.split(" ");
  if (words.length < 2) return [title];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/** Copy enters in sequence: title lines, then credit, meta and action. */
const COPY = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};
const RISE = {
  hidden: { opacity: 0, transform: "translateY(14px)" },
  shown: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.6, ease: EASE } },
};

/**
 * Picks the source, then hands it to the filmstrip. Films in cinemas now come
 * live from TMDB or, if TMDB can't be reached, from the list saved with the
 * site (lib/tmdb.js); the curated classics are the last resort. While the
 * request is out the strip shows empty frames rather than one set of films
 * that is then swapped for another.
 */
export default function HeroCarousel({ defaultIndex = 0 }) {
  const [region] = useRegion();
  const live = useRemote(hasTmdb() ? `hc|now|${region}` : null, (signal) => nowPlaying({ region }, signal));
  if (live.loading) return <Waiting />;

  const liveItems = (live.data?.results ?? []).filter((m) => m.poster).slice(0, 12).map(fromTmdb);
  const isLive = liveItems.length >= 5;
  const where = inRegion(live.data?.region ?? region);
  const label = !isLive ? "Now showing"
    : `Now showing · in cinemas in ${where}${live.data.saved ? ` · as of ${savedOn(live.data.saved)}` : ""}`;

  return (
    <Filmstrip
      key={isLive ? `live|${region}` : "curated"}
      items={isLive ? liveItems : CURATED}
      label={label}
      region={region}
      defaultIndex={defaultIndex}
    />
  );
}

function Waiting() {
  return (
    <section className="hc is-waiting" aria-label="Now showing" aria-busy="true">
      <div className="hc-backdrop" aria-hidden="true" />
      <div className="hc-grade" aria-hidden="true" />
      <p className="hc-label label">
        <span className="hc-label-n" aria-hidden="true">02</span>
        <span className="hc-label-dot" aria-hidden="true" />
        Now showing
      </p>
      <div className="hc-viewport" aria-hidden="true">
        <ul className="hc-strip">
          {Array.from({ length: 7 }, (_, i) => <li key={i} className="hc-li"><span className="hc-card hc-card-wait" /></li>)}
        </ul>
      </div>
    </section>
  );
}

function Filmstrip({ items, label, region, defaultIndex }) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();

  const [picked, setIndex] = useState(defaultIndex);
  const index = Math.min(Math.max(picked, 0), items.length - 1);
  const active = items[index];

  // Director, runtime and genre for the focused cinema release (one cached call).
  const extra = useRemote(active.tmdbId ? `hc|detail|${active.tmdbId}|${region}` : null,
    (signal) => movieDetail(active.tmdbId, region, signal));
  const credit = extra.data?.director ? `By ${extra.data.director}.` : active.credit;
  const meta = extra.data
    ? [released(extra.data.released), extra.data.runtime ? formatRuntime(extra.data.runtime) : null, extra.data.genres[0]].filter(Boolean)
    : active.meta;

  const accentFor = useAccents(items.map((it) => it.poster));
  const colours = items.map((it) => accentFor(it.poster) ?? `hsl(${it.film.hue} 62% 40%)`);
  const colourKey = colours.join("|");

  const viewport = useRef(null);
  const strip = useRef(null);
  const metrics = useRef({ step: 0, anchor: 0 });
  const indexRef = useRef(index);
  const dragged = useRef(false);
  const wheelAt = useRef(0);
  const x = useMotionValue(0);
  const backdrop = useMotionValue(colours[index]);

  // Keep a ref in step with the index for handlers that outlive a render
  // (the ResizeObserver, the wheel listener). Written in a layout effect, not
  // during render — mutating a ref mid-render is unsafe under concurrent React.
  useLayoutEffect(() => { indexRef.current = index; }, [index]);

  // THE BACKDROP FOLLOWS THE SLIDE. The strip's position is read as a
  // fractional card index, and the colour is blended between the two cards
  // either side of it — so dragging halfway between two films shows the
  // colour halfway between their accents, and a settle spring carries the
  // grade with it. Driven off the motion value: no React render per frame.
  useEffect(() => {
    const palette = colourKey.split("|");
    const stops = palette.map((_, i) => i);
    const paint = (v) => {
      const { step, anchor } = metrics.current;
      if (!step || palette.length < 2) { backdrop.set(palette[indexRef.current] ?? palette[0]); return; }
      const pos = Math.min(Math.max((anchor - v) / step, 0), palette.length - 1);
      backdrop.set(transform(pos, stops, palette));
    };
    paint(x.get());
    return x.on("change", paint);
  }, [x, backdrop, colourKey]);

  // The upper bound is applied during render (see `index` above), so a
  // request past the end simply resolves to the last card.
  const go = useCallback((i) => setIndex(Math.max(i, 0)), []);

  /** Move the strip so card `i` sits on the anchor line. */
  const settle = useCallback((i, instant = false) => {
    const { step, anchor } = metrics.current;
    if (!step) return;
    const target = anchor - i * step;
    if (instant || reduced) x.set(target);
    else animate(x, target, SPRING);
  }, [x, reduced]);

  useEffect(() => { settle(index); }, [index, settle]);

  // Measure into refs, not state: resizing never re-renders, it just re-aims.
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return undefined;
    const measure = () => {
      const card = vp.querySelector(".hc-card");
      if (!card || !strip.current) return;
      const gap = parseFloat(getComputedStyle(strip.current).columnGap) || 0;
      const wide = vp.clientWidth >= 900;
      metrics.current = { step: card.offsetWidth + gap, anchor: vp.clientWidth * (wide ? 0.52 : 0.07) };
      settle(indexRef.current, true);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    // ResizeObserver can fail to deliver in throttled contexts; measure anyway.
    const t = setTimeout(measure, 250);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [settle]);

  // Horizontal wheel / trackpad swipe. Non-passive so it can preventDefault —
  // React's onWheel is passive and cannot.
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return undefined;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      const now = Date.now();
      if (now - wheelAt.current < 420) return;
      wheelAt.current = now;
      go(indexRef.current + (e.deltaX > 0 ? 1 : -1));
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [go]);

  function onKeyDown(e) {
    const moves = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in moves) { e.preventDefault(); go(index + moves[e.key]); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(items.length - 1); }
  }

  function onCardClick(i) {
    if (dragged.current) return;               // a drag is not a click
    if (i === index) navigate(items[i].href);
    else go(i);
  }

  const lines = splitTitle(active.title);

  return (
    <section
      className="hc"
      aria-roledescription="carousel"
      aria-label="Now showing"
      onKeyDown={onKeyDown}
    >
      <motion.div className="hc-backdrop" aria-hidden="true" style={{ backgroundColor: backdrop }} />
      <div className="hc-grade" aria-hidden="true" />

      <p className="hc-label label">
        <span className="hc-label-n" aria-hidden="true">02</span>
        <span className="hc-label-dot" aria-hidden="true" />
        {label}
      </p>

      <div ref={viewport} className="hc-viewport">
        <motion.ul
          ref={strip}
          className="hc-strip"
          style={{ x }}
          drag={reduced ? false : "x"}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => { dragged.current = true; }}
          onDragEnd={(_, info) => {
            const { step } = metrics.current;
            const delta = step ? Math.round(-info.offset.x / step) : 0;
            if (delta) go(indexRef.current + delta);
            else settle(indexRef.current);
            setTimeout(() => { dragged.current = false; }, 60);
          }}
        >
          {items.map((it, i) => {
            // Signed distance from focus, capped: drives the parallax.
            const d = Math.max(-3, Math.min(3, i - index));
            return (
              <li key={it.key} className="hc-li">
                <motion.button
                  type="button"
                  className={`hc-card${i === index ? " is-active" : ""}`}
                  aria-label={`${it.title}${it.year ? `, ${it.year}` : ""}${i === index ? ". Open the film." : ""}`}
                  aria-current={i === index ? "true" : undefined}
                  initial={false}
                  animate={{ clipPath: i === index ? FULL : HALF }}
                  transition={reduced ? { duration: 0 } : SPRING}
                  onClick={() => onCardClick(i)}
                >
                  {/* The picture drifts against the strip's motion and eases
                      back as it takes focus: depth inside each frame. */}
                  <motion.span
                    className="hc-art"
                    initial={false}
                    animate={{ transform: `translateX(${d * -7}%) scale(${d === 0 ? 1.02 : 1.14})` }}
                    transition={reduced ? { duration: 0 } : SPRING}
                  >
                    <Poster film={it.film} showText={false} sizes="(max-width: 899px) 45vw, 300px" />
                  </motion.span>
                </motion.button>
              </li>
            );
          })}
        </motion.ul>
      </div>

      <div className="hc-copy">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.key}
            variants={COPY}
            initial={reduced ? false : "hidden"}
            animate="shown"
            exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.18 } }}
          >
            <h2 className="hc-title">
              {lines.map((line, i) => (
                <span className="mask" key={line}>
                  <motion.span
                    className="mask-in"
                    variants={{ hidden: { y: "110%" }, shown: { y: 0, transition: { duration: 0.8, ease: EASE } } }}
                  >
                    {i === lines.length - 1 && lines.length > 1 ? <em>{line}</em> : line}
                  </motion.span>
                  {i < lines.length - 1 ? " " : null}
                </span>
              ))}
            </h2>
            <motion.p className="hc-credit" variants={RISE}>{credit}</motion.p>
            <motion.ul className="hc-meta" variants={RISE}>
              {meta.map((m) => <li key={m}>{m}</li>)}
            </motion.ul>
            <motion.div variants={RISE}>
              <Link className="btn btn-ink btn-go" to={active.href}>{active.cta}</Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hc-controls">
        <span className="hc-count tnum" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}<i> / {String(items.length).padStart(2, "0")}</i>
        </span>
        <span className="hc-progress" aria-hidden="true">
          <motion.span
            initial={false}
            animate={{ scaleX: (index + 1) / items.length }}
            transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE }}
          />
        </span>
        <button type="button" className="hc-btn" onClick={() => go(index - 1)}
          disabled={index === 0} aria-label="Previous film">&larr;</button>
        <button type="button" className="hc-btn" onClick={() => go(index + 1)}
          disabled={index === items.length - 1} aria-label="Next film">&rarr;</button>
        <button type="button" className="hc-btn hc-menu"
          onClick={() => window.dispatchEvent(new Event("3flix:palette"))}
          aria-label="Search the catalogue">Menu</button>
      </div>

      {/* Announced, so a screen-reader user knows the carousel moved. */}
      <p className="sr-only" aria-live="polite">
        Film {index + 1} of {items.length}: {active.title}{active.year ? `, ${active.year}` : ""}.
      </p>
    </section>
  );
}
