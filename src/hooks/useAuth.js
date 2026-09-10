import { useContext } from "react";
import { AuthContext } from "../context/authContext.js";

/**
 * CUSTOM HOOK — read the auth context.
 *
 * Wrapping useContext means components never import the context object, and
 * we get one clear error instead of a confusing `null` if the provider is
 * missing above them.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
