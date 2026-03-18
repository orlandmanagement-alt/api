import { json, requireAuth } from "../../_lib.js";
import { getTalentInviteDetailService } from "../../services/talent/talent_invites_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await getTalentInviteDetailService(env, auth, {
    invite_id: url.searchParams.get("invite_id") || ""
  });

  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
