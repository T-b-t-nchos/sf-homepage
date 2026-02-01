import crypto from "node:crypto";
import { createStateCookie, isStrongSessionSecret } from "../_lib/session.js";
import { sendJson } from "../_lib/http.js";

export default function handler(req: { method?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !redirectUri || !sessionSecret) {
    return sendJson(res, 500, { error: "Missing OAuth configuration." });
  }
  if (!isStrongSessionSecret(sessionSecret)) {
    return sendJson(res, 500, { error: "Session secret is too weak." });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });

  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", createStateCookie(state, sessionSecret));
  res.setHeader("Location", `https://discord.com/api/oauth2/authorize?${params}`);
  res.end();
}
