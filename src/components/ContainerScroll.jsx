import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import FilmGrid from "./FilmGrid.jsx";
import { FILMS } from "../data/films.js";

/**
 * CONTAINER SCROLL ANIMATION — 21st.dev Popular #2 (9.2k).
 *
 * The real library interface rises from a tilted plane to face the viewer.
 * It is the live <FilmGrid>, not a screenshot — so it can never drift out of
 * date with the actual product.
 *
 * The embedded grid is `inert`: it is a preview, and a keyboard user must not
 * be dropped into a fake copy of the UI. The real link sits outside it.
 */
const PREVIEW = FILMS.slice(0, 8);

export default function ContainerScroll() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const rotateX = useTransform(scrollYProgress, [0.1, 0.55], [22, 0]);
  const scale = useTransform(scrollYProgress, [0.1, 0.55], [0.86, 1]);
  const titleY = useTransform(scrollYProgress, [0.15, 0.5], [0, -80]);
  const titleOpacity = useTransform(scrollYProgress, [0.2, 0.5], [1, 0.15]);

  return (
    <section ref={ref} className="cscroll" aria-labelledby="cscroll-title">
      <div className="container">
        <motion.header className="cscroll-head"
          style={reduced ? undefined : { y: titleY, opacity: titleOpacity }}>
          <p className="folio">No. 01</p>
          <h2 id="cscroll-title" className="sec-title display-xl">The library,<br /><em>as it is.</em></h2>
        </motion.header>

        <div className="cscroll-stage">
          <motion.div className="cscroll-screen" inert
            style={reduced ? undefined : { rotateX, scale }}>
            <div className="cscroll-bezel" aria-hidden="true">
              <span /><span /><span />
            </div>
            <div className="cscroll-view">
              <FilmGrid films={PREVIEW} />
            </div>
          </motion.div>
        </div>

        <p className="cscroll-caption">
          <span className="label">24 titles · {FILMS.filter((f) => f.video).length} playable</span>
          <Link className="link-rule" to="/library">Open the library</Link>
        </p>
      </div>
    </section>
  );
}
