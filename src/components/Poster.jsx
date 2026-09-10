import { memo, useState } from "react";
import { buildPosterArt, secondHue } from "../lib/poster.js";
import { img } from "../lib/tmdb.js";

/**
 * A film's artwork.
 *
 * When the film carries official artwork (film.tmdb, from TMDB's image CDN —
 * no key needed to load it), that is what shows: the portrait poster by
 * default, or the wide backdrop with art="backdrop" for landscape slots. The
 * generated SVG is always drawn underneath, so the frame is never empty while
 * the image loads, and it takes over if the image fails.
 *
 * Demonstrates: props with defaults, conditional rendering, local state for a
 * failed image, responsive images (srcset/sizes), and dangerouslySetInnerHTML
 * used deliberately for SVG we generate ourselves (never for user input).
 */
const SRCSET = {
  poster: [["w185", 185], ["w342", 342], ["w500", 500], ["w780", 780]],
  backdrop: [["w300", 300], ["w780", 780], ["w1280", 1280]],
};

function Poster({ film, showText = true, art = "poster", sizes = "(max-width: 600px) 50vw, 300px", eager = false }) {
  const { title, year, director, rating, hue } = film;
  const [broken, setBroken] = useState(false);
  const path = film.tmdb?.[art] ?? (art === "backdrop" ? film.tmdb?.poster : null);
  const real = Boolean(path) && !broken;
  const set = SRCSET[film.tmdb?.[art] ? art : "poster"];

  return (
    <div className={`poster${real ? " has-art" : ""}`} style={{ "--h1": hue, "--h2": secondHue(film) }}>
      <svg
        className="poster-art"
        viewBox="0 0 300 450"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
        dangerouslySetInnerHTML={{ __html: buildPosterArt(film) }}
      />
      {real && (
        <img
          className="poster-img"
          src={img(path, set[1][0])}
          srcSet={set.map(([size, w]) => `${img(path, size)} ${w}w`).join(", ")}
          sizes={sizes}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          // Otherwise pressing on the art starts the browser's own image drag,
          // which cancels pointer events and kills the carousel's drag gesture.
          draggable={false}
          onError={() => setBroken(true)}
        />
      )}
      <span className="poster-frame" aria-hidden="true" />

      {/* A real poster already carries its own title; only the generated art
          needs the printed billing block. */}
      {showText && !real && (
        <div className="poster-text">
          <span className="poster-rule" aria-hidden="true" />
          <p className="poster-title">{title}</p>
          <p className="poster-meta">
            {year} &middot; {director}
          </p>
        </div>
      )}

      <span className="poster-rating tnum">{rating.toFixed(1)}</span>
    </div>
  );
}

export default memo(Poster);
