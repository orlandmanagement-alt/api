import { getInviteDetailRow, respondInvite } from "../../repos/talent_repo.js";
function nowSec() { return Math.floor(Date.now() / 1000); }

export async function getTalentInviteDetailService(env, auth, params){
  if(!auth.roles.includes('talent')) return { error: "forbidden", status: 403 };
  const invite_id = String(params.invite_id || "").trim();
  if(!invite_id) return { error: "invite_id_required", status: 400 };

  const row = await getInviteDetailRow(env, invite_id);
  if(!row) return { error: "invite_not_found", status: 404 };
  if(String(row.talent_user_id) !== String(auth.uid)) return { error: "forbidden", status: 403 };

  return row;
}

export async function respondTalentInviteService(env, auth, body){
  if(!auth.roles.includes('talent')) return { error: "forbidden", status: 403 };
  const invite_id = String(body.invite_id || "").trim();
  const decision = String(body.decision || "").trim().toLowerCase();
  const message = String(body.message || "").trim();

  if(!invite_id) return { error: "invite_id_required", status: 400 };
  if(!["accepted", "declined"].includes(decision)) return { error: "invalid_decision", status: 400 };

  const invite = await getInviteDetailRow(env, invite_id);
  if(!invite) return { error: "invite_not_found", status: 404 };
  if(String(invite.talent_user_id) !== String(auth.uid)) return { error: "forbidden", status: 403 };
  if(String(invite.status).toLowerCase() !== "pending") return { error: "invite_not_pending", status: 409 };

  const updated = await respondInvite(env, invite_id, decision, message, nowSec());
  return { ...updated, project_role_id: invite.project_role_id, talent_user_id: auth.uid };
}
