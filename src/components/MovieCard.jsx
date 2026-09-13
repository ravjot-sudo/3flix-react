import { useState } from "react";
import { Link } from "react-router-dom";
import Poster from "./Poster.jsx";
import StarButton from "./StarButton.jsx";
import { img, posterStandIn, tmdbSnapshot } from "../lib/tmdb.js";

/**
 * One film from the TMDB catalogue: poster, then a title bar.
 *
 * TMDB artwork is responsive (srcset picks 185/342/500px wide by layout), and
 * lazy — a grid of forty posters only downloads the ones on screen. If a film
 * has no poster, or the image fails, our own generated <Poster/> stands in.
 */
export default function MovieCard({ film, inWatchlist = false, onToggleWatchlist }) {
  const [broken, setBroken] = useState(false);
  const src = img(film.poster, "w342");
  const saveId = `tmdb-${film.id}`;

  return (
    <Link className="mv-card" to={`/movies/${film.id}`}>
      <span className="mv-poster">
        {src && !broken ? (
          <img
            src={src}
            srcSet={`${img(film.poster, "w185")} 185w, ${src} 342w, ${img(film.poster, "w500")} 500w`}
            sizes="(max-width: 560px) 46vw, (max-width: 1100px) 24vw, 210px"
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
          />
        ) : (
          <Poster film={posterStandIn(film)} />
        )}
      </span>
      <span className="mv-bar">
        <span className="mv-title">{film.title}</span>
        <span className="mv-meta">
          {film.year ?? "—"}
          {film.rating ? <> · <span aria-label={`rated ${film.rating.toFixed(1)} out of 10`}>★ {film.rating.toFixed(1)}</span></> : null}
        </span>
      </span>
      {onToggleWatchlist && (
        <StarButton
          saved={inWatchlist}
          title={film.title}
          onToggle={() => onToggleWatchlist(saveId, inWatchlist ? undefined : tmdbSnapshot(film))}
        />
      )}
    </Link>
  );
}
