import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import GateWall from "./GateWall.jsx";
import SignInCard from "./SignInCard.jsx";

/**
 * The sign-in that pops up the moment the opening ends (Home.jsx).
 *
 * A true modal: it is portalled to <body>, and while it is up the app behind
 * it is `inert` — nothing there can be clicked, focused or read — and the
 * page stops scrolling. It has no close button because it is the way in;
 * signing in unmounts it, and the page carries on from the end of the intro.
 */
export default function SignInGate() {
  const titleId = useId();

  useEffect(() => {
    const app = document.getElementById("root");
    const html = document.documentElement;
    app?.setAttribute("inert", "");
    html.classList.add("is-gated");
    return () => {
      app?.removeAttribute("inert");
      html.classList.remove("is-gated");
    };
  }, []);

  return createPortal(
    <motion.div
      className="gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
    >
      <GateWall />
      <motion.div
        className="gate-pop"
        initial={{ opacity: 0, transform: "translateY(28px) scale(0.94)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.24, delay: 0.12 }}
      >
        <SignInCard titleId={titleId} focusOnMount />
      </motion.div>
    </motion.div>,
    document.body,
  );
}
