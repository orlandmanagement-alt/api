import { json, requirePortalAuth } from "../../_lib.js";
import { getTalentMeService } from "../../services/talent/talent_me_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requirePortalAuth(env, request, "talent");
  if(!auth.ok) return auth.res;

  const result = await getTalentMeService(env, auth);
  if(result?.error){
    return json(result.status || 500, result.status === 404 ? "not_found" : "server_error", result);
  }

  return json(200, "ok", result);
}
