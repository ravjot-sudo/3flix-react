import { TOP_SIX, GENRE_DECKS } from "../data/homePicks.js";
import { img } from "../lib/tmdb.js";

/**
 * The backdrop behind the sign-in card: the home page's thirty films as a
 * wall of official posters, five columns drifting in opposite directions.
 * Purely decorative — hidden from assistive tech, nothing in it is focusable.
 * The loop is the same CSS keyframe as the Library's poster columns, so it
 * stops for reduced motion with everything else.
 */
const FILMS = [...TOP_SIX, ...GENRE_DECKS.flatMap((g) => g.films)].filter((m) => m.poster);
const COLUMNS = Array.from({ length: 5 }, (_, c) => FILMS.filter((_, i) => i % 5 === c));

export default function GateWall() {
  return (
    <div className="gate-wall" aria-hidden="true">
      <div className="gate-cols">
        {COLUMNS.map((films, c) => (
          <div key={c} className="gate-col">
            <div className={`pcol-track${c % 2 ? " is-reverse" : ""}`} style={{ "--dur": `${70 + c * 11}s` }}>
              {/* Twice over, so the -50% loop is seamless. */}
              {[0, 1].map((copy) =>
                films.map((m) => (
                  <img
                    key={`${copy}-${m.id}`}
                    className="gate-poster"
                    src={img(m.poster, "w342")}
                    alt=""
                    loading={copy ? "lazy" : "eager"}
                    decoding="async"
                  />
                )))}
            </div>
          </div>
        ))}
      </div>
      <div className="gate-shade" />
    </div>
  );
}
