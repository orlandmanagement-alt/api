export function normEmail(email) { return String(email || "").trim().toLowerCase(); }
export function requireEnv(env, keys) {
  const miss = [];
  for (const k of keys) { if (!env[k]) miss.push(k); }
  return miss;
}
export function getClientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}
export function ipPrefix(ip) {
  ip = String(ip || "").trim();
  if (!ip) return "";
  if (ip.includes(".")) {
    const p = ip.split(".");
    if (p.length >= 3) return `${p[0]}.${p[1]}.${p[2]}.0/24`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return parts.slice(0, 4).join(":") + "::/64";
  }
  return ip;
}
