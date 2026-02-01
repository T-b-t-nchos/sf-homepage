import crypto from "node:crypto";
import { parseCookies, serializeCookie } from "./cookies.js";

export type SessionPayload = {
  sub: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  exp: number;
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const STATE_MAX_AGE_SECONDS = 60 * 5;
const MIN_SESSION_SECRET_BYTES = 32;

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(value: string, secret: string) {
  return base64UrlEncode(crypto.createHmac("sha256", secret).update(value).digest());
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function isSecureCookie() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  const baseUrl = process.env.APP_BASE_URL ?? "";
  return baseUrl.startsWith("https://");
}

function getSessionCookieName() {
  return isSecureCookie() ? "__Host-lt_session" : "lt_session";
}

function getStateCookieName() {
  return isSecureCookie() ? "__Host-lt_oauth_state" : "lt_oauth_state";
}

export function isStrongSessionSecret(secret: string) {
  return Buffer.byteLength(secret, "utf8") >= MIN_SESSION_SECRET_BYTES;
}

function assertStrongSessionSecret(secret: string) {
  if (!isStrongSessionSecret(secret)) {
    throw new Error("SESSION_SECRET too weak: require >= 32 bytes");
  }
}

function createToken(payload: SessionPayload, secret: string) {
  const data = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`v1.${data}`, secret);
  return `v1.${data}.${signature}`;
}

function verifyToken(token: string, secret: string): SessionPayload | null {
  const [version, data, signature] = token.split(".");
  if (version !== "v1" || !data || !signature) {
    return null;
  }

  const expected = sign(`${version}.${data}`, secret);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(data)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createStateCookie(state: string, secret: string) {
  assertStrongSessionSecret(secret);
  const signature = sign(`state.${state}`, secret);
  const value = `v1.${state}.${signature}`;
  return serializeCookie(getStateCookieName(), value, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "Lax",
    path: "/",
    maxAge: STATE_MAX_AGE_SECONDS,
  });
}

export function clearStateCookie() {
  return serializeCookie(getStateCookieName(), "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

export function readStateCookie(req: { headers?: { cookie?: string } }, secret: string) {
  assertStrongSessionSecret(secret);
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[getStateCookieName()];
  if (!token) {
    return null;
  }
  const [version, state, signature] = token.split(".");
  if (version !== "v1" || !state || !signature) {
    return null;
  }
  const expected = sign(`state.${state}`, secret);
  if (!safeEqual(signature, expected)) {
    return null;
  }
  return state;
}

export function createSessionCookie(payload: SessionPayload, secret: string) {
  assertStrongSessionSecret(secret);
  return serializeCookie(getSessionCookieName(), createToken(payload, secret), {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie() {
  return serializeCookie(getSessionCookieName(), "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

export function readSession(req: { headers?: { cookie?: string } }, secret: string) {
  assertStrongSessionSecret(secret);
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[getSessionCookieName()];
  if (!token) {
    return null;
  }
  return verifyToken(token, secret);
}
