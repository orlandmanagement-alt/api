import { json, requireAuth, hasRole, readJson } from "../../_lib.js";
import { getClientShortlists, postClientShortlist } from "../../services/client/client_shortlists_service.js";

function canAccessClient(roles){
  const set = new Set((roles || []).map(String));
  return set.has("client") || set.has("super_admin") || set.has("admin") || set.has("staff");
}

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccessClient(auth.roles || [])) return json(403, "forbidden", { message: "role_not_allowed" });

  const url = new URL(request.url);
  const projectId = String(url.searchParams.get("project_id") || "").trim();
  return json(200, "ok", await getClientShortlists(env, projectId));
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!hasRole(auth.roles || [], ["client", "super_admin", "admin"])) return json(403, "forbidden", { message: "role_not_allowed" });

  const body = await readJson(request) || {};
  if(!String(body.project_role_id || "").trim() || !String(body.talent_user_id || "").trim()){
    return json(400, "invalid_input", { message: "project_role_id_and_talent_user_id_required" });
  }

  const result = await postClientShortlist(env, body);
  if (result?.error) {
    return json(result.status || 500, result.status === 409 ? "conflict" : result.status === 404 ? "not_found" : "server_error", result);
  }
  return json(200, "ok", result);
}
