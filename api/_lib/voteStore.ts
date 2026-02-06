import crypto from "node:crypto";

const memoryVotes = new Set<string>();
let warnedMemoryFallback = false;

function hasKvConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function voteKey(eventId: string, userId: string) {
  const digest = crypto.createHash("sha256").update(`${eventId}:${userId}`).digest("hex");
  return `lt:vote:${eventId}:${digest}`;
}

function buildKvUrl(path: string) {
  const baseUrl = process.env.KV_REST_API_URL;
  if (!baseUrl) {
    throw new Error("KV_REST_API_URL is missing.");
  }
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path, normalized).toString();
}

async function kvRequest(path: string) {
  const token = process.env.KV_REST_API_TOKEN;
  if (!token) {
    throw new Error("KV_REST_API_TOKEN is missing.");
  }
  const response = await fetch(buildKvUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    redirect: "error",
  });
  if (!response.ok) {
    throw new Error(`KV request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as { result?: unknown };
}

export class VoteStoreUnavailableError extends Error {
  constructor(message = "Vote store unavailable.") {
    super(message);
    this.name = "VoteStoreUnavailableError";
  }
}

export async function reserveVoteSlot(eventId: string, userId: string) {
  const key = voteKey(eventId, userId);

  if (!hasKvConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new VoteStoreUnavailableError("Vote store is not configured.");
    }
    if (!warnedMemoryFallback) {
      warnedMemoryFallback = true;
      console.warn("[VoteStore] KV is not configured. Falling back to in-memory store.");
    }
    if (memoryVotes.has(key)) {
      return false;
    }
    memoryVotes.add(key);
    return true;
  }

  try {
    const data = await kvRequest(
      `set/${encodeURIComponent(key)}/${encodeURIComponent(Date.now().toString())}?NX=true`,
    );
    return data.result === "OK";
  } catch (error) {
    console.error(
      `[VoteStore] Failed to reserve vote slot: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    throw new VoteStoreUnavailableError("Vote store is temporarily unavailable.");
  }
}

export async function releaseVoteSlot(eventId: string, userId: string) {
  const key = voteKey(eventId, userId);

  if (!hasKvConfig()) {
    memoryVotes.delete(key);
    return;
  }

  try {
    await kvRequest(`del/${encodeURIComponent(key)}`);
  } catch (error) {
    console.error(
      `[VoteStore] Failed to release vote slot: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}
