import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion, useInView, useReducedMotion, useScroll, useSpring, useTransform,
} from "framer-motion";
import Poster from "./Poster.jsx";
import Reveal from "./Reveal.jsx";
import { FILMS } from "../data/films.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

/**
 * OPENING — adapted from 21st.dev "Hero scroll video pin reveal".
 *
 * The original drives this with GSAP, ScrollTrigger, SplitText and Lenis.
 * Here it runs on framer-motion alone, so the whole site has one motion
 * system and one scroll: nothing hijacks the wheel.
 *
 *   1. a statement, full screen
 *   2. a headline whose words tilt upright as you scroll (scrubbed, not timed)
 *   3. genre tags wiping in, left to right
 *   4. a pinned screen that opens as a growing circle onto a film
 *   5. an outro line — after which the nav bar arrives (see the effect below)
 */
const FILM = FILMS.find((f) => f.id === "metropolis") ?? FILMS[0];

const HEADLINE = "From a rocket in the Moon’s eye to the night the dead walked.";

const TAGS = [
  { genre: "Silent", tone: "gold" },
  { genre: "Noir", tone: "ember" },
  { genre: "Sci-Fi", tone: "paper" },
  { genre: "Horror", tone: "line" },
];

const RING = `3FLIX · PUBLIC DOMAIN · NOW SHOWING · ${FILM.title.toUpperCase()} ${FILM.year} · `;

export default function OpeningReveal({ onEnd }) {
  const reduced = useReducedMotion();
  const section = useRef(null);
  // The latest onEnd, for the scroll handler below to call without
  // re-subscribing whenever the parent passes a new function.
  const endRef = useRef(onEnd);
  useEffect(() => { endRef.current = onEnd; }, [onEnd]);

  // Starting radius of the circle, per breakpoint (a phone needs a bigger
  // opening to read as a picture at all).
  const small = useMediaQuery("(max-width: 639px)");
  const mid = useMediaQuery("(max-width: 1023px)");
  const r0 = small ? 18 : mid ? 12 : 8;

  // While the opening fills the screen, the page is a title sequence: the nav
  // stays out of the way and a Skip button offers the exit. The state lives on
  // <html> so plain CSS can react to it, and is removed when Home unmounts.
  // Once it is over, onEnd says so (Home shows the sign-in then).
  useEffect(() => {
    const root = document.documentElement;
    let last = 0;
    let trailing = 0;
    const check = () => {
      const el = section.current;
      if (!el) return;
      const on = el.getBoundingClientRect().bottom > window.innerHeight * 0.6;
      const was = root.dataset.intro;
      root.dataset.intro = on ? "on" : "off";
      // Only as it ends (or if the page opens already past it), not on every
      // scroll event after.
      if (!on && was !== "off") endRef.current?.();
    };
    const onScroll = () => {
      clearTimeout(trailing);
      trailing = setTimeout(check, 90); // always settle on the final position
      const now = Date.now();
      if (now - last < 80) return;
      last = now;
      check();
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(trailing);
      delete root.dataset.intro;
    };
  }, []);

  // To the menu when signed in; signed out, to the end — where the sign-in is.
  function skip() {
    const target = document.getElementById("browse") ?? document.getElementById("gate-runway");
    if (!target) return;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }

  return (
    <section ref={section} id="opening" className="op" aria-label="Introduction">
      <div className="op-statement">
        <div className="op-brand" aria-hidden="true">
          <span className="op-brand-word">3Flix</span>
          <span className="label">Public domain cinema</span>
        </div>

        <Reveal as="h1" className="op-big" lines={["Twenty-four films outlived", "their copyright."]} />
        <p className="op-cue label" aria-hidden="true">Scroll</p>
      </div>

      <Kinetic reduced={reduced} />

      {/* Keyed by the radius so a breakpoint change rebuilds the transforms. */}
      <CirclePin key={r0} r0={r0} reduced={reduced} />

      <div className="op-statement op-outro">
        <Reveal as="p" className="op-big" lines={["Now they belong", <em key="e">to everyone.</em>]} />
      </div>

      <button type="button" className="op-skip btn btn-ghost btn-go" onClick={skip}>
        Skip intro
      </button>
    </section>
  );
}

/* ---------- 2 + 3: scrubbed headline and tag wipes ------------------- */
function Kinetic({ reduced }) {
  const ref = useRef(null);
  // 0 as the block enters the bottom of the screen, 1 when its top reaches 30%
  // down — so the headline and every tag are complete while they sit centred,
  // never left half-assembled where a reader stops.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "start 30%"] });
  const words = HEADLINE.split(" ");

  return (
    <div ref={ref} className="op-kinetic">
      <div className="container">
        <h2 className="op-headline">
          <span className="sr-only">{HEADLINE}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <Word key={i} progress={scrollYProgress} range={wordRange(i, words.length)} reduced={reduced}>
                {w}
              </Word>
            ))}
          </span>
        </h2>

        <ul className="op-tags" aria-label="Start with a genre">
          {TAGS.map((t, j) => (
            <Tag key={t.genre} progress={scrollYProgress} range={[0.62 + j * 0.07, 0.76 + j * 0.07]}
              reduced={reduced} {...t} />
          ))}
        </ul>

        <p className="op-sub">1902 to 1968. No ads, no catch.</p>
      </div>
    </div>
  );
}

/** Each word owns a slice of the progress, overlapping its neighbours. */
const wordRange = (i, n) => {
  const start = (i / n) * 0.46;
  return [start, start + 0.18];
};

function Word({ progress, range, reduced, children }) {
  const opacity = useTransform(progress, range, [0, 1]);
  const transform = useTransform(progress, range,
    ["translateY(30%) rotate(8deg)", "translateY(0%) rotate(0deg)"]);
  return (
    <motion.span className="op-word" style={reduced ? undefined : { opacity, transform }}>
      {children}
    </motion.span>
  );
}

function Tag({ progress, range, reduced, genre, tone }) {
  const clipPath = useTransform(progress, range, ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  return (
    <li>
      <motion.span style={reduced ? undefined : { clipPath }} className="op-tag-wrap">
        <Link className={`op-tag op-tag--${tone}`} to={`/library?c=classics&genre=${encodeURIComponent(genre)}`}>
          {genre}
        </Link>
      </motion.span>
    </li>
  );
}

/* ---------- 4: the circle that opens onto a film ------------------ */
function CirclePin({ r0, reduced }) {
  const pin = useRef(null);
  const ringId = useId();
  // Load the clip only once the pin is close, and keep it after that.
  const near = useInView(pin, { once: true, margin: "300px 0px" });
  // Pause the rotating ring whenever the pin is off screen.
  const live = useInView(pin);
  const [videoOk, setVideoOk] = useState(false);

  const { scrollYProgress } = useScroll({ target: pin, offset: ["start start", "end end"] });
  // A spring over raw progress so a trackpad flick settles instead of snapping.
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  const clipPath = useTransform(p, [0, 0.82], [`circle(${r0}% at 50% 50%)`, "circle(150% at 50% 50%)"]);
  // The picture dollies back as the aperture opens — depth inside the frame.
  const innerTransform = useTransform(p, [0, 0.82], ["scale(1.2)", "scale(1)"]);
  const ringOpacity = useTransform(p, [0, 0.3], [1, 0]);
  const creditOpacity = useTransform(p, [0.72, 0.95], [0, 1]);

  const saveData = typeof navigator !== "undefined" && navigator.connection?.saveData;
  const wantVideo = near && !reduced && Boolean(FILM.video) && !saveData;

  return (
    <div ref={pin} className="op-pin">
      <div className="op-stage">
        <motion.div className="op-screen" style={reduced ? undefined : { clipPath }}>
          <motion.div className="op-inner" style={reduced ? undefined : { transform: innerTransform }}>
            <Poster film={FILM} showText={false} art="backdrop" sizes="100vw" eager />
            {wantVideo && (
              <video
                className={`op-video${videoOk ? " is-ok" : ""}`}
                src={`${FILM.video}#t=900`}
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
                onPlaying={() => setVideoOk(true)}
              />
            )}
          </motion.div>
          <div className="op-shade" aria-hidden="true" />
        </motion.div>

        <motion.div
          className={`op-ring${live ? " is-live" : ""}`}
          style={reduced ? { opacity: 0 } : { opacity: ringOpacity, "--r0": r0 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 200 200">
            <defs>
              <path id={ringId} d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" />
            </defs>
            <text textLength="520" lengthAdjust="spacing">
              <textPath href={`#${ringId}`}>{RING}</textPath>
            </text>
          </svg>
        </motion.div>

        <Link className="op-play" to={`/library/${FILM.id}`} aria-label={`Play ${FILM.title} (${FILM.year})`}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor" /></svg>
        </Link>

        <motion.p className="op-credit label" style={reduced ? undefined : { opacity: creditOpacity }}>
          {FILM.title} — {FILM.director}, {FILM.year}
        </motion.p>
      </div>
    </div>
  );
}
