/**
 * The two fixed pieces of text the TMDB section needs: setup instructions for
 * when no key is present, and the attribution TMDB's terms require.
 */
export function TmdbSetup() {
  return (
    <div className="tmdb-setup">
      <p className="folio">Setup · about two minutes</p>
      <h2 className="tmdb-setup-title">Connect TMDB to bring in <em>everything on Netflix.</em></h2>
      <ol className="tmdb-steps">
        <li>Create a free account at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer">themoviedb.org</a>.</li>
        <li>Open <strong>Settings → API</strong> and request a key (Developer, “student project”).</li>
        <li>Copy the long <strong>API Read Access Token</strong> — not the short API key.</li>
        <li>In <code>3flix-react/.env.local</code> add a line: <code>VITE_TMDB_TOKEN=your_token</code></li>
        <li>Restart the dev server so Vite reads it.</li>
      </ol>
      <p className="tmdb-setup-note">
        The token ships inside the site’s JavaScript, which is why it has to be the
        read-only one. Netflix films stream on Netflix; 3flix shows the catalogue,
        the trailers and a way in.
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
