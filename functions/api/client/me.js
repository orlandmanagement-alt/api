import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { getClientMeService } from "../../services/client/client_me_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const result = await getClientMeService(env, auth);
  if(result?.error) return jsonError(result.error, result.status);
  return jsonOk(result);
}
