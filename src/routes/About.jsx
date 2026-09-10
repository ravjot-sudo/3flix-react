/**
 * About — static content, but semantic and accessible.
 *
 * Demonstrates: semantic HTML5 (section, article, ol, dl, figure), heading
 * hierarchy, and the inverted "paper" section from the design system.
 */
export default function About() {
  return (
    <section className="section paper">
      <div className="container">
        <header className="sec-head">
          <p className="folio"><span>04</span><span className="folio-label">About</span></p>
          <div className="sec-head-body">
            <h1 className="sec-title display-xl">
              Copyright expires.<br />These already did.
            </h1>
            <p className="sec-note">
              Every title is a film widely held to be in the United States
              public domain — its term ran out, its notice was omitted, or its
              renewal was never filed.
            </p>
          </div>
        </header>

        <ol className="notes">
          <Note num="i" title="Term expiry">
            Films published before 1930 have run their full term in the United
            States. <em>Nosferatu</em>, <em>Metropolis</em> and <em>The
            General</em> reach us this way.
          </Note>
          <Note num="ii" title="Notice failure">
            Under the 1909 Act a film released without a visible copyright
            notice entered the public domain immediately. That single omission
            is why <em>Night of the Living Dead</em> is free today.
          </Note>
          <Note num="iii" title="Renewal lapse">
            Older works required an active renewal at twenty-eight years.
            Thousands were never renewed — <em>Charade</em> and <em>D.O.A.</em>
            among them.
          </Note>
          <Note num="iv" title="What we add">
            The catalogue, the artwork and the interface. Posters are drawn
            procedurally and the films stream from the Internet Archive, which
            hosts them lawfully.
          </Note>
        </ol>
      </div>
    </section>
  );
}

/** Composition: children are passed through, so each note can hold markup. */
function Note({ num, title, children }) {
  return (
    <li className="note">
      <span className="note-num">{num}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </li>
  );
}
