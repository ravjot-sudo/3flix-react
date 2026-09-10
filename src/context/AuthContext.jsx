import { useCallback, useMemo } from "react";
import { AuthContext } from "./authContext.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

/**
 * Auth provider — the mechanism behind protected routes.
 *
 * Demonstrates: Context as the answer to prop drilling, useMemo to keep the
 * context value referentially stable, and useCallback for the actions.
 *
 * This is a coursework demo, not real authentication: any name signs you in
 * and the "session" is a string in localStorage. Nothing is verified.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage("3flix:user", null);

  const signIn = useCallback((name) => setUser({ name, since: Date.now() }), [setUser]);
  const signOut = useCallback(() => setUser(null), [setUser]);

  // Without useMemo this object is a new reference on every render, so every
  // consumer would re-render even when nothing actually changed.
  const value = useMemo(
    () => ({ user, isSignedIn: Boolean(user), signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
