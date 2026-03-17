export async function getDashboardSummary(env){
  const users = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_users,
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_users,
      SUM(CASE WHEN status='disabled' THEN 1 ELSE 0 END) AS disabled_users,
      SUM(CASE WHEN must_change_password=1 THEN 1 ELSE 0 END) AS must_change_password_users,
      SUM(CASE WHEN mfa_enabled=1 THEN 1 ELSE 0 END) AS mfa_enabled_users
    FROM users
  `).first();

  const sessions = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_sessions,
      SUM(CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END) AS active_sessions
    FROM sessions
  `).first();

  const projects = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_projects,
      SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft_projects,
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_projects
    FROM projects
  `).first().catch(() => null);

  const applications = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_applications,
      SUM(CASE WHEN status='submitted' THEN 1 ELSE 0 END) AS submitted_applications,
      SUM(CASE WHEN status='withdrawn' THEN 1 ELSE 0 END) AS withdrawn_applications
    FROM project_applications
  `).first().catch(() => null);

  const invites = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_invites,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_invites,
      SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) AS accepted_invites,
      SUM(CASE WHEN status='declined' THEN 1 ELSE 0 END) AS declined_invites
    FROM project_invites
  `).first().catch(() => null);

  const bookings = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_bookings,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_bookings,
      SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed_bookings
    FROM project_bookings
  `).first().catch(() => null);

  return {
    users: users || {},
    sessions: sessions || {},
    projects: projects || {},
    applications: applications || {},
    invites: invites || {},
    bookings: bookings || {}
  };
}
