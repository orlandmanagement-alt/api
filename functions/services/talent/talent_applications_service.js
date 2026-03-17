import { nowSec, hasRole } from "../../_lib.js";
import { getProjectRoleForApply, getExistingApplication, createProjectApplication, getApplicationById, withdrawApplication } from "../../repos/talent_repo.js";

export async function submitTalentApplication(env, auth, body){
  if(!hasRole(auth.roles, ["talent", "super_admin", "admin"])) {
    return { error: "role_not_allowed", status: 403 };
  }

  const project_role_id = String(body.project_role_id || "").trim();
  const message = String(body.message || "").trim();

  if(!project_role_id){
    return { error: "project_role_id_required", status: 400 };
  }

  const role = await getProjectRoleForApply(env, project_role_id);
  if(!role){
    return { error: "project_role_not_found", status: 404 };
  }

  const exists = await getExistingApplication(env, project_role_id, auth.uid);
  if(exists){
    return {
      error: "application_already_exists",
      status: 409,
      id: exists.id,
      application_status: exists.status || ""
    };
  }

  const created = await createProjectApplication(env, {
    project_role_id,
    talent_user_id: auth.uid,
    status: "submitted",
    message,
    created_at: nowSec()
  });

  return {
    ...created,
    project_title: role.project_title || "",
    role_title: role.title || ""
  };
}

export async function withdrawTalentApplication(env, auth, body){
  if(!hasRole(auth.roles, ["talent", "super_admin", "admin"])) {
    return { error: "role_not_allowed", status: 403 };
  }

  const application_id = String(body.application_id || "").trim();
  if(!application_id){
    return { error: "application_id_required", status: 400 };
  }

  const found = await getApplicationById(env, application_id);
  if(!found){
    return { error: "application_not_found", status: 404 };
  }

  if(String(found.talent_user_id || "") !== String(auth.uid)){
    return { error: "application_not_owned_by_user", status: 403 };
  }

  if(["withdrawn", "accepted", "rejected"].includes(String(found.status || "").toLowerCase())){
    return {
      error: "application_status_not_withdrawable",
      status: 409,
      application_status: found.status || ""
    };
  }

  return await withdrawApplication(env, application_id, nowSec());
}
