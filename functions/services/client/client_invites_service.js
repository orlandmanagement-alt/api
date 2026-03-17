import { nowSec } from "../../_lib.js";
import { listProjectInvites, createProjectInvite } from "../../repos/client_repo.js";

export async function getClientInvites(env, projectId = "") {
  const rows = await listProjectInvites(env, projectId);
  return {
    items: rows.map(row => ({
      id: row.id,
      project_id: row.project_id,
      project_title: row.project_title || "",
      project_role_id: row.project_role_id,
      role_title: row.role_title || "",
      talent_user_id: row.talent_user_id,
      talent_name: row.talent_name || "",
      message: row.message || "",
      status: row.status || "",
      created_at: row.created_at || null
    }))
  };
}

export async function postClientInvite(env, body) {
  const result = await createProjectInvite(env, {
    project_role_id: String(body.project_role_id || "").trim(),
    talent_user_id: String(body.talent_user_id || "").trim(),
    message: String(body.message || "").trim(),
    created_at: nowSec()
  });
  return result;
}
