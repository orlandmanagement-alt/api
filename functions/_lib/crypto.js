export function timingSafeEqual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function randomB64(bytes = 18) {
  const u8 = crypto.getRandomValues(new Uint8Array(bytes));
  let s = ""; for (const c of u8) s += String.fromCharCode(c);
  return btoa(s);
}

// Menggunakan algoritma hash enterprise baru kita untuk menggantikan pbkdf2 kompleks
export async function hashData(text) {
  if(!text) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text + "orland_enterprise_salt_999"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
