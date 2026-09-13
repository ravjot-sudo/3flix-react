import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * About — what 3Flix is, and why the free half is legal.
 *
 * Two halves, said plainly: the classics are public domain and play here; the
 * new releases are licensed to other services, so 3Flix shows their official
 * artwork and trailers and points to where each one legally streams.
 *
 * Demonstrates: semantic HTML (section, ol, dl), a heading hierarchy that
 * reads top to bottom, composition (children passed through Reason), and
 * whileInView reveals.
 */
const EASE = [0.16, 1, 0.3, 1];

const REASONS = [
  {
    title: "The term ran out",
    film: { id: "nosferatu", title: "Nosferatu" },
    body: <>US copyright on films published before 1930 has fully expired. <em>Nosferatu</em>, <em>Metropolis</em> and <em>The General</em> are free this way.</>,
  },
  {
    title: "No notice, no copyright",
    film: { id: "night-living-dead", title: "Night of the Living Dead" },
    body: <>Under the 1909 Act, a film released without a copyright notice entered the public domain at once. One missing line is why <em>Night of the Living Dead</em> is free.</>,
  },
  {
    title: "Never renewed",
    film: { id: "charade", title: "Charade" },
    body: <>Older works needed their copyright renewed after 28 years. Thousands never were, <em>Charade</em> and <em>D.O.A.</em> among them.</>,
  },
];

const SOURCES = [
  ["TMDB", "Titles, official posters, ratings and cast for the new releases.", "https://www.themoviedb.org/"],
  ["JustWatch", "Which services stream each film in your country, via TMDB.", "https://www.justwatch.com/"],
  ["Watchmode", "A direct link to the film on each service, with rent and buy prices.", "https://www.watchmode.com/"],
  ["OMDb", "IMDb, Rotten Tomatoes and Metacritic scores, awards and box office.", "https://www.omdbapi.com/"],
  ["YouTube", "Official trailers. Nothing loads until you press play.", "https://www.youtube.com/"],
  ["Internet Archive", "The classics themselves, streamed from where they are lawfully hosted.", "https://archive.org/"],
];

const STACK = ["React 19", "React Router 7", "framer-motion", "Vite", "Plain CSS"];

export default function About() {
  return (
    <section className="section about" aria-labelledby="about-title">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>04</span><span className="folio-label">About</span></p>
          <div className="sec-head-body">
            <h1 id="about-title" className="sec-title display-xl">
              Old films play here. <em>New ones play there.</em>
            </h1>
            <p className="sec-note">
              3Flix has two halves. Films that stream right here, free: 24
              public-domain classics, with subtitles. And
              a live catalogue of new and popular films, with official posters,
              trailers, scores, and a link to wherever each one legally streams.
            </p>
          </div>
        </header>

        <h2 className="about-h">
          <span className="about-h-n">01</span> Why the classics are free
        </h2>
        <ol className="about-grid">
          {REASONS.map((r, i) => (
            <Reason key={r.title} n={i + 1} title={r.title} film={r.film}>{r.body}</Reason>
          ))}
        </ol>

        <h2 className="about-h">
          <span className="about-h-n">02</span> Where everything comes from
        </h2>
        <dl className="about-grid about-sources">
          {SOURCES.map(([name, what, href]) => (
            <div key={name} className="about-cell">
              <dt>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {name}<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
        <p className="about-fine">
          New releases are licensed to streaming services and cinemas, so 3Flix
          never plays them; it sends you to the service that has them. This
          product uses the TMDB API but is not endorsed or certified by TMDB.
          Scores are from OMDb under CC BY-NC 4.0. The API keys stay on the server.
          Signing in asks for a name and an email address — temporary inboxes are
          turned away — and nothing else.
        </p>

        <h2 className="about-h">
          <span className="about-h-n">03</span> Built with
        </h2>
        <ul className="about-stack">
          {STACK.map((s) => <li key={s}>{s}</li>)}
        </ul>

        <div className="about-actions">
          <Link className="btn btn-primary btn-go" to="/library">Browse films</Link>
          <Link className="btn btn-ghost btn-go" to="/movies">See what’s new</Link>
        </div>
      </div>
    </section>
  );
}

/** Composition: the reason's text arrives as children, so it can hold markup. */
function Reason({ n, title, film, children }) {
  return (
    <motion.li
      className="about-cell"
      initial={{ opacity: 0, transform: "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: (n - 1) * 0.08, ease: EASE }}
    >
      <span className="about-n" aria-hidden="true">{String(n).padStart(2, "0")}</span>
      <h3>{title}</h3>
      <p>{children}</p>
      <Link className="link-go" to={`/library/${film.id}`}>Play {film.title}</Link>
    </motion.li>
  );
}
