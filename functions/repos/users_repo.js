export async function ensureRole(env, name, now){
  let r = await env.DB.prepare(`
    SELECT id FROM roles WHERE name=? LIMIT 1
  `).bind(name).first();

  if(r) return r.id;

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO roles (id,name,created_at) VALUES (?,?,?)
  `).bind(id, name, now).run();

  return id;
}

export async function getAdminUsers(env, q, limit){
  const like = q ? `%${q}%` : null;
  const r = await env.DB.prepare(`
    SELECT u.id,u.email_norm,u.display_name,u.status,u.created_at,u.updated_at,
           (SELECT MAX(created_at) FROM sessions s WHERE s.user_id=u.id) AS last_login_at,
           GROUP_CONCAT(ro.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id=u.id
    LEFT JOIN roles ro ON ro.id=ur.role_id
    WHERE ( ? IS NULL OR u.email_norm LIKE ? OR u.display_name LIKE ? )
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ?
  `).bind(like, like, like, limit).all();

  return (r.results || []).map(x => ({
    id: x.id,
    email_norm: x.email_norm,
    display_name: x.display_name,
    status: x.status,
    created_at: x.created_at,
    updated_at: x.updated_at,
    last_login_at: x.last_login_at,
    roles: String(x.roles || "").split(",").filter(Boolean)
  }));
}

export async function getUserByEmail(env, email){
  return await env.DB.prepare(`
    SELECT 1 AS ok FROM users WHERE email_norm=? LIMIT 1
  `).bind(email).first();
}

export async function createUser(env, payload){
  await env.DB.prepare(`
    INSERT INTO users (
      id,email_norm,email_hash,display_name,status,created_at,updated_at,
      password_hash,password_salt,password_iter,password_algo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    payload.user_id,
    payload.email_norm,
    payload.email_hash,
    payload.display_name,
    payload.status,
    payload.created_at,
    payload.updated_at,
    payload.password_hash,
    payload.password_salt,
    payload.password_iter,
    payload.password_algo
  ).run();
}

export async function attachUserRole(env, user_id, role_id, now){
  await env.DB.prepare(`
    INSERT OR IGNORE INTO user_roles (user_id,role_id,created_at) VALUES (?,?,?)
  `).bind(user_id, role_id, now).run();
}

export async function updateUserStatus(env, user_id, status, now){
  await env.DB.prepare(`
    UPDATE users SET status=?, updated_at=? WHERE id=?
  `).bind(status, now, user_id).run();
}

export async function updateUserDisplayName(env, user_id, display_name, now){
  await env.DB.prepare(`
    UPDATE users SET display_name=?, updated_at=? WHERE id=?
  `).bind(display_name, now, user_id).run();
}

export async function updateUserPassword(env, user_id, hash, salt, iter, now){
  await env.DB.prepare(`
    UPDATE users
    SET password_hash=?, password_salt=?, password_iter=?, password_algo=?, updated_at=?
    WHERE id=?
  `).bind(hash, salt, iter, "pbkdf2_sha256", now, user_id).run();
}

export async function deleteAdminRoles(env, user_id){
  await env.DB.prepare(`
    DELETE FROM user_roles
    WHERE user_id=? AND role_id IN (
      SELECT id FROM roles WHERE name IN ('super_admin','admin','staff')
    )
  `).bind(user_id).run();
}

export async function listClientUsers(env, q, limit, cursor){
  const like = q ? `%${q}%` : null;

  const rows = await env.DB.prepare(`
    SELECT u.id,u.email_norm,u.display_name,u.status,u.created_at,u.updated_at
    FROM users u
    JOIN user_roles ur ON ur.user_id=u.id
    JOIN roles r ON r.id=ur.role_id
    WHERE r.name='client'
      AND ( ? IS NULL OR lower(u.email_norm) LIKE ? OR lower(u.display_name) LIKE ? )
      AND (
        ? IS NULL
        OR (u.created_at < ?)
        OR (u.created_at = ? AND u.id < ?)
      )
    ORDER BY u.created_at DESC, u.id DESC
    LIMIT ?
  `).bind(
    like, like, like,
    cursor ? "1" : null,
    cursor ? cursor.created_at : null,
    cursor ? cursor.created_at : null,
    cursor ? cursor.id : null,
    limit + 1
  ).all();

  return rows.results || [];
}

export async function listTalentUsers(env, filters){
  const {
    q, location, gender, age_min, age_max,
    height_min, height_max, score_min, progress_min, limit
  } = filters;

  const like = q ? `%${q}%` : null;

  const r = await env.DB.prepare(`
    SELECT
      u.id,
      u.email_norm,
      u.display_name,
      u.status,
      u.created_at,
      u.updated_at,
      (SELECT MAX(created_at) FROM sessions s WHERE s.user_id=u.id) AS last_login_at,
      tp.gender,
      tp.age_years,
      tp.height_cm,
      tp.location AS tp_location,
      tp.location_norm,
      tp.category_csv,
      tp.score,
      tp.progress_pct,
      tp.verified_email,
      tp.verified_phone,
      tp.verified_identity
    FROM users u
    JOIN user_roles ur ON ur.user_id=u.id
    JOIN roles ro ON ro.id=ur.role_id AND ro.name='talent'
    LEFT JOIN talent_profiles tp ON tp.user_id=u.id
    WHERE
      ( ? IS NULL OR u.email_norm LIKE ? OR u.display_name LIKE ? )
      AND ( ? = '' OR tp.location_norm = ? )
      AND ( ? = '' OR tp.gender = ? )
      AND ( ? = 0 OR (tp.age_years IS NOT NULL AND tp.age_years >= ?) )
      AND ( ? = 0 OR (tp.age_years IS NOT NULL AND tp.age_years <= ?) )
      AND ( ? = 0 OR (tp.height_cm IS NOT NULL AND tp.height_cm >= ?) )
      AND ( ? = 0 OR (tp.height_cm IS NOT NULL AND tp.height_cm <= ?) )
      AND ( ? = 0 OR (tp.score IS NOT NULL AND tp.score >= ?) )
      AND ( ? = 0 OR (tp.progress_pct IS NOT NULL AND tp.progress_pct >= ?) )
    ORDER BY COALESCE(tp.score,0) DESC, COALESCE(tp.progress_pct,0) DESC, u.created_at DESC
    LIMIT ?
  `).bind(
    like, like, like,
    location, location,
    gender, gender,
    age_min, age_min,
    age_max, age_max,
    height_min, height_min,
    height_max, height_max,
    score_min, score_min,
    progress_min, progress_min,
    limit
  ).all();

  return r.results || [];
}

export async function getTalentUserDetail(env, id){
  const u = await env.DB.prepare(`
    SELECT u.id,u.email_norm,u.display_name,u.status,u.created_at,u.updated_at
    FROM users u
    WHERE u.id=? LIMIT 1
  `).bind(id).first();

  if(!u) return null;

  const tp = await env.DB.prepare(`
    SELECT user_id,name,gender,dob,age_years,location,height_cm,category_csv,score,progress_pct,
           verified_email,verified_phone,verified_identity,created_at,updated_at
    FROM talent_profiles
    WHERE user_id=? LIMIT 1
  `).bind(id).first();

  return { user: u, profile: tp || null };
}

export async function listUserOptions(env, q, limit){
  const like = q ? `%${q}%` : null;
  const r = await env.DB.prepare(`
    SELECT
      u.id,
      u.display_name,
      u.email_norm,
      u.status,
      GROUP_CONCAT(ro.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles ro ON ro.id = ur.role_id
    WHERE u.status='active'
      AND (
        ? IS NULL OR
        u.display_name LIKE ? OR
        u.email_norm LIKE ?
      )
    GROUP BY u.id
    ORDER BY
      CASE WHEN u.display_name IS NULL OR u.display_name='' THEN 1 ELSE 0 END,
      u.display_name ASC,
      u.email_norm ASC
    LIMIT ?
  `).bind(like, like, like, limit).all();

  return r.results || [];
}

export async function getLifecycleUsers(env){
  const r = await env.DB.prepare(`
    SELECT id, email_norm, display_name, status, created_at, updated_at,
           disabled_at, disabled_reason, locked_until, lock_reason,
           must_change_password, mfa_enabled
    FROM users
    ORDER BY updated_at DESC, created_at DESC
  `).all();

  return r.results || [];
}

export async function getUserById(env, user_id){
  return await env.DB.prepare(`
    SELECT id, status, session_version, email_norm, display_name
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(user_id).first();
}

export async function setLifecycleStatus(env, user_id, status, now, reason){
  await env.DB.prepare(`
    UPDATE users
    SET status = ?,
        updated_at = ?,
        disabled_at = CASE WHEN ? IN ('suspended','archived') THEN ? ELSE NULL END,
        disabled_reason = CASE WHEN ? IN ('suspended','archived') THEN ? ELSE NULL END
    WHERE id = ?
  `).bind(status, now, status, now, status, reason, user_id).run();
}

export async function forcePasswordResetFlag(env, user_id, now){
  await env.DB.prepare(`
    UPDATE users
    SET must_change_password = 1,
        updated_at = ?
    WHERE id = ?
  `).bind(now, user_id).run();
}

export async function clearUserLock(env, user_id, now){
  await env.DB.prepare(`
    UPDATE users
    SET locked_until = NULL,
        lock_reason = NULL,
        pw_fail_count = 0,
        pw_fail_last_at = NULL,
        updated_at = ?
    WHERE id = ?
  `).bind(now, user_id).run();
}

export async function archiveUser(env, user_id, now, reason){
  await env.DB.prepare(`
    UPDATE users
    SET status = 'archived',
        disabled_at = ?,
        disabled_reason = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(now, reason, now, user_id).run();
}

export async function getOffboardingUsers(env){
  const r = await env.DB.prepare(`
    SELECT id, email_norm, display_name, status, disabled_at, disabled_reason,
           must_change_password, mfa_enabled, updated_at, created_at
    FROM users
    ORDER BY updated_at DESC, created_at DESC
  `).all();

  return r.results || [];
}

export async function getUserRoleRows(env, user_id){
  const r = await env.DB.prepare(`
    SELECT ur.role_id, ro.name
    FROM user_roles ur
    JOIN roles ro ON ro.id = ur.role_id
    WHERE ur.user_id = ?
    ORDER BY ro.name ASC
  `).bind(user_id).all();

  return r.results || [];
}

export async function offboardUser(env, user_id, now, reason, status){
  await env.DB.prepare(`
    UPDATE users
    SET status = ?,
        disabled_at = ?,
        disabled_reason = ?,
        must_change_password = 1,
        updated_at = ?
    WHERE id = ?
  `).bind(status, now, reason, now, user_id).run();
}

export async function deleteAllUserRoles(env, user_id){
  await env.DB.prepare(`
    DELETE FROM user_roles
    WHERE user_id = ?
  `).bind(user_id).run();
}

export async function talentBackfillRows(env, limit){
  const r = await env.DB.prepare(`
    SELECT u.id AS user_id, u.display_name AS name
    FROM users u
    JOIN user_roles ur ON ur.user_id=u.id
    JOIN roles ro ON ro.id=ur.role_id
    LEFT JOIN talent_profiles tp ON tp.user_id=u.id
    WHERE ro.name='talent' AND tp.user_id IS NULL
    ORDER BY u.created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return r.results || [];
}

export async function insertTalentBackfillRow(env, row, now){
  await env.DB.prepare(`
    INSERT OR IGNORE INTO talent_profiles (
      user_id,name,gender,dob,location,location_norm,height_cm,category_csv,
      score,progress_pct,verified_email,verified_phone,verified_identity,
      created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    row.user_id,
    row.name || null,
    null,
    null,
    null,
    null,
    null,
    "",
    0,
    0,
    0,
    0,
    0,
    now,
    now
  ).run();
}
