// Vercel function: POST /api/signin {"name": "…", "email": "…"} — see server/proxy.js.
import { handle } from "../server/proxy.js";

export default function handler(req, res) {
  return handle(req, res, process.env);
}
