import { canAccessPortal } from "./roles.js";
import { json } from "./response.js";
import { requireAuth } from "./session.js";

export function portalBaseUrl(env, portal) {
  if (portal === "dashboard") return env.DASHBOARD_URL || "https://dashboard.orlandmanagement.com";
  if (portal === "talent") return env.TALENT_URL || "https://talent.orlandmanagement.com";
  if (portal === "client") return env.CLIENT_URL || "https://client.orlandmanagement.com";
  return env.DASHBOARD_URL || "https://dashboard.orlandmanagement.com";
}

export function safeNextPath(nextPath, fallback = "/") {
  const s = String(nextPath || "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  return s;
}

export function portalRedirectUrl(env, portal, nextPath = "/") {
  return `${portalBaseUrl(env, portal)}${safeNextPath(nextPath, "/")}`;
}

export function inferCookieDomain(request, env) {
  if (env.COOKIE_DOMAIN) return env.COOKIE_DOMAIN;

  try {
    const host = new URL(request.url).hostname;
    if (host === "orlandmanagement.com" || host.endsWith(".orlandmanagement.com")) {
      return ".orlandmanagement.com";
    }
  } catch {}

  return undefined;
}

export async function requirePortalAuth(env, request, portal) {
  const a = await requireAuth(env, request);
  if (!a.ok) return a;

  if (!canAccessPortal(a.roles, portal)) {
    return {
      ok: false,
      res: json(403, "forbidden", {
        message: "role_not_allowed_for_portal",
        portal
      })
    };
  }

  return a;
}
