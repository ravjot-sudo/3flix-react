import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Poster from "../components/Poster.jsx";
import Ratings from "../components/Ratings.jsx";
import { TmdbCredit, TmdbSetup } from "../components/TmdbNotes.jsx";
import { useRegion, useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, img, inRegion, movieDetail, netflixUrl, posterStandIn, tmdbSnapshot } from "../lib/tmdb.js";
import { price, watchLinks } from "../lib/watchmode.js";
import { formatRuntime } from "../data/films.js";

const DEFAULT_SERVERS = [
  {
    id: "vidsrc",
    name: "Server 1 (VidSrc)",
    url: (id) => `https://vidsrc.pm/embed/movie/${id}`,
  },
  {
    id: "autoembed",
    name: "Server 2 (AutoEmbed)",
    url: (id) => `https://autoembed.co/movie/tmdb/${id}`,
  },
  {
    id: "vidlink",
    name: "Server 3 (VidLink)",
    url: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e8b14c&secondaryColor=121218&iconColor=e8b14c`,
  },
  // Fallbacks: third-party embed URLs drift over time — if one stops
  // loading (or streams without sound), switch to another above.
  {
    id: "vidsrccc",
    name: "Server 4 (VidSrc CC)",
    url: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
  {
    id: "twoembed",
    name: "Server 5 (2Embed)",
    url: (id) => `https://www.2embed.cc/embed/${id}`,
  },
];

const customSource = typeof import.meta !== "undefined" && import.meta.env?.VITE_VIDEO_SOURCE;
const STREAM_SERVERS = customSource
  ? [
      {
        id: "custom",
        name: "Custom Source (env)",
        url: (id) => `${customSource.replace(/\/$/, "")}/${id}`,
      },
      ...DEFAULT_SERVERS,
    ]
  : DEFAULT_SERVERS;

/**
 * /movies/:movieId — one film from the TMDB catalogue.
 *
 * Provides a full cinema streaming screen with multiple servers, click-to-load
 * YouTube trailers, cinema dimming mode, and direct streaming links.
 */
export default function MovieDetail({ watchlist = [], onToggleWatchlist }) {
  const { movieId } = useParams();
  const id = Number(movieId);
  const valid = Number.isInteger(id) && id > 0;
  const [region] = useRegion();
  const navigate = useNavigate();
  const ready = hasTmdb();

  const [tab, setTab] = useState("stream"); // "stream" | "trailer"
  const [serverId, setServerId] = useState("vidsrc");
  const [cinema, setCinema] = useState(false);
  const [streamPlaying, setStreamPlaying] = useState(false);

  // Cinema mode: dims the surrounding page
  useEffect(() => {
    document.documentElement.classList.toggle("cinema-mode", cinema);
    if (!cinema) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setCinema(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("cinema-mode");
    };
  }, [cinema]);

  const { data: m, error, loading, retry } = useRemote(
    ready && valid ? `${id}|${region}` : null,
    (signal) => movieDetail(id, region, signal),
  );
  // Direct links (Watchmode), once the film itself has loaded. Optional: if
  // they don't come, the page still says where it streams.
  const links = useRemote(m ? `wm|${m.id}|${region}` : null, (signal) => watchLinks(m.id, region, signal));

  // Arriving from a long list, start at the top of the film.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  if (!ready) return <div className="section"><div className="container"><TmdbSetup /></div></div>;
  if (!valid) return <Missing text={`“${movieId}” is not a film id.`} />;
  if (error?.status === 503) return <div className="section"><div className="container"><TmdbSetup /></div></div>;
  if (error) return <Missing text={error.message} retry={retry} />;
  if (loading || !m) return <div className="section mvd-loading"><div className="container"><p className="label">Loading film…</p></div></div>;

  const place = inRegion(region);
  const facts = [m.year, m.runtime ? formatRuntime(m.runtime) : null, m.genres.slice(0, 3).join(" · ")].filter(Boolean);

  const sources = links.data?.sources ?? [];
  const netflixLink = sources.find((s) => s.kind === "sub" && /netflix/i.test(s.name))?.url ?? netflixUrl(m.title);
  const subscription = sources.find((s) => s.kind === "sub");
  const freeSource = sources.find((s) => s.kind === "free");
  const currentServer = STREAM_SERVERS.find((s) => s.id === serverId) ?? STREAM_SERVERS[0];
  const saveId = `tmdb-${m.id}`;
  const saved = watchlist.includes(saveId);

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
              <Ratings imdbId={m.imdbId} />
              <div className="mvd-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-go"
                  onClick={() => {
                    setTab("stream");
                    setStreamPlaying(true);
                    document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true" style={{ marginRight: 6 }}>
                    <path d="M4 2.5v11l9.5-5.5z" />
                  </svg>
                  Watch Film
                </button>
                {onToggleWatchlist && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-pressed={saved}
                    onClick={() => onToggleWatchlist(saveId, saved ? undefined : tmdbSnapshot(m))}
                  >
                    {saved ? "★ Saved to Watchlist" : "☆ Save to Watchlist"}
                  </button>
                )}
                {m.onNetflix ? (
                  <a className="btn btn-ghost btn-go" href={netflixLink} target="_blank" rel="noopener noreferrer">
                    Watch on Netflix<span className="sr-only"> (opens Netflix in a new tab)</span>
                  </a>
                ) : subscription && (
                  <a className="btn btn-ghost btn-go" href={subscription.url} target="_blank" rel="noopener noreferrer">
                    Watch on {subscription.name}<span className="sr-only"> (opens {subscription.name} in a new tab)</span>
                  </a>
                )}
                {(freeSource || m.free.length > 0) && (
                  <a className="btn btn-ghost" href={freeSource?.url ?? m.providersLink} target="_blank" rel="noopener noreferrer">
                    Watch free on {freeSource?.name ?? m.free[0].name}
                    {!freeSource && m.free.length > 1 ? ` +${m.free.length - 1}` : ""}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
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
        <section id="player" className="mvd-block mvd-player-section" aria-labelledby="mvd-player-heading">
          <div className="mvd-player-header">
            <div className="mvd-player-tabs" role="tablist" aria-label="Media player modes">
              <button
                type="button"
                role="tab"
                id="tab-stream"
                aria-selected={tab === "stream"}
                className={`mvd-tab ${tab === "stream" ? "is-active" : ""}`}
                onClick={() => setTab("stream")}
              >
                Stream Film
              </button>
              {m.trailerKey && (
                <button
                  type="button"
                  role="tab"
                  id="tab-trailer"
                  aria-selected={tab === "trailer"}
                  className={`mvd-tab ${tab === "trailer" ? "is-active" : ""}`}
                  onClick={() => setTab("trailer")}
                >
                  Trailer
                </button>
              )}
            </div>

            {tab === "stream" && (
              <div className="mvd-player-controls">
                <label className="mvd-server-label" htmlFor="server-select">
                  <span className="label">Server</span>
                  <select
                    id="server-select"
                    className="mvd-server-select"
                    value={serverId}
                    onChange={(e) => setServerId(e.target.value)}
                  >
                    {STREAM_SERVERS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={`btn-icon cinema-btn ${cinema ? "is-active" : ""}`}
                  onClick={() => setCinema((c) => !c)}
                  aria-pressed={cinema}
                  aria-label={cinema ? "Leave cinema mode" : "Cinema mode — dim the page"}
                  title="Cinema mode (Esc to leave)"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="currentColor" />
                    <path d="M5 13.5h6" stroke="currentColor" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="mvd-screen-wrapper">
            {tab === "stream" ? (
              <MovieStreamer
                key={`${m.id}-${serverId}`}
                id={m.id}
                title={m.title}
                backdrop={m.backdrop}
                server={currentServer}
                autoPlay={streamPlaying}
                onPlay={() => setStreamPlaying(true)}
              />
            ) : (
              <Trailer
                key={m.id}
                videoKey={m.trailerKey}
                title={m.title}
                backdrop={m.backdrop}
              />
            )}
          </div>

          {tab === "stream" && (
            <div className="mvd-server-hint">
              <span className="mvd-tag">{currentServer.name}</span>
              <span>
                No sound or slow playback? Switch servers above — and tap the
                speaker icon inside the video, then turn your device volume up.
              </span>
            </div>
          )}

          {tab === "trailer" && (
            <div className="mvd-server-hint">
              <span className="mvd-tag">Trailer</span>
              <span>
                Press play in the player for sound — if silent, tap YouTube's
                speaker icon and turn your device volume up.
              </span>
            </div>
          )}
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
            ) : !sources.length && (
              <p className="mvd-note">
                No streaming service carries it in {place} right now
                {m.year && m.year >= new Date().getFullYear() - 1 ? " — it may still be in cinemas." : "."}
              </p>
            )}

            {sources.length > 0 && (
              <>
                <h3 className="mvd-sub label">Open it directly</h3>
                <ul className="mvd-links">
                  {sources.map((s) => (
                    <li key={`${s.id}|${s.kind}`}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        <span className="mvd-link-name">{s.name}</span>
                        <span className="mvd-tag">{s.label}{s.price != null ? ` · ${price(s.price, region)}` : ""}</span>
                        <span className="sr-only"> (opens {s.name} in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mvd-credit label">
                  Direct links by <a href="https://www.watchmode.com/" target="_blank" rel="noopener noreferrer">Watchmode</a>
                </p>
              </>
            )}
          </section>
        </div>

        {m.cast.length > 0 && (
          <section className="mvd-block" aria-labelledby="mvd-cast">
            <h2 id="mvd-cast" className="mvd-h">Cast</h2>
            <ul className="mvd-cast">
              {m.cast.map((c) => (
                <li key={c.id}>
                  {c.photo ? (
                    <img className="mvd-cast-photo" src={img(c.photo, "w185")} alt={c.name} width="92" loading="lazy" decoding="async" />
                  ) : (
                    <span className="mvd-cast-fallback" aria-hidden="true">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                  )}
                  <span className="mvd-cast-name">{c.name}</span><span className="mvd-cast-role">{c.character}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <TmdbCredit />
      </div>
    </article>
  );
}

/** Embedded video streaming player with click-to-load facade */
function MovieStreamer({ id, title, backdrop, server, autoPlay, onPlay }) {
  const [on, setOn] = useState(autoPlay || false);

  function start() {
    setOn(true);
    onPlay?.();
  }

  return (
    <div className="mvd-trailer">
      {on ? (
        <iframe
          src={server.url(id)}
          title={`${title} — streaming`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="mvd-facade"
          onClick={start}
          aria-label={`Stream ${title} on ${server.name}`}
        >
          {backdrop && <img src={img(backdrop, "w780")} alt="" loading="lazy" />}
          <span className="mvd-play" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M4 2.5v11l9.5-5.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="mvd-facade-label label">Stream film · loads player ({server.name})</span>
        </button>
      )}
    </div>
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
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?rel=0`}
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
