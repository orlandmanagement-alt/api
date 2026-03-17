import { nowSec, hasRole } from "../../_lib.js";
import { getInviteDetailRow, respondInvite } from "../../repos/talent_repo.js";

export async function getTalentInviteDetail(env, auth, invite_id){
  if(!hasRole(auth.roles, ["talent", "super_admin", "admin"])) {
    return { error: "role_not_allowed", status: 403 };
  }

  if(!invite_id){
    return { error: "invite_id_required", status: 400 };
  }

  const row = await getInviteDetailRow(env, invite_id);
  if(!row){
    return { error: "invite_not_found", status: 404 };
  }

  if(String(row.talent_user_id || "") !== String(auth.uid)){
    return { error: "invite_not_owned_by_user", status: 403 };
  }

  return {
    id: row.id,
    project_id: row.project_id,
    project_title: row.project_title || "",
    project_role_id: row.project_role_id,
    role_title: row.role_title || "",
    talent_user_id: row.talent_user_id,
    status: row.status || "",
    message: row.message || "",
    response_message: row.response_message || "",
    created_at: row.created_at || null,
    responded_at: row.responded_at || null
  };
}

export async function postTalentInviteRespond(env, auth, body){
  if(!hasRole(auth.roles, ["talent", "super_admin", "admin"])) {
    return { error: "role_not_allowed", status: 403 };
  }

  const invite_id = String(body.invite_id || "").trim();
  const decision = String(body.decision || "").trim().toLowerCase();
  const message = String(body.message || "").trim();

  if(!invite_id){
    return { error: "invite_id_required", status: 400 };
  }

  if(!["accepted", "declined"].includes(decision)){
    return { error: "decision_must_be_accepted_or_declined", status: 400 };
  }

  const invite = await getInviteDetailRow(env, invite_id);
  if(!invite){
    return { error: "invite_not_found", status: 404 };
  }

  if(String(invite.talent_user_id || "") !== String(auth.uid)){
    return { error: "invite_not_owned_by_user", status: 403 };
  }

  if(String(invite.status || "").toLowerCase() !== "pending"){
    return {
      error: "invite_not_pending",
      status: 409,
      invite_status: invite.status || ""
    };
  }

  const updated = await respondInvite(env, invite_id, decision, message, nowSec());
  return {
    ...updated,
    project_role_id: invite.project_role_id,
    talent_user_id: auth.uid
  };
}
