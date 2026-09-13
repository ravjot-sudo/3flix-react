/**
 * Signing in: ask the server to check the address is real
 * (server/proxy.js, POST /api/signin). Every refusal comes back as a
 * `reason`, which becomes a sentence here — and a `field`, so the form can
 * put the message next to the input it is about.
 */
const MESSAGES = {
  name: ["name", "Enter your name — at least two characters."],
  format: ["email", "That doesn’t look like an email address."],
  disposable: ["email", "Temporary email addresses aren’t accepted. Use an inbox you’ll keep."],
  "no-mail": ["email", "That domain can’t receive email. Check the spelling."],
  network: ["form", "Couldn’t reach 3Flix. Check your connection and try again."],
  setup: ["form", "Sign-in isn’t answering properly right now. Try again in a minute."],
};

export function signInError(reason) {
  const [field, text] = MESSAGES[reason] ?? MESSAGES.service;
  return Object.assign(new Error(text), { reason, field });
}

export const nameOk = (n) => n.length >= 2 && n.length <= 40;

/** → { mode: "local", email, name } */
export async function requestSignIn(name, email) {
  let res;
  try {
    res = await fetch("/api/signin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
  } catch {
    throw signInError("network");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw signInError(body.reason ?? "service");
  return body;
}

/* ---------- remembered visitor -----------------------------------------
 * The last verified name and email, so the form greets return visitors
 * prefilled. The signed-in session itself lives in "3flix:user"
 * (AuthContext); this is only the form's memory, kept even after sign-out. */
const LAST_LOGIN = "3flix:last-login";

export function loadLastLogin() {
  try {
    const data = JSON.parse(localStorage.getItem(LAST_LOGIN) ?? "null");
    if (data && typeof data.name === "string" && typeof data.email === "string") return data;
  } catch { /* private mode or a corrupt value: start blank */ }
  return null;
}

export function saveLastLogin({ name, email }) {
  try {
    localStorage.setItem(LAST_LOGIN, JSON.stringify({ name, email }));
  } catch { /* storage unavailable: simply not remembered next time */ }
}
