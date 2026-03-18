import { json, requireAuth } from "../../_lib.js";
import { getDashboardSummaryService } from "../../services/dashboard/dashboard_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await getDashboardSummaryService(env, auth);
  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
