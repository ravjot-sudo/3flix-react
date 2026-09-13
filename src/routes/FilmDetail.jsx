import { Link, useNavigate, useParams } from "react-router-dom";
import Player from "../components/Player.jsx";
import Ratings from "../components/Ratings.jsx";
import { useToast } from "../hooks/useToast.js";
import { FILMS, formatRuntime } from "../data/films.js";

/**
 * DYNAMIC ROUTE — /library/:filmId
 *
 * Demonstrates: useParams to read a route parameter, useNavigate for
 * programmatic navigation, conditional rendering for the not-found case, and
 * callbacks passed up to the parent (progress and watchlist both live above).
 */
export default function FilmDetail({ progress, onProgress, watchlist, onToggleWatchlist }) {
  const { filmId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const film = FILMS.find((f) => f.id === filmId);

  // An unknown :filmId is a 404 in spirit, so say so rather than crash.
  if (!film) {
    return (
      <div className="detail detail-missing">
        <p className="label">Unknown title</p>
        <h2>No film with the id “{filmId}”.</h2>
        <Link className="link-rule" to="/library">Back to the library</Link>
      </div>
    );
  }

  const saved = watchlist.includes(film.id);

  return (
    <article className="detail">
      <Player
        key={film.id}
        film={film}
        startAt={progress[film.id] ?? 0}
        onProgress={(fraction) => onProgress(film.id, fraction)}
      />

      <div className="detail-meta">
        <div className="detail-head">
          <h2>{film.title}</h2>
          <span className="rating-badge tnum">{film.rating.toFixed(1)}</span>
        </div>

        <div className="chips">
          {film.genres.map((g) => (
            <span key={g} className="chip">{g}</span>
          ))}
        </div>

        <p className="detail-synopsis">{film.synopsis}</p>

        <Ratings imdbId={film.imdbId} />

        <dl className="modal-facts">
          <Fact label="Director" value={film.director} />
          <Fact label="Year" value={film.year} />
          <Fact label="Runtime" value={formatRuntime(film.runtime)} />
          <Fact label="Rights" value="Public domain" />
        </dl>

        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onToggleWatchlist(film.id);
              toast.show(
                saved ? `Removed ${film.title} from your watchlist.` : `Added ${film.title} to your watchlist.`,
                { undo: () => onToggleWatchlist(film.id) },
              );
            }}
            aria-pressed={saved}
          >
            {saved ? "Remove from watchlist" : "Add to watchlist"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
