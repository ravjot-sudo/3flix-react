/**
 * Star toggle — the save button on every film card.
 *
 * Lives inside the card's link, so the click is stopped before it can follow
 * it: preventDefault (not just stopPropagation) is what keeps React Router's
 * link from navigating.
 */
export default function StarButton({ saved, title, onToggle }) {
  return (
    <button
      type="button"
      className={`star-btn${saved ? " is-on" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from your watchlist` : `Save ${title} to your watchlist`}
      title={saved ? "Saved to your watchlist" : "Save to your watchlist"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.8l2.83 5.83 6.42.86-4.7 4.5 1.17 6.36L12 17.3l-5.72 3.05 1.17-6.36-4.7-4.5 6.42-.86z" />
      </svg>
    </button>
  );
}
