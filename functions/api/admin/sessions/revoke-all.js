import { json, requireAuth, readJson } from "../../../_lib.js";
import { postAdminSessionRevokeAll } from "../../../services/admin/admin_sessions_service.js";

export async function onRequestPost({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const body = await readJson(request) || {};
  const result = await postAdminSessionRevokeAll(env, a, request, body);

  if(result?.error){
    let st = "server_error";
    if(result.status === 400) st = "invalid_input";
    else if(result.status === 403) st = "forbidden";
    else if(result.status === 404) st = "not_found";
    return json(result.status || 500, st, result);
  }

  return json(200, "ok", result);
}
