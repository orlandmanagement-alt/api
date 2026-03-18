import { json, requireAuth } from "../../_lib.js";
import { getVerificationRecentEventsService } from "../../services/verification/verification_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await getVerificationRecentEventsService(env, auth, {
    limit: url.searchParams.get("limit") || "100"
  });

  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
