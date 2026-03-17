import { json } from "./response.js";
import { parseCookies } from "./request.js";

function toNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export async function createSession(env, user_id, roles) {
  const now = Math.floor(Date.now() / 1000);
  const r = Array.isArray(roles) ? roles : [];
  const ttlMin = toNum(env.SESSION_TTL_MIN, 720);
  const ttl = Math.max(10, ttlMin) * 60;
  const exp = now + ttl;
  const sid = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO sessions (
      id, user_id, token_hash, created_at, expires_at, revoked_at,
      ip_hash, ua_hash, role_snapshot, ip_prefix_hash, last_seen_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sid,
    user_id,
    sid,
    now,
    exp,
    null,
    null,
    null,
    JSON.stringify(r),
    null,
    now
  ).run();

  return { sid, exp, ttl };
}

export async function revokeSessionBySid(env, sid, reason = null) {
  try {
    await env.DB.prepare(`
      UPDATE sessions
      SET revoked_at = ?, revoke_reason = COALESCE(?, revoke_reason)
      WHERE id = ?
    `).bind(Math.floor(Date.now() / 1000), reason, sid).run();
    return true;
  } catch {
    return false;
  }
}

export async function revokeAllSessionsForUser(env, user_id, reason = null) {
  try {
    await env.DB.prepare(`
      UPDATE sessions
      SET revoked_at = ?, revoke_reason = COALESCE(?, revoke_reason)
      WHERE user_id = ? AND revoked_at IS NULL
    `).bind(Math.floor(Date.now() / 1000), reason, user_id).run();
    return true;
  } catch {
    return false;
  }
}

export async function requireAuth(env, request) {
  const cookies = parseCookies(request);
  const sid = String(cookies.sid || "").trim();

  if (!sid) {
    return { ok: false, res: json(401, "unauthorized", null) };
  }

  let row = null;
  try {
    row = await env.DB.prepare(`
      SELECT id, user_id, role_snapshot, expires_at, revoked_at
      FROM sessions
      WHERE id = ?
      LIMIT 1
    `).bind(sid).first();
  } catch {
    return { ok: false, res: json(401, "unauthorized", null) };
  }

  if (!row || row.revoked_at) {
    return { ok: false, res: json(401, "unauthorized", null) };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(row.expires_at || 0);
  if (!Number.isFinite(exp) || now > exp) {
    return { ok: false, res: json(401, "unauthorized", null) };
  }

  try {
    await env.DB.prepare(`
      UPDATE sessions
      SET last_seen_at = ?
      WHERE id = ?
    `).bind(now, row.id).run();
  } catch {}

  let roles = [];
  try {
    roles = JSON.parse(row.role_snapshot || "[]") || [];
  } catch {
    roles = [];
  }

  return {
    ok: true,
    uid: row.user_id,
    roles,
    token: sid
  };
}
