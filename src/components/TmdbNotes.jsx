/**
 * The two fixed pieces of text the TMDB section needs: setup instructions for
 * when the server has no key (the /api/tmdb route answers 503), and the
 * attribution TMDB's terms require.
 */
export function TmdbSetup() {
  // Setup steps are for whoever runs the site; a visitor to the live site
  // just needs to know the catalogue is offline for now.
  if (import.meta.env.PROD) {
    return (
      <div className="empty">
        <h2>The live catalogue is offline.</h2>
        <p>This part of 3Flix reads from TMDB, which isn’t answering right now. Try again in a little while.</p>
      </div>
    );
  }
  return (
    <div className="tmdb-setup">
      <p className="folio">Setup · about two minutes</p>
      <h2 className="tmdb-setup-title">Connect TMDB to bring in <em>the new releases.</em></h2>
      <ol className="tmdb-steps">
        <li>Create a free account at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer">themoviedb.org</a>.</li>
        <li>Open <strong>Settings → API</strong> and request a key (Developer, “student project”).</li>
        <li>In <code>3flix-react/.env.local</code> add a line: <code>TMDB_TOKEN=your_key</code> (either of TMDB’s keys works).</li>
        <li>For the live site, add the same <code>TMDB_TOKEN</code> under Vercel → Project → Settings → Environment Variables.</li>
        <li>Restart the dev server so it reads the key.</li>
      </ol>
      <p className="tmdb-setup-note">
        The key stays on the server: the site asks its own <code>/api/tmdb</code>, and
        the server adds the key, so it never appears in the page’s JavaScript.
      </p>
    </div>
  );
}

export function TmdbCredit() {
  return (
    <p className="tmdb-credit label">
      Film data and images from{" "}
      <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>.
      {" "}This product uses the TMDB API but is not endorsed or certified by TMDB.
      {" "}Streaming availability by{" "}
      <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a>.
    </p>
  );
}
