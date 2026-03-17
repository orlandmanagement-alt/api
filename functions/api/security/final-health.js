import { json, requireAuth } from "../../_lib.js";
import { getFinalHealthService } from "../../services/security/security_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const result = await getFinalHealthService(env, a);
  if(result?.error) return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);

  return json(200, "ok", result);
}
