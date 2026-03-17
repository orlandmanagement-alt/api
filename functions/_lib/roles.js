export function hasRole(roles, allowed) {
  const s = new Set((roles || []).map(String));
  return allowed.some(r => s.has(r));
}

export async function getRolesForUser(env, user_id) {
  try {
    const r = await env.DB.prepare(`
      SELECT r.name AS name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).bind(user_id).all();

    return (r.results || []).map(x => x.name);
  } catch {
    return [];
  }
}

export function portalAccessFromRoles(roles) {
  const r = new Set((roles || []).map(x => String(x)));
  return {
    dashboard: r.has("super_admin") || r.has("admin") || r.has("staff"),
    talent: r.has("super_admin") || r.has("admin") || r.has("staff") || r.has("talent"),
    client: r.has("super_admin") || r.has("admin") || r.has("staff") || r.has("client")
  };
}

export function canAccessPortal(roles, portal) {
  const p = portalAccessFromRoles(roles);
  return !!p[String(portal || "")];
}

export function defaultPortalFromRoles(roles) {
  const p = portalAccessFromRoles(roles);
  if (p.dashboard) return "dashboard";
  if (p.talent) return "talent";
  if (p.client) return "client";
  return null;
}
