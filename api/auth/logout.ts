import { clearSessionCookie } from "../_lib/session.js";
import { sendJson } from "../_lib/http.js";
import { enforceCsrf } from "../_lib/requestGuard.js";

export default function handler(
  req: { method?: string; headers?: Record<string, string | undefined> },
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void },
) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }
  if (!enforceCsrf(req, res)) {
    return;
  }

  res.setHeader("Set-Cookie", clearSessionCookie());
  return sendJson(res, 200, { ok: true });
}
