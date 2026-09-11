import { useRemote } from "../hooks/useTmdb.js";
import { omdbRatings } from "../lib/omdb.js";

/**
 * A strip of scores from OMDb: IMDb, Rotten Tomatoes, Metacritic, the age
 * rating and box office, with the film's awards underneath.
 *
 * Quietly absent when there is nothing to show — no IMDb id, OMDb not yet
 * connected on the server, or no record — so it never leaves an empty box.
 */
export default function Ratings({ imdbId }) {
  const { data } = useRemote(imdbId ? `omdb|${imdbId}` : null, (signal) => omdbRatings(imdbId, signal));
  if (!data) return null;

  const items = [
    data.imdb && {
      label: "IMDb",
      value: `${data.imdb.score}/10`,
      sub: data.imdb.votes && `${data.imdb.votes} votes`,
      href: `https://www.imdb.com/title/${imdbId}/`,
    },
    data.rottenTomatoes && { label: "Rotten Tomatoes", value: data.rottenTomatoes },
    data.metacritic && { label: "Metacritic", value: `${data.metacritic}/100` },
    data.rated && { label: "Rated", value: data.rated },
    data.boxOffice && { label: "Box office", value: data.boxOffice },
  ].filter(Boolean);

  if (!items.length && !data.awards) return null;

  return (
    <section className="ratings" aria-label="Ratings">
      {items.length > 0 && (
        <dl className="ratings-row">
          {items.map(({ label, value, sub, href }) => (
            <div key={label} className="ratings-item">
              <dt className="label">{label}</dt>
              <dd>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {value}<span className="sr-only"> (opens IMDb in a new tab)</span>
                  </a>
                ) : value}
                {sub && <span className="ratings-sub">{sub}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {data.awards && <p className="ratings-awards">{data.awards}</p>}
      <p className="ratings-credit label">
        Scores via <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">OMDb</a> · CC BY-NC 4.0
      </p>
    </section>
  );
}
