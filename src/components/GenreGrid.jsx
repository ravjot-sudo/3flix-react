import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS, GENRES } from "../data/films.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

/**
 * THE MENU — the first thing after the opening, and the way into browsing.
 *
 * A numbered 4×2 grid of panels, one per genre.
 * Each panel holds three of its films as a stacked deck; hovering or focusing
 * the panel fans the deck out on a spring, so the menu previews what is behind
 * each door before you open it. Touch screens have no hover, so there the deck
 * fans as the panel scrolls into view instead. Opening one lands on the
 * library already filtered (the genre travels in the URL).
 *
 * Demonstrates: variants propagating from a parent gesture to children,
 * springs, motion.create() around a router <Link>, derived data at module scope.
 */
const MotionLink = motion.create(Link);

const COPY = {
  Comedy: "Keaton’s stunts, Chaplin’s tramp, screwball patter.",
  Documentary: "The Arctic on film, and a history of witchcraft.",
  Drama: "A tramp, a painter, a mutiny and a hoax.",
  Horror: "From Nosferatu’s shadow to the living dead.",
  Noir: "Rain, smoke, and nobody tells the truth.",
  "Sci-Fi": "A rocket, a robot, a last man and Plan 9.",
  Silent: "No dialogue. Nothing missing.",
  Thriller: "Poison, pursuit and a caper in Paris.",
};

// Static data, so derive it once rather than on every render.
const GROUPS = GENRES.map((genre) => {
  const films = FILMS.filter((f) => f.genres.includes(genre));
  const years = films.map((f) => f.year);
  return { genre, films, from: Math.min(...years), to: Math.max(...years) };
});


// Apple-style spring: easy to reason about, a little bounce for a playful deck.
const FAN = { type: "spring", duration: 0.5, bounce: 0.25 };

/** Offsets for a card at signed position d (−1 … 1) in the deck. */
const rest = (d) => `translateX(${d * 10}px) translateY(0px) rotate(${d * 3}deg)`;
const fan = (d) => `translateX(${d * 64}px) translateY(${Math.abs(d) * 10}px) rotate(${d * 11}deg)`;

export default function GenreGrid() {
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  return (
    <section id="browse" className="section gmenu" aria-labelledby="gmenu-title" tabIndex={-1}>
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>01</span><span className="folio-label">Browse</span></p>
          <div className="sec-head-body">
            <h2 id="gmenu-title" className="sec-title">Eight ways <em>in.</em></h2>
            <p className="sec-note">
              Pick a genre and the library opens already filtered. Each panel
              fans out the films inside it.
            </p>
          </div>
        </header>

        <ul className="gmenu-grid">
          {GROUPS.map((g, i) => (
            <GenreCell key={g.genre} {...g} index={i} canHover={canHover} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function GenreCell({ genre, films, from, to, index, canHover }) {
  const deck = films.slice(0, 3);
  const mid = (deck.length - 1) / 2;
  const span = from === to ? `${from}` : `${from}–${to}`;

  return (
    <li className="gcell">
      <MotionLink
        className="gcell-link"
        to={`/library?genre=${encodeURIComponent(genre)}`}
        initial="rest"
        animate="rest"
        whileHover="fan"
        whileFocus="fan"
        whileInView={canHover ? undefined : "fan"}
        viewport={{ amount: 0.6 }}
      >
        <span className="gcell-text">
          <span className="gcell-n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="gcell-title">
            {genre}
            <svg className="gcell-arrow" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="gcell-desc">{COPY[genre]}</span>
          <span className="gcell-meta">{films.length} films · {span}</span>
        </span>

        <span className="gcell-demo" aria-hidden="true">
          {deck.map((f, k) => {
            const d = mid === 0 ? 0 : (k - mid) / Math.max(mid, 1);
            return (
              <motion.span
                key={f.id}
                className="gcell-poster"
                style={{ zIndex: k === Math.round(mid) ? 3 : 1 }}
                variants={{ rest: { transform: rest(d) }, fan: { transform: fan(d) } }}
                transition={FAN}
              >
                <Poster film={f} showText={false} />
              </motion.span>
            );
          })}
        </span>
      </MotionLink>
    </li>
  );
}
