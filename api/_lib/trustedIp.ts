import { isIP } from "node:net";
import { isFeatureEnabled } from "./featureFlag.js";

const TRUST_PROXY_ENABLED = isFeatureEnabled("TRUST_PROXY", false);
const TRUSTED_PROXY_PROVIDER = (process.env.TRUSTED_PROXY_PROVIDER ?? "").trim().toLowerCase();

function parseIpCandidate(raw: string) {
  const first = raw.split(",")[0]?.trim() ?? "";
  if (!first) {
    return "";
  }
  const withoutPort = first.match(/^\d+\.\d+\.\d+\.\d+:\d+$/) ? first.split(":")[0] ?? "" : first;
  return isIP(withoutPort) ? withoutPort : "";
}

export function getTrustedIp(headers?: Record<string, string | undefined>) {
  if (!TRUST_PROXY_ENABLED) {
    return "";
  }
  const normalizedHeaders = headers ?? {};

  if (TRUSTED_PROXY_PROVIDER === "vercel") {
    // Only trust forwarding headers if request came through Vercel edge.
    if (!normalizedHeaders["x-vercel-id"]) {
      return "";
    }
    return parseIpCandidate(
      normalizedHeaders["x-vercel-forwarded-for"] ?? normalizedHeaders["x-forwarded-for"] ?? "",
    );
  }

  if (TRUSTED_PROXY_PROVIDER === "cloudflare") {
    // Only trust CF headers if request came through Cloudflare.
    if (!normalizedHeaders["cf-ray"]) {
      return "";
    }
    return parseIpCandidate(normalizedHeaders["cf-connecting-ip"] ?? "");
  }

  return "";
}
