import { json, requireAuth } from "../../../_lib.js";
import { getAdminSessionsIndex } from "../../../services/admin/admin_sessions_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const url = new URL(request.url);
  const result = await getAdminSessionsIndex(env, a, {
    user_id: url.searchParams.get("user_id") || ""
  });

  if(result?.error){
    let st = "server_error";
    if(result.status === 400) st = "invalid_input";
    else if(result.status === 403) st = "forbidden";
    else if(result.status === 404) st = "not_found";
    return json(result.status || 500, st, result);
  }

  return json(200, "ok", result);
}
