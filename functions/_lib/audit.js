export async function audit(env, { actor_user_id, action, route, http_status, meta }) {
  try {
    if(!env.DB_DASHBOARD) return; // Mencegah error jika belum di-binding
    const id = crypto.randomUUID();
    const created_at = Math.floor(Date.now() / 1000);
    const meta_json = JSON.stringify({ route: route || null, http_status: http_status || null, ...(meta || {}) });

    await env.DB_DASHBOARD.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, ip_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, actor_user_id || null, String(action || "event"), "http", route || null, meta_json, created_at).run();
  } catch {}
}

export async function auditEvent(env, request, payload = {}) {
  const route = payload.route || (() => {
    try { const u = new URL(request.url); return `${request.method} ${u.pathname}`; } 
    catch { return String(payload.route || "http"); }
  })();
  return await audit(env, { actor_user_id: payload.actor_user_id || payload.actorUserId || null, action: payload.action || "event", route, http_status: payload.http_status || payload.httpStatus || 200, meta: payload.meta || {} });
}
