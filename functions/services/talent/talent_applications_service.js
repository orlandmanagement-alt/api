import { getProjectRoleForApply, getExistingApplication, createProjectApplication, getApplicationById, withdrawApplication, listTalentApplications } from "../../repos/talent_repo.js";

function nowSec() { return Math.floor(Date.now() / 1000); }

export async function listTalentApplicationsService(env, auth) {
  if(!auth.roles.includes('talent')) return { error: "talent_only", status: 403 };
  const items = await listTalentApplications(env, auth.uid);
  return { items };
}

export async function applyTalentProjectService(env, auth, body) {
  if(!auth.roles.includes('talent')) return { error: "talent_only", status: 403 };
  const roleId = String(body.project_role_id || "").trim();
  
  const role = await getProjectRoleForApply(env, roleId);
  if(!role) return { error: "project_role_not_found", status: 404 };
  if(role.project_status !== 'published' && role.project_status !== 'open') return { error: "project_not_open", status: 400 };

  const existing = await getExistingApplication(env, roleId, auth.uid);
  if(existing) return { error: "already_applied", status: 409 };

  const result = await createProjectApplication(env, {
    project_role_id: roleId, talent_user_id: auth.uid,
    status: "pending", message: String(body.message || "").trim(), created_at: nowSec()
  });
  return result;
}

export async function withdrawTalentApplicationService(env, auth, body) {
  if(!auth.roles.includes('talent')) return { error: "talent_only", status: 403 };
  const appId = String(body.application_id || "").trim();
  
  const app = await getApplicationById(env, appId);
  if(!app) return { error: "application_not_found", status: 404 };
  if(app.talent_user_id !== auth.uid) return { error: "forbidden", status: 403 };

  return await withdrawApplication(env, appId, nowSec());
}
