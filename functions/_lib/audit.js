import { nowSec } from "../_lib.js";

export async function audit(env, {
  actor_user_id,
  action,
  route,
  http_status,
  ip_hash,
  ua_hash,
  duration_ms,
  meta
}) {
  try {
    const id = crypto.randomUUID();
    const created_at = nowSec();
    const meta_json = JSON.stringify({
      route: route || null,
      http_status: http_status || null,
      ...(meta || {})
    });

    await env.DB.prepare(`
      INSERT INTO audit_logs (
        id, actor_user_id, action, target_type, target_id, meta_json, created_at, ip_hash, ua_hash, route, http_status, duration_ms
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      actor_user_id || null,
      String(action || "event"),
      "http",
      route || null,
      meta_json,
      created_at,
      ip_hash || null,
      ua_hash || null,
      route || null,
      http_status || null,
      duration_ms || null
    ).run();
  } catch {}
}

export async function auditEvent(env, request, payload = {}) {
  const route = payload.route || (() => {
    try {
      const u = new URL(request.url);
      return `${request.method} ${u.pathname}`;
    } catch {
      return String(payload.route || "http");
    }
  })();

  return await audit(env, {
    actor_user_id: payload.actor_user_id || payload.actorUserId || null,
    action: payload.action || "event",
    route,
    http_status: payload.http_status || payload.httpStatus || 200,
    ip_hash: payload.ip_hash || null,
    ua_hash: payload.ua_hash || null,
    duration_ms: payload.duration_ms || null,
    meta: payload.meta || {}
  });
}
