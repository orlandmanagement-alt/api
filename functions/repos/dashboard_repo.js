export async function getDashboardSummary(env){
  // 1. DATA DARI DB SSO
  const users = await env.DB.prepare(`
    SELECT COUNT(*) AS total_users,
           SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_users,
           SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS disabled_users,
           0 AS must_change_password_users, 0 AS mfa_enabled_users
    FROM users
  `).first();

  const sessions = await env.DB.prepare("SELECT COUNT(*) AS total_sessions, COUNT(*) AS active_sessions FROM sessions").first();

  // 2. DATA DARI DB CLIENT (Cross-DB Fetching)
  let projects = {}, applications = {}, invites = {}, bookings = {};
  
  if(env.DB_CLIENT) {
    projects = await env.DB_CLIENT.prepare("SELECT COUNT(*) AS total_projects, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft_projects, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_projects FROM projects").first().catch(() => ({}));
    applications = await env.DB_CLIENT.prepare("SELECT COUNT(*) AS total_applications, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS submitted_applications, SUM(CASE WHEN status='withdrawn' THEN 1 ELSE 0 END) AS withdrawn_applications FROM project_applications").first().catch(() => ({}));
    invites = await env.DB_CLIENT.prepare("SELECT COUNT(*) AS total_invites, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_invites, SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) AS accepted_invites, SUM(CASE WHEN status='declined' THEN 1 ELSE 0 END) AS declined_invites FROM project_invites").first().catch(() => ({}));
    bookings = await env.DB_CLIENT.prepare("SELECT COUNT(*) AS total_bookings, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_bookings, SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed_bookings FROM project_bookings").first().catch(() => ({}));
  }

  return { users: users || {}, sessions: sessions || {}, projects: projects || {}, applications: applications || {}, invites: invites || {}, bookings: bookings || {} };
}
