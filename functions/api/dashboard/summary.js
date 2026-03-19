import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { getDashboardSummaryService } from "../../services/dashboard/dashboard_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const result = await getDashboardSummaryService(env, auth);
  if(result?.error) return jsonError(result.error, result.status);
  return jsonOk(result);
}
