import { useCallback, useState } from "react";
import OpeningReveal from "../components/OpeningReveal.jsx";
import GenreGrid from "../components/GenreGrid.jsx";
import HeroCarousel from "../components/HeroCarousel.jsx";
import FilmShelf from "../components/FilmShelf.jsx";
import TrendingRow from "../components/TrendingRow.jsx";
import SignInGate from "../components/SignInGate.jsx";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Home — a title sequence, then the way in.
 *
 *   Opening   statement → scrubbed headline → circle opens onto a film
 *             (the nav bar stays away until this is over)
 *
 * Signed out, that is all there is: the moment the opening ends, the
 * sign-in pops up over it (SignInGate). Signed in, the menu follows:
 *   01 Browse     eight genres × their top three films of 2000 onward
 *   02 Now showing the filmstrip carousel
 *   03 Top six    the highest-rated films of 2008 onward
 *   04 Trending   this week’s most-watched films, official posters (TMDB)
 *
 * Browse and Top six share one TMDB ranking, so no film appears twice.
 */
export default function Home() {
  const { ready, isSignedIn } = useAuth();
  const [ended, setEnded] = useState(false);
  const end = useCallback(() => setEnded(true), []);

  // Signing out starts the opening over: the gate waits for it to end again.
  // (Adjusting state while rendering, on a change of input — React's
  // recommended alternative to an effect for this.)
  const [wasIn, setWasIn] = useState(isSignedIn);
  if (wasIn !== isSignedIn) {
    setWasIn(isSignedIn);
    setEnded(false);
  }

  return (
    <>
      <OpeningReveal onEnd={end} />
      {isSignedIn ? (
        <>
          <GenreGrid />
          <HeroCarousel defaultIndex={2} />
          <FilmShelf />
          <TrendingRow />
        </>
      ) : (
        <>
          {/* Sign-in pops up immediately — before the intro plays. */}
          {ready && <SignInGate />}
        </>
      )}
    </>
  );
}
