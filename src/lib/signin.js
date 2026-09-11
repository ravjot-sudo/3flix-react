/**
 * Step one of signing in: ask the server to check the address and send a
 * code (server/proxy.js, POST /api/signin). Every refusal comes back as a
 * `reason`, which becomes a sentence here — and a `field`, so the form can
 * put the message next to the input it is about.
 */
const MESSAGES = {
  name: ["name", "Enter your name — at least two characters."],
  format: ["email", "That doesn’t look like an email address."],
  disposable: ["email", "Temporary email addresses aren’t accepted. Use an inbox you’ll keep."],
  "no-mail": ["email", "That domain can’t receive email. Check the spelling."],
  wait: ["form", "A code was sent a moment ago. Wait a minute, then ask for another."],
  send: ["form", "The code couldn’t be sent just now. Try again in a minute."],
  service: ["form", "Sign-in is having trouble right now. Try again in a minute."],
  network: ["form", "Couldn’t reach 3Flix. Check your connection and try again."],
  code: ["code", "That code is wrong or has expired. Check the newest email, or send a new code."],
  setup: ["form", "Sign-in is only half set up on this site, so no code can be sent."],
};

export function signInError(reason) {
  const [field, text] = MESSAGES[reason] ?? MESSAGES.service;
  return Object.assign(new Error(text), { reason, field });
}

export const nameOk = (n) => n.length >= 2 && n.length <= 40;

/** → { mode: "code", email } or { mode: "local", email, name } */
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
