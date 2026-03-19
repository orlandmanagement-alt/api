export async function getSessionUser(env, user_id){
  return await env.DB.prepare(`
    SELECT id, email AS email_norm, full_name AS display_name, status,
           1 AS session_version, locked_until, NULL AS lock_reason
    FROM users WHERE id = ? LIMIT 1
  `).bind(user_id).first();
}

export async function getSessionsByUser(env, user_id){
  const rows = await env.DB.prepare(`
    SELECT id, user_id, created_at, expires_at,
           NULL AS revoked_at, NULL AS ip_hash, NULL AS ua_hash, NULL AS ip_prefix_hash,
           created_at AS last_seen_at, role AS role_snapshot, NULL AS roles_json,
           1 AS session_version, NULL AS revoke_reason
    FROM sessions WHERE user_id = ? ORDER BY created_at DESC
  `).bind(user_id).all();
  return rows.results || [];
}

export async function revokeSessionRow(env, sid, now, reason){
  // Skema baru: Hapus sesi secara permanen, bukan di-update
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
}

export async function revokeUserSessionsRows(env, user_id, now, reason){
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user_id).run();
}

export async function rotateUserSessionVersion(env, user_id, nextVersion, now){
  // No-op: Skema baru tidak menggunakan session_version untuk efisiensi.
  return;
}

export async function listSecurityKpiUsers(env, limit){
  const r = await env.DB.prepare(`
    SELECT id, email AS email_norm, full_name AS display_name, status,
           0 AS must_change_password, 0 AS mfa_enabled, locked_until, fail_count AS pw_fail_count,
           NULL AS last_login_at, NULL AS last_login_success_at, NULL AS last_login_fail_at,
           created_at, created_at AS updated_at
    FROM users ORDER BY created_at DESC LIMIT ?
  `).bind(limit).all();
  return r.results || [];
}

export async function listUsersSecurityMonitor(env, limit){
  const r = await env.DB.prepare(`
    SELECT id, email AS email_norm, full_name AS display_name, status,
           0 AS must_change_password, 0 AS mfa_enabled, 0 AS require_mfa_enroll,
           locked_until, NULL AS lock_reason, fail_count AS pw_fail_count,
           NULL AS last_login_at, NULL AS last_login_success_at, NULL AS last_login_fail_at,
           role AS roles
    FROM users ORDER BY created_at DESC LIMIT ?
  `).bind(limit).all();
  return r.results || [];
}

export async function listSessionsMonitor(env, limit){
  const r = await env.DB.prepare(`
    SELECT s.id, s.user_id, s.created_at, s.expires_at,
           NULL AS revoked_at, s.created_at AS last_seen_at, NULL AS ip_hash, NULL AS ua_hash, NULL AS ip_prefix_hash,
           s.role AS role_snapshot, NULL AS roles_json, 1 AS session_version, NULL AS revoke_reason,
           u.email AS email_norm, u.full_name AS display_name, u.status
    FROM sessions s LEFT JOIN users u ON u.id = s.user_id
    ORDER BY s.created_at DESC LIMIT ?
  `).bind(limit).all();
  return r.results || [];
}

export async function getDisplayNamesForAdmin(env, userIds) {
  if (!userIds || userIds.length === 0 || !env.DB) return {};
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if(uniqueIds.length === 0) return {};
  const placeholders = uniqueIds.map(() => '?').join(',');
  const res = await env.DB.prepare(`SELECT id, full_name FROM users WHERE id IN (${placeholders})`).bind(...uniqueIds).all();
  const map = {};
  (res.results || []).forEach(u => map[u.id] = u.full_name);
  return map;
}

export async function getDisplayNamesForAdmin(env, userIds) {
  if (!userIds || userIds.length === 0 || !env.DB) return {};
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if(uniqueIds.length === 0) return {};
  const placeholders = uniqueIds.map(() => '?').join(',');
  const res = await env.DB.prepare(`SELECT id, full_name FROM users WHERE id IN (${placeholders})`).bind(...uniqueIds).all();
  const map = {};
  (res.results || []).forEach(u => map[u.id] = u.full_name);
  return map;
}
