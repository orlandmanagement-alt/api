import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { readJson } from "../../_lib/request.js";
import { listClientInvitesService, createClientInviteService } from "../../services/client/client_invites_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const url = new URL(request.url);
  const result = await listClientInvitesService(env, auth, { project_id: url.searchParams.get("project_id") || "" });
  if(result?.error) return jsonError(result.error, result.status);
  return jsonOk(result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  const body = await readJson(request) || {};
  const result = await createClientInviteService(env, auth, body);
  if(result?.error) return jsonError(result.error, result.status);
  return jsonOk(result);
}
