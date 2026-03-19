/**
 * Middleware:
 * - CORS Terpusat untuk ekosistem *.orlandmanagement.com
 * - Pengamanan Header (CSP, Frame Options)
 * - Preserve Set-Cookie
 */

export async function onRequest(ctx) {
  const { request } = ctx;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") || "";

  // Handle Preflight OPTIONS request untuk CORS
  if (request.method === "OPTIONS") {
    const corsHeaders = new Headers();
    if (origin.endsWith("orlandmanagement.com") || origin.includes("localhost")) {
      corsHeaders.set("Access-Control-Allow-Origin", origin);
      corsHeaders.set("Access-Control-Allow-Credentials", "true");
      corsHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      corsHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const res = await ctx.next();
  const out = new Response(res.body, res);

  // Set CORS untuk Response Normal
  if (origin.endsWith("orlandmanagement.com") || origin.includes("localhost")) {
    out.headers.set("Access-Control-Allow-Origin", origin);
    out.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Security Headers
  out.headers.set("cache-control", "no-store");
  out.headers.set("x-content-type-options", "nosniff");
  out.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  out.headers.set("x-frame-options", "DENY");
  out.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");

  if (!url.pathname.startsWith("/api/")) {
    out.headers.set(
      "content-security-policy",
      "default-src 'self' https:; " +
      "script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net 'unsafe-inline'; " +
      "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    );
  }

  return out;
}
