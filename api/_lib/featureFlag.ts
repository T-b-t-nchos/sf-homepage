import { sendJson } from "./http.js";

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function isFeatureEnabled(flagName: string, defaultValue = false) {
  const normalized = normalize(process.env[flagName]);
  if (!normalized) {
    return defaultValue;
  }
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function enforceFeatureEnabled(
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void },
  flagName: string,
  defaultValue = false,
) {
  if (!isFeatureEnabled(flagName, defaultValue)) {
    sendJson(res, 404, { error: "Not found." });
    return false;
  }
  return true;
}
