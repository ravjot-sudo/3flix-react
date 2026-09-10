import FilmCard from "./FilmCard.jsx";

/**
 * Renders a list of films, or an empty state when there are none.
 *
 * Demonstrates: rendering lists with .map and a stable `key`, conditional
 * rendering, and the rest/spread pattern for passing lookups down.
 */
export default function FilmGrid({ films, progress = {}, watchlist = [], emptyMessage }) {
  if (films.length === 0) {
    return (
      <div className="empty">
        <h2>Nothing matches that</h2>
        <p>{emptyMessage ?? "Try a different title, director or genre."}</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {films.map((film) => (
        <FilmCard
          key={film.id}
          film={film}
          progress={progress[film.id] ?? 0}
          inWatchlist={watchlist.includes(film.id)}
        />
      ))}
    </div>
  );
}
