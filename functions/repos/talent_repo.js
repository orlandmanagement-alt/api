// ---> DB UTAMA (SSO)
export async function getTalentMeRow(env, user_id) {
  return await env.DB.prepare("SELECT id, email AS email_norm, full_name AS display_name, status FROM users WHERE id = ? LIMIT 1").bind(user_id).first();
}

// ---> DB TALENT (Profil & Portofolio)
export async function getTalentProfileRow(env, user_id) {
  if(!env.DB_TALENT) return null;
  return await env.DB_TALENT.prepare("SELECT * FROM talent_profiles WHERE user_id=? LIMIT 1").bind(user_id).first();
}

export async function ensureTalentProfileSeedRow(env, user_id, display_name, now) {
  if(!env.DB_TALENT) return;
  await env.DB_TALENT.prepare(`
    INSERT OR IGNORE INTO talent_profiles (
      user_id, name, gender, dob, location, location_norm, height_cm, category_csv,
      score, progress_pct, verified_email, verified_phone, verified_identity, created_at, updated_at
    ) VALUES (?,?,NULL,NULL,NULL,NULL,NULL,'',0,0,0,0,0,?,?)
  `).bind(user_id, display_name || null, now, now).run();
}

export async function updateTalentProfileRow(env, user_id, patch, score, progress_pct, now) {
  if(!env.DB_TALENT) return;
  await env.DB_TALENT.prepare(`
    UPDATE talent_profiles SET
      name = COALESCE(?, name), gender = COALESCE(?, gender), dob = COALESCE(?, dob),
      age_years = COALESCE(?, age_years), location = COALESCE(?, location), location_norm = COALESCE(?, location_norm),
      height_cm = COALESCE(?, height_cm), category_csv = COALESCE(?, category_csv),
      progress_pct = ?, score = ?, updated_at = ?
    WHERE user_id=?
  `).bind(
    patch.name, patch.gender, patch.dob, patch.age_years, patch.location, patch.location_norm,
    patch.height_cm, patch.category_csv, progress_pct, score, now, user_id
  ).run();
}

// ---> DB CLIENT (Proyek & Lamaran)
export async function getProjectRoleForApply(env, project_role_id) {
  if(!env.DB_CLIENT) return null;
  return await env.DB_CLIENT.prepare(`
    SELECT pr.id, pr.project_id, pr.title, p.status AS project_status, p.title AS project_title
    FROM project_roles pr LEFT JOIN projects p ON p.id = pr.project_id WHERE pr.id = ? LIMIT 1
  `).bind(project_role_id).first();
}

export async function getExistingApplication(env, project_role_id, talent_user_id) {
  if(!env.DB_CLIENT) return null;
  return await env.DB_CLIENT.prepare("SELECT id, status FROM project_applications WHERE project_role_id = ? AND talent_user_id = ? LIMIT 1").bind(project_role_id, talent_user_id).first();
}

export async function createProjectApplication(env, payload) {
  if(!env.DB_CLIENT) return { error: "db_client_missing" };
  const id = crypto.randomUUID();
  await env.DB_CLIENT.prepare("INSERT INTO project_applications (id, project_role_id, talent_user_id, status, message, created_at) VALUES (?,?,?,?,?,?)")
    .bind(id, payload.project_role_id, payload.talent_user_id, payload.status, payload.message, payload.created_at).run();
  return { id, project_role_id: payload.project_role_id, status: payload.status };
}

export async function getApplicationById(env, application_id) {
  if(!env.DB_CLIENT) return null;
  return await env.DB_CLIENT.prepare("SELECT id, talent_user_id, status FROM project_applications WHERE id = ? LIMIT 1").bind(application_id).first();
}

export async function withdrawApplication(env, application_id, updated_at) {
  if(!env.DB_CLIENT) return null;
  await env.DB_CLIENT.prepare("UPDATE project_applications SET status = ?, updated_at = ? WHERE id = ?").bind("withdrawn", updated_at, application_id).run();
  return { id: application_id, status: "withdrawn", updated_at };
}

export async function listTalentApplications(env, talent_user_id) {
  if(!env.DB_CLIENT) return [];
  const r = await env.DB_CLIENT.prepare(`
    SELECT pa.id, pa.status, pa.created_at, pr.title AS role_title, p.title AS project_title
    FROM project_applications pa
    LEFT JOIN project_roles pr ON pr.id = pa.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
    WHERE pa.talent_user_id = ? ORDER BY pa.created_at DESC
  `).bind(talent_user_id).all();
  return r.results || [];
}

// ---> TAMBAHAN BATCH 7: Mengakses DB_CLIENT untuk Invites
export async function getInviteDetailRow(env, invite_id) {
  if(!env.DB_CLIENT) return null;
  return await env.DB_CLIENT.prepare(`
    SELECT i.id, i.project_role_id, i.talent_user_id, i.status, i.message, i.response_message, i.created_at, i.responded_at,
           pr.title AS role_title, p.id AS project_id, p.title AS project_title
    FROM project_invites i
    LEFT JOIN project_roles pr ON pr.id = i.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
    WHERE i.id = ? LIMIT 1
  `).bind(invite_id).first();
}

export async function respondInvite(env, invite_id, decision, message, responded_at) {
  if(!env.DB_CLIENT) return null;
  await env.DB_CLIENT.prepare(`
    UPDATE project_invites SET status = ?, response_message = ?, responded_at = ? WHERE id = ?
  `).bind(decision, message, responded_at, invite_id).run();
  return { id: invite_id, status: decision, response_message: message, responded_at };
}
