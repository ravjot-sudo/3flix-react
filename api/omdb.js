// Vercel function: GET /api/omdb?i=tt0468569 — see server/proxy.js.
import { handle } from "../server/proxy.js";

export default function handler(req, res) {
  return handle(req, res, process.env);
}
