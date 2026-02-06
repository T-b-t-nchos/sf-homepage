export class PayloadTooLargeError extends Error {
  constructor(message = "Payload too large") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

export async function readJson<T = unknown>(
  req: AsyncIterable<Uint8Array> & { body?: unknown },
  options: { maxBytes?: number } = {},
) {
  const maxBytes = options.maxBytes ?? 100 * 1024;

  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (Buffer.byteLength(req.body, "utf8") > maxBytes) {
        throw new PayloadTooLargeError();
      }
      return JSON.parse(req.body) as T;
    }
    if (req.body instanceof Buffer) {
      if (req.body.length > maxBytes) {
        throw new PayloadTooLargeError();
      }
      return JSON.parse(req.body.toString("utf8")) as T;
    }
    if (typeof req.body === "object" && req.body !== null) {
      return req.body as T;
    }
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new PayloadTooLargeError();
    }
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) {
    return {} as T;
  }
  return JSON.parse(body) as T;
}

export function sendJson(res: { setHeader: (name: string, value: string) => void; statusCode: number; end: (body?: string) => void }, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}
