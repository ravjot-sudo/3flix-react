import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { handle } from "./server/proxy.js";

/**
 * In development the same server code that runs as Vercel functions answers
 * /api/*, reading TMDB_TOKEN and OMDB_KEY from .env.local through loadEnv.
 * Those names have no VITE_ prefix, so they stay in Node and never reach the
 * browser bundle.
 */
function apiRoutes(env) {
  const mount = (server) => {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith("/api/")) return next();
      handle(req, res, env);
    });
  };
  return { name: "3flix-api", configureServer: mount, configurePreviewServer: mount };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), apiRoutes(loadEnv(mode, process.cwd(), ""))],
}));
