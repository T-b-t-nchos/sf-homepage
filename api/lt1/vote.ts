import { isStrongSessionSecret, readSession } from "../_lib/session.js";
import { PayloadTooLargeError, readJson, sendJson } from "../_lib/http.js";
import { checkRateLimit } from "../_lib/rateLimit.js";
import { enforceCsrf, enforceJson } from "../_lib/requestGuard.js";
import { serializeCookie, parseCookies } from "../_lib/cookies.js";
import { lt1Presenters } from "../../shared/lt1Presenters.js";

type VotePayload = {
    presenterId: string;
    presenterName?: string;
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
    if (!sessionSecret || !isStrongSessionSecret(sessionSecret)) {
        return sendJson(res, 500, { error: "Server configuration error." });
    }

    const session = readSession(req, sessionSecret);
    if (!session) {
        return sendJson(res, 401, { error: "Sign in with Discord first." });
    }

    // Check Cookie for previous vote
    const cookies = parseCookies(req.headers?.cookie);
    if (cookies["lt1_voted"]) {
        return sendJson(res, 409, { error: "You have already voted." });
    }

    // Rate Limit (Strict)
    const userKey = `lt1:vote:${session.sub}`;
    const userLimit = checkRateLimit(userKey, { limit: 1, windowMs: 24 * 60 * 60 * 1000 }); // 1 vote per day (effectively once)
    if (!userLimit.allowed) {
        return sendJson(res, 429, { error: "You have already voted." });
    }

    let body: VotePayload;
    try {
        body = await readJson<VotePayload>(req, { maxBytes: 1024 });
    } catch (error) {
        if (error instanceof PayloadTooLargeError) {
            return sendJson(res, 413, { error: "Payload too large." });
        }
        return sendJson(res, 400, { error: "Invalid JSON." });
    }

    const presenterId = (body.presenterId ?? "").trim();
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
    if (presenter.status !== "active") {
        return sendJson(res, 400, { error: "Presenter is not available." });
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

    const embed = {
        title: "LT Vote",
        color: 0xF59E0B, // Amber/Gold
        fields: [
            { name: "Voted For", value: safePresenter },
            { name: "ID", value: safePresenterId },
            { name: "Voter", value: `${safeDisplayName}\nID: ${session.sub}` },
        ],
        timestamp: new Date().toISOString(),
    };

    console.log(`[LT1] Vote: ${safeDisplayName} -> ${safePresenter}`);

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
            console.error(`[LT1] Vote webhook failed: ${response.status}`);
            return sendJson(res, 502, { error: "Failed to record vote." });
        }
    } catch (err) {
        console.error(`[LT1] Vote webhook error: ${err}`);
        return sendJson(res, 502, { error: "Failed to record vote." });
    } finally {
        clearTimeout(timeout);
    }

    // Set Cookie to prevent re-vote
    res.setHeader("Set-Cookie", serializeCookie("lt1_voted", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    }));

    return sendJson(res, 200, { ok: true });
}
