import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { readJson } from "../../_lib/request.js";
import { listTalentApplicationsService, applyTalentProjectService, withdrawTalentApplicationService } from "../../services/talent/talent_applications_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await listTalentApplicationsService(env, auth);
  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const body = await readJson(request) || {};
  const action = String(body.action || "").trim().toLowerCase();
  
  const result = action === "withdraw"
    ? await withdrawTalentApplicationService(env, auth, body)
    : await applyTalentProjectService(env, auth, body);

  if(result?.error) return jsonError(result.error, result.status || 500);
  return jsonOk(result);
}
