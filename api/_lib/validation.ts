const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/i;
const DOMAIN_PATTERN = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/[^\s]*)?/i;

export function findForbiddenReason(value: string) {
  if (!value) {
    return null;
  }
  if (value.includes("@")) {
    return "mention";
  }
  if (URL_PATTERN.test(value) || DOMAIN_PATTERN.test(value)) {
    return "url";
  }
  return null;
}
