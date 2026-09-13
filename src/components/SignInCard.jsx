import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { loadLastLogin, nameOk, signInError } from "../lib/signin.js";

/**
 * The sign-in form, in one step:
 *   name + email → the server checks the address is real (no temporary
 *   inboxes, a domain that can actually receive mail) and the visitor is in,
 *   remembered on this device. No password, no code.
 *
 * Nothing here navigates: signing in changes the auth state, and whatever
 * rendered the card (the home-page gate, or /signin) re-renders past it.
 *
 * Demonstrates: CONTROLLED COMPONENTS and errors placed next to the field
 * they are about (and announced).
 */
const STEP = {
  initial: { opacity: 0, transform: "translateX(18px)" },
  animate: { opacity: 1, transform: "translateX(0px)", transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transform: "translateX(-18px)", transition: { duration: 0.16 } },
};

export default function SignInCard({ titleId, as: Heading = "h2", focusOnMount = false }) {
  const { begin } = useAuth();
  const ids = { name: useId(), email: useId(), error: useId() };
  // Greet return visitors: the last verified name and email are prefilled.
  const [name, setName] = useState(() => loadLastLogin()?.name ?? "");
  const [email, setEmail] = useState(() => loadLastLogin()?.email ?? "");

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const nameField = useRef(null);

  // Put the cursor where the next thing to type goes.
  useEffect(() => {
    if (focusOnMount) nameField.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  async function send(event) {
    event?.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!nameOk(cleanName)) { setError(signInError("name")); return; }
    if (!email.trim()) { setError(signInError("format")); return; }
    setBusy(true);
    setError(null);
    try {
      await begin({ name: cleanName, email: email.trim() });
      // Signed in: the parent re-renders past this card on its own.
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const errorFor = (field) => (error?.field === field ? error.message : null);
  const describe = (field) => (errorFor(field) ? ids.error : undefined);
  const problem = (field) =>
    errorFor(field) && <p className="field-error" id={ids.error} role="alert">{errorFor(field)}</p>;

  return (
    <div className="signin-card">
      <p className="signin-brand">
        <span className="brand-word">3<span className="brand-flix">Flix</span></span>
        <span className="label">Members</span>
      </p>

      <motion.form className="signin-form" onSubmit={send} noValidate {...STEP}>
        <Heading id={titleId} className="signin-title">Sign in to <em>start watching.</em></Heading>
        <p className="signin-lede">
          Your name and a real email address — no password, no code. We check the address is genuine and you’re in.
        </p>

        <div className="field">
          <label className="label" htmlFor={ids.name}>Your name</label>
          <input
            ref={nameField}
            id={ids.name}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="name"
            aria-invalid={errorFor("name") ? "true" : undefined}
            aria-describedby={describe("name")}
          />
          {problem("name")}
        </div>

        <div className="field">
          <label className="label" htmlFor={ids.email}>Email</label>
          <input
            id={ids.email}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            spellCheck={false}
            aria-invalid={errorFor("email") ? "true" : undefined}
            aria-describedby={describe("email")}
          />
          {problem("email")}
        </div>

        {problem("form")}
        <button type="submit" className="btn btn-primary btn-go signin-go" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </button>
        <p className="signin-fine">
          Temporary email addresses aren’t accepted. Your email is used only to sign you in on this device.
        </p>
      </motion.form>
    </div>
  );
}
