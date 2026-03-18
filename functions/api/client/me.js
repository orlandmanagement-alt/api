import { json, requirePortalAuth } from "../../_lib.js";
import { getClientMeService } from "../../services/client/client_me_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requirePortalAuth(env, request, "client");
  if(!auth.ok) return auth.res;

  const result = await getClientMeService(env, auth);
  if(result?.error){
    return json(result.status || 500, result.status === 404 ? "not_found" : "server_error", result);
  }

  return json(200, "ok", result);
}
