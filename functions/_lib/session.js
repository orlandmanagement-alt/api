import { nowSec } from "./time.js";
import { parseCookies } from "./cookies.js"; // Pastikan ini mengarah ke file yang tepat sesuai struktur Anda
import { jsonUnauthorized, jsonError } from "./response.js"; // Gunakan shortcut agar bebas error

export async function createSession(env, user_id, roles) {
  const now = nowSec();
  const ttlMin = Number(env.SESSION_TTL_MIN || 10080); // Default 7 Hari
  const exp = now + (ttlMin * 60);
  const sid = crypto.randomUUID();
  
  const primaryRole = Array.isArray(roles) && roles.length > 0 ? roles[0] : 'talent';

  await env.DB_SSO.prepare(`
    INSERT INTO sessions (id, user_id, role, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sid, user_id, primaryRole, now, exp).run();

  return { sid, exp, ttl: ttlMin * 60 };
}

export async function revokeSessionBySid(env, sid) {
  try {
    await env.DB_SSO.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  } catch {}
}

export async function revokeAllSessionsForUser(env, user_id) {
  try {
    await env.DB_SSO.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user_id).run();
    return true;
  } catch {
    return false;
  }
}

// FUNGSI UTAMA PENJAGA GERBANG API
export async function requireAuth(env, request) {
  const cookies = parseCookies(request);
  const sid = String(cookies.sid || "").trim();

  // PERBAIKAN: Gunakan jsonUnauthorized agar format balasan terjamin benar
  if (!sid) return { ok: false, res: jsonUnauthorized("unauthorized - no cookie") };

  let row = null;
  try {
    row = await env.DB_SSO.prepare(`
      SELECT id, user_id, role, expires_at
      FROM sessions
      WHERE id = ?
    `).bind(sid).first();
  } catch {
    return { ok: false, res: jsonError("database error", 500) };
  }

  if (!row) return { ok: false, res: jsonUnauthorized("unauthorized - invalid session") };

  const exp = Number(row.expires_at || 0);
  if (!Number.isFinite(exp) || nowSec() > exp) {
    await revokeSessionBySid(env, sid);
    return { ok: false, res: jsonUnauthorized("unauthorized - session expired") };
  }

  const rolesArray = [row.role];

  return {
    ok: true,
    uid: row.user_id,
    roles: rolesArray,
    token: sid
  };
}
