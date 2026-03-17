import { hasRole } from "../../_lib.js";

export async function getFinalHealthService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin", "staff"])){
    return { error: "forbidden", status: 403 };
  }

  const users = await env.DB.prepare(`
    SELECT COUNT(*) AS total_users
    FROM users
  `).first().catch(() => ({ total_users: 0 }));

  const sessions = await env.DB.prepare(`
    SELECT COUNT(*) AS total_sessions,
           SUM(CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END) AS active_sessions
    FROM sessions
  `).first().catch(() => ({ total_sessions: 0, active_sessions: 0 }));

  const ip_blocks = await env.DB.prepare(`
    SELECT COUNT(*) AS active_ip_blocks
    FROM ip_blocks
    WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > strftime('%s','now'))
  `).first().catch(() => ({ active_ip_blocks: 0 }));

  return {
    ok: true,
    users: users || {},
    sessions: sessions || {},
    ip_blocks: ip_blocks || {}
  };
}

export async function getMfaPolicyService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin", "staff"])){
    return { error: "forbidden", status: 403 };
  }

  const row = await env.DB.prepare(`
    SELECT v
    FROM system_settings
    WHERE k = 'mfa_policy_v1'
    LIMIT 1
  `).first().catch(() => null);

  let policy = {
    enabled: 0,
    allow_user_opt_in: 0,
    require_for_super_admin: 0,
    require_for_security_admin: 0,
    require_for_admin: 0,
    allowed_types: ["app"],
    recovery_codes_enabled: 0
  };

  try{
    if(row?.v){
      const parsed = JSON.parse(String(row.v || "{}"));
      if(parsed && typeof parsed === "object"){
        policy = { ...policy, ...parsed };
      }
    }
  }catch{}

  return policy;
}

export async function getLoginTimelineService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin", "staff"])){
    return { error: "forbidden", status: 403 };
  }

  const limit = Math.min(500, Math.max(1, Number(query.limit || "100")));

  const rows = await env.DB.prepare(`
    SELECT id, actor_user_id, action, route, http_status, meta_json, created_at
    FROM audit_logs
    WHERE action LIKE 'login%' OR action LIKE 'auth%'
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all().catch(() => ({ results: [] }));

  return {
    items: (rows.results || []).map(x => ({
      id: String(x.id || ""),
      actor_user_id: x.actor_user_id || null,
      action: x.action || "",
      route: x.route || "",
      http_status: x.http_status == null ? null : Number(x.http_status),
      meta_json: x.meta_json || null,
      created_at: Number(x.created_at || 0)
    }))
  };
}
