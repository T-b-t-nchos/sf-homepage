import { isStrongSessionSecret, readSession } from "../_lib/session.js";
import { sendJson } from "../_lib/http.js";

export default function handler(
  req: { method?: string; headers?: { cookie?: string } },
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void },
) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return sendJson(res, 500, { error: "Missing session secret." });
  }
  if (!isStrongSessionSecret(sessionSecret)) {
    return sendJson(res, 500, { error: "Session secret is too weak." });
  }

  const session = readSession(req, sessionSecret);
  if (!session) {
    return sendJson(res, 401, { error: "Not signed in." });
  }

  return sendJson(res, 200, {
    user: {
      id: session.sub,
      username: session.username,
      globalName: session.globalName ?? null,
      avatar: session.avatar ?? null,
    },
  });
}
