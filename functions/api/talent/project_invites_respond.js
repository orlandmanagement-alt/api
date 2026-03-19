import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { readJson } from "../../_lib/request.js";
import { respondTalentInviteService } from "../../services/talent/talent_invites_service.js";

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const body = await readJson(request) || {};
  const result = await respondTalentInviteService(env, auth, body);
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
