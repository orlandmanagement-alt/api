import { listProjectInvites, createProjectInvite } from "../../repos/client_repo.js";
function nowSec() { return Math.floor(Date.now() / 1000); }

export async function listClientInvitesService(env, auth, params) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden", status: 403 };
  const items = await listProjectInvites(env, params.project_id);
  return { items };
}

export async function createClientInviteService(env, auth, body) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden", status: 403 };
  return await createProjectInvite(env, {
    project_role_id: String(body.project_role_id || "").trim(),
    talent_user_id: String(body.talent_user_id || "").trim(),
    message: String(body.message || "").trim(),
    created_at: nowSec()
  });
}
