import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { listTalentUsersService } from "../../services/users/users_talent_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const url = new URL(request.url);
  
  const query = {
    q: url.searchParams.get("q"), location: url.searchParams.get("location"), gender: url.searchParams.get("gender"),
    limit: url.searchParams.get("limit"), age_min: url.searchParams.get("age_min"), age_max: url.searchParams.get("age_max")
  };
  
  const result = await listTalentUsersService(env, auth, query);
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
