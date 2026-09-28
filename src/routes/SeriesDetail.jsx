import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Poster from "../components/Poster.jsx";
import { TmdbCredit, TmdbSetup } from "../components/TmdbNotes.jsx";
import { useRegion, useRemote } from "../hooks/useTmdb.js";
import { hasTmdb, img, inRegion, posterStandIn, seasonEpisodes, seriesDetail, tmdbSnapshot } from "../lib/tmdb.js";

const STREAM_SERVERS = [
  {
    id: "vidsrc",
    name: "Server 1 (VidSrc)",
    url: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "autoembed",
    name: "Server 2 (AutoEmbed)",
    url: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    id: "vidlink",
    name: "Server 3 (VidLink)",
    url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e8b14c&secondaryColor=121218&iconColor=e8b14c`,
  },
];

/**
 * /series/:tvId — one series from the TMDB catalogue.
 *
 * The film page's sibling: same cinema screen with multiple servers,
 * click-to-load YouTube trailers, cinema dimming mode and direct streaming
 * links — plus a season and episode picker driving the embed URLs.
 */
export default function SeriesDetail({ watchlist = [], onToggleWatchlist }) {
  const { tvId } = useParams();
  const id = Number(tvId);
  const valid = Number.isInteger(id) && id > 0;
  const [region] = useRegion();
  const navigate = useNavigate();
  const ready = hasTmdb();

  const [tab, setTab] = useState("stream"); // "stream" | "trailer"
  const [serverId, setServerId] = useState("vidsrc");
  const [cinema, setCinema] = useState(false);
  const [streamPlaying, setStreamPlaying] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

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
    ready && valid ? `tv|${id}|${region}` : null,
    (signal) => seriesDetail(id, region, signal),
  );
  // Episode titles for the picker; the count alone is enough to play.
  const eps = useRemote(m ? `ep|${m.id}|${season}` : null, (signal) => seasonEpisodes(m.id, season, signal));

  // A new season starts at its first episode (adjusted while rendering, on
  // a change of input — React's recommended alternative to an effect here).
  const [aired, setAired] = useState(season);
  if (aired !== season) {
    setAired(season);
    setEpisode(1);
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  if (!ready) return <div className="section"><div className="container"><TmdbSetup /></div></div>;
  if (!valid) return <Missing text={`“${tvId}” is not a series id.`} />;
  if (error?.status === 503) return <div className="section"><div className="container"><TmdbSetup /></div></div>;
  if (error) return <Missing text={error.message} retry={retry} />;
  if (loading || !m) return <div className="section mvd-loading"><div className="container"><p className="label">Loading series…</p></div></div>;

  const place = inRegion(region);
  const seasonCount = m.seasons.length;
  const facts = [m.year, seasonCount ? `${seasonCount} Season${seasonCount === 1 ? "" : "s"}` : null, m.genres.slice(0, 3).join(" · ")].filter(Boolean);

  const currentServer = STREAM_SERVERS.find((s) => s.id === serverId) ?? STREAM_SERVERS[0];
  const saveId = `tv-${m.id}`;
  const saved = watchlist.includes(saveId);

  const activeSeason = m.seasons.find((s) => s.number === season) ?? m.seasons[0] ?? null;
  const episodeList = eps.data?.length
    ? eps.data
    : Array.from({ length: activeSeason?.episodes ?? 1 }, (_, i) => ({ number: i + 1, name: `Episode ${i + 1}` }));
  const shownEpisode = Math.min(episode, episodeList.length || 1);

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
                  Watch Series
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
                Stream Series
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
                <label className="mvd-server-label" htmlFor="season-select">
                  <span className="label">Season</span>
                  <select
                    id="season-select"
                    className="mvd-server-select"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                  >
                    {m.seasons.map((s) => (
                      <option key={s.number} value={s.number}>S{s.number} · {s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="mvd-server-label" htmlFor="episode-select">
                  <span className="label">Episode</span>
                  <select
                    id="episode-select"
                    className="mvd-server-select"
                    value={shownEpisode}
                    onChange={(e) => setEpisode(Number(e.target.value))}
                  >
                    {episodeList.map((e) => (
                      <option key={e.number} value={e.number}>E{e.number} · {e.name}</option>
                    ))}
                  </select>
                </label>
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
              <SeriesStreamer
                key={`${m.id}-${serverId}-${season}-${shownEpisode}`}
                id={m.id}
                title={m.title}
                backdrop={m.backdrop}
                server={currentServer}
                season={season}
                episode={shownEpisode}
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
              <span>S{season} E{shownEpisode} · if playback is slow or blocked, switch to another server above.</span>
            </div>
          )}
        </section>

        <div className="mvd-cols">
          <section className="mvd-block" aria-labelledby="mvd-story">
            <h2 id="mvd-story" className="mvd-h">The series</h2>
            <p className="mvd-overview">{m.overview || "No synopsis on file."}</p>
            <dl className="modal-facts">
              {m.creator && <div><dt className="label">Created by</dt><dd>{m.creator}</dd></div>}
              {m.rating ? <div><dt className="label">TMDB rating</dt><dd>{m.rating.toFixed(1)} / 10 ({m.votes.toLocaleString()} votes)</dd></div> : null}
              {m.year && <div><dt className="label">First aired</dt><dd>{m.year}</dd></div>}
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
                  <li key={`s${p.id}`}>
                    {p.logo && <img src={img(p.logo, "w92")} alt="" width="36" height="36" loading="lazy" />}
                    <span>{p.name}</span>
                    <span className="mvd-tag">Subscription</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mvd-note">
                No streaming service carries it in {place} right now.
              </p>
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

/** Embedded series streaming player with click-to-load facade */
function SeriesStreamer({ id, title, backdrop, server, season, episode, autoPlay, onPlay }) {
  const [on, setOn] = useState(autoPlay || false);

  function start() {
    setOn(true);
    onPlay?.();
  }

  return (
    <div className="mvd-trailer">
      {on ? (
        <iframe
          src={server.url(id, season, episode)}
          title={`${title} S${season} E${episode} — streaming`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="mvd-facade"
          onClick={start}
          aria-label={`Stream ${title} season ${season} episode ${episode} on ${server.name}`}
        >
          {backdrop && <img src={img(backdrop, "w780")} alt="" loading="lazy" />}
          <span className="mvd-play" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M4 2.5v11l9.5-5.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="mvd-facade-label label">Stream S{season} E{episode} · loads player ({server.name})</span>
        </button>
      )}
    </div>
  );
}

/** Click-to-load YouTube trailer. Remounted per series (key), so it resets. */
function Trailer({ videoKey, title, backdrop }) {
  const [on, setOn] = useState(false);
  if (!videoKey) return <p className="mvd-note">No trailer on file for this series.</p>;

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
        <h2>Couldn’t open this series.</h2>
        <p>{text}</p>
        {retry && <button type="button" className="btn btn-ghost" onClick={retry}>Try again</button>}
        <Link className="link-go" to="/movies">Back to Movies</Link>
      </div>
    </div>
  );
}
