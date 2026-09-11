import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { nameOk } from "../lib/signin.js";

/**
 * The account button in the nav bar — there is no "Sign in" button, because
 * nobody reaches the nav without signing in. It opens a small panel: who you
 * are, Change name (edited in place), your watchlist, and Sign out.
 *
 * Demonstrates: a disclosure (aria-expanded / aria-controls), closing on
 * Escape and on a click outside, returning focus to the button that opened
 * it, and AnimatePresence for the exit.
 */
export default function AccountMenu() {
  const { user, mode, rename, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const wrap = useRef(null);
  const button = useRef(null);
  const input = useRef(null);
  const ids = { panel: useId(), name: useId(), error: useId() };

  // Close on Escape (focus back to the button) or on a press outside.
  useEffect(() => {
    if (!open) return undefined;
    const shut = () => { setOpen(false); setEditing(false); setError(""); };
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) shut(); };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      shut();
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => { if (editing) input.current?.select(); }, [editing]);

  if (!user) return null;

  function startEditing() {
    setDraft(user.name);
    setError("");
    setEditing(true);
  }

  async function save(event) {
    event.preventDefault();
    const next = draft.trim().replace(/\s+/g, " ");
    if (!nameOk(next)) { setError("At least two characters, at most forty."); return; }
    if (next === user.name) { setEditing(false); return; }
    setBusy(true);
    try {
      await rename(next);
      setEditing(false);
    } catch {
      setError("Couldn’t save that just now. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setOpen(false);
    await signOut();
    // Every other page hands over to /signin by itself (ProtectedRoute). On
    // the home page the opening starts over and the sign-in follows it — so
    // back to the top, instantly: a smooth scroll up would pass the end of
    // the opening on the way and set the sign-in off early.
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="acct" ref={wrap}>
      <button
        ref={button}
        type="button"
        className="acct-btn"
        aria-expanded={open}
        aria-controls={ids.panel}
        onClick={() => { setOpen((o) => !o); setEditing(false); setError(""); }}
      >
        <span className="acct-avatar" aria-hidden="true">{initial}</span>
        <span className="acct-name">{user.name}</span>
        <span className="sr-only">, account menu</span>
        <svg className="acct-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={ids.panel}
            className="acct-panel"
            initial={{ opacity: 0, transform: "translateY(-6px) scale(0.98)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, transform: "translateY(-6px) scale(0.98)", transition: { duration: 0.12 } }}
          >
            <div className="acct-who">
              <span className="acct-avatar acct-avatar-lg" aria-hidden="true">{initial}</span>
              <div>
                <p className="acct-full">{user.name}</p>
                <p className="acct-email">{user.email}</p>
              </div>
            </div>

            {editing ? (
              <form className="acct-form" onSubmit={save} noValidate>
                <label className="label" htmlFor={ids.name}>Display name</label>
                <input
                  ref={input}
                  id={ids.name}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={40}
                  autoComplete="name"
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? ids.error : undefined}
                />
                {error && <p className="field-error" id={ids.error} role="alert">{error}</p>}
                <div className="acct-row">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <ul className="acct-actions">
                <li><button type="button" onClick={startEditing}>Change name</button></li>
                <li><Link to="/watchlist" onClick={() => setOpen(false)}>Your watchlist</Link></li>
                <li><button type="button" className="acct-out" onClick={leave}>Sign out</button></li>
              </ul>
            )}

            <p className="acct-note label">
              {mode === "cloud" ? "Watchlist saved to your account" : "Saved in this browser"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
