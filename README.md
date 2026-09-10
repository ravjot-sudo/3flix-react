# 3Flix — React

A streaming platform for public-domain film. React 19 + Vite + React Router 7.

```bash
npm install
npm run dev
```

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
| `/watchlist` | Watchlist | Protected route, Context |
| `/signin` | Sign in | Controlled form, validation, redirect |
| `/about` | About | Semantic HTML |
| `/films` | → `/library` | Redirect |
| anything else | 404 | Wildcard route |

The sibling folder `../3flix/` is the same product built with no framework and
no build step — evidence for the HTML/CSS/vanilla-JS modules.
