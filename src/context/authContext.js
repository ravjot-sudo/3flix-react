import { createContext } from "react";

/**
 * The context object lives in its own module.
 *
 * A file that exports both components and plain values breaks Vite's Fast
 * Refresh, which can only reload a module when everything in it is a
 * component. Splitting it is the standard fix.
 */
export const AuthContext = createContext(null);
