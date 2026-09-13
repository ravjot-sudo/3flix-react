import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Poster from "./Poster.jsx";
import { FILMS } from "../data/films.js";
import { useAuth } from "../hooks/useAuth.js";
import { useDebounce } from "../hooks/useDebounce.js";

// Everything that plays on 3Flix: the free classics.
const PLAYABLE = FILMS;

/**
 * CATALOGUE COMMAND PALETTE (⌘K).
 *
 * Searches the catalogue by title, director and genre, and jumps to routes.
 * With an empty query it offers "Continue watching" first, read from the same
 * localStorage progress the player writes.
 *
 * A11y is the point here, not an afterthought: the input is a combobox, the
 * list is a listbox, and the keyboard cursor moves via aria-activedescendant —
 * DOM focus never leaves the input, which is what screen readers expect.
 */
const ROUTES = [
  { label: "Home", to: "/" },
  { label: "Library", to: "/library" },
  { label: "Movies — trending, cinemas, free", to: "/movies" },
  { label: "Watchlist", to: "/watchlist" },
  { label: "How this is legal", to: "/about" },
];

function readProgress() {
  try { return JSON.parse(localStorage.getItem("3flix:progress") || "{}"); }
  catch { return {}; }
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const q = useDebounce(query, 120);
  const inputRef = useRef(null);
  const returnTo = useRef(null);
  const navigate = useNavigate();
  const { isSignedIn, signOut } = useAuth();

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = [];

    if (!needle) {
      const progress = readProgress();
      PLAYABLE.filter((f) => (progress[f.id] ?? 0) > 0.01 && (progress[f.id] ?? 0) < 0.98)
        .slice(0, 4)
        .forEach((f) => out.push({ group: "Continue watching", kind: "film", film: f,
          hint: `${Math.round(progress[f.id] * 100)}%`, run: () => navigate(`/library/${f.id}`) }));
    }

    const films = needle
      ? PLAYABLE.filter((f) =>
          f.title.toLowerCase().includes(needle) ||
          f.director.toLowerCase().includes(needle) ||
          f.genres.some((g) => g.toLowerCase().includes(needle)))
      : [];
    films.slice(0, 8).forEach((f) => out.push({ group: "Films", kind: "film", film: f,
      hint: String(f.year), run: () => navigate(`/library/${f.id}`) }));
    if (films.length > 8) {
      out.push({ group: "Films", kind: "more", label: `See all ${films.length} in the library`,
        hint: "Library", run: () => navigate("/library") });
    }

    ROUTES.filter((r) => !needle || r.label.toLowerCase().includes(needle))
      .forEach((r) => out.push({ group: "Go to", kind: "route", label: r.label,
        hint: r.to, run: () => navigate(r.to) }));

    const account = isSignedIn
      ? { label: "Sign out", run: signOut }
      : { label: "Sign in", run: () => navigate("/signin") };
    if (!needle || account.label.toLowerCase().includes(needle)) {
      out.push({ group: "Account", kind: "route", label: account.label, hint: "", run: account.run });
    }
    return out;
  }, [q, navigate, isSignedIn, signOut]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    returnTo.current?.focus?.();
  }, []);

  const run = useCallback((i) => {
    const item = items[i];
    if (!item) return;
    item.run();
    close();                       // every command dismisses the palette
  }, [items, close]);

  // Global shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) returnTo.current = document.activeElement;
          return !o;
        });
      }
    };
    const onOpen = () => { returnTo.current = document.activeElement; setOpen(true); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("3flix:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("3flix:palette", onOpen);
    };
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  function onKeyDown(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, items.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); return; }
    if (e.key === "Enter") { e.preventDefault(); run(Math.min(cursor, items.length - 1)); return; }
    if (e.key === "Tab") e.preventDefault();          // the input is the only stop
  }

  // Clamp during render: the list can shrink under the cursor as results change.
  const active = Math.min(cursor, Math.max(items.length - 1, 0));
  let lastGroup = null;

  return (
    <AnimatePresence>
      {open && (
        <div className="cmdk-root">
          <motion.div className="cmdk-back" onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }} />
          <motion.div
            className="cmdk"
            role="dialog"
            aria-modal="true"
            aria-label="Search the catalogue"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.18 } }}
          >
            <div className="cmdk-field">
              <span className="cmdk-prompt" aria-hidden="true">&rsaquo;</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
                onKeyDown={onKeyDown}
                placeholder={`Search ${PLAYABLE.length} films, or jump somewhere…`}
                role="combobox"
                aria-expanded="true"
                aria-controls="cmdk-list"
                aria-activedescendant={items[active] ? `cmdk-${active}` : undefined}
                aria-label="Search the catalogue"
                autoComplete="off"
                spellCheck="false"
              />
              <kbd className="cmdk-esc">esc</kbd>
            </div>

            <ul id="cmdk-list" className="cmdk-list" role="listbox">
              {items.length === 0 && <li className="cmdk-empty">Nothing matches that.</li>}
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <li key={`${item.group}-${i}`} role="presentation">
                    {header && <p className="cmdk-group" aria-hidden="true">{header}</p>}
                    <div
                      id={`cmdk-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={`cmdk-item${i === active ? " is-cursor" : ""}`}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => run(i)}
                    >
                      {item.kind === "film" ? (
                        <>
                          <span className="cmdk-thumb" aria-hidden="true"><Poster film={item.film} showText={false} /></span>
                          <span className="cmdk-text">
                            <span className="cmdk-title">{item.film.title}</span>
                            <span className="cmdk-sub">{item.film.director}</span>
                          </span>
                        </>
                      ) : (
                        <span className="cmdk-text"><span className="cmdk-title">{item.label}</span></span>
                      )}
                      <span className="cmdk-hint">{item.hint}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
