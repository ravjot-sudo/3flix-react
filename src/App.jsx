import { useCallback } from "react";
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
 * Route map
 *   /                    Home                    (index route)
 *   /library             Library                 (parent / nested)
 *   /library/:filmId     Library > FilmDetail    (dynamic, route param)
 *   /movies              Movies                  (Netflix catalogue, TMDB)
 *   /movies/:movieId     MovieDetail             (dynamic, route param)
 *   /watchlist           Watchlist               (protected)
 *   /signin              SignIn
 *   /about               About
 *   /films               -> redirect to /library
 *   *                    NotFound                (404)
 */
export default function App() {
  const { films, status } = useFilms();

  const [watchlist, setWatchlist] = useLocalStorage("3flix:watchlist", []);
  const [progress, setProgress] = useLocalStorage("3flix:progress", {});

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
      {/* Layout route: renders chrome once, children swap inside <Outlet/>. */}
      <Route element={<Layout />}>
        <Route
          index
          element={<Home watchlist={watchlist} onToggleWatchlist={toggleWatchlist} />}
        />

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
          element={
            <ProtectedRoute>
              <Watchlist films={films} watchlist={watchlist} progress={progress} />
            </ProtectedRoute>
          }
        />

        {/* The Netflix catalogue, from TMDB. Browse and detail are sibling
            routes: the detail replaces the grid rather than nesting in it. */}
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:movieId" element={<MovieDetail />} />

        <Route path="signin" element={<SignIn />} />
        <Route path="about" element={<About />} />

        {/* Redirect an old path rather than 404 it. */}
        <Route path="films" element={<Navigate to="/library" replace />} />

        {/* Wildcard must come last. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
