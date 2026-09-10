# How 3Flix was built

A full account of the process: the commands, the decisions, the component
design, and the bugs. Written so it can be defended line by line in a viva.

---

## 1. What exists, and why there are two projects

| Folder | Stack | Purpose |
| --- | --- | --- |
| `3flix/` | HTML + CSS + vanilla JS | Modules 1–2. No build step: double-click `index.html` |
| `3flix-react/` | React 19 + Vite + Router 7 | Modules 2–4 |

The vanilla version came first and was kept rather than deleted. It is the
evidence for "static responsive landing page" and for DOM manipulation without
a framework, and it is the fallback if a laptop cannot run a dev server during
the viva.

---

## 2. Commands, in the order they were run

### The vanilla build

```bash
mkdir -p 3flix/css 3flix/js/vendor
# animation library, vendored locally so the page works with no network
curl -sL "https://cdn.jsdelivr.net/npm/animejs@4.0.2/lib/anime.iife.js" \
     -o 3flix/js/vendor/anime.iife.js
```

Serving it locally for testing:

```bash
npx --yes serve --listen 4400 3flix
```

### Finding the film sources

Public-domain films are hosted by the Internet Archive, which has a JSON API
and needs no key. A script searched it, then **rejected** bad matches:

```bash
# search by title
curl -s "https://archive.org/advancedsearch.php?q=title:(%22Nosferatu%22)+AND+mediatype:(movies)&fl[]=identifier&rows=8&output=json"
# then inspect one item's files
curl -s "https://archive.org/metadata/Nosferatu1922HD"
```

The filter that mattered: **runtime within 25% of the catalogue value, and
title similarity above 0.62.** Without it, a plain title search returned a
sales-tax training video for *The General* and a road-works safety film for
*Detour*. Every surviving URL was then loaded in a real browser to confirm the
codec plays. Result: 23 of 24 verified, `The Kid` rejected rather than shipped
pointing at the wrong film.

### The React build

```bash
npm create vite@latest 3flix-react -- --template react
cd 3flix-react
npm install
npm install react-router-dom
npm run dev -- --port 4500     # development
npm run build                  # production bundle into dist/
```

Versions installed: React 19.2, Vite 8.2, React Router 7.18.

### Git

```bash
git init
git add -A
git commit -m "feat: 3Flix — public-domain streaming platform"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.gitignore` covers `node_modules/`, `dist/`, and `js/config.js` — the last one
because it holds an API key and must never be committed.

### VS Code

Extensions used: **ESLint**, **Prettier**, **Live Server** (for the vanilla
folder), and **Simple React Snippets**. Format-on-save is on, which is why the
whole codebase has consistent quoting and trailing commas.

---

## 3. The design, and why it looks like that

The first version looked generated: a bento grid, pill-shaped badges, a centred
hero, rounded cards. Those are the patterns every AI-made page has, so they were
all removed and replaced with one committed idea.

**The concept: a repertory cinema programme.** Not a streaming service. That one
decision answers most "why" questions:

| Decision | Reason |
| --- | --- |
| Bodoni Moda + IBM Plex Mono | A high-contrast Didone against a mono is a *bookish* pairing. Inter or Roboto would read as a product UI |
| 2px border radius | Print has no rounded corners. Soft 8px pills are a large part of what makes a page look generated |
| Hairline rules instead of cards | Sections are separated by 1px lines and whitespace, like a printed page |
| One cream section | `#ece5d8` stock with dark ink for "How this is legal". A single inverted block does more than any extra accent colour |
| Ink + amber, not red on black | Red on black would read as an imitation of a well-known service. Gold is a cinema marquee |
| Asymmetric hero | 1.15 / 0.85 split, headline oversized on the left, reading matter dropped right — not a centred stack |
| Folio numbers (`No. 01`) | Catalogue convention; gives each section an anchor in the margin |

### Colour tokens

All in `src/styles/base.css` as custom properties, so a theme change is one
block, not a search-and-replace:

```css
--ink: #0b0b0f;      /* page */
--surface: #121218;  /* panels */
--line: #26262f;     /* hairlines */
--paper: #f2efe9;    /* text, warm rather than pure white */
--amber: #e8b14c;    /* the single accent */
--stock: #ece5d8;    /* the inverted section */
```

### Layout

Mobile-first throughout. Every media query is `min-width`, so the base rules are
the phone layout and larger screens add to them. Grid does two-dimensional
layout (`.hero-grid`, `.colophon`, `.plate-wall`); Flexbox does one-dimensional
rows (`.search-form`, `.player-bar`). `auto-fill` with `minmax()` means the film
grid reflows without needing a breakpoint at all.

---

## 4. The posters — no image files anywhere

The project ships **zero images**. Every poster is drawn at runtime.

Real posters were rejected for two reasons: studio artwork is copyrighted even
when the film is not, which would undo the whole point of a public-domain
catalogue; and 24 JPEGs is 24 network requests.

`src/lib/poster.js` works like this:

1. The film's `id` is hashed (FNV-1a) into an integer.
2. That integer seeds a small PRNG (mulberry32).
3. The film's first matching genre picks a motif — a lit doorway with a cast
   shadow for horror, concentric orbits for sci-fi, venetian-blind slats for
   noir, offset frames for comedy.
4. The motif function draws with that seeded generator.

Because the randomness is seeded from the id and not `Math.random()`, **the same
film renders identically every time**. That is the answer to "if it's random,
why doesn't it flicker?"

---

## 5. The components, one by one

### `Poster.jsx`
Pure and presentational: same film in, same markup out. Wrapped in `React.memo`
for that reason. Uses `dangerouslySetInnerHTML` for the SVG — safe here because
the markup is generated by our own code, never from user input.

### `FilmCard.jsx`
A tile. Composes `<Poster>` rather than redrawing artwork, and is a `<Link>` to
`/library/:filmId` so navigation is client-side. Shows a progress bar only when
progress exists — conditional rendering.

### `FilmGrid.jsx`
Maps films to cards with `key={film.id}`. Returns an empty state early when the
list is empty, which keeps the caller free of that branch.

### `SearchForm.jsx`
Controlled components: `value` comes from state, `onChange` writes back, React
is the single source of truth. `useId` generates a unique id so the `label`
still matches its `input` if the form is used twice on a page. `useRef` blurs
the field on submit.

### `Player.jsx`
The one place `useRef` is genuinely necessary: a `<video>` element has an
imperative API (`play()`, `currentTime`) that cannot be expressed as JSX.
Native media events are attached in `useEffect` and removed in its cleanup, so
switching films does not stack listeners.

Two hard-won details:
- **No `crossOrigin` attribute.** The Archive redirects to a host that sends no
  CORS headers, so requesting CORS mode fails with `MEDIA_ERR_SRC_NOT_SUPPORTED`.
  Plain playback needs no CORS, and we never read the video's pixels.
- **An `error` handler that falls back.** A dead link or unsupported codec
  switches to an explanatory panel instead of a black box.

### `ProtectedRoute.jsx`
A wrapper. If signed out it renders `<Navigate to="/signin" replace>` and stashes
the attempted path in `location.state`, so sign-in can send the user onward to
where they were actually going. `replace` keeps the guarded URL out of history.

### `Layout.jsx`
The persistent shell. `<Outlet />` is where the matched child renders — that is
what makes nav and footer survive navigation instead of remounting, and it is
the structural basis of the SPA.

---

## 6. State: where it lives and why

Three different techniques, used deliberately so the difference is visible.

**Local state** — `Player.jsx` owns `playing`, `buffering`, `time`. Nothing else
needs them.

**Lifted state** — `Library.jsx` owns `query` and `genre` because two children
need them: the form writes, the grid reads. `App.jsx` owns `watchlist` and
`progress` because three routes need the same copy.

**Context** — `AuthContext` holds the user. Auth is needed by `Layout` (the sign
out button), `ProtectedRoute` (the guard) and `Watchlist` (the greeting), which
sit at different depths. Threading a prop through every intermediate component
is exactly the prop drilling that Context exists to remove.

The rule applied: start local, lift when a sibling needs it, reach for Context
only when the drilling gets deep. Context is not a global-state dumping ground.

---

## 7. Why `useMemo` and `useCallback` are there

Not decoration — each one has a reason:

- `Library.jsx` re-renders on every keystroke. `useMemo` around the filter means
  the array is recomputed only when the query, genre or film list actually
  changes.
- `AuthContext` builds an object for its value. Without `useMemo` that is a new
  reference every render, so every consumer re-renders even when nothing changed.
- `App.jsx` passes `toggleWatchlist` and `recordProgress` down. `useCallback`
  keeps their identity stable, so the memoised children below them are not
  invalidated on every parent render.
- `useFilms.js` returns `load`, which is used as an effect dependency. Without
  `useCallback` it would be a new function each render and the effect would
  loop forever.

---

## 8. Bugs hit, and what fixed them

**Video refused to load.** Error code 4, `MEDIA_ERR_SRC_NOT_SUPPORTED`. The
cause was the `crossorigin="anonymous"` attribute: the Archive's redirect target
sends no CORS headers. Removing the attribute fixed it immediately —
confirmed by loading the same URL with and without it.

**A title search returned the wrong films.** `The General` matched a sales-tax
training video. Fixed by validating on runtime and title similarity, then
loading each candidate in a browser.

**Content stranded invisible — three separate causes.** Anything that animates
*from* a hidden state can get stuck at the starting frame:
1. `requestAnimationFrame` is throttled to a standstill in a background tab.
2. `IntersectionObserver` can silently never fire in some contexts.
3. CSS **transitions** are driven by the compositor too, so a `0 → 1` opacity
   transition that never advances leaves the element at 0.

The fix was to stop trusting any single trigger: scroll reveals moved to a
`getBoundingClientRect` check on scroll and resize plus a bounded poll, every
animation got a `setTimeout` that writes its final state, and a `.reveal-forced`
class asserts `opacity: 1` with `transition: none` as a last resort.

**A blank canvas that never recovered.** The particle wordmark measured zero at
startup, `build()` bailed, and the `ResizeObserver` that was supposed to retry
never fired. One zero measurement left it blank permanently. Fixed with a retry
ladder plus a plain resize listener.

**Temporal dead zone.** A `p.screen.append(...)` line ran before the `const p`
it referenced, throwing `ReferenceError` on load. Moved below the declaration.

---

## 9. Running it

```bash
# React SPA
cd 3flix-react
npm install
npm run dev          # http://localhost:5173

# vanilla version — no install, no server
open ../3flix/index.html
```

Production build:

```bash
npm run build        # -> dist/
npm run preview
```

Current output: 46 modules, 262 kB JS (84 kB gzipped), 28 kB CSS.

---

## 10. Honest limitations

- Sign-in is not authentication. Any name is accepted and the "session" is a
  string in `localStorage`. It exists to demonstrate a protected route.
- Playback depends on the Internet Archive being reachable.
- `The Kid` has no verified source and shows an explanatory panel.
- Public-domain status is the commonly cited US position, not legal advice, and
  differs by country.
- `localStorage` is per-browser, so history does not follow you to another
  machine.
