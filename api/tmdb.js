// Vercel function: GET /api/tmdb?path=/discover/movie&… — see server/proxy.js.
import { handle } from "../server/proxy.js";

export default function handler(req, res) {
  return handle(req, res, process.env);
}
