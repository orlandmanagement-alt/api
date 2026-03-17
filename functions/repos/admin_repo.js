export async function getSessionUser(env, user_id){
  return await env.DB.prepare(`
    SELECT
      id, email_norm, display_name, status,
      session_version, locked_until, lock_reason
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(user_id).first();
}

export async function getSessionsByUser(env, user_id){
  const rows = await env.DB.prepare(`
    SELECT
      id,
      user_id,
      created_at,
      expires_at,
      revoked_at,
      ip_hash,
      ua_hash,
      ip_prefix_hash,
      last_seen_at,
      role_snapshot,
      roles_json,
      session_version,
      revoke_reason
    FROM sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(user_id).all();

  return rows.results || [];
}

export async function revokeSessionRow(env, sid, now, reason){
  await env.DB.prepare(`
    UPDATE sessions
    SET revoked_at = ?, revoke_reason = COALESCE(?, revoke_reason)
    WHERE id = ?
  `).bind(now, reason || null, sid).run();
}

export async function revokeUserSessionsRows(env, user_id, now, reason){
  await env.DB.prepare(`
    UPDATE sessions
    SET revoked_at = ?, revoke_reason = COALESCE(?, revoke_reason)
    WHERE user_id = ? AND revoked_at IS NULL
  `).bind(now, reason || null, user_id).run();
}

export async function rotateUserSessionVersion(env, user_id, nextVersion, now){
  await env.DB.prepare(`
    UPDATE users
    SET session_version = ?, updated_at = ?
    WHERE id = ?
  `).bind(nextVersion, now, user_id).run();
}

export async function listSecurityKpiUsers(env, limit){
  const r = await env.DB.prepare(`
    SELECT
      id,
      email_norm,
      display_name,
      status,
      must_change_password,
      mfa_enabled,
      locked_until,
      pw_fail_count,
      last_login_at,
      last_login_success_at,
      last_login_fail_at,
      created_at,
      updated_at
    FROM users
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return r.results || [];
}

export async function listUsersSecurityMonitor(env, limit){
  const r = await env.DB.prepare(`
    SELECT
      u.id,
      u.email_norm,
      u.display_name,
      u.status,
      u.must_change_password,
      u.mfa_enabled,
      u.require_mfa_enroll,
      u.locked_until,
      u.lock_reason,
      u.pw_fail_count,
      u.last_login_at,
      u.last_login_success_at,
      u.last_login_fail_at,
      GROUP_CONCAT(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY u.id
    ORDER BY u.updated_at DESC, u.created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return r.results || [];
}

export async function listSessionsMonitor(env, limit){
  const r = await env.DB.prepare(`
    SELECT
      s.id,
      s.user_id,
      s.created_at,
      s.expires_at,
      s.revoked_at,
      s.last_seen_at,
      s.ip_hash,
      s.ua_hash,
      s.ip_prefix_hash,
      s.role_snapshot,
      s.roles_json,
      s.session_version,
      s.revoke_reason,
      u.email_norm,
      u.display_name,
      u.status
    FROM sessions s
    LEFT JOIN users u ON u.id = s.user_id
    ORDER BY s.created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return r.results || [];
}
