import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * MASKED LINE REVEAL — 21st.dev "Text Components".
 *
 * Each line rises out of its own overflow-hidden mask with a 2° tilt, like
 * set type dropping into a forme. The heading's accessible name is the whole
 * sentence, set on the element itself — lines are never split into characters
 * and the text never lives only in aria-label.
 *
 * Backstop: motion and CSS both stop advancing in a throttled or background
 * tab, which would leave a heading invisible. After the animation should have
 * finished, `settled` switches every line to its final state with no motion.
 */
export default function Reveal({ as = "h2", lines, className = "", delay = 0, id }) {
  const Tag = as;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(() => setSettled(true), delay * 1000 + 1600);
    return () => clearTimeout(t);
  }, [inView, delay]);

  const done = reduced || settled;

  return (
    <Tag ref={ref} id={id} className={`reveal-head ${className}`}>
      {lines.map((line, i) => (
        <span className="mask" key={i}>
          <motion.span
            className="mask-in"
            initial={done ? false : { y: "115%", rotate: 2, opacity: 0 }}
            animate={done || inView ? { y: 0, rotate: 0, opacity: 1 } : undefined}
            transition={done ? { duration: 0 } : {
              duration: 1.15, delay: delay + i * 0.09, ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.span>
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
