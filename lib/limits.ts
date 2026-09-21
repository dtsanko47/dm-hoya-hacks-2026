// Limits for the public API routes. Both spend metered credits, so these are
// enforced on the server - the client imports them only for the UI warning.

// ElevenLabs bills 1 credit per character.
export const MAX_TTS_CHARS = 5000;

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const MAX_SCRIPT_CHARS = 20000;

// Free plans can't use library voices, so only the ones in the dropdown.
export const ALLOWED_VOICE_IDS = [
  "hpp4J3VqNfWAUOO0d1Us", // Bella
  "EXAVITQu4vr4xnSDxMaL", // Sarah
  "SAz9YHcvj6GT2YYXdXww", // River
  "TX3LPaxmHKxFdv7VOQHJ", // Liam
  "bIHbv24MWmeRgasZH58o", // Will
  "iP95p4xoKVk53GoZ742B", // Chris
  "pNInz6obpgDQGcFmaJgB", // Adam
] as const;

export const isAllowedVoice = (id: unknown): id is string =>
  typeof id === "string" && (ALLOWED_VOICE_IDS as readonly string[]).includes(id);

// Per-instance only - Vercel runs several, so this slows a flood, it doesn't
// cap a global rate.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function sweepBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
