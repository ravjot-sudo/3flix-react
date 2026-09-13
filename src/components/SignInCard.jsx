import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { nameOk, signInError } from "../lib/signin.js";

/**
 * The sign-in form, in two steps:
 *   1. name + email → the server checks the address (no temporary inboxes)
 *      and emails a one-time code
 *   2. the code → verified, and the visitor is in
 * Without Supabase configured there is no step 2 (see AuthContext).
 *
 * Nothing here navigates: signing in changes the auth state, and whatever
 * rendered the card (the home-page gate, or /signin) re-renders past it.
 *
 * Demonstrates: CONTROLLED COMPONENTS, a multi-step form, errors placed next
 * to the field they are about (and announced), and a resend cooldown timer.
 */
const STEP = {
  initial: { opacity: 0, transform: "translateX(18px)" },
  animate: { opacity: 1, transform: "translateX(0px)", transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transform: "translateX(-18px)", transition: { duration: 0.16 } },
};
const RESEND_AFTER = 60;   // Supabase allows one code per address a minute

export default function SignInCard({ titleId, as: Heading = "h2", focusOnMount = false }) {
  const { mode, begin, verify } = useAuth();
  const ids = { name: useId(), email: useId(), code: useId(), error: useId() };
  const [step, setStep] = useState("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const nameField = useRef(null);
  const codeField = useRef(null);

  // Count the resend cooldown down, one second at a time.
  useEffect(() => {
    if (!wait) return undefined;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // Put the cursor where the next thing to type goes.
  useEffect(() => {
    if (step === "code") codeField.current?.focus({ preventScroll: true });
    else if (focusOnMount) nameField.current?.focus({ preventScroll: true });
  }, [step, focusOnMount]);

  async function send(event) {
    event?.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!nameOk(cleanName)) { setError(signInError("name")); return; }
    if (!email.trim()) { setError(signInError("format")); return; }
    setBusy(true);
    setError(null);
    try {
      const next = await begin({ name: cleanName, email: email.trim() });
      if (next.step === "code") {
        setSentTo(next.email);
        setDevOtp(next.devOtp ?? null);
        setCode(next.devOtp ?? "");
        setStep("code");
        setWait(RESEND_AFTER);
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function check(event) {
    event.preventDefault();
    const digits = code.replace(/\D/g, "");
    if (digits.length < 6) { setError(signInError("code")); return; }
    setBusy(true);
    setError(null);
    try {
      await verify({ email: sentTo, code: digits, name: name.trim() });
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
        <span className="label">{step === "code" ? "Step 2 of 2" : mode === "cloud" ? "Step 1 of 2" : "Members"}</span>
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {step === "details" ? (
          <motion.form key="details" className="signin-form" onSubmit={send} noValidate {...STEP}>
            <Heading id={titleId} className="signin-title">Sign in to <em>start watching.</em></Heading>
            <p className="signin-lede">
              {mode === "cloud"
                ? "Your name and email — we’ll email you a sign-in code. No password to remember."
                : "Your name and email, and you’re in."}
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
              {busy ? "Checking…" : mode === "cloud" ? "Email me a code" : "Continue"}
            </button>
            <p className="signin-fine">
              Temporary email addresses aren’t accepted. Your email is used only to sign you in.
            </p>
          </motion.form>
        ) : (
          <motion.form key="code" className="signin-form" onSubmit={check} noValidate {...STEP}>
            <Heading id={titleId} className="signin-title">Check <em>your inbox.</em></Heading>
            <p className="signin-lede">
              We sent a code to <strong>{sentTo}</strong>. It can take a minute to arrive — look in spam too.
            </p>
            {devOtp && (
              <p className="signin-fine" style={{ color: "var(--amber)", marginBottom: "var(--s-3)", fontSize: "0.875rem" }}>
                One-time code: <strong style={{ letterSpacing: "2px" }}>{devOtp}</strong>
              </p>
            )}

            <div className="field">
              <label className="label" htmlFor={ids.code}>Code from the email</label>
              <input
                ref={codeField}
                id={ids.code}
                className="signin-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                aria-invalid={errorFor("code") ? "true" : undefined}
                aria-describedby={describe("code")}
              />
              {problem("code")}
            </div>

            {problem("form")}
            <button type="submit" className="btn btn-primary btn-go signin-go" disabled={busy}>
              {busy ? "Checking…" : "Verify and enter"}
            </button>
            <div className="signin-row">
              <button type="button" className="signin-link" onClick={() => send()} disabled={busy || wait > 0}>
                {wait > 0 ? `New code in ${wait}s` : "Send a new code"}
              </button>
              <button
                type="button"
                className="signin-link"
                onClick={() => { setStep("details"); setError(null); }}
                disabled={busy}
              >
                Use a different email
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
