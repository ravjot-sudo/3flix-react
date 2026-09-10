import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Poster from "../components/Poster.jsx";
import { TmdbCredit, TmdbSetup } from "../components/TmdbNotes.jsx";
import { useRegion, useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, img, movieDetail, netflixUrl, posterStandIn, regionName } from "../lib/tmdb.js";
import { formatRuntime } from "../data/films.js";

/**
 * /movies/:movieId — one film from the TMDB catalogue.
 *
 * The trailer is a click-to-load facade: YouTube is not contacted until the
 * visitor presses play, which keeps the page fast and keeps a third party out
 * of every page view. "Watch on Netflix" appears only when TMDB says the film
 * is on Netflix in the visitor's country; otherwise the page says so plainly
 * and lists where it does stream.
 */
export default function MovieDetail() {
  const { movieId } = useParams();
  const id = Number(movieId);
  const valid = Number.isInteger(id) && id > 0;
  const [region] = useRegion();
  const navigate = useNavigate();
  const ready = hasTmdb();

  const { data: m, error, loading, retry } = useRemote(
    ready && valid ? `${id}|${region}` : null,
    (signal) => movieDetail(id, region, signal),
  );

  // Arriving from a long list, start at the top of the film.
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!ready) return <div className="section"><div className="container"><TmdbSetup /></div></div>;
  if (!valid) return <Missing text={`“${movieId}” is not a film id.`} />;
  if (error) return <Missing text={error.message} retry={retry} />;
  if (loading || !m) return <div className="section mvd-loading"><div className="container"><p className="label">Loading film…</p></div></div>;

  const place = regionName(region);
  const facts = [m.year, m.runtime ? formatRuntime(m.runtime) : null, m.genres.slice(0, 3).join(" · ")].filter(Boolean);

  return (
    <article className="mvd">
      <div className="mvd-hero">
        {m.backdrop && <img className="mvd-backdrop" src={img(m.backdrop, "w1280")} alt="" decoding="async" />}
        <div className="mvd-shade" aria-hidden="true" />
        <div className="container mvd-hero-inner">
          <button type="button" className="link-go link-back" onClick={() => navigate(-1)}>Back</button>
          <div className="mvd-head">
            <span className="mvd-poster">
              {m.poster ? <img src={img(m.poster, "w342")} alt="" /> : <Poster film={posterStandIn(m)} />}
            </span>
            <div className="mvd-copy">
              <p className="label">{facts.join("   ·   ")}</p>
              <h1 className="mvd-title">{m.title}</h1>
              {m.tagline && <p className="mvd-tagline">{m.tagline}</p>}
              <div className="mvd-actions">
                {m.onNetflix && (
                  <a className="btn btn-primary btn-go" href={netflixUrl(m.title)} target="_blank" rel="noopener noreferrer">
                    Watch on Netflix<span className="sr-only"> (opens Netflix in a new tab)</span>
                  </a>
                )}
                {m.free.length > 0 && (
                  <a className={`btn ${m.onNetflix ? "btn-ghost" : "btn-primary btn-go"}`} href={m.providersLink} target="_blank" rel="noopener noreferrer">
                    Watch free on {m.free[0].name}{m.free.length > 1 ? ` +${m.free.length - 1}` : ""}
                    <span className="sr-only"> (opens the list of free services in a new tab)</span>
                  </a>
                )}
                {!m.onNetflix && !m.free.length && (
                  <p className="mvd-flag">
                    {!m.stream.length && m.year >= new Date().getFullYear() - 1
                      ? `Not streaming yet in ${place}`
                      : `Not on Netflix in ${place}`}
                  </p>
                )}
                <a className="btn btn-ghost" href={m.providersLink} target="_blank" rel="noopener noreferrer">
                  All ways to watch<span className="sr-only"> (opens TMDB in a new tab)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mvd-body">
        <section className="mvd-block mvd-trailer-block" aria-labelledby="mvd-trailer">
          <h2 id="mvd-trailer" className="mvd-h">Trailer</h2>
          <Trailer key={m.id} videoKey={m.trailerKey} title={m.title} backdrop={m.backdrop} />
        </section>

        <div className="mvd-cols">
          <section className="mvd-block" aria-labelledby="mvd-story">
            <h2 id="mvd-story" className="mvd-h">The film</h2>
            <p className="mvd-overview">{m.overview || "No synopsis on file."}</p>
            <dl className="modal-facts">
              {m.director && <div><dt className="label">Director</dt><dd>{m.director}</dd></div>}
              {m.rating ? <div><dt className="label">TMDB rating</dt><dd>{m.rating.toFixed(1)} / 10 ({m.votes.toLocaleString()} votes)</dd></div> : null}
              {m.year && <div><dt className="label">Year</dt><dd>{m.year}</dd></div>}
            </dl>
          </section>

          <section className="mvd-block" aria-labelledby="mvd-where">
            <h2 id="mvd-where" className="mvd-h">Where to watch in {place}</h2>
            {m.stream.length || m.free.length ? (
              <ul className="mvd-providers">
                {m.free.map((p) => (
                  <li key={`f${p.id}`} className="is-free">
                    {p.logo && <img src={img(p.logo, "w92")} alt="" width="36" height="36" loading="lazy" />}
                    <span>{p.name}</span>
                    <span className="mvd-tag">Free</span>
                  </li>
                ))}
                {m.stream.map((p) => (
                  <li key={`s${p.id}`} className={p.name === "Netflix" ? "is-netflix" : undefined}>
                    {p.logo && <img src={img(p.logo, "w92")} alt="" width="36" height="36" loading="lazy" />}
                    <span>{p.name}</span>
                    <span className="mvd-tag">Subscription</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mvd-note">
                No streaming service carries it in {place} right now
                {m.year && m.year >= new Date().getFullYear() - 1 ? " — it may still be in cinemas." : "."}
              </p>
            )}
          </section>
        </div>

        {m.cast.length > 0 && (
          <section className="mvd-block" aria-labelledby="mvd-cast">
            <h2 id="mvd-cast" className="mvd-h">Cast</h2>
            <ul className="mvd-cast">
              {m.cast.map((c) => (
                <li key={c.id}><span className="mvd-cast-name">{c.name}</span><span className="mvd-cast-role">{c.character}</span></li>
              ))}
            </ul>
          </section>
        )}

        <TmdbCredit />
      </div>
    </article>
  );
}

/** Click-to-load YouTube trailer. Remounted per film (key), so it resets. */
function Trailer({ videoKey, title, backdrop }) {
  const [on, setOn] = useState(false);
  if (!videoKey) return <p className="mvd-note">No trailer on file for this film.</p>;

  return (
    <div className="mvd-trailer">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?autoplay=1&rel=0`}
          title={`${title} — trailer`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className="mvd-facade" onClick={() => setOn(true)} aria-label={`Play the trailer for ${title}`}>
          {backdrop && <img src={img(backdrop, "w780")} alt="" loading="lazy" />}
          <span className="mvd-play" aria-hidden="true">
            <svg viewBox="0 0 16 16"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor" /></svg>
          </span>
          <span className="mvd-facade-label label">Play trailer · loads YouTube</span>
        </button>
      )}
    </div>
  );
}

function Missing({ text, retry }) {
  return (
    <div className="section">
      <div className="container empty">
        <h2>Couldn’t open this film.</h2>
        <p>{text}</p>
        {retry && <button type="button" className="btn btn-ghost" onClick={retry}>Try again</button>}
        <Link className="link-go" to="/movies">Back to On Netflix</Link>
      </div>
    </div>
  );
}
