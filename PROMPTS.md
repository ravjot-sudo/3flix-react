# 3Flix — component prompts

Copy-paste prompts in the `/ultimate-design` Step-3 template, one per required
component. Paste any single block into Cursor, v0, Claude Code or Lovable.

**Provenance.** Components 02–06 are taken from 21st.dev's live **Popular**
ranking, fetched on 2026-09-10 (usage count in brackets). The prompts are
written for 3Flix; they are not copies of any 21st.dev author's source.

**Stack line.** The template's default is Tailwind + shadcn. 3Flix is
React 19 + Vite + plain CSS on purpose — the course grades CSS fundamentals
(box model, flexbox, grid, media queries) and Tailwind would hide them. So
every prompt below says *plain CSS with the project tokens* instead.

Shared system — every prompt inherits it:

```
bg #0b0b0f · surface #121218 · raised #1a1a22 · border 1px #26262f
text #f2efe9 · muted #a3a3b0 · dim #71717f · accent #e8b14c
inverted "stock" section: bg #ece5d8 / ink #17150f
Display Bodoni Moda 500, italic for emphasis · Body Outfit 300–400
Mono    IBM Plex Mono 400, 11px, tracking .16em, uppercase labels
Radius 2px · Motion 250/400/700ms · cubic-bezier(.16,1,.3,1)
Scale 12 14 16 18 24 32 48 64 96 (1.333) · max-w 1240
Animation lib: motion (useScroll / useTransform / useSpring)
```

---

## 01 — Navigation · *21st.dev category: Navigation*

```
─────────────────────────────────────────
COMPONENT: Navigation
─────────────────────────────────────────
Build the header for 3Flix, a streaming front end for public-domain film,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- Repertory-programme — a masthead rule, not a pill bar. Transparent over the
  hero, blurred ink + hairline once scrolled.
- set: bg rgba(11,11,15,.86) + blur 14px / border-bottom 1px #26262f
- Wordmark: Bodoni Moda 600, 1.3rem, "3" in text colour, "Flix" in #e8b14c
- Links: IBM Plex Mono 400, 11px, tracking .16em, uppercase, #a3a3b0
- Radius 2px · shadow none

STRUCTURE
- <header> fixed, full width → wordmark / <nav> links / tools
- Links: Home · Library · Watchlist · About (NavLink, active = accent)
- Tools: ⌘K hint (≥760px) · Sign in / user name + Sign out
- Underline grows from the left on hover (scaleX), 1px #e8b14c

STATES
- top / scrolled (after 40px) / link hover / active route / focus-visible /
  signed-in / signed-out / mobile (links collapse)

MOTION
- Background + border 400ms on the scroll threshold; underline scaleX 400ms
- Respect prefers-reduced-motion — no exceptions

A11Y
- <header>, <nav aria-label="Primary">, skip-link to #main first in tab order
- aria-current="page" on the active NavLink
- Keyboard: logical order; ⌘K opens the palette from anywhere
- Contrast ≥ 4.5:1 on links (#a3a3b0 on #0b0b0f = 8.3:1)
- Focus ring: 2px #e8b14c, 3px offset

CONSTRAINTS
- Plain CSS with the project tokens. No inline styles.
- Throttle the scroll listener on a timestamp, not requestAnimationFrame.
- Mobile-first. Breakpoints 640 / 760 / 900 / 1100.
- Real copy only.
─────────────────────────────────────────
```

---

## 02 — Scroll media expansion hero · *21st.dev Popular #1 (9.4k)*

```
─────────────────────────────────────────
COMPONENT: Scroll Media Expansion Hero
─────────────────────────────────────────
Build a scroll-driven hero for 3Flix in which a single film frame grows from
an inset card to a full-bleed cinema screen,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- Repertory-programme meets projection room. Starts as a 2px-bordered plate
  in the middle of an ink field; ends edge to edge with the house lights down.
- bg #0b0b0f / plate border 1px #26262f / text #f2efe9 / accent #e8b14c
- Display: Bodoni Moda 500, clamp(3rem,8.2vw,6.6rem), leading .92,
  tracking -.035em — split into two words that part as the frame grows
- Mono: IBM Plex Mono 400, 11px — the running credit under the frame
- Radius 2px → 0 at full bleed · shadow 0 40px 90px -30px rgba(0,0,0,.85)

STRUCTURE
- Section height 250vh; inner wrapper position:sticky top:0 h:100dvh
- Layer 0: ink field with a faint vignette
- Layer 1: the frame — a generated poster of Metropolis (procedural, see
  lib/poster.js) with an optional muted Internet Archive clip on top
- Layer 2: headline words "Cinema" and "outlived." either side of the frame
- Layer 3: credit line + scroll cue
- After the pin releases, the frame hands off to the Library

STATES
- initial (frame 32vw × 42vh, words touching the frame edges) /
  scrubbing / full-bleed (frame 100vw × 100dvh, words pushed off-screen) /
  video-loaded / video-failed (poster stays — never a black box) /
  reduced-motion (render the full-bleed end state, no scrub)

MOTION
- useScroll({ target: section, offset: ["start start","end end"] })
- width 32vw → 100vw, height 42vh → 100dvh, radius 2px → 0 over 0 → 0.7
- left word translateX 0 → -60vw, right word 0 → 60vw over 0 → 0.6
- frame scale driven by useSpring({ stiffness: 120, damping: 30 }) so it
  settles instead of snapping on trackpads
- Credit line fades out 0 → 0.3
- Respect prefers-reduced-motion — no exceptions

A11Y
- The headline is ONE <h1> whose text reads "Cinema that outlived its own
  copyright." — the split words are presentational spans, aria-hidden, with
  the full sentence kept as the accessible name
- Video: muted, playsinline, no autoplay under reduced motion, has a poster
- Frame is decorative; the CTA below it is a real <a> to /library
- Contrast ≥ 3:1 for the display text over the frame

CONSTRAINTS
- Plain CSS with the project tokens; motion values applied via style props
  only because they are live scroll state.
- Never request the video before the section is on screen.
- No crossOrigin on the <video>: the Archive's redirect host sends no CORS
  headers and requesting CORS mode fails the load.
- Mobile-first. On < 760px, shorten the pin to 180vh.
- Real copy only.
─────────────────────────────────────────
```

---

## 03 — Container scroll animation · *21st.dev Popular #2 (9.2k)*

```
─────────────────────────────────────────
COMPONENT: Container Scroll Animation
─────────────────────────────────────────
Build a section in which the 3Flix library interface rises from a tilted 3D
plane to face the viewer as you scroll,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- A real screen, not a mockup PNG: the actual <FilmGrid> rendered at reduced
  scale inside a bezel. Hairline bezel, no device chrome, no fake notch.
- bezel bg #121218 / border 1px #26262f / screen bg #0b0b0f / accent #e8b14c
- Display: Bodoni Moda 500, clamp(2rem,4.4vw,3.4rem) section title
- Radius 2px · shadow 0 60px 120px -40px rgba(0,0,0,.9)

STRUCTURE
- Section 160vh, sticky inner
- Title block above the container, scrolls up and away
- Container: perspective 1200px parent → the screen (aspect 16/10,
  max-w 1100) holding a live <FilmGrid> of 8 titles, pointer-events off
- Caption below in mono: "The library — 24 titles, 23 playable"

STATES
- tilted (rotateX 22deg, scale .86) / rising / upright (rotateX 0, scale 1) /
  reduced-motion (upright, no scrub) / narrow (no tilt, plain stacked)

MOTION
- useScroll on the section, offset ["start end","end start"]
- rotateX 22deg → 0 over 0.1 → 0.55
- scale .86 → 1 over the same range
- title translateY 0 → -80px, opacity 1 → 0 over 0.2 → 0.5
- Respect prefers-reduced-motion — no exceptions

A11Y
- The embedded grid is a visual preview: aria-hidden, inert, tabindex -1 on
  every link inside it, so keyboard users are not dropped into a fake UI
- A real "Open the library" link sits outside the container
- Contrast ≥ 4.5:1 on the caption

CONSTRAINTS
- Reuse <FilmGrid>; do not duplicate markup or screenshot it.
- transform-style: preserve-3d on the parent only — never on the grid, or
  every poster gets its own 3D context and the frame rate collapses.
- Plain CSS with the project tokens. Mobile-first. No tilt below 760px.
- Real copy only.
─────────────────────────────────────────
```

---

## 04 — Spotlight card · *21st.dev Popular #4 (7.7k)*

```
─────────────────────────────────────────
COMPONENT: Spotlight Poster Card
─────────────────────────────────────────
Build a poster card for 3Flix in which a soft projector light follows the
pointer across the artwork,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- The light is the concept: a warm radial pool, like a projector beam catching
  a lobby card. Not a neon glow, not a colour ring.
- card bg #121218 / border 1px #26262f → rgba(232,177,76,.55) on hover
- light: radial-gradient(320px circle at var(--x) var(--y),
  rgba(232,177,76,.16), transparent 60%)
- Title: Bodoni Moda 500, 1.1rem · meta IBM Plex Mono 400, 9px, .14em
- Radius 2px · shadow none at rest, 0 30px 60px -24px rgba(0,0,0,.8) hover

STRUCTURE
- <Link> wrapping: <Poster> (generated art) → light layer → keyline →
  text block → rating badge
- Light layer: absolutely positioned, pointer-events none, mix-blend screen
- Progress bar pinned to the bottom edge when the film has been started

STATES
- default / hover (light tracks) / focus-visible (light centred, keyline on) /
  active (scale .98) / in-watchlist (mono "List" flag) / in-progress
  (amber bar) / touch (no light — static keyline highlight on tap)

MOTION
- Pointer position written to CSS custom properties --x/--y, throttled to one
  write per animation frame
- Light opacity 0 → 1 in 250ms on enter, 1 → 0 in 400ms on leave
- Card translateY 0 → -5px, 400ms
- Respect prefers-reduced-motion — disable the tracking light entirely

A11Y
- The card is ONE link with a full accessible name:
  "Nosferatu, 1922, directed by F. W. Murnau. 31 percent watched."
- Light layer and keyline are aria-hidden
- Keyboard focus shows the light centred so focus is never invisible
- Contrast ≥ 4.5:1 on the meta line

CONSTRAINTS
- Only CSS variables change on pointermove — no React re-render per mouse event.
- Plain CSS with the project tokens. Mobile-first.
- Real copy from data/films.js only.
─────────────────────────────────────────
```

---

## 05 — Poster columns · *21st.dev Popular #6, Testimonials Columns (6.1k), adapted*

```
─────────────────────────────────────────
COMPONENT: Layered Poster Columns
─────────────────────────────────────────
Build three vertically scrolling columns of 3Flix posters moving at
different speeds, to give the collection section real depth,
React 19 + Vite + motion + plain CSS with the project tokens.

WHY ADAPTED
- The source component shows testimonial quotes. 3Flix has no customers to
  quote, and inventing them is fake proof. The PATTERN — columns drifting at
  different rates — is kept; the content is our own catalogue.

LOOK
- Three depths: back column small and dim, middle normal, front large and
  fully lit. Reads as a wall of lobby cards receding into the dark.
- bg #0b0b0f / column masks fade to #0b0b0f top and bottom
- back: scale .82, opacity .45, blur 1px · middle: 1, .8 · front: 1.08, 1
- Radius 2px on posters · shadow only on the front column

STRUCTURE
- Section with a left text column (title + note) and a right 3-column field
- Each column: the same poster list duplicated once so the loop is seamless
- Column order back → front in DOM, z-index ascending
- Mask: mask-image linear-gradient(transparent, #000 12%, #000 88%, transparent)

STATES
- idle loop / hover-paused (the column under the pointer stops) /
  offscreen-paused / reduced-motion (static, no loop)

MOTION
- CSS keyframes translateY 0 → -50%, durations 64s / 48s / 36s — slower at
  the back, which is what makes it read as distance
- Middle column runs in reverse
- Scroll adds parallax on top: useScroll maps section progress to an extra
  ±40px / ±80px / ±140px per column
- Respect prefers-reduced-motion — no exceptions

A11Y
- The duplicated half is aria-hidden so each title is announced once
- Each poster is a link with a full name; the columns are a <ul> per column
- Paused on hover AND on focus-within, so keyboard users can read and tab
- Contrast of the text column ≥ 4.5:1

CONSTRAINTS
- Animate transform only. Pause via animation-play-state when offscreen.
- Plain CSS with the project tokens. Below 900px, show one column, no parallax.
- Real titles from data/films.js only.
─────────────────────────────────────────
```

---

## 06 — Radial orbital timeline · *21st.dev Popular #5 (6.7k)*

```
─────────────────────────────────────────
COMPONENT: Radial Orbital Timeline
─────────────────────────────────────────
Build an orbit of the 3Flix catalogue by decade — 1900s at the centre,
1960s at the rim — where selecting a node brings its films forward,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- An orrery, not a dashboard chart. Hairline concentric rings, one per
  decade; each film is a small node on its ring, placed by release year.
- rings 1px #26262f / nodes 8px #a3a3b0 / active node #e8b14c with a 1px
  outer ring / centre label in Bodoni Moda
- Mono labels on the ring edges: "1900s", "1920s" … "1960s"
- Radius n/a · shadow none

STRUCTURE
- Square stage, max 620px, centred; detail panel beside it at ≥1000px
- Rings: 6 (1900s–1960s), radius stepped 14% → 94%
- Node angle = (index within decade / count in decade) × 360deg, offset per
  ring so nodes do not line up radially
- Detail panel: selected film's generated poster, title, year, director,
  synopsis, "Watch" link

STATES
- idle (slow rotation) / hover node (label appears) / selected (orbit
  pauses, rings dim except the selected decade, node scales 1.6) /
  focus-visible / reduced-motion (static orbit, no rotation)

MOTION
- Whole stage rotates 360deg over 180s, linear; pauses while anything is
  selected or hovered
- Node select: scale 1 → 1.6, 400ms; other rings opacity 1 → .3, 400ms
- Panel content crossfades 250ms
- Respect prefers-reduced-motion — no exceptions

A11Y
- The orbit is a visual index of a real list: render the films as a
  <ul> of buttons grouped by decade, and position those buttons with CSS —
  so the DOM order is chronological even though the layout is circular
- Each node button: aria-label "Nosferatu, 1922", aria-pressed when selected
- Keyboard: Tab through nodes in year order; Enter selects; Esc clears
- The rotation must not move focus targets out from under keyboard focus —
  pause on focus-within
- Contrast ≥ 3:1 for nodes against the ground, ≥ 4.5:1 for labels

CONSTRAINTS
- Counter-rotate labels so text is always upright.
- Plain CSS with the project tokens. Below 760px, render the decade list
  plainly with no orbit.
- Real data from data/films.js only.
─────────────────────────────────────────
```

---

## 07 — Number ticker · *21st.dev component signal: 12.4k, 454 bookmarks*

```
─────────────────────────────────────────
COMPONENT: Number Ticker Colophon
─────────────────────────────────────────
Build the figures strip for 3Flix,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- A printed colophon: columns divided by hairlines, figures in Bodoni Moda,
  labels in mono. Not stat cards.
- border-top 1px #26262f / column rules 1px #1d1d25 / text #f2efe9
- Display: Bodoni Moda 500, clamp(1.6rem,3vw,2.4rem), tabular-nums
- Mono: IBM Plex Mono 400, 11px, tracking .16em, uppercase
- Radius 0 · shadow none

STRUCTURE
- <dl>: 2 cols → 3 at 700px → 5 at 1000px
- Titles 24 · Earliest 1902 · Streamable 23 · Image files 0 · Licence fees 0
- Every value is COMPUTED from data/films.js, never typed in

STATES
- rendered (final value in the markup) / counting / settled

MOTION
- useInView → animate 0 → value over 1100ms, ease-out
- A timer writes the final value at 1260ms regardless: requestAnimationFrame
  stalls in a background tab and would freeze the number mid-count
- Respect prefers-reduced-motion — show the value, never animate

A11Y
- <dt>/<dd> with real text; the final value is present before any animation
- No aria-live — a decorative count-up should not be announced
- tabular-nums so the width does not jitter
- Contrast ≥ 4.5:1

CONSTRAINTS
- Plain CSS with the project tokens. Mobile-first.
- Values derived from data, so copy and animation can never disagree.
─────────────────────────────────────────
```

---

## 08 — Masked text reveal · *21st.dev category: Text Components*

```
─────────────────────────────────────────
COMPONENT: Masked Line Reveal
─────────────────────────────────────────
Build a reusable <Reveal> heading component for 3Flix,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- Lines rise out of their own mask with a slight rotation, like set type
  dropping into a forme.
- text #f2efe9 / italic emphasis #e8b14c
- Display: Bodoni Moda 500, size from the caller

STRUCTURE
- Props: as ("h1" | "h2" | "h3"), lines: string[], delay
- Each line: <span class="mask"> (overflow hidden) → <motion.span> (moves)
- The heading's accessible name is lines.join(" ") on the element itself

STATES
- hidden / revealing / revealed / reduced-motion (revealed, no motion)

MOTION
- y 115% → 0, rotate 2deg → 0, opacity 0 → 1, 1150ms, stagger 90ms
- whileInView with once: true and a margin of "-10%"
- Backstop: after delay + 1600ms set the final state with no transition —
  CSS and motion both stop advancing in a throttled tab, and invisible
  headings are the worst failure this component can have
- Respect prefers-reduced-motion — no exceptions

A11Y
- Never split into characters; never put the text only in aria-label
- Masks are presentational; the heading level is the caller's choice
- Contrast ≥ 3:1 for display sizes

CONSTRAINTS
- Plain CSS with the project tokens. One component, reused everywhere.
─────────────────────────────────────────
```

---

## 09 — Command palette · *21st.dev category: Sign-ins & widgets*

```
─────────────────────────────────────────
COMPONENT: Catalogue Command Palette
─────────────────────────────────────────
Build a ⌘K palette that searches the 3Flix catalogue and jumps to routes,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- Bordered panel on a blurred ground, anchored 12vh from the top. Result rows
  show a 28px generated poster thumbnail, title, year, director.
- surface #121218 / border 1px #26262f / active row inset 2px #e8b14c
- Input: Outfit 300, 15px · rows 14px · hints IBM Plex Mono 9.5px
- Radius 2px · shadow 0 50px 110px -40px rgba(0,0,0,.95)

STRUCTURE
- Groups: Films (fuzzy match on title/director/genre) · Go to (routes) ·
  Actions (toggle watchlist for the focused film)
- Empty query shows "Continue watching" first, from localStorage progress
- Max 8 film results; "See all in Library" row when there are more

STATES
- closed / open-empty / typing / results / no-match / keyboard-cursor
- Running any command dismisses the palette

MOTION
- Backdrop 280ms fade; panel translateY 14px → 0, 340ms
- No motion on cursor movement
- Respect prefers-reduced-motion — no exceptions

A11Y
- input role="combobox" + aria-activedescendant; list role="listbox";
  rows role="option"
- Keyboard: ⌘K/Ctrl+K · ↑↓ · Enter · Esc · Tab trapped · focus restored
- Contrast ≥ 4.5:1

CONSTRAINTS
- Debounce the query 120ms; search runs over the in-memory catalogue.
- Plain CSS with the project tokens. Mobile-first.
- Real data only.
─────────────────────────────────────────
```

---

## 10 — Cinema player · *21st.dev category: Galleries & 3D*

```
─────────────────────────────────────────
COMPONENT: Cinema Player
─────────────────────────────────────────
Upgrade the 3Flix <Player> with an ambient light that spills from the screen
in the film's own colour,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- The screen lights the room: a blurred glow behind the player, tinted from
  the film's poster hue, strongest while playing.
- screen bg #050507 / glow hsl(<film.hue> 50% 40% / .35), blur 80px
- controls bar #1a1a22 / play #e8b14c / mono timecodes
- Radius 2px · shadow layered

STRUCTURE
- Glow layer (absolute, behind) → screen (16:9) → overlay (title, status) →
  controls (play, time, native range seek, total, watchlist)
- "Cinema mode" toggle dims the rest of the page to 8% and hides the nav

STATES
- no-source (explanatory panel, never a black box) / loading (spinner) /
  playing (glow up) / paused (glow down) / ended / error (falls back to the
  no-source panel) / cinema-mode on/off

MOTION
- Glow opacity .15 ↔ .35 over 700ms on play/pause
- Cinema mode: page dim 400ms
- Respect prefers-reduced-motion — no exceptions

A11Y
- Native <input type="range"> for seek; aria-label on every icon button
- Space toggles play when the player has focus; Esc exits cinema mode
- Captions slot reserved (<track>) even though the catalogue has none yet

CONSTRAINTS
- Remount via key={film.id} instead of resetting state in an effect.
- No crossOrigin attribute on <video> (see 02).
- Plain CSS with the project tokens. Mobile-first.
─────────────────────────────────────────
```

---

## 11 — Toast · *21st.dev category: Sign-ins & widgets*

```
─────────────────────────────────────────
COMPONENT: Toast
─────────────────────────────────────────
Build a status toast for 3Flix watchlist and playback events,
React 19 + Vite + motion + plain CSS with the project tokens.

LOOK
- A bordered strip, amber-dim border, no icon, no colour fill.
- surface #121218 / border 1px #8a6a2e / text #f2efe9
- Body: Outfit 400, 13px · Radius 2px · shadow none

STRUCTURE
- Fixed, bottom 28px, centred · one at a time · optional "Undo" button

STATES
- hidden / rising / visible / auto-dismiss 4600ms / undone

MOTION
- opacity + translateY 14px → 0, 400ms · exit 260ms
- Respect prefers-reduced-motion — no exceptions

A11Y
- role="status" aria-live="polite" — a confirmation is not an alert
- Never takes focus; the Undo button is reachable by Tab while visible
- Specific copy: "Added Nosferatu to your watchlist." — never "Success"

CONSTRAINTS
- Plain CSS with the project tokens. Mobile-first. Real copy only.
─────────────────────────────────────────
```

---

## 12 — AetherList adapter · *data layer, not visual*

```
─────────────────────────────────────────
COMPONENT: useAether (data adapter)
─────────────────────────────────────────
Build a React hook that reads from the AetherList API and merges it with the
3Flix bundled catalogue, React 19 + Vite.

KNOWN
- Host: from VITE_AETHER_BASE_URL. The root returns
  {"message":"Backend is working as expected (v2.1.0)"}; unknown routes return
  a Nitro/h3 404 JSON body. There is no public route list or OpenAPI spec.
- Key: VITE_AETHER_KEY, read only through src/lib/config.js

STRUCTURE
- useAether(path) → { data, status: "idle"|"loading"|"ready"|"error", error }
- AbortController cancels on unmount and on path change
- Map the response into the Film shape; anything unmappable is dropped
- Result is MERGED into the local catalogue, never replaces it

STATES
- not-configured (no key/URL → return the local catalogue, no request) /
  loading / ready / error (return the local catalogue, log once) /
  unauthorised (401 → surface a single console warning, fall back)

A11Y
- A visible, polite status line in the Library when remote data is in use:
  "Including 12 titles from AetherList."

CONSTRAINTS
- The endpoint path is NOT known. Do not guess it — take it as an argument.
- VITE_ variables are inlined into the bundle at build time. The key is
  public. Use a read-only key; the only real fix is a server-side proxy.
- The app must work exactly as before with no key, no URL, or a dead network.
─────────────────────────────────────────
```
