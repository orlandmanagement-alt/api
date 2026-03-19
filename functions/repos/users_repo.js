import { hashData } from "../_lib/crypto.js";

// Adaptasi skema baru: display_name -> full_name, email_norm -> email, roles table -> role column
export async function ensureRole(env, name, now){ return name; } // Dummy, karena role sekarang ada di kolom users

export async function getAdminUsers(env, q, limit){
  const like = q ? `%${q}%` : null;
  const r = await env.DB.prepare(`
    SELECT id, email AS email_norm, full_name AS display_name, status, created_at, role AS roles
    FROM users 
    WHERE role IN ('super_admin', 'admin', 'staff') AND (? IS NULL OR email LIKE ? OR full_name LIKE ?)
    ORDER BY created_at DESC LIMIT ?
  `).bind(like, like, like, limit).all();

  return (r.results || []).map(x => ({ ...x, roles: [x.roles] }));
}

export async function getUserByEmail(env, email){
  return await env.DB.prepare("SELECT 1 AS ok FROM users WHERE email=? LIMIT 1").bind(email).first();
}

export async function createUser(env, payload){
  await env.DB.prepare(`
    INSERT INTO users (id, email, full_name, status, created_at, password_hash, role) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(payload.user_id, payload.email_norm, payload.display_name, payload.status, payload.created_at, payload.password_hash, 'talent').run();
}

export async function attachUserRole(env, user_id, role_id, now){
  await env.DB.prepare("UPDATE users SET role=? WHERE id=?").bind(role_id, user_id).run();
}

export async function updateUserStatus(env, user_id, status, now){
  await env.DB.prepare("UPDATE users SET status=? WHERE id=?").bind(status, user_id).run();
}

export async function updateUserDisplayName(env, user_id, display_name, now){
  await env.DB.prepare("UPDATE users SET full_name=? WHERE id=?").bind(display_name, user_id).run();
}

export async function updateUserPassword(env, user_id, password_raw, now){
  const hashed = await hashData(password_raw);
  await env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(hashed, user_id).run();
}

export async function deleteAdminRoles(env, user_id){
  await env.DB.prepare("UPDATE users SET role='talent' WHERE id=?").bind(user_id).run();
}

export async function listClientUsers(env, q, limit, cursor){
  const like = q ? `%${q}%` : null;
  const rows = await env.DB.prepare(`
    SELECT id, email AS email_norm, full_name AS display_name, status, created_at
    FROM users WHERE role='client' AND (? IS NULL OR email LIKE ? OR full_name LIKE ?)
    ORDER BY created_at DESC LIMIT ?
  `).bind(like, like, like, limit + 1).all();
  return rows.results || [];
}

// CROSS-DB JOIN SIMULATION (SSO DB + TALENT DB)
export async function listTalentUsers(env, filters){
  const { q, limit } = filters;
  const like = q ? `%${q}%` : null;
  
  // 1. Tarik User dari SSO DB
  const usersRes = await env.DB.prepare(`
    SELECT id, email AS email_norm, full_name AS display_name, status, created_at 
    FROM users WHERE role='talent' AND (? IS NULL OR email LIKE ? OR full_name LIKE ?)
    ORDER BY created_at DESC LIMIT ?
  `).bind(like, like, like, limit || 50).all();
  
  const users = usersRes.results || [];
  if(users.length === 0) return [];

  const userIds = users.map(u => u.id);
  const placeholders = userIds.map(() => '?').join(',');

  // 2. Tarik Profile dari TALENT DB (Jika D1 Binding tersedia)
  let profilesMap = {};
  if(env.DB_TALENT) {
    const tpRes = await env.DB_TALENT.prepare(`SELECT * FROM talent_profiles WHERE user_id IN (${placeholders})`).bind(...userIds).all();
    (tpRes.results || []).forEach(p => profilesMap[p.user_id] = p);
  }

  // 3. Gabungkan di JavaScript
  return users.map(u => {
    const p = profilesMap[u.id] || {};
    return { ...u, ...p, tp_location: p.location || null };
  });
}

export async function getTalentUserDetail(env, id){
  const u = await env.DB.prepare("SELECT id, email AS email_norm, full_name AS display_name, status, created_at FROM users WHERE id=? LIMIT 1").bind(id).first();
  if(!u) return null;
  let tp = null;
  if(env.DB_TALENT) tp = await env.DB_TALENT.prepare("SELECT * FROM talent_profiles WHERE user_id=? LIMIT 1").bind(id).first();
  return { user: u, profile: tp || null };
}

export async function listUserOptions(env, q, limit){
  const like = q ? `%${q}%` : null;
  const r = await env.DB.prepare(`
    SELECT id, full_name AS display_name, email AS email_norm, status, role AS roles
    FROM users WHERE status='active' AND (? IS NULL OR full_name LIKE ? OR email LIKE ?)
    ORDER BY full_name ASC LIMIT ?
  `).bind(like, like, like, limit).all();
  return r.results || [];
}

export async function getLifecycleUsers(env){
  const r = await env.DB.prepare("SELECT id, email AS email_norm, full_name AS display_name, status, created_at, locked_until FROM users ORDER BY created_at DESC").all();
  return r.results || [];
}

export async function getUserById(env, user_id){
  return await env.DB.prepare("SELECT id, status, email AS email_norm, full_name AS display_name, role FROM users WHERE id=? LIMIT 1").bind(user_id).first();
}

export async function setLifecycleStatus(env, user_id, status, now, reason){
  await env.DB.prepare("UPDATE users SET status=? WHERE id=?").bind(status, user_id).run();
}

export async function clearUserLock(env, user_id, now){
  await env.DB.prepare("UPDATE users SET locked_until=NULL, fail_count=0 WHERE id=?").bind(user_id).run();
}

export async function getUserRoleRows(env, user_id){
  const r = await env.DB.prepare("SELECT role as name, role as role_id FROM users WHERE id=?").bind(user_id).all();
  return r.results || [];
}

export async function talentBackfillRows(env, limit){
  // Logika backfill disederhanakan karena profile talent bisa di-handle saat onboarding
  return [];
}

// ---> TAMBAHAN BATCH 8: Offboarding & Lifecycle
export async function getOffboardingUsers(env){
  const r = await env.DB.prepare("SELECT id, email AS email_norm, full_name AS display_name, status, created_at FROM users WHERE status IN ('suspended', 'archived') ORDER BY created_at DESC").all();
  return r.results || [];
}

export async function offboardUser(env, user_id, now, reason, status){
  await env.DB.prepare("UPDATE users SET status=? WHERE id=?").bind(status, user_id).run();
}

export async function deleteAllUserRoles(env, user_id){
  // Karena role sekarang satu kolom, 'delete' artinya mendemosi (downgrade) ke talent biasa
  await env.DB.prepare("UPDATE users SET role='talent' WHERE id=?").bind(user_id).run();
}

export async function insertTalentBackfillRow(env, user_id, name, now){
  if(!env.DB_TALENT) return;
  await env.DB_TALENT.prepare(`
    INSERT OR IGNORE INTO talent_profiles (
      user_id, name, category_csv, score, progress_pct, verified_email, verified_phone, verified_identity, created_at, updated_at
    ) VALUES (?,?,'',0,0,0,0,0,?,?)
  `).bind(user_id, name || null, now, now).run();
}
