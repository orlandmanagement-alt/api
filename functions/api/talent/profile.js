import { json, requireAuth, readJson } from "../../_lib.js";
import { getTalentProfile, putTalentProfile } from "../../services/talent/talent_profile_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const result = await getTalentProfile(env, a);
  if(result?.error){
    return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);
  }
  return json(200, "ok", { profile: result.profile || null });
}

export async function onRequestPut({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const body = await readJson(request) || {};
  const result = await putTalentProfile(env, a, body);
  if(result?.error){
    return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);
  }
  return json(200, "ok", result);
}
