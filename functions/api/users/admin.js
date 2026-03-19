import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { listAdminUsersService } from "../../services/users/users_admin_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const url = new URL(request.url);
  const result = await listAdminUsersService(env, auth, { q: url.searchParams.get("q"), limit: url.searchParams.get("limit") });
  if(result?.error) return jsonError(result.error, result.status);
  return jsonOk(result);
}
