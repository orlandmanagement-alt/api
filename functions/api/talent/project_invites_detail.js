import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { getTalentInviteDetailService } from "../../services/talent/talent_invites_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const url = new URL(request.url);
  const result = await getTalentInviteDetailService(env, auth, { invite_id: url.searchParams.get("invite_id") || "" });
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
