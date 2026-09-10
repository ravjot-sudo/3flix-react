import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Sign-in form — the gate in front of the protected route.
 *
 * Demonstrates: CONTROLLED COMPONENTS, form validation with error state,
 * preventDefault, and programmatic navigation back to wherever the user was
 * originally headed (ProtectedRoute stashed it in location.state).
 *
 * There is no real authentication here: any non-empty name is accepted. It
 * exists to demonstrate route protection, not security.
 */
export default function SignIn() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from ?? "/watchlist";

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter at least two characters.");
      return;
    }

    setError("");
    signIn(trimmed);
    navigate(from, { replace: true });
  }

  return (
    <section className="section">
      <div className="container narrow">
        <header className="sec-head">
          <p className="folio">Members</p>
          <div className="sec-head-body">
            <h1 className="sec-title display-xl">Sign in</h1>
            <p className="sec-note">
              The watchlist is stored per browser. No password, no server —
              this exists to demonstrate a protected route.
            </p>
          </div>
        </header>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              value={name}                                  /* controlled */
              onChange={(e) => setName(e.target.value)}     /* controlled */
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "name-error" : undefined}
              autoComplete="given-name"
            />
            {/* Error sits next to its field, and is announced. */}
            {error && (
              <p className="field-error" id="name-error" role="alert">{error}</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary">Continue</button>
        </form>
      </div>
    </section>
  );
}
