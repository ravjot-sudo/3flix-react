import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { hasSupabase, supabase } from "../lib/supabase.js";
import { requestSignIn, signInError } from "../lib/signin.js";

/**
 * Auth provider — the mechanism behind the sign-in gate.
 *
 * Every page but the opening sits behind it (App.jsx). Signing in is two
 * steps: name + email, then a one-time code sent to that email. The server
 * turns away temporary inboxes before any code is sent (server/proxy.js).
 *
 * Two modes, one interface — so no component knows which is running:
 *   cloud  Supabase is configured: real accounts, codes by email, the
 *          session kept and refreshed by supabase-js, and the watchlist and
 *          progress saved to the account (see `cloud`, used in App.jsx)
 *   local  it isn't: the email is still checked, but the "session" is this
 *          browser's localStorage and no code is sent
 *
 * Interface: { mode, ready, user, isSignedIn, begin, verify, rename,
 *              signOut, cloud }
 *
 * Demonstrates: Context as the answer to prop drilling, useMemo to keep the
 * context value referentially stable, and useCallback for the actions.
 */
export function AuthProvider({ children }) {
  return hasSupabase ? <CloudAuth>{children}</CloudAuth> : <LocalAuth>{children}</LocalAuth>;
}

/* ---------- local: this browser only ------------------------------------ */
function LocalAuth({ children }) {
  const [user, setUser] = useLocalStorage("3flix:user", null);

  const begin = useCallback(async ({ name, email }) => {
    const res = await requestSignIn(name, email);
    // The server can send codes but this build can't check them.
    if (res.mode !== "local") throw signInError("setup");
    setUser({ name: res.name, email: res.email, since: Date.now() });
    return { step: "done" };
  }, [setUser]);

  const verify = useCallback(async () => { throw signInError("setup"); }, []);
  const rename = useCallback(async (name) => setUser((u) => (u ? { ...u, name } : u)), [setUser]);
  const signOut = useCallback(async () => setUser(null), [setUser]);

  // A profile saved before email was required doesn't count as signed in.
  const current = user?.email ? user : null;
  const value = useMemo(
    () => ({ mode: "local", ready: true, user: current, isSignedIn: Boolean(current), begin, verify, rename, signOut, cloud: null }),
    [current, begin, verify, rename, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------- cloud: Supabase accounts ------------------------------------- */
function CloudAuth({ children }) {
  const [session, setSession] = useState({ ready: false, user: null });

  useEffect(() => {
    let alive = true;
    let stop = () => {};
    supabase().then(
      (sb) => {
        if (!alive) return;
        // Fires at once with any stored session (INITIAL_SESSION), then on
        // every sign-in, sign-out, token refresh and profile change.
        const { data } = sb.auth.onAuthStateChange((_event, s) => setSession({ ready: true, user: s?.user ?? null }));
        stop = () => data.subscription.unsubscribe();
      },
      () => { if (alive) setSession({ ready: true, user: null }); },
    );
    return () => { alive = false; stop(); };
  }, []);

  const begin = useCallback(async ({ name, email }) => {
    const res = await requestSignIn(name, email);
    if (res.mode !== "code") throw signInError("setup");
    return { step: "code", email: res.email };
  }, []);

  const verify = useCallback(async ({ email, code, name }) => {
    const sb = await supabase();
    const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      throw signInError(error.status === 429 ? "wait" : error.status >= 400 && error.status < 500 ? "code" : "service");
    }
    // A new account got its name when the server created it; this covers
    // any account that somehow has none.
    if (!data.user?.user_metadata?.name && name) await sb.auth.updateUser({ data: { name } });
  }, []);

  const rename = useCallback(async (name) => {
    const { error } = await (await supabase()).auth.updateUser({ data: { name } });
    if (error) throw error;
  }, []);

  // "local" scope: signing out here doesn't sign out the account's other devices.
  const signOut = useCallback(async () => {
    await (await supabase()).auth.signOut({ scope: "local" });
  }, []);

  // The watchlist and progress, saved in the account's metadata (App.jsx).
  const save = useCallback(async (patch) => {
    await (await supabase()).auth.updateUser({ data: patch });
  }, []);
  const load = useCallback(async () => {
    const { data } = await (await supabase()).auth.getUser();
    return data.user?.user_metadata ?? {};
  }, []);

  const raw = session.user;
  const id = raw?.id ?? null;
  const email = raw?.email ?? "";
  const name = raw?.user_metadata?.name ?? "";
  const since = raw?.created_at ?? null;

  const user = useMemo(
    () => (id ? { id, email, name: name || email.split("@")[0], since } : null),
    [id, email, name, since],
  );
  const cloud = useMemo(() => (id ? { id, load, save } : null), [id, load, save]);

  const value = useMemo(
    () => ({ mode: "cloud", ready: session.ready, user, isSignedIn: Boolean(user), begin, verify, rename, signOut, cloud }),
    [session.ready, user, begin, verify, rename, signOut, cloud],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
