// Vercel function: GET /api/watchmode?id=movie-155&region=US — see server/proxy.js.
import { handle } from "../server/proxy.js";

export default function handler(req, res) {
  return handle(req, res, process.env);
}
