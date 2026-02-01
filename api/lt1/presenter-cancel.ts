import { isStrongSessionSecret, readSession } from "../_lib/session.js";
import { PayloadTooLargeError, readJson, sendJson } from "../_lib/http.js";
import { checkRateLimit } from "../_lib/rateLimit.js";
import { enforceCsrf, enforceJson } from "../_lib/requestGuard.js";
import { lt1Presenters } from "../../shared/lt1Presenters.js";

type CancelPayload = {
  presenterId: string;
  reason?: string;
};

const sanitizeLog = (value: string) => value.replace(/[\x00-\x1F\x7F]/g, "");
const presentersById = new Map(lt1Presenters.map((presenter) => [presenter.id, presenter]));

function validateWebhookUrl(raw: string) {
  const parsed = new URL(raw);
  const allowedHosts = new Set(["discord.com", "canary.discord.com", "ptb.discord.com"]);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) {
    throw new Error("Invalid webhook host/protocol");
  }
  return parsed;
}

export default async function handler(
  req: { method?: string; headers?: Record<string, string | undefined> } & AsyncIterable<Uint8Array>,
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void },
) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }
  if (!enforceCsrf(req, res)) {
    return;
  }
  if (!enforceJson(req, res)) {
    return;
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
    return sendJson(res, 401, { error: "Sign in with Discord first." });
  }

  const userKey = `lt1:presenter-cancel:${session.sub}`;
  const userLimit = checkRateLimit(userKey, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!userLimit.allowed) {
    res.setHeader("Retry-After", Math.ceil(userLimit.retryAfterMs / 1000).toString());
    return sendJson(res, 429, { error: "Rate limit exceeded." });
  }

  let body: CancelPayload;
  try {
    body = await readJson<CancelPayload>(req, { maxBytes: 2048 });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return sendJson(res, 413, { error: "Payload too large." });
    }
    return sendJson(res, 400, { error: "Invalid JSON." });
  }

  const presenterId = (body.presenterId ?? "").trim();
  const reason = (body.reason ?? "").trim();
  if (!presenterId) {
    return sendJson(res, 400, { error: "Presenter information is missing." });
  }
  if (presenterId.length > 50) {
    return sendJson(res, 400, { error: "Invalid data format." });
  }

  const presenter = presentersById.get(presenterId);
  if (!presenter) {
    return sendJson(res, 400, { error: "Unknown presenter." });
  }

  // Permission Check: Admin or Self-service
  const adminIds = (process.env.ADMIN_DISCORD_IDS ?? "").split(",").map(id => id.trim());
  const isUserAdmin = adminIds.includes(session.sub);
  const isUserPresenter = presenter.discordId === session.sub;

  if (!isUserAdmin && !isUserPresenter) {
    return sendJson(res, 403, { error: "You do not have permission to cancel this presenter." });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return sendJson(res, 500, { error: "Webhook is not configured." });
  }
  let parsedWebhookUrl: URL;
  try {
    parsedWebhookUrl = validateWebhookUrl(webhookUrl);
  } catch {
    return sendJson(res, 500, { error: "Invalid webhook configuration." });
  }

  const displayName = session.globalName
    ? `${session.globalName} (${session.username})`
    : session.username;
  const safeDisplayName = sanitizeLog(displayName);
  const safePresenter = sanitizeLog(presenter.name);
  const safePresenterId = sanitizeLog(presenter.id);
  const safeReason = sanitizeLog(reason || "N/A");

  const embed = {
    title: "LT Presenter Cancelled",
    color: 0xEF4444,
    fields: [
      { name: "Presenter", value: safePresenter },
      { name: "ID", value: safePresenterId },
      { name: "Reason", value: safeReason },
      { name: "Cancelled by", value: `${safeDisplayName}\nID: ${session.sub}` },
    ],
    timestamp: new Date().toISOString(),
  };

  console.log(`[LT1] Presenter cancelled: ${safePresenter} (${safePresenterId}) by ${safeDisplayName}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(parsedWebhookUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "error",
      signal: controller.signal,
      body: JSON.stringify({
        embeds: [embed],
        allowed_mentions: { parse: [] },
      }),
    });
    if (!response.ok) {
      console.error(`[LT1] Presenter cancel webhook failed: ${response.status}`);
      return sendJson(res, 502, { error: "Failed to send cancel notice." });
    }
  } catch (error) {
    console.error(`[LT1] Presenter cancel webhook error: ${error instanceof Error ? error.message : "unknown error"}`);
    return sendJson(res, 502, { error: "Failed to send cancel notice." });
  } finally {
    clearTimeout(timeout);
  }

  return sendJson(res, 200, { ok: true });
}
