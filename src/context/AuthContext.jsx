import { useCallback, useMemo } from "react";
import { AuthContext } from "./authContext.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { requestSignIn, saveLastLogin, signInError } from "../lib/signin.js";

/**
 * Auth provider — the mechanism behind the sign-in gate.
 *
 * Signing in is one step: a name plus a real email address. The server
 * checks the address is genuine (correct format, no temporary inboxes, and
 * a domain that can actually receive mail — server/proxy.js) and the
 * profile is then remembered in this browser's localStorage, so the visitor
 * stays signed in across visits. No passwords, no codes, no accounts.
 *
 * Interface: { mode, ready, user, isSignedIn, begin, rename, signOut }
 *
 * Demonstrates: Context as the answer to prop drilling, useMemo to keep the
 * context value referentially stable, and useCallback for the actions.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage("3flix:user", null);

  const begin = useCallback(async ({ name, email }) => {
    const res = await requestSignIn(name, email);
    // The server only ever answers local now: the address checked out, so
    // sign in on this device and remember who it was for next time.
    if (res.mode !== "local") throw signInError("setup");
    setUser({ name: res.name, email: res.email, since: Date.now() });
    saveLastLogin({ name: res.name, email: res.email });
    return { step: "done" };
  }, [setUser]);

  const rename = useCallback(async (name) => setUser((u) => (u ? { ...u, name } : u)), [setUser]);
  // Signing out clears the session but not the remembered name and email,
  // so the form still greets the next visitor to this browser by name.
  const signOut = useCallback(async () => setUser(null), [setUser]);

  // A profile saved before email was required doesn't count as signed in.
  const current = user?.email ? user : null;
  const value = useMemo(
    () => ({ mode: "local", ready: true, user: current, isSignedIn: Boolean(current), begin, rename, signOut }),
    [current, begin, rename, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
