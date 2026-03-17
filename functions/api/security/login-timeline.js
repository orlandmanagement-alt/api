import { json, requireAuth } from "../../_lib.js";
import { getLoginTimelineService } from "../../services/security/security_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const url = new URL(request.url);
  const result = await getLoginTimelineService(env, a, {
    limit: url.searchParams.get("limit") || "100"
  });

  if(result?.error) return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);

  return json(200, "ok", result);
}
