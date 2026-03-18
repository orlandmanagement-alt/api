import { nowSec } from "./time.js";
import { parseCookies } from "./request.js";
import { json } from "./response.js";

export async function createSession(env, user_id, roles) {
  const now = nowSec();
  const r = Array.isArray(roles) ? roles : [];

  const ttlMin = Number(env.SESSION_TTL_MIN || 720);
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

export async function revokeSessionBySid(env, sid) {
  try {
    await env.DB.prepare(`
      UPDATE sessions
      SET revoked_at = ?
      WHERE id = ?
    `).bind(nowSec(), sid).run();
  } catch {}
}

export async function revokeAllSessionsForUser(env, user_id) {
  try {
    await env.DB.prepare(`
      UPDATE sessions
      SET revoked_at = ?
      WHERE user_id = ? AND revoked_at IS NULL
    `).bind(nowSec(), user_id).run();
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

  if (!row) return { ok: false, res: json(401, "unauthorized", null) };
  if (row.revoked_at) return { ok: false, res: json(401, "unauthorized", null) };

  const exp = Number(row.expires_at || 0);
  if (!Number.isFinite(exp) || nowSec() > exp) {
    return { ok: false, res: json(401, "unauthorized", null) };
  }

  try {
    await env.DB.prepare(`
      UPDATE sessions
      SET last_seen_at = ?
      WHERE id = ?
    `).bind(nowSec(), row.id).run();
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
