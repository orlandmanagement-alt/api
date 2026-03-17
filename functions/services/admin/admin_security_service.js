import { hasRole } from "../../_lib.js";
import {
  listSecurityKpiUsers,
  listUsersSecurityMonitor,
  listSessionsMonitor
} from "../../repos/admin_repo.js";

function canRead(auth){
  return hasRole(auth.roles, ["super_admin", "admin", "security_admin", "staff"]);
}

export async function getSecurityKpiService(env, auth, query){
  if(!canRead(auth)) return { error: "forbidden", status: 403 };

  const limit = Math.min(500, Math.max(1, Number(query.limit || "100")));
  const rows = await listSecurityKpiUsers(env, limit);

  const total_users = rows.length;
  const active_users = rows.filter(x => String(x.status || "") === "active").length;
  const locked_users = rows.filter(x => Number(x.locked_until || 0) > 0).length;
  const mfa_enabled_users = rows.filter(x => Number(x.mfa_enabled || 0) === 1).length;
  const password_reset_required = rows.filter(x => Number(x.must_change_password || 0) === 1).length;
  const with_fail_count = rows.filter(x => Number(x.pw_fail_count || 0) > 0).length;

  return {
    total_users,
    active_users,
    locked_users,
    mfa_enabled_users,
    password_reset_required,
    with_fail_count
  };
}

export async function getUsersSecurityMonitorService(env, auth, query){
  if(!canRead(auth)) return { error: "forbidden", status: 403 };

  const limit = Math.min(500, Math.max(1, Number(query.limit || "100")));
  const rows = await listUsersSecurityMonitor(env, limit);

  return {
    items: rows.map(x => ({
      id: String(x.id || ""),
      email_norm: x.email_norm || "",
      display_name: x.display_name || "",
      status: x.status || "",
      must_change_password: Number(x.must_change_password || 0) === 1,
      mfa_enabled: Number(x.mfa_enabled || 0) === 1,
      require_mfa_enroll: Number(x.require_mfa_enroll || 0) === 1,
      locked_until: x.locked_until == null ? null : Number(x.locked_until),
      lock_reason: x.lock_reason || null,
      pw_fail_count: Number(x.pw_fail_count || 0),
      last_login_at: x.last_login_at == null ? null : Number(x.last_login_at),
      last_login_success_at: x.last_login_success_at == null ? null : Number(x.last_login_success_at),
      last_login_fail_at: x.last_login_fail_at == null ? null : Number(x.last_login_fail_at),
      roles: String(x.roles || "").split(",").filter(Boolean)
    }))
  };
}

export async function getSessionsMonitorService(env, auth, query){
  if(!canRead(auth)) return { error: "forbidden", status: 403 };

  const limit = Math.min(500, Math.max(1, Number(query.limit || "100")));
  const rows = await listSessionsMonitor(env, limit);

  return {
    items: rows.map(x => ({
      id: String(x.id || ""),
      user_id: String(x.user_id || ""),
      email_norm: x.email_norm || "",
      display_name: x.display_name || "",
      user_status: x.status || "",
      created_at: Number(x.created_at || 0),
      expires_at: Number(x.expires_at || 0),
      revoked_at: x.revoked_at == null ? null : Number(x.revoked_at),
      last_seen_at: x.last_seen_at == null ? null : Number(x.last_seen_at),
      ip_hash: x.ip_hash || null,
      ua_hash: x.ua_hash || null,
      ip_prefix_hash: x.ip_prefix_hash || null,
      role_snapshot: x.role_snapshot || null,
      roles_json: x.roles_json || null,
      session_version: Number(x.session_version || 1),
      revoke_reason: x.revoke_reason || null
    }))
  };
}
