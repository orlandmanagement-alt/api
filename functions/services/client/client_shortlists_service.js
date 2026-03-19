import { listProjectShortlists, createProjectShortlist } from "../../repos/client_repo.js";
function nowSec() { return Math.floor(Date.now() / 1000); }

export async function listClientShortlistsService(env, auth, params) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden", status: 403 };
  const rows = await listProjectShortlists(env, params.project_id);
  return { items: rows }; // Format sudah ditangani sempurna oleh in-memory join di client_repo.js (Batch 2)
}

export async function createClientShortlistService(env, auth, body) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden", status: 403 };
  return await createProjectShortlist(env, {
    project_role_id: String(body.project_role_id || "").trim(),
    talent_user_id: String(body.talent_user_id || "").trim(),
    created_at: nowSec()
  });
}
