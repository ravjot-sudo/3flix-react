# 3Flix — React

**Live: [3flix-react.vercel.app](https://3flix-react.vercel.app)**

A streaming platform for public-domain film, plus a current-film catalogue
from TMDB. React 19 + Vite + React Router 7 + framer-motion.

```bash
npm install
cp .env.example .env.local   # then add your own TMDB key (see below)
npm run dev
```

The Movies pages (trending, in cinemas, free to watch, on Netflix) need a free
TMDB key in `.env.local` as `VITE_TMDB_TOKEN`. Without one, everything else
still works and those pages explain how to connect it.

| Document | Contents |
| --- | --- |
| [`SYLLABUS.md`](SYLLABUS.md) | Every course topic mapped to the file and line that proves it |
| [`BUILD.md`](BUILD.md) | How it was built: commands, design decisions, components, bugs |

## Routes

| Path | Page | Demonstrates |
| --- | --- | --- |
| `/` | Home | Lists, composition, reusable components |
| `/library` | Library | Lifted state, `useMemo`, controlled search |
| `/library/:filmId` | Film detail | Nested + dynamic route, `useParams`, `useRef` |
| `/movies` | Movies (TMDB) | URL state, paged fetching, `AbortController` |
| `/movies/:movieId` | Movie detail | Dynamic route, trailer facade, where to watch |
| `/watchlist` | Watchlist | Protected route, Context |
| `/signin` | Sign in | Controlled form, validation, redirect |
| `/about` | About | Semantic HTML |
| `/films` | → `/library` | Redirect |
| anything else | 404 | Wildcard route |

The sibling folder `../3flix/` is the same product built with no framework and
no build step — evidence for the HTML/CSS/vanilla-JS modules.

## Deploying

The live site is a Vercel **prebuilt** deploy: it is built on a machine that has
`.env.local`, then the finished files are uploaded.

```bash
vercel build --prod
vercel deploy --prebuilt --prod
```

Pushes to GitHub do not deploy (`"git": { "deploymentEnabled": false }` in
`vercel.json`), because a build on Vercel's servers has no TMDB key unless one
is added there. To switch on deploy-on-push: add `VITE_TMDB_TOKEN` under Vercel →
Project → Settings → Environment Variables, then delete the `git` block from
`vercel.json`.

Note that any `VITE_` variable is compiled into the public JavaScript, so the
TMDB key is readable by anyone. Use TMDB's read-only key, and regenerate it if
it is ever abused.
