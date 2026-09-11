import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./routes/Home.jsx";
import Library from "./routes/Library.jsx";
import FilmDetail from "./routes/FilmDetail.jsx";
import Watchlist from "./routes/Watchlist.jsx";
import SignIn from "./routes/SignIn.jsx";
import About from "./routes/About.jsx";
import Movies from "./routes/Movies.jsx";
import MovieDetail from "./routes/MovieDetail.jsx";
import NotFound from "./routes/NotFound.jsx";

import { useAuth } from "./hooks/useAuth.js";
import { useFilms } from "./hooks/useFilms.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";

/**
 * The route tree, and the owner of app-wide state.
 *
 * Watchlist and progress live here — one level above every route that reads
 * them — because Library, FilmDetail and Watchlist all need the same copy.
 * That is LIFTING STATE UP; Context (see AuthContext) is the alternative once
 * the drilling gets deep, and both techniques are used in this project so the
 * difference is visible.
 *
 * The site sits behind a sign-in gate. Signed out, the home page plays its
 * opening and then asks you to sign in; every other page is wrapped in
 * <ProtectedRoute>, which sends you to /signin and back again afterwards.
 *
 * Route map
 *   /signin              SignIn                  (the gate — outside the layout)
 *   /                    Home                    (index route; opening, then the gate)
 *   — behind ProtectedRoute —
 *   /library             Library                 (parent / nested)
 *   /library/:filmId     Library > FilmDetail    (dynamic, route param)
 *   /movies              Movies                  (the TMDB catalogue)
 *   /movies/:movieId     MovieDetail             (dynamic, route param)
 *   /watchlist           Watchlist
 *   /about               About
 *   /films               -> redirect to /library
 *   *                    NotFound                (404)
 */
export default function App() {
  const { films, status } = useFilms();
  const { cloud } = useAuth();

  const [watchlist, setWatchlist] = useLocalStorage("3flix:watchlist", []);
  const [progress, setProgress] = useLocalStorage("3flix:progress", {});
  useAccountSync(cloud, watchlist, setWatchlist, progress, setProgress);

  // useCallback keeps these stable, so the memoised children below them do not
  // re-render on every keystroke in the search box.
  const toggleWatchlist = useCallback(
    (id) =>
      setWatchlist((list) =>
        // Spread + filter: never mutate state in place.
        list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      ),
    [setWatchlist],
  );

  const recordProgress = useCallback(
    (id, fraction) => setProgress((prev) => ({ ...prev, [id]: fraction })),
    [setProgress],
  );

  if (status === "loading") {
    return (
      <div className="boot">
        <p className="label">Loading catalogue…</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* The gate as a page, for links that land anywhere but home. */}
      <Route path="signin" element={<SignIn />} />

      {/* The layout route renders the chrome once; children swap inside its
          outlet. */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />

        {/* Everything else is behind the sign-in. */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="library"
            element={
              <Library films={films} progress={progress} watchlist={watchlist} />
            }
          >
            {/* Nested + dynamic: renders inside Library's <Outlet/>. */}
            <Route
              path=":filmId"
              element={
                <FilmDetail
                  progress={progress}
                  onProgress={recordProgress}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                />
              }
            />
          </Route>

          <Route
            path="watchlist"
            element={<Watchlist films={films} watchlist={watchlist} progress={progress} />}
          />

          {/* The TMDB catalogue. Browse and detail are sibling routes: the
              detail replaces the grid rather than nesting in it. */}
          <Route path="movies" element={<Movies />} />
          <Route path="movies/:movieId" element={<MovieDetail />} />

          <Route path="about" element={<About />} />

          {/* Redirect an old path rather than 404 it. */}
          <Route path="films" element={<Navigate to="/library" replace />} />

          {/* Wildcard must come last. */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

/**
 * With Supabase accounts (AuthContext's `cloud`), the watchlist and progress
 * follow the account from device to device:
 *   - on sign-in, the account's saved copy is merged into this browser's —
 *     every film on either watchlist, and the furthest point reached in each
 *   - after that, each change is saved back two seconds after it settles
 *     (progress changes several times a second while a film plays)
 *   - on sign-out, this browser's copy is cleared, so the next person to
 *     sign in here doesn't inherit it
 * Without accounts it does nothing: the lists simply stay in this browser.
 */
function useAccountSync(cloud, watchlist, setWatchlist, progress, setProgress) {
  const [merged, setMerged] = useState(null);   // the account whose copy is merged in
  const [had, setHad] = useState(null);         // the account signed in last render

  // Signing out: adjust state while rendering, on a change of input (React's
  // recommended alternative to an effect for this).
  const id = cloud?.id ?? null;
  if (had !== id) {
    setHad(id);
    if (had && !id) {
      setWatchlist([]);
      setProgress({});
      setMerged(null);
    }
  }

  useEffect(() => {
    if (!cloud) return undefined;
    let alive = true;
    const done = () => { if (alive) setMerged(cloud.id); };
    cloud.load().then((saved) => {
      if (!alive) return;
      const list = Array.isArray(saved.watchlist) ? saved.watchlist.filter((x) => typeof x === "string") : [];
      setWatchlist((mine) => [...new Set([...mine, ...list])]);
      setProgress((mine) => {
        const out = { ...mine };
        for (const [film, at] of Object.entries(saved.progress ?? {})) {
          if (typeof at === "number" && at > (out[film] ?? 0)) out[film] = at;
        }
        return out;
      });
      done();
    }, done);
    return () => { alive = false; };
  }, [cloud, setWatchlist, setProgress]);

  useEffect(() => {
    if (!cloud || merged !== cloud.id) return undefined;
    const t = setTimeout(() => {
      const rounded = Object.fromEntries(Object.entries(progress).map(([film, at]) => [film, Math.round(at * 1000) / 1000]));
      cloud.save({ watchlist, progress: rounded }).catch(() => { /* kept locally; saved on the next change */ });
    }, 2000);
    return () => clearTimeout(t);
  }, [cloud, merged, watchlist, progress]);
}
