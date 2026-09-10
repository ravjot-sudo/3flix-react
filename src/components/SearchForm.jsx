import { useId, useRef } from "react";

/**
 * CONTROLLED COMPONENTS — the input's value comes from React state and every
 * keystroke goes through onChange. React is the single source of truth.
 *
 * Demonstrates: controlled inputs, form submit handling with preventDefault,
 * useRef for imperative focus, useId for a label/input pair that is unique
 * even if the component is used twice on one page.
 */
export default function SearchForm({ query, onQueryChange, genre, genres, onGenreChange }) {
  const inputId = useId();
  const inputRef = useRef(null);

  function handleSubmit(event) {
    // Without this the browser navigates and the SPA reloads.
    event.preventDefault();
    inputRef.current?.blur();
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <div className="search-wrap">
        <svg className="search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>

        <label className="sr-only" htmlFor={inputId}>
          Search films by title, director or genre
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          value={query}                                   /* controlled */
          onChange={(e) => onQueryChange(e.target.value)} /* controlled */
          placeholder="Search titles, directors, genres…"
          autoComplete="off"
        />
      </div>

      <div className="genre-list">
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            className={`genre-chip${genre === g ? " is-on" : ""}`}
            aria-pressed={genre === g}
            onClick={() => onGenreChange(genre === g ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>
    </form>
  );
}
