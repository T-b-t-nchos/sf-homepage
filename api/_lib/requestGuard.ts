import { sendJson } from "./http.js";

function getAppOrigin() {
  const raw = process.env.APP_BASE_URL ?? process.env.DISCORD_REDIRECT_URI ?? "";
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function enforceCsrf(req: { headers?: Record<string, string | undefined> }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }) {
  const allowedOrigin = getAppOrigin();
  if (!allowedOrigin) {
    sendJson(res, 500, { error: "CSRF protection is not configured." });
    return false;
  }

  const origin = req.headers?.origin ?? "";
  const referer = req.headers?.referer ?? "";
  const originMatches = origin === allowedOrigin;
  const refererMatches = referer.startsWith(`${allowedOrigin}/`);

  if (!originMatches && !refererMatches) {
    sendJson(res, 403, { error: "CSRF validation failed." });
    return false;
  }

  return true;
}

export function enforceJson(req: { headers?: Record<string, string | undefined> }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }) {
  const contentType = req.headers?.["content-type"] ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    sendJson(res, 415, { error: "Unsupported media type." });
    return false;
  }
  return true;
}
