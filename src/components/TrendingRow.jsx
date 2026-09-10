import { Link } from "react-router-dom";
import MovieCard from "./MovieCard.jsx";
import { useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, trending } from "../lib/tmdb.js";

/**
 * Home, section 05: this week's most-watched films worldwide, with their
 * official posters — a scrolling row, the full list one click away. Without a
 * TMDB key it becomes a single line that says what connecting it would add.
 */
export default function TrendingRow() {
  const ready = hasTmdb();
  const { data, error } = useRemote(ready ? "home|trending" : null, (signal) => trending({}, signal));

  return (
    <section className="section nfrow" aria-labelledby="trend-title">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>05</span><span className="folio-label">Trending</span></p>
          <div className="sec-head-body">
            <h2 id="trend-title" className="sec-title">Trending <em>this week.</em></h2>
            <div className="sec-aside">
              <p className="sec-note">
                {ready
                  ? "The films the world is watching right now — official posters, trailers, and where each one streams."
                  : "Connect TMDB and this row fills with this week’s trending films, official posters and all."}
              </p>
              <Link className="link-go" to="/movies">{ready ? "See everything trending" : "Set it up"}</Link>
            </div>
          </div>
        </header>

        {ready && !error && (
          <ul className="nfrow-track" aria-busy={!data}>
            {(data?.results ?? Array.from({ length: 8 }, (_, i) => ({ id: `s${i}` }))).slice(0, 14).map((f) => (
              <li key={f.id} className={data ? undefined : "mv-skel"}>
                {data && <MovieCard film={f} />}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mvd-note">{error.message}</p>}
      </div>
    </section>
  );
}
