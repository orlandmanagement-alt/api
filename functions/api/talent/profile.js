import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { readJson } from "../../_lib/request.js";
import { getTalentProfileService, putTalentProfileService } from "../../services/talent/talent_profile_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await getTalentProfileService(env, auth);
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}

export async function onRequestPut({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const body = await readJson(request) || {};
  const result = await putTalentProfileService(env, auth, body);
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
