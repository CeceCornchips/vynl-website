export const COOKIE_NAME = "vynl_admin_session";
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/**
 * Create a signed session token: `<uuid>.<hmac-sha256-hex>`.
 * Uses only Web Crypto APIs — works in Edge runtime and Node.js 18+.
 */
export async function createSession(secret: string): Promise<string> {
  const token = crypto.randomUUID();
  const sig = await hmacHex(token, secret);
  return `${token}.${sig}`;
}

/**
 * Verify a session cookie value. Returns true only if the HMAC signature
 * matches. Uses a timing-safe comparison to prevent timing attacks.
 */
export async function verifySession(
  cookieValue: string | undefined,
  secret: string
): Promise<boolean> {
  if (!cookieValue || !secret) return false;

  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return false;

  const token = cookieValue.slice(0, dotIdx);
  const provided = cookieValue.slice(dotIdx + 1);
  if (!token || !provided) return false;

  const expected = await hmacHex(token, secret);
  return timingSafeEqual(provided, expected);
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to prevent timing oracle attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
