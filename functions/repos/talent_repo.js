export async function getTalentMeRow(env, user_id) {
  return await env.DB.prepare(`
    SELECT id, email_norm, display_name, status
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(user_id).first();
}

export async function getTalentProfileRow(env, user_id) {
  return await env.DB.prepare(`
    SELECT user_id,name,gender,dob,age_years,location,location_norm,height_cm,category_csv,
           score,progress_pct,verified_email,verified_phone,verified_identity,created_at,updated_at
    FROM talent_profiles
    WHERE user_id=?
    LIMIT 1
  `).bind(user_id).first();
}

export async function ensureTalentProfileSeedRow(env, user_id, display_name, now) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO talent_profiles (
      user_id,name,gender,dob,age_years,location,location_norm,height_cm,category_csv,
      score,progress_pct,verified_email,verified_phone,verified_identity,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    user_id, display_name || null, null, null, null, null, null, null, "",
    0, 0, 0, 0, 0, now, now
  ).run();
}

export async function updateTalentProfileRow(env, user_id, patch, score, progress_pct, now) {
  await env.DB.prepare(`
    UPDATE talent_profiles SET
      name = COALESCE(?, name),
      gender = COALESCE(?, gender),
      dob = COALESCE(?, dob),
      age_years = COALESCE(?, age_years),
      location = COALESCE(?, location),
      location_norm = COALESCE(?, location_norm),
      height_cm = COALESCE(?, height_cm),
      category_csv = COALESCE(?, category_csv),
      progress_pct = ?,
      score = ?,
      updated_at = ?
    WHERE user_id=?
  `).bind(
    patch.name, patch.gender, patch.dob, patch.age_years,
    patch.location, patch.location_norm,
    patch.height_cm, patch.category_csv,
    progress_pct, score, now, user_id
  ).run();
}

export async function getProjectRoleForApply(env, project_role_id) {
  return await env.DB.prepare(`
    SELECT
      pr.id,
      pr.project_id,
      pr.title,
      p.status AS project_status,
      p.title AS project_title
    FROM project_roles pr
    LEFT JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = ?
    LIMIT 1
  `).bind(project_role_id).first();
}

export async function getExistingApplication(env, project_role_id, talent_user_id) {
  return await env.DB.prepare(`
    SELECT id, status
    FROM project_applications
    WHERE project_role_id = ? AND talent_user_id = ?
    LIMIT 1
  `).bind(project_role_id, talent_user_id).first();
}

export async function createProjectApplication(env, payload) {
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO project_applications (
      id, project_role_id, talent_user_id, status, message, created_at
    ) VALUES (?,?,?,?,?,?)
  `).bind(
    id,
    payload.project_role_id,
    payload.talent_user_id,
    payload.status,
    payload.message,
    payload.created_at
  ).run();

  return {
    id,
    project_role_id: payload.project_role_id,
    talent_user_id: payload.talent_user_id,
    status: payload.status,
    message: payload.message,
    created_at: payload.created_at
  };
}

export async function getApplicationById(env, application_id) {
  return await env.DB.prepare(`
    SELECT id, talent_user_id, status
    FROM project_applications
    WHERE id = ?
    LIMIT 1
  `).bind(application_id).first();
}

export async function withdrawApplication(env, application_id, updated_at) {
  await env.DB.prepare(`
    UPDATE project_applications
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).bind("withdrawn", updated_at, application_id).run();

  return {
    id: application_id,
    status: "withdrawn",
    updated_at
  };
}

export async function getInviteDetailRow(env, invite_id) {
  return await env.DB.prepare(`
    SELECT
      i.id,
      i.project_role_id,
      i.talent_user_id,
      i.status,
      i.message,
      i.response_message,
      i.created_at,
      i.responded_at,
      pr.title AS role_title,
      p.id AS project_id,
      p.title AS project_title
    FROM project_invites i
    LEFT JOIN project_roles pr ON pr.id = i.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
    WHERE i.id = ?
    LIMIT 1
  `).bind(invite_id).first();
}

export async function respondInvite(env, invite_id, decision, message, responded_at) {
  await env.DB.prepare(`
    UPDATE project_invites
    SET status = ?, response_message = ?, responded_at = ?
    WHERE id = ?
  `).bind(decision, message, responded_at, invite_id).run();

  return {
    id: invite_id,
    status: decision,
    response_message: message,
    responded_at
  };
}

export async function createTalentInviteRegistration(env, payload) {
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
    "active",
    payload.now,
    payload.now,
    payload.password_hash,
    payload.password_salt,
    payload.password_iter,
    "pbkdf2_sha256"
  ).run();
}

export async function markInviteUsed(env, now, user_id, token_hash) {
  await env.DB.prepare(`
    UPDATE invites
    SET used_at=?, used_by_user_id=?
    WHERE id=? AND used_at IS NULL
  `).bind(now, user_id, token_hash).run();
}
