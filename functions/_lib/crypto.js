export function randomB64(bytes = 18) {
  const u8 = crypto.getRandomValues(new Uint8Array(bytes));
  let s = "";
  for (const c of u8) s += String.fromCharCode(c);
  return btoa(s);
}

export async function sha256Base64(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(str))
  );
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function pbkdf2Hash(password, saltB64, iterations) {
  const iter = Math.min(100000, Math.max(1000, Number(iterations || 100000)));
  const salt = Uint8Array.from(atob(String(saltB64)), c => c.charCodeAt(0));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    baseKey,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export function timingSafeEqual(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a.length !== b.length) return false;

  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}
