import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import CommandPalette from "./CommandPalette.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { GENRES } from "../data/films.js";

/**
 * LAYOUT ROUTE — the persistent shell every page renders inside.
 *
 * The matched child route arrives through useOutlet() rather than <Outlet/>,
 * so AnimatePresence can hold on to the outgoing page long enough to fade it
 * out. The key is the first path segment: /library → /library/metropolis is
 * the same page opening a detail, not a page change, so it does not fade.
 *
 * Demonstrates: nested routes, useOutlet, <NavLink> with an active state,
 * a shared-layout (layoutId) indicator, semantic landmarks and a skip link.
 */
const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/library", label: "Library" },
  { to: "/movies", label: "Movies" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/about", label: "About" },
];

const openPalette = () => window.dispatchEvent(new Event("3flix:palette"));

export default function Layout() {
  const { user, isSignedIn, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const page = location.pathname.split("/")[1] || "home";

  // The bar gains a shadow once the page moves. Throttled on a timestamp, not
  // requestAnimationFrame — rAF stalls in a background tab.
  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - last < 80) return;
      last = now;
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className={`nav${scrolled ? " is-stuck" : ""}`}>
        <div className="container nav-inner">
          <Link className="brand" to="/" aria-label="3Flix home">
            <Mark />
            <span className="brand-word">3<span className="brand-flix">Flix</span></span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                {({ isActive }) => (
                  <>
                    {label}
                    {/* One element, handed from link to link: it springs
                        across instead of disappearing and reappearing. */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="nav-underline"
                        transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              className="kbd-trigger"
              onClick={openPalette}
              aria-label="Search the catalogue (Command K)"
            >
              <span className="kbd">&#8984;</span><span className="kbd">K</span>
            </button>
            <button type="button" className="btn btn-ghost nav-menu" onClick={openPalette}>
              Menu
            </button>
            {isSignedIn ? (
              <>
                <span className="nav-badge label">{user.name}</span>
                <button type="button" className="btn btn-ink" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <Link className="btn btn-ink" to="/signin">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main id="main" className={page === "home" ? "main main-home" : "main"}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          {/* Opacity only: a transform here would become the containing block
              for every position:fixed element inside the page. */}
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: "easeOut" } }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      <CommandPalette />

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label="3Flix home">
              <Mark />
              <span className="brand-word">3<span className="brand-flix">Flix</span></span>
            </Link>
            <p className="footer-note">
              Films whose copyright has run out, free to stream. Built as coursework
              with React, React Router and framer-motion.
            </p>
          </div>

          <div className="footer-cols">
            <div>
              <h3>Browse</h3>
              <ul>
                <li><Link to="/library">Library</Link></li>
                <li><Link to="/movies">Movies</Link></li>
                <li><Link to="/watchlist">Watchlist</Link></li>
                <li><Link to="/about">About</Link></li>
              </ul>
            </div>
            <div>
              <h3>Genres</h3>
              <ul>
                {GENRES.map((g) => (
                  <li key={g}><Link to={`/library?genre=${encodeURIComponent(g)}`}>{g}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Keys</h3>
              <ul>
                <li><span>⌘K — search anything</span></li>
                <li><span>← → — move the filmstrip</span></li>
                <li><span>Esc — close</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container footer-base">
          <p className="label">&copy; {new Date().getFullYear()} 3Flix — coursework build</p>
          <p className="label">Public domain cinema</p>
        </div>
      </footer>
    </>
  );
}

/** NavLink gives us isActive; this keeps the class logic in one place. */
const navClass = ({ isActive }) => (isActive ? "is-active" : undefined);

function Mark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 9h19M2.5 15h19" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <path className="brand-play" d="M10 10.2v3.6l3.2-1.8z" />
    </svg>
  );
}
