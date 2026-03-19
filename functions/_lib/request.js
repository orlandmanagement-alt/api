export async function readJson(request) {
  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await request.json();
  } catch { return null; }
}

export function parseCookies(request) {
  const h = request.headers.get("cookie") || "";
  const out = {};
  h.split(";").map(s => s.trim()).filter(Boolean).forEach(kv => {
    const i = kv.indexOf("=");
    if (i > 0) out[kv.slice(0, i)] = kv.slice(i + 1);
  });
  return out;
}
