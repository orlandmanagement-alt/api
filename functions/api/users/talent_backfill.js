import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { postTalentBackfillService } from "../../services/users/users_talent_backfill_service.js";

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const url = new URL(request.url);
  const result = await postTalentBackfillService(env, auth, { limit: url.searchParams.get("limit") });
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
