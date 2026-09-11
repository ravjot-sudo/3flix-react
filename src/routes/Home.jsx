import OpeningReveal from "../components/OpeningReveal.jsx";
import GenreGrid from "../components/GenreGrid.jsx";
import HeroCarousel from "../components/HeroCarousel.jsx";
import FilmShelf from "../components/FilmShelf.jsx";
import TrendingRow from "../components/TrendingRow.jsx";

/**
 * Home — a title sequence, then the menu.
 *
 *   Opening   statement → scrubbed headline → circle opens onto a film
 *             (the nav bar stays away until this is over)
 *   01 Browse     eight genres × their top three films of 2000 onward
 *   02 Now showing the filmstrip carousel
 *   03 Top six    the highest-rated films of 2008 onward
 *   04 Trending   this week’s most-watched films, official posters (TMDB)
 *
 * Browse and Top six share one TMDB ranking, so no film appears twice.
 */
export default function Home() {
  return (
    <>
      <OpeningReveal />
      <GenreGrid />
      <HeroCarousel defaultIndex={2} />
      <FilmShelf />
      <TrendingRow />
    </>
  );
}
