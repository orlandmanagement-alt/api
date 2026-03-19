import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { listClientUsersService } from "../../services/users/users_client_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const url = new URL(request.url);
  const result = await listClientUsersService(env, auth, { q: url.searchParams.get("q"), limit: url.searchParams.get("limit"), cursor: url.searchParams.get("cursor") });
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
