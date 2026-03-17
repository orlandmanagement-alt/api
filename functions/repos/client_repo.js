export async function getClientMeRow(env, user_id) {
  return await env.DB.prepare(`
    SELECT id, email_norm, display_name, status
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(user_id).first();
}

export async function listProjectInvites(env, projectId = "") {
  let sql = `
    SELECT
      i.id,
      i.project_role_id,
      i.talent_user_id,
      i.status,
      i.message,
      i.created_at,
      pr.title AS role_title,
      p.id AS project_id,
      p.title AS project_title,
      u.display_name AS talent_name
    FROM project_invites i
    LEFT JOIN project_roles pr ON pr.id = i.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
    LEFT JOIN users u ON u.id = i.talent_user_id
  `;
  const binds = [];
  if (projectId) {
    sql += ` WHERE p.id = ? `;
    binds.push(projectId);
  }
  sql += ` ORDER BY i.created_at DESC LIMIT 100 `;
  const r = await env.DB.prepare(sql).bind(...binds).all();
  return r.results || [];
}

export async function createProjectInvite(env, payload) {
  const { project_role_id, talent_user_id, message, created_at } = payload;

  const role = await env.DB.prepare(`
    SELECT id, project_id, title
    FROM project_roles
    WHERE id = ?
    LIMIT 1
  `).bind(project_role_id).first();

  if (!role) return { error: "project_role_not_found", status: 404 };

  const talent = await env.DB.prepare(`
    SELECT id, display_name, status
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(talent_user_id).first();

  if (!talent) return { error: "talent_not_found", status: 404 };

  const exists = await env.DB.prepare(`
    SELECT id
    FROM project_invites
    WHERE project_role_id = ? AND talent_user_id = ? AND status IN ('pending','accepted')
    LIMIT 1
  `).bind(project_role_id, talent_user_id).first();

  if (exists) return { error: "invite_already_exists", status: 409, id: exists.id };

  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO project_invites (
      id, project_role_id, talent_user_id, status, message, created_at
    ) VALUES (?,?,?,?,?,?)
  `).bind(
    id,
    project_role_id,
    talent_user_id,
    "pending",
    message,
    created_at
  ).run();

  return {
    id,
    project_role_id,
    talent_user_id,
    message,
    status: "pending",
    created_at
  };
}

export async function listProjectShortlists(env, projectId = "") {
  let sql = `
    SELECT
      s.id,
      s.project_role_id,
      s.talent_user_id,
      s.status,
      s.created_at,
      pr.title AS role_title,
      p.id AS project_id,
      p.title AS project_title,
      u.display_name AS talent_name
    FROM project_shortlists s
    LEFT JOIN project_roles pr ON pr.id = s.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
    LEFT JOIN users u ON u.id = s.talent_user_id
  `;
  const binds = [];
  if (projectId) {
    sql += ` WHERE p.id = ? `;
    binds.push(projectId);
  }
  sql += ` ORDER BY s.created_at DESC LIMIT 100 `;
  const r = await env.DB.prepare(sql).bind(...binds).all();
  return r.results || [];
}

export async function createProjectShortlist(env, payload) {
  const { project_role_id, talent_user_id, created_at } = payload;

  const role = await env.DB.prepare(`
    SELECT id, project_id, title
    FROM project_roles
    WHERE id = ?
    LIMIT 1
  `).bind(project_role_id).first();

  if (!role) return { error: "project_role_not_found", status: 404 };

  const talent = await env.DB.prepare(`
    SELECT id, display_name, status
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(talent_user_id).first();

  if (!talent) return { error: "talent_not_found", status: 404 };

  const exists = await env.DB.prepare(`
    SELECT id
    FROM project_shortlists
    WHERE project_role_id = ? AND talent_user_id = ?
    LIMIT 1
  `).bind(project_role_id, talent_user_id).first();

  if (exists) return { error: "shortlist_already_exists", status: 409, id: exists.id };

  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO project_shortlists (
      id, project_role_id, talent_user_id, status, created_at
    ) VALUES (?,?,?,?,?)
  `).bind(
    id,
    project_role_id,
    talent_user_id,
    "shortlisted",
    created_at
  ).run();

  return {
    id,
    project_role_id,
    talent_user_id,
    status: "shortlisted",
    created_at
  };
}

export async function listProjectBookings(env, projectId = "") {
  let sql = `
    SELECT
      b.id,
      b.project_role_id,
      b.talent_user_id,
      b.status,
      b.notes,
      b.created_at,
      b.updated_at,
      pr.title AS role_title,
      p.id AS project_id,
      p.title AS project_title,
      u.display_name AS talent_name
    FROM project_bookings b
    LEFT JOIN project_roles pr ON pr.id = b.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
    LEFT JOIN users u ON u.id = b.talent_user_id
  `;
  const binds = [];
  if (projectId) {
    sql += ` WHERE p.id = ? `;
    binds.push(projectId);
  }
  sql += ` ORDER BY b.created_at DESC LIMIT 100 `;
  const r = await env.DB.prepare(sql).bind(...binds).all();
  return r.results || [];
}

export async function createProjectBooking(env, payload) {
  const { project_role_id, talent_user_id, notes, created_at } = payload;

  const role = await env.DB.prepare(`
    SELECT id, project_id, title
    FROM project_roles
    WHERE id = ?
    LIMIT 1
  `).bind(project_role_id).first();

  if (!role) return { error: "project_role_not_found", status: 404 };

  const talent = await env.DB.prepare(`
    SELECT id, display_name, status
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(talent_user_id).first();

  if (!talent) return { error: "talent_not_found", status: 404 };

  const exists = await env.DB.prepare(`
    SELECT id, status
    FROM project_bookings
    WHERE project_role_id = ? AND talent_user_id = ?
    LIMIT 1
  `).bind(project_role_id, talent_user_id).first();

  if (exists) {
    return {
      error: "booking_already_exists",
      status: 409,
      id: exists.id,
      booking_status: exists.status || ""
    };
  }

  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO project_bookings (
      id, project_role_id, talent_user_id, status, notes, created_at
    ) VALUES (?,?,?,?,?,?)
  `).bind(
    id,
    project_role_id,
    talent_user_id,
    "pending",
    notes,
    created_at
  ).run();

  return {
    id,
    project_role_id,
    talent_user_id,
    status: "pending",
    notes,
    created_at
  };
}

export async function patchProjectBooking(env, payload) {
  const { booking_id, status, notes, updated_at } = payload;

  const found = await env.DB.prepare(`
    SELECT id, status, notes
    FROM project_bookings
    WHERE id = ?
    LIMIT 1
  `).bind(booking_id).first();

  if (!found) return { error: "booking_not_found", status: 404 };

  const nextStatus = status || String(found.status || "pending");
  const nextNotes = notes || String(found.notes || "");

  await env.DB.prepare(`
    UPDATE project_bookings
    SET status = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    nextStatus,
    nextNotes,
    updated_at,
    booking_id
  ).run();

  return {
    id: booking_id,
    status: nextStatus,
    notes: nextNotes,
    updated_at
  };
}
