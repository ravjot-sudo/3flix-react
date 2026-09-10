import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS } from "../data/films.js";

/**
 * SCROLL MEDIA EXPANSION HERO — 21st.dev Popular #1 (9.4k).
 *
 * A single film frame grows from an inset plate to a full-bleed screen as the
 * section is scrolled, while the headline parts either side of it.
 *
 * The frame is always full-size; what animates is its clip-path. Animating
 * width/height would relayout the page every frame, whereas clip-path is
 * composited — that is the difference between smooth and janky on a laptop.
 *
 * Layers, back to front:
 *   0 ink field + vignette
 *   1 the frame: generated poster, then an optional muted Archive clip
 *   2 the parting headline
 *   3 credit line + scroll cue
 */
const FILM = FILMS.find((f) => f.id === "metropolis") ?? FILMS[0];

export default function ScrollHero() {
  const section = useRef(null);
  const reduced = useReducedMotion();
  // `once`: after the hero has been seen, keep the video rather than
  // tearing it down and re-buffering every time it scrolls back in.
  const seen = useInView(section, { once: true, margin: "0px" });
  const [videoOk, setVideoOk] = useState(false);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // A spring over the raw progress so trackpad flicks settle rather than snap.
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  // Frame: an inset plate (32vw × 42vh) opening to the whole screen.
  const insetY = useTransform(p, [0, 0.7], [29, 0]);
  const insetX = useTransform(p, [0, 0.7], [34, 0]);
  const radius = useTransform(p, [0, 0.7], [2, 0]);
  const clipPath = useTransform([insetY, insetX, radius],
    ([y, x, r]) => `inset(${y}% ${x}% ${y}% ${x}% round ${r}px)`);
  // The picture inside dollies back as the frame opens — parallax within it.
  const innerScale = useTransform(p, [0, 0.7], [1.22, 1]);

  // Headline: the two words part and leave the screen.
  const leftX = useTransform(p, [0, 0.6], ["0vw", "-62vw"]);
  const rightX = useTransform(p, [0, 0.6], ["0vw", "62vw"]);
  const creditOpacity = useTransform(p, [0, 0.3], [1, 0]);
  const dim = useTransform(p, [0.55, 0.95], [0, 0.55]);

  // Derived, not stored: only ask for video once the hero has been on screen,
  // never under reduced motion, and never when the visitor asked to save data.
  const saveData = typeof navigator !== "undefined" && navigator.connection?.saveData;
  const wantVideo = seen && !reduced && Boolean(FILM.video) && !saveData;

  const endState = reduced
    ? { clipPath: "inset(0% 0% 0% 0% round 0px)" }
    : { clipPath };

  return (
    <section className="xhero" aria-labelledby="xhero-title">
      {/* The pin: tall, and containing nothing but the sticky layer. */}
      <div ref={section} className="xhero-pin">
      <div className="xhero-sticky">
        <div className="xhero-field" aria-hidden="true" />

        <motion.div className="xhero-frame" style={endState} aria-hidden="true">
          <motion.div className="xhero-inner" style={reduced ? undefined : { scale: innerScale }}>
            <Poster film={FILM} showText={false} />
            {wantVideo && (
              // No crossOrigin: the Archive redirects to a host with no CORS
              // headers, and asking for CORS mode fails the load outright.
              // #t skips the opening credits.
              <video
                className={`xhero-video${videoOk ? " is-ok" : ""}`}
                src={`${FILM.video}#t=900`}
                muted
                playsInline
                autoPlay
                loop
                preload="none"
                onPlaying={() => setVideoOk(true)}
                onError={() => setVideoOk(false)}
              />
            )}
          </motion.div>
          <motion.div className="xhero-dim" style={reduced ? undefined : { opacity: dim }} />
        </motion.div>

        {/* One heading, one accessible name. The parting words are visual. */}
        <h1 id="xhero-title" className="xhero-title">
          <span className="sr-only">Cinema that outlived its own copyright.</span>
          <motion.span className="xhero-word xhero-left" aria-hidden="true"
            style={reduced ? undefined : { x: leftX }}>Cinema</motion.span>
          <motion.span className="xhero-word xhero-right" aria-hidden="true"
            style={reduced ? undefined : { x: rightX }}><em>outlived.</em></motion.span>
        </h1>

        <motion.div className="xhero-credit" style={reduced ? undefined : { opacity: creditOpacity }}>
          <p className="label">
            Now showing &middot; <span className="xhero-credit-title">{FILM.title}</span> &middot; {FILM.year}
          </p>
          <span className="xhero-cue" aria-hidden="true"><i /></span>
        </motion.div>
      </div>
      </div>

      {/* Follow-on copy lives AFTER the pin, so it only arrives once the
          frame has finished opening. */}
      <div className="xhero-after container">
        <p className="xhero-lede">
          Twenty-four films that shaped horror, noir, science fiction and comedy —
          every one of them now free for anyone to watch, copy and keep.
        </p>
        <div className="xhero-actions">
          <Link className="btn btn-primary btn-lg" to="/library">Enter the library</Link>
          <Link className="link-rule" to="/about">How this is legal</Link>
        </div>
      </div>
    </section>
  );
}
