import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Poster from "./Poster.jsx";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, homePicks } from "../lib/tmdb.js";
import { GENRE_DECKS } from "../data/homePicks.js";

/**
 * EIGHT WAYS IN — the first thing after the opening, and the way into browsing.
 *
 * A numbered 4×2 grid of panels, one per genre. Each holds that genre's three
 * highest-rated films of 2000 onward (TMDB, 5,000+ votes) as a stacked deck;
 * hovering or focusing the panel fans the deck out on a spring. Touch screens
 * have no hover, so there the deck fans as the panel scrolls into view.
 *
 * No film appears twice on the home page: the decks are computed together
 * with the top six (lib/tmdb.js, homePicks), skipping any film — or franchise —
 * already shown. Opening a panel lands on Movies → Top rated for that genre.
 *
 * Demonstrates: variants propagating from a parent gesture to children,
 * springs, motion.create() around a router <Link>, a shared data source.
 */
const MotionLink = motion.create(Link);

// Apple-style spring: easy to reason about, a little bounce for a playful deck.
const FAN = { type: "spring", duration: 0.5, bounce: 0.25 };

/** Offsets for a card at signed position d (−1 … 1) in the deck. */
const rest = (d) => `translateX(${d * 10}px) translateY(0px) rotate(${d * 3}deg)`;
const fan = (d) => `translateX(${d * 64}px) translateY(${Math.abs(d) * 10}px) rotate(${d * 11}deg)`;

const asFilm = (m) => ({
  id: `tmdb-${m.id}`, title: m.title, year: m.year ?? "", director: "", rating: m.rating ?? 0,
  hue: (m.id * 47) % 360, genres: [], tmdb: { poster: m.poster, backdrop: m.backdrop },
});

/** TMDB calls it "Science Fiction"; the panel has room for "Sci-Fi". */
const short = (name) => (name === "Science Fiction" ? "Sci-Fi" : name);

export default function GenreGrid() {
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const live = useRemote(hasTmdb() ? "home|picks" : null, () => homePicks());
  const genres = live.data?.genres?.every((g) => g.films.length === 3) ? live.data.genres : GENRE_DECKS;

  return (
    <section id="browse" className="section gmenu" aria-labelledby="gmenu-title" tabIndex={-1}>
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>01</span><span className="folio-label">Browse</span></p>
          <div className="sec-head-body">
            <h2 id="gmenu-title" className="sec-title">Eight ways <em>in.</em></h2>
            <p className="sec-note">
              The best-rated films of 2000–{new Date().getFullYear()}, one genre at a time,
              and no film twice on this page. Each panel fans out its top three.
            </p>
          </div>
        </header>

        <ul className="gmenu-grid">
          {genres.map((g, i) => (
            <GenreCell key={g.id} genre={g} index={i} canHover={canHover} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function GenreCell({ genre, index, canHover }) {
  const { id, name, total, films } = genre;
  const mid = (films.length - 1) / 2;

  return (
    <li className="gcell">
      <MotionLink
        className="gcell-link"
        to={`/movies?list=top&genre=${id}`}
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
            {short(name)}
            <svg className="gcell-arrow" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="gcell-desc">{films.map((f) => f.title).join(" · ")}</span>
          <span className="gcell-meta">{total.toLocaleString()} top-rated · since 2000</span>
        </span>

        <span className="gcell-demo" aria-hidden="true">
          {films.map((f, k) => {
            const d = mid === 0 ? 0 : (k - mid) / Math.max(mid, 1);
            return (
              <motion.span
                key={f.id}
                className="gcell-poster"
                style={{ zIndex: k === Math.round(mid) ? 3 : 1 }}
                variants={{ rest: { transform: rest(d) }, fan: { transform: fan(d) } }}
                transition={FAN}
              >
                <Poster film={asFilm(f)} showText={false} sizes="90px" />
              </motion.span>
            );
          })}
        </span>
      </MotionLink>
    </li>
  );
}
