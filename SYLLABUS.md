# Syllabus coverage — 3Flix

Every point from the course, mapped to the file and line that demonstrates it.
Line numbers refer to this React project unless the row says `3flix/`, which is
the vanilla build in the sibling folder.

Two projects are submitted deliberately:

| Folder | Stack | What it evidences |
| --- | --- | --- |
| `3flix/` | HTML + CSS + vanilla JS, no build step | Modules 1 and 2 |
| `3flix-react/` | React 19 + Vite + React Router 7 | Modules 2, 3 and 4 |

---

## Module 1 — HTML, CSS, tooling

| Syllabus item | Where | Notes |
| --- | --- | --- |
| HTML5 structure | `index.html`, `src/components/Layout.jsx` | Full document in the vanilla build; the SPA shell here |
| Semantic tags | `Layout.jsx:35-60` | `header` / `nav` / `main` / `footer` landmarks |
| | `routes/About.jsx` | `section`, `ol`, `li`, heading hierarchy |
| | `routes/FilmDetail.jsx` | `article`, `dl` / `dt` / `dd` for facts |
| Accessibility basics | `Layout.jsx:31` | Skip link to `#main` |
| | `components/SearchForm.jsx:29` | `useId` pairs `label` with `input` |
| | `routes/SignIn.jsx:57-62` | `aria-invalid`, `aria-describedby`, `role="alert"` |
| | `components/FilmCard.jsx:18` | Descriptive `aria-label` per tile |
| | `styles/base.css` | `:focus-visible` restyled, never removed; `prefers-reduced-motion` honoured |
| CSS3 fundamentals | `styles/base.css` | Custom properties, `clamp()`, logical properties |
| Box model | `styles/base.css` | `box-sizing: border-box` reset at the top |
| Flexbox | `styles/app.css` — `.search-form`, `.player-bar` | One-dimensional rows |
| Grid | `styles/landing.css` — `.hero-grid`, `.colophon`, `.plate-wall` | Two-dimensional layout |
| Responsive design | `styles/landing.css` | `auto-fill` / `minmax` grids reflow without breakpoints |
| Media queries | `styles/landing.css`, `styles/app.css` | 700 / 760 / 900 / 1000 / 1100px |
| Mobile-first | throughout | Base rules are the small-screen case; every query is `min-width` |
| JS: variables | everywhere | `const` by default, `let` only where reassigned |
| Functions | `lib/poster.js` | Declarations, arrows, closures (`seeded`) |
| Arrays | `routes/Library.jsx:28-38` | `filter`, `map`, `some`, `includes` |
| Objects | `data/films.js` | 24 objects; spread updates in `App.jsx:50` |
| Loops | `lib/poster.js:20-26` | `for` loop in the hash function |
| Dev tools | — | Console and Network used throughout; see `BUILD.md` |
| VS Code setup | — | See `BUILD.md` |
| Git / GitHub | — | See `BUILD.md` |
| **Mini project: static responsive landing page** | `3flix/index.html` | The vanilla landing page, no framework, no build |

---

## Module 2 — ES6+, async, DOM, storage, forms

| Syllabus item | Where | Notes |
| --- | --- | --- |
| `let` / `const` | everywhere | No `var` anywhere in either project |
| Arrow functions | `App.jsx:44`, `Library.jsx:30` | Including concise bodies and implicit return |
| Destructuring | `components/Poster.jsx:17` | Object destructuring from props |
| | `hooks/useLocalStorage.js:20` | Array destructuring of the returned tuple |
| Spread / rest | `App.jsx:50` | `[...list, id]` — never mutate state |
| | `App.jsx:57` | `{ ...prev, [id]: fraction }` — computed key |
| | `routes/Home.jsx:16` | Spreading two arrays to build the featured set |
| Modules, import / export | every file | Named and default exports; `data/films.js` exports four |
| Promises | `hooks/useFilms.js:24` | `fetch` returns one; `.catch` on `play()` in `Player.jsx:88` |
| async / await | `hooks/useFilms.js:21-38` | `async` callback, two `await`s, `try` / `catch` |
| fetch API | `hooks/useFilms.js:25` | Real request to `/films.json` with `AbortController` |
| DOM manipulation | `3flix/js/app.js` | `createElement`, `append`, `classList` — the vanilla way |
| | `components/Player.jsx:34` | `useRef` to reach a real `<video>` node in React |
| Event handling | `components/SearchForm.jsx:22` | `onSubmit` with `preventDefault` |
| | `components/Player.jsx:44-66` | Native media events added and cleaned up |
| Browser storage | `hooks/useLocalStorage.js` | Read, write, and `try` / `catch` for blocked storage |
| JSON | `hooks/useLocalStorage.js:16,29` | `JSON.parse` / `JSON.stringify` |
| | `public/films.json` | The fetched payload |
| Forms | `routes/SignIn.jsx` | Submit, validate, error state, redirect |
| Controlled components | `SignIn.jsx:52-54`, `SearchForm.jsx:40-42` | `value` from state, `onChange` writes back |
| **Mini project: interactive to-do app** | `routes/Watchlist.jsx` + `App.jsx:47` | Same shape: add / remove / persist a list |
| React project setup with Vite | `package.json`, `vite.config.js` | `npm create vite@latest` — see `BUILD.md` |
| **Mini project: counter / product card UI** | `components/FilmCard.jsx` | Reusable product card, composed from `Poster` |

---

## Module 3 — React core

| Syllabus item | Where | Notes |
| --- | --- | --- |
| Component architecture | `src/components`, `src/routes` | Presentational components vs route components |
| JSX | every `.jsx` | Expressions, attributes, fragments |
| Components | 7 in `components/`, 7 in `routes/` | |
| Props | `FilmCard.jsx:14`, `Poster.jsx:16` | Destructured in the parameter list, with defaults |
| State | `Library.jsx:22-23`, `SignIn.jsx:18-19` | |
| Rendering lists | `FilmGrid.jsx:26-34` | `.map` with a stable `key={film.id}` |
| Conditional rendering | `FilmGrid.jsx:17` | Early return for the empty state |
| | `Player.jsx:104` | Ternary: real video or fallback panel |
| | `Layout.jsx:38` | Signed in vs signed out |
| | `Poster.jsx:31` | `&&` short-circuit |
| `useState` | `Library.jsx:22`, `Player.jsx:17-21` | |
| `useEffect` | `useLocalStorage.js:27` | Write on change |
| | `useDebounce.js:16` | With cleanup — `clearTimeout` |
| | `Player.jsx:31,41` | Reset on id change; subscribe and unsubscribe |
| | `useFilms.js:41` | With `AbortController` cleanup |
| `useRef` | `Player.jsx:16` | Imperative access to `<video>` |
| | `SearchForm.jsx:19` | Focus / blur control |
| `useMemo` | `Library.jsx:31` | Filtering, recomputed only on real input changes |
| | `AuthContext.jsx:31` | Stable context value |
| `useCallback` | `App.jsx:44,55` | Stable handlers passed to memoised children |
| | `useFilms.js:21` | Stable loader, safe as an effect dependency |
| Component composition | `About.jsx:48` | `children` passed through `<Note>` |
| | `FilmCard.jsx:22` | Renders `<Poster>` rather than duplicating it |
| Reusable UI | `Poster`, `FilmCard`, `FilmGrid`, `SearchForm` | Used across three routes |
| Custom hooks | `hooks/useLocalStorage.js` | Persisted state |
| | `hooks/useDebounce.js` | Delayed value |
| | `hooks/useFilms.js` | Async data with loading / error |
| | `hooks/useMediaQuery.js` | Breakpoint subscription |
| | `context/AuthContext.jsx:41` | `useAuth` wraps `useContext` |
| Lifting state up | `Library.jsx:22-23` | Query and genre lifted above form and grid |
| | `App.jsx:38-39` | Watchlist and progress lifted above three routes |
| Prop drilling basics | `App.jsx` → `Library` → `FilmGrid` → `FilmCard` | Drilling shown deliberately |
| | `context/AuthContext.jsx` | Context as the alternative, for auth |
| **Mini project: weather / notes app** | `routes/Watchlist.jsx` | Async data + persisted user list |

---

## Module 4 — Routing and SPA structure

| Syllabus item | Where | Notes |
| --- | --- | --- |
| React Router basics | `main.jsx:24` | `<BrowserRouter>` at the root |
| | `App.jsx:60-100` | `<Routes>` / `<Route>` tree |
| Nested routes | `App.jsx:66-79` | `/library/:filmId` renders inside `/library` |
| | `Layout.jsx:56` | `<Outlet>` in the shell |
| | `Library.jsx:63` | Second `<Outlet>` for the detail panel |
| Dynamic routes | `App.jsx:71` | `path=":filmId"` |
| Route params | `FilmDetail.jsx:13` | `useParams()` |
| | `Library.jsx:26` | Reads the same param to decide layout |
| Protected routes | `components/ProtectedRoute.jsx` | Redirects to `/signin`, remembers origin |
| | `App.jsx:83` | Wraps `/watchlist` |
| | `SignIn.jsx:26,38` | Returns the user to where they were going |
| 404 page | `routes/NotFound.jsx` | Matched by `path="*"` in `App.jsx:97` |
| Redirects | `App.jsx:94` | `/films` → `/library` via `<Navigate replace>` |
| Navigation layout | `components/Layout.jsx` | Persistent chrome, `<NavLink>` active state |
| Multi-page SPA | 7 routes | No full page reload between any of them |

---

## Verified behaviour

Driven in a real browser, not asserted:

| Check | Result |
| --- | --- |
| Debounce actually delays | 24 tiles at 120 ms, 2 at 620 ms |
| Genre filter | Noir → 4 titles, `aria-pressed="true"` |
| Protected route | `/watchlist` → `/signin` when signed out |
| Form validation | "A" rejected, stays on `/signin` with an error |
| Redirect after sign-in | Returns to `/watchlist`, the original destination |
| Dynamic route | `/library/nosferatu` renders the player |
| Unknown param | `/library/not-a-film` shows a message, no crash |
| Legacy redirect | `/films` → `/library` |
| 404 | `/nope-nothing-here` → "No such page." |
| Persistence | `3flix:watchlist` and `3flix:user` survive reload |
| Production build | 46 modules, 262 kB JS (84 kB gzipped), no errors |
