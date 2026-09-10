import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS, formatRuntime } from "../data/films.js";

/**
 * RADIAL ORBITAL TIMELINE — 21st.dev Popular #5 (6.7k).
 *
 * The catalogue as an orrery: one ring per decade, earliest at the centre, and
 * every film a node on its ring. Selecting a node stops the orbit and brings
 * that film forward.
 *
 * Structure is chosen for accessibility, not just looks: the nodes are a real
 * list of buttons in CHRONOLOGICAL order, grouped by decade, and CSS places
 * them on the circle. Tab order therefore walks forward through time even
 * though the layout is round.
 */
const FIRST = [...FILMS].sort((a, b) => a.year - b.year)[0];

export default function OrbitalTimeline() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(null);

  // Rings are derived from the data — decades with no films simply do not
  // appear, so the orbit can never show an empty era.
  const rings = useMemo(() => {
    const byDecade = new Map();
    [...FILMS].sort((a, b) => a.year - b.year).forEach((f) => {
      const d = Math.floor(f.year / 10) * 10;
      if (!byDecade.has(d)) byDecade.set(d, []);
      byDecade.get(d).push(f);
    });
    const decades = [...byDecade.keys()];
    return decades.map((decade, i) => {
      const films = byDecade.get(decade);
      const radius = 18 + (i / Math.max(decades.length - 1, 1)) * 74;   // % of stage
      const offset = i * 37;                                             // stagger per ring
      return {
        decade, radius,
        films: films.map((f, j) => {
          const angle = ((j / films.length) * 360 + offset) * (Math.PI / 180);
          return { film: f, x: 50 + (radius / 2) * Math.cos(angle), y: 50 + (radius / 2) * Math.sin(angle) };
        }),
      };
    });
  }, []);

  const active = FILMS.find((f) => f.id === selected) ?? null;
  const activeDecade = active ? Math.floor(active.year / 10) * 10 : null;
  // The panel is never empty: until a point is picked it shows the first film
  // in the collection, and the orbit keeps turning.
  const shown = active ?? FIRST;

  return (
    <section className="orbit-sec section" aria-labelledby="orbit-title">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>04</span><span className="folio-label">History</span></p>
          <div className="sec-head-body">
            <h2 id="orbit-title" className="sec-title display-xl">Sixty-six years<br /><em>in orbit.</em></h2>
            <p className="sec-note">
              One ring for each decade that has a film in the collection, from
              1902 at the centre to 1968 at the rim. Choose any point of light.
            </p>
          </div>
        </header>

        <div className="orbit-layout">
          <div
            className={`orbit${selected ? " is-paused" : ""}${reduced ? " is-still" : ""}`}
            onKeyDown={(e) => { if (e.key === "Escape") setSelected(null); }}
          >
            <div className="orbit-stage">
              {rings.map((ring) => (
                <div
                  key={ring.decade}
                  className={`orbit-ring${activeDecade === ring.decade ? " is-lit" : ""}${activeDecade && activeDecade !== ring.decade ? " is-dim" : ""}`}
                  style={{ "--r": `${ring.radius}%` }}
                  aria-hidden="true"
                >
                  <span className="orbit-ring-label">{ring.decade}s</span>
                </div>
              ))}

              <ol className="orbit-nodes">
                {rings.map((ring) => (
                  <li key={ring.decade}>
                    <ol aria-label={`${ring.decade}s`}>
                      {ring.films.map(({ film, x, y }) => (
                        <li key={film.id}>
                          <button
                            type="button"
                            className={`orbit-node${selected === film.id ? " is-on" : ""}`}
                            style={{ "--x": `${x}%`, "--y": `${y}%` }}
                            aria-pressed={selected === film.id}
                            aria-label={`${film.title}, ${film.year}`}
                            onClick={() => setSelected(selected === film.id ? null : film.id)}
                          >
                            <span className="orbit-dot" aria-hidden="true" />
                            <span className="orbit-tip" aria-hidden="true">{film.title}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </div>

            <div className="orbit-core" aria-hidden="true">
              <span className="orbit-core-year">{active ? active.year : "1902"}</span>
              <span className="label">{active ? "selected" : "the first"}</span>
            </div>
          </div>

          <div className="orbit-panel" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.article
                key={shown.id}
                className="orbit-card"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
              >
                <div className="orbit-card-art"><Poster film={shown} showText={false} sizes="200px" /></div>
                <div>
                  <p className="label">
                    {active ? "" : "Where it starts · "}{shown.year} · {formatRuntime(shown.runtime)} · {shown.genres[0]}
                  </p>
                  <h3>{shown.title}</h3>
                  <p className="orbit-card-dir">{shown.director}</p>
                  <p className="orbit-card-syn">{shown.synopsis}</p>
                  <Link className="btn btn-primary btn-go" to={`/library/${shown.id}`}>
                    {shown.video ? "Watch now" : "Open the listing"}
                  </Link>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
