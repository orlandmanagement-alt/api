export async function getUserSessions(env, user_id) {
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
