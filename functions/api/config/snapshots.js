import { json, requireAuth, readJson } from "../../_lib.js";
import {
  createConfigSnapshotService,
  listConfigSnapshotsService,
  restoreConfigSnapshotService
} from "../../services/config/config_service.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const url = new URL(request.url);
  const result = await listConfigSnapshotsService(env, a, url.searchParams.get("limit") || "50");
  if(result?.error) return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);

  return json(200, "ok", result);
}

export async function onRequestPost({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const body = await readJson(request) || {};
  const action = String(body.action || "").trim().toLowerCase();

  const result = action === "restore"
    ? await restoreConfigSnapshotService(env, a, body)
    : await createConfigSnapshotService(env, a, body);

  if(result?.error){
    let st = "server_error";
    if(result.status === 400) st = "invalid_input";
    else if(result.status === 403) st = "forbidden";
    else if(result.status === 404) st = "not_found";
    return json(result.status || 500, st, result);
  }

  return json(200, "ok", result);
}
