import { clearStateCookie, createSessionCookie, isStrongSessionSecret, readStateCookie, SESSION_MAX_AGE_SECONDS, type SessionPayload } from "../_lib/session.js";
import { sendJson } from "../_lib/http.js";

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
};

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal, redirect: "error" });
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(
  req: { method?: string; url?: string; headers?: { cookie?: string } },
  res: { statusCode: number; setHeader: (name: string, value: string | string[]) => void; end: (body?: string) => void },
) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !sessionSecret) {
    return sendJson(res, 500, { error: "Missing OAuth configuration." });
  }
  if (!isStrongSessionSecret(sessionSecret)) {
    return sendJson(res, 500, { error: "Session secret is too weak." });
  }

  const url = new URL(req.url ?? "", "http://localhost");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return sendJson(res, 400, { error: `OAuth error: ${error}` });
  }

  const storedState = readStateCookie(req, sessionSecret);
  if (!code || !state || !storedState || state !== storedState) {
    return sendJson(res, 400, { error: "Invalid OAuth state." });
  }

  let appBaseUrl: string;
  try {
    if (process.env.APP_BASE_URL) {
      const parsed = new URL(process.env.APP_BASE_URL);
      const basePath = parsed.pathname.replace(/\/$/, "");
      appBaseUrl = `${parsed.origin}${basePath === "/" ? "" : basePath}`;
    } else {
      const parsed = new URL(redirectUri);
      const callbackSuffix = "/api/auth/callback";
      let basePath = parsed.pathname;
      if (basePath.endsWith(callbackSuffix)) {
        basePath = basePath.slice(0, -callbackSuffix.length);
      } else {
        basePath = "";
      }
      appBaseUrl = `${parsed.origin}${basePath}`;
    }
  } catch {
    return sendJson(res, 500, { error: "Invalid base URL configuration." });
  }

  let tokenRes: Awaited<ReturnType<typeof fetch>>;
  try {
    tokenRes = await fetchWithTimeout(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      },
      5000,
    );
  } catch (error) {
    console.error(`[Auth] Token exchange failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return sendJson(res, 502, { error: "Failed to exchange OAuth token." });
  }

  if (!tokenRes.ok) {
    return sendJson(res, 502, { error: "Failed to exchange OAuth token." });
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return sendJson(res, 502, { error: "Missing access token." });
  }

  let userRes: Awaited<ReturnType<typeof fetch>>;
  try {
    userRes = await fetchWithTimeout(
      "https://discord.com/api/users/@me",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
      5000,
    );
  } catch (error) {
    console.error(`[Auth] User fetch failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return sendJson(res, 502, { error: "Failed to fetch Discord user." });
  }

  if (!userRes.ok) {
    return sendJson(res, 502, { error: "Failed to fetch Discord user." });
  }

  const user = (await userRes.json()) as DiscordUser;
  if (user.bot) {
    return sendJson(res, 403, { error: "Bot accounts are not allowed." });
  }
  const now = Math.floor(Date.now() / 1000);
  const session: SessionPayload = {
    sub: user.id,
    username: user.username,
    globalName: user.global_name ?? null,
    avatar: user.avatar ?? null,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", [createSessionCookie(session, sessionSecret), clearStateCookie()]);
  res.setHeader("Location", `${appBaseUrl}/events/lt-1/register`);
  res.end();
}
