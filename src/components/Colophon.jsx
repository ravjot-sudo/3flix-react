import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { FILMS } from "../data/films.js";

/**
 * NUMBER TICKER COLOPHON — 21st.dev Number Ticker (12.4k, 454 bookmarks).
 *
 * Every value is derived from the catalogue, so copy and data can never
 * disagree. The final value is rendered first; the count-up is decoration on
 * top of text that was already correct.
 */
const STATS = [
  { label: "Titles",       value: () => FILMS.length },
  { label: "Earliest",     value: () => Math.min(...FILMS.map((f) => f.year)) },
  { label: "Streamable",   value: () => FILMS.filter((f) => f.video).length },
  { label: "Image files",  value: () => 0 },
  { label: "Licence fees", value: () => 0 },
];

function Ticker({ to }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = useReducedMotion();
  // A MotionValue rather than state: motion writes it to the DOM itself, so
  // counting to 1902 costs no React renders at all. It STARTS at the final
  // value, so the markup is correct before any animation runs.
  const value = useMotionValue(to);
  const rounded = useTransform(value, (v) => Math.round(v));

  useEffect(() => {
    if (!inView || reduced || to === 0) return undefined;
    value.jump(0);
    const controls = animate(value, to, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    // requestAnimationFrame stalls in a background tab and would freeze the
    // count mid-way; land the real value on a timer regardless.
    const t = setTimeout(() => value.set(to), 1260);
    return () => { controls.stop(); clearTimeout(t); };
  }, [inView, reduced, to, value]);

  return <motion.dd ref={ref} className="tnum">{rounded}</motion.dd>;
}

export default function Colophon() {
  return (
    <dl className="colophon">
      {STATS.map((s) => (
        <div key={s.label}>
          <dt className="label">{s.label}</dt>
          <Ticker to={s.value()} />
        </div>
      ))}
    </dl>
  );
}
