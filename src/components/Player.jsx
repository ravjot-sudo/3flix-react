import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { fetchWyzieSubtitles, loadSubAsVttUrl } from "../lib/wyzie.js";
import { setVideoBoost } from "../lib/sound.js";

/**
 * Video player with resume and live subtitles.
 *
 * Subtitles: films that ship subtitle files get <track> elements and a menu.
 * When an Aether/Wyzie key is present, live subtitles are fetched from Wyzie
 * (sub.wyzie.io) by TMDB ID, converted to WebVTT in-browser, and rendered.
 * The chosen language is remembered (localStorage) across films.
 */
export default function Player({ film, startAt = 0, onProgress }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState({ now: 0, total: film.runtime * 60 });

  // Subtitles: local bundled tracks + dynamic Wyzie tracks
  const rawSubs = film.subtitles;
  const [wyzieSubs, setWyzieSubs] = useState([]);
  const [activeVttSrc, setActiveVttSrc] = useState(null);
  const [loadedWyzieId, setLoadedWyzieId] = useState(null);

  // Fetch live subtitles from Wyzie when film has a TMDB ID
  useEffect(() => {
    const tmdbId = film.tmdb?.id ?? film.tmdbId;
    if (!tmdbId) return undefined;
    const controller = new AbortController();
    fetchWyzieSubtitles(tmdbId, "en", controller.signal).then((tracks) => {
      setWyzieSubs(tracks);
    });
    return () => controller.abort();
  }, [film.id, film.tmdb?.id, film.tmdbId]);

  const allSubs = useMemo(() => [
    ...(rawSubs ?? []).map((s) => ({ ...s, source: "local", key: s.lang })),
    ...wyzieSubs.map((s) => ({ ...s, source: "wyzie", key: s.id })),
  ], [rawSubs, wyzieSubs]);

  const [captionsPref, setCaptions] = useLocalStorage("3flix:captions", "off");
  const captions = allSubs.some((t) => t.key === captionsPref || t.lang === captionsPref) ? captionsPref : "off";

  // When a Wyzie subtitle is selected, load the SRT and convert it to a WebVTT Object URL
  useEffect(() => {
    const selected = allSubs.find((s) => (s.key === captions || s.lang === captions) && s.source === "wyzie");
    if (!selected) return undefined;
    if (loadedWyzieId === selected.id) return undefined;

    const controller = new AbortController();
    loadSubAsVttUrl(selected.url, controller.signal)
      .then((blobUrl) => {
        setActiveVttSrc((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blobUrl;
        });
        setLoadedWyzieId(selected.id);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.warn("3Flix: Failed to load subtitle:", err);
      });

    return () => controller.abort();
  }, [captions, allSubs, loadedWyzieId]);

  // Clean up Object URL on unmount or change to avoid leaks
  useEffect(() => {
    return () => {
      if (activeVttSrc) URL.revokeObjectURL(activeVttSrc);
    };
  }, [activeVttSrc]);

  // TextTrack.mode is imperative: set it on the element itself.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    const apply = () => {
      for (const track of el.textTracks) {
        if (track.label?.includes("Wyzie")) {
          track.mode = activeVttSrc ? "showing" : "disabled";
        } else {
          track.mode = track.language === captions ? "showing" : "disabled";
        }
      }
    };
    apply();
    el.textTracks.addEventListener("addtrack", apply);
    return () => el.textTracks.removeEventListener("addtrack", apply);
  }, [captions, activeVttSrc]);

  // There is deliberately no "reset on film change" effect here. The parent
  // renders <Player key={film.id} …>, so React unmounts and remounts this
  // component when the route param changes and every piece of state starts
  // fresh. A key is the idiomatic way to reset a subtree — resetting by hand
  // in an effect costs an extra render and is easy to get incomplete.

  // Native media events. Registered here and removed on cleanup so switching
  // films does not stack listeners on a reused element.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const onMeta = () => {
      setBuffering(false);
      if (startAt > 0 && Number.isFinite(el.duration)) {
        el.currentTime = startAt * el.duration;
      }
      setTime({ now: el.currentTime, total: el.duration });
    };
    const onTime = () => {
      if (!Number.isFinite(el.duration) || !el.duration) return;
      setTime({ now: el.currentTime, total: el.duration });
      onProgress?.(el.currentTime / el.duration);
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { setBuffering(false); setPlaying(true); };
    const onPause = () => setPlaying(false);
    const onError = () => { setFailed(true); setBuffering(false); };

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, [film.id, startAt, onProgress]);

  function toggle() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => setPlaying(false));
    else el.pause();
  }

  function seek(fraction) {
    const el = videoRef.current;
    if (el && Number.isFinite(el.duration)) el.currentTime = fraction * el.duration;
  }

  const hasSource = Boolean(film.video) && !failed;
  const fraction = time.total ? time.now / time.total : 0;

  // CINEMA MODE — dims the rest of the page so the screen is the only light.
  // A class on <html> rather than a portal, so the dim reaches every region.
  const [cinema, setCinema] = useState(false);
  // SETTINGS > SOUND BOOST — quiet Archive rips get up to +9dB via Web
  // Audio (clamped + compressed, no clipping). A level, not a switch, and
  // remembered across films like the captions pref. Migrates the old
  // boolean pref (true -> 2.5x).
  const [boostRaw, setBoost] = useLocalStorage("3flix:boost", 0);
  const boost = boostRaw === true ? 2.5 : (Number(boostRaw) || 0);
  const boosting = boost > 0;
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    setVideoBoost(videoRef.current, boosting, boost || 1);
  }, [boost, boosting, film.id]);
  // Close the settings panel on Escape.
  useEffect(() => {
    if (!settingsOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSettingsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);
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

  return (
    <div className={`player${playing ? " is-playing" : ""}`} style={{ "--hue": film.hue }}>
      {/* Ambient spill: the screen lighting the room in the film's own colour. */}
      <div className="player-glow" aria-hidden="true" />
      <div className="screen">
        {hasSource ? (
          // No crossOrigin: the Archive redirects to a host without CORS
          // headers, and requesting CORS mode makes the load fail outright.
          <video
            ref={videoRef}
            className="screen-video"
            src={film.video}
            preload="metadata"
            playsInline
          >
            {(rawSubs ?? []).map((t) => (
              <track key={t.lang} kind="subtitles" src={t.src} srcLang={t.lang} label={t.label} />
            ))}
            {activeVttSrc && (
              <track
                key={loadedWyzieId}
                kind="subtitles"
                src={activeVttSrc}
                srcLang={captions}
                label="Wyzie Subtitles"
                default
              />
            )}
          </video>
        ) : (
          <div className="screen-fallback">
            <p className="label">
              {film.video ? "Stream unavailable" : "No stream for this title"}
            </p>
            <p className="screen-fallback-note">
              This film has no verified public-domain source, so it is listed
              but not played.
            </p>
          </div>
        )}

        {buffering && <div className="screen-spinner" aria-hidden="true" />}

        <div className="screen-overlay">
          <p className="label">{playing ? "Now playing" : "Paused"}</p>
          <h2 className="screen-title">{film.title}</h2>
        </div>
      </div>

      <div className="player-bar">
        <button
          type="button"
          className="btn-icon play-btn"
          onClick={toggle}
          disabled={!hasSource}
          aria-label={playing ? "Pause" : "Play"}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d={playing ? "M5 3.5h2.2v9H5zM8.8 3.5H11v9H8.8z" : "M5 3.5v9l7.5-4.5z"} fill="currentColor" />
          </svg>
        </button>

        <span className="time tnum">{clock(time.now)}</span>

        <label className="sr-only" htmlFor="seek">Seek</label>
        <input
          id="seek"
          className="seek"
          type="range"
          min="0"
          max="1000"
          value={Math.round(fraction * 1000)}
          onChange={(e) => seek(Number(e.target.value) / 1000)}
          disabled={!hasSource}
        />

        <span className="time tnum">{clock(time.total)}</span>

        {allSubs.length > 0 && (
          <label className="cc-select">
            <span className="cc-badge" aria-hidden="true">CC</span>
            <span className="sr-only">Subtitles</span>
            <select value={captions} onChange={(e) => setCaptions(e.target.value)}>
              <option value="off">Off</option>
              {allSubs.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="player-settings">
          <button
            type="button"
            className={`btn-icon settings-btn${boosting ? " is-active" : ""}`}
            onClick={() => setSettingsOpen((o) => !o)}
            disabled={!hasSource}
            aria-expanded={settingsOpen}
            aria-label={boosting ? `Watch settings, sound boost ${boost.toFixed(1)}x on` : "Watch settings"}
            title={boosting ? `Settings · boost ${boost.toFixed(1)}x` : "Watch settings · sound boost"}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" stroke="currentColor" />
              <path d="M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M3.6 3.6l1.2 1.2M11.2 11.2l1.2 1.2M12.4 3.6l-1.2 1.2M4.8 11.2l-1.2 1.2" stroke="currentColor" strokeLinecap="round" />
            </svg>
          </button>

          {settingsOpen && (
            <div className="settings-panel" role="dialog" aria-label="Watch settings">
              <label className="settings-row" htmlFor="boost">
                <span className="label">Sound boost</span>
                <span className="settings-value tnum">{boosting ? `${boost.toFixed(1)}x` : "Off"}</span>
              </label>
              <input
                id="boost"
                className="seek settings-slider"
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={boost}
                onChange={(e) => setBoost(Number(e.target.value))}
                disabled={!hasSource}
                aria-valuetext={boosting ? `${boost.toFixed(1)} times volume` : "Off"}
              />
              <p className="settings-hint">Lifts quiet rips, up to 3x. Remembered for every film.</p>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-icon cinema-btn"
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
    </div>
  );
}

/** Seconds -> m:ss or h:mm:ss. */
function clock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
