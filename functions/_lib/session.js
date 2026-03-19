// --- functions/_lib/session.js ---
import { nowSec } from "./time.js";
import { parseCookies } from "./request.js";
import { json } from "./response.js";

// Catatan: appapi seharusnya tidak lagi membuat session (karena itu tugas SSO).
// Fungsi ini dibiarkan jika ada kebutuhan force-login dari admin panel.
export async function createSession(env, user_id, roles) {
  const now = nowSec();
  const ttlMin = Number(env.SESSION_TTL_MIN || 10080); // Default 7 Hari
  const exp = now + (ttlMin * 60);
  const sid = crypto.randomUUID();
  
  // Mengambil role pertama (karena skema baru menggunakan string tunggal)
  const primaryRole = Array.isArray(roles) && roles.length > 0 ? roles[0] : 'talent';

  await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, role, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sid, user_id, primaryRole, now, exp).run();

  return { sid, exp, ttl: ttlMin * 60 };
}

export async function revokeSessionBySid(env, sid) {
  try {
    // Skema baru: Hapus baris sesi, bukan update revoked_at
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  } catch {}
}

export async function revokeAllSessionsForUser(env, user_id) {
  try {
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user_id).run();
    return true;
  } catch {
    return false;
  }
}

// FUNGSI UTAMA PENJAGA GERBANG API
export async function requireAuth(env, request) {
  const cookies = parseCookies(request);
  const sid = String(cookies.sid || "").trim();

  if (!sid) return { ok: false, res: json(401, "unauthorized - no cookie", null) };

  let row = null;
  try {
    // Menyesuaikan dengan kolom tabel sessions yang baru
    row = await env.DB.prepare(`
      SELECT id, user_id, role, expires_at
      FROM sessions
      WHERE id = ?
    `).bind(sid).first();
  } catch {
    return { ok: false, res: json(500, "database error", null) };
  }

  if (!row) return { ok: false, res: json(401, "unauthorized - invalid session", null) };

  const exp = Number(row.expires_at || 0);
  if (!Number.isFinite(exp) || nowSec() > exp) {
    // Sesi kadaluarsa, sekalian kita bersihkan dari database
    await revokeSessionBySid(env, sid);
    return { ok: false, res: json(401, "unauthorized - session expired", null) };
  }

  // Mengubah role tunggal kembali menjadi Array agar kompatibel dengan services lama
  const rolesArray = [row.role];

  return {
    ok: true,
    uid: row.user_id,
    roles: rolesArray,
    token: sid
  };
}
