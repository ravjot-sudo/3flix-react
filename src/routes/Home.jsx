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
 *   01 Browse     the genre menu: eight panels, decks fan on hover
 *   02 Now showing the filmstrip carousel
 *   03 Library    the best-rated shelf, with watchlist hearts
 *   04 Trending   this week’s most-watched films, official posters (TMDB)
 *
 * Watchlist state lives in App and arrives here as props (lifting state up).
 */
export default function Home({ watchlist, onToggleWatchlist }) {
  return (
    <>
      <OpeningReveal />
      <GenreGrid />
      <HeroCarousel defaultIndex={2} />
      <FilmShelf watchlist={watchlist} onToggleWatchlist={onToggleWatchlist} />
      <TrendingRow />
    </>
  );
}
