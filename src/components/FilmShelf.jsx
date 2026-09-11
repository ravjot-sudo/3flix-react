import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Poster from "./Poster.jsx";
import { useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, homePicks } from "../lib/tmdb.js";
import { TOP_SIX } from "../data/homePicks.js";

/**
 * THE TOP SIX — the highest-rated films released 2008 onward, as a ranked row.
 *
 * Ranked by TMDB among films with 15,000+ votes, so a small, enthusiastic
 * audience can't outrank what millions have judged. Fetched live when TMDB is
 * connected; otherwise the snapshot in data/homePicks.js, so the row is always
 * the right six. It shares one ranking with "Eight ways in", which never
 * repeats a film shown here.
 *
 * Each place is a big outlined numeral with the film's official poster set
 * against it; the row rises in one by one as it scrolls into view.
 *
 * Demonstrates: an ordered list for a ranking, whileInView with a staggered
 * delay, and a data source shared between two components.
 */
const EASE = [0.16, 1, 0.3, 1];

const asFilm = (m) => ({
  id: `tmdb-${m.id}`, title: m.title, year: m.year ?? "", director: "", rating: m.rating ?? 0,
  hue: (m.id * 47) % 360, genres: [], tmdb: { poster: m.poster, backdrop: m.backdrop },
});

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 0 });

export default function FilmShelf() {
  const live = useRemote(hasTmdb() ? "home|picks" : null, () => homePicks());
  const six = live.data?.six?.length === 6 ? live.data.six : TOP_SIX;

  return (
    <section className="section shelf" aria-labelledby="shelf-title">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>03</span><span className="folio-label">Top six</span></p>
          <div className="sec-head-body">
            <h2 id="shelf-title" className="sec-title">The top six, <em>since 2008.</em></h2>
            <div className="sec-aside">
              <p className="sec-note">
                The highest-rated films of 2008–{new Date().getFullYear()}, ranked by TMDB
                among films with 15,000+ votes.
              </p>
              <Link className="link-go" to="/movies?list=top">All top rated</Link>
            </div>
          </div>
        </header>

        <ol className="rank">
          {six.map((m, i) => (
            <motion.li
              key={m.id}
              className="rank-item"
              initial={{ opacity: 0, transform: "translateY(28px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: EASE }}
            >
              <span className="rank-n" aria-hidden="true">{i + 1}</span>

              <div className="rank-card">
                <Link className="rank-link" to={`/movies/${m.id}`}>
                  <span className="rank-poster">
                    <Poster film={asFilm(m)} showText={false} sizes="(max-width: 700px) 40vw, 180px" />
                  </span>
                  <span className="rank-title">{m.title}</span>
                  <span className="rank-meta">
                    <span className="sr-only">Number {i + 1}. </span>
                    {m.year} · <span aria-label={`rated ${m.rating.toFixed(1)} from ${m.votes.toLocaleString()} votes`}>
                      ★ {m.rating.toFixed(1)} · {compact.format(m.votes)} votes
                    </span>
                  </span>
                </Link>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
