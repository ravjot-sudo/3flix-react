import { Link, useLocation } from "react-router-dom";

/**
 * 404 — the catch-all route, matched by path="*".
 *
 * Demonstrates: wildcard routing, useLocation to report what was requested,
 * and giving the user a way out instead of a dead end.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <section className="section">
      <div className="container narrow">
        <p className="folio">Error 404</p>
        <h1 className="sec-title display-xl">
          No such page.
        </h1>
        <p className="sec-note">
          Nothing is published at <code>{pathname}</code>. It may have been
          renamed, or the link that brought you here may be wrong.
        </p>
        <p className="sec-foot">
          <Link className="link-rule" to="/">Back to the programme</Link>
        </p>
      </div>
    </section>
  );
}
