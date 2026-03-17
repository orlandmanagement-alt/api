import { json, requireAuth } from "../../_lib.js";
import { getVerificationHealthService } from "../../services/verification/verification_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const result = await getVerificationHealthService(env, a);
  if(result?.error) return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);

  return json(200, "ok", result);
}
