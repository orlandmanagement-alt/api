import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { getSecurityKpiService } from "../../services/admin/admin_security_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;
  const url = new URL(request.url);
  const result = await getSecurityKpiService(env, a, { limit: url.searchParams.get("limit") || "100" });
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
