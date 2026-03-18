import { json, requireAuth } from "../../_lib.js";
import { listClientInvitesService, createClientInviteService } from "../../services/client/client_invites_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await listClientInvitesService(env, auth, {
    project_id: url.searchParams.get("project_id") || ""
  });

  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const result = await createClientInviteService(env, auth, body);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
