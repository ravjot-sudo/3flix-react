/**
 * Supabase — accounts, one-time email codes, and the synced watchlist.
 *
 * Optional. With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY unset, visitors
 * sign in on their own device instead (AuthContext's "local" mode). Both
 * values are PUBLIC by design — the anon (publishable) key can only do what
 * the project's settings allow — so the VITE_ prefix is right for them. The
 * secret key never comes here: it lives on the server (server/proxy.js).
 *
 * The client library is loaded on demand, so a build without Supabase
 * ships none of it.
 */
const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const hasSupabase = Boolean(url && key);

let client = null;

/** The one shared client, created on first use. */
export function supabase() {
  if (!client) {
    client = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "3flix:session" } }));
    client.catch(() => { client = null; });   // a failed load is retried, not cached
  }
  return client;
}
