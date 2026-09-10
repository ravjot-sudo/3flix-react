import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS } from "../data/films.js";

/**
 * LAYERED POSTER COLUMNS — adapted from 21st.dev Popular #6,
 * "Testimonials Columns" (6.1k).
 *
 * The source shows customer quotes. 3Flix has no customers to quote and
 * inventing them would be fake proof, so the PATTERN is kept — columns
 * drifting at different speeds — and filled with the catalogue instead.
 *
 * Depth comes from three cues moving together: the back column is smaller,
 * dimmer and slower; the front is larger, brighter and faster. Scroll then
 * adds a second, independent parallax on top of the loop.
 */
const DEPTHS = [
  { key: "back",  films: FILMS.slice(0, 8),   duration: 64, reverse: false, travel: 40 },
  { key: "mid",   films: FILMS.slice(8, 16),  duration: 48, reverse: true,  travel: 80 },
  { key: "front", films: FILMS.slice(16, 24), duration: 36, reverse: false, travel: 140 },
];

function Column({ depth, progress, reduced }) {
  const y = useTransform(progress, [0, 1], [depth.travel, -depth.travel]);

  return (
    <motion.div
      className={`pcol pcol-${depth.key}`}
      style={reduced ? undefined : { y }}
    >
      <div
        className={`pcol-track${depth.reverse ? " is-reverse" : ""}`}
        style={{ "--dur": `${depth.duration}s` }}
      >
        {/* The list is rendered twice so the -50% loop is seamless. The
            second copy is hidden from assistive tech AND taken out of the tab
            order — aria-hidden alone would leave focusable links inside it. */}
        {[0, 1].map((copy) => (
          <ul key={copy} className="pcol-list" aria-hidden={copy === 1 || undefined}>
            {depth.films.map((f) => (
              <li key={`${copy}-${f.id}`}>
                <Link
                  to={`/library/${f.id}`}
                  className="pcol-card"
                  tabIndex={copy === 1 ? -1 : undefined}
                  aria-label={copy === 1 ? undefined : `${f.title}, ${f.year}`}
                >
                  <Poster film={f} />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </motion.div>
  );
}

export default function PosterColumns() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} className="pcols" aria-labelledby="pcols-title">
      <div className="container pcols-grid">
        <div className="pcols-copy">
          <p className="folio">No. 02</p>
          <h2 id="pcols-title" className="sec-title display-xl">
            Twenty-four<br /><em>lobby cards.</em>
          </h2>
          <p className="sec-note">
            Every poster here is drawn in your browser from the film&apos;s own
            metadata — its year, its genre, its hue. Nothing is borrowed from a
            rights holder. Hover a column to stop it; select any card to play.
          </p>
        </div>

        <div className={`pcols-field${reduced ? " is-still" : ""}`}>
          {DEPTHS.map((d) => (
            <Column key={d.key} depth={d} progress={scrollYProgress} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  );
}
