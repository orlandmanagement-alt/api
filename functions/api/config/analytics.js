import { json, requireAuth, readJson } from "../../_lib.js";
import { getScopedSettingsService, saveScopedSettingsService } from "../../services/config/config_service.js";

const KEYS = [
  "analytics.enabled",
  "analytics.retention_days",
  "analytics.track_logged_in_only",
  "analytics.exclude_admin"
];

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const result = await getScopedSettingsService(env, a, KEYS);
  if(result?.error) return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);

  return json(200, "ok", result.settings || {});
}

export async function onRequestPost({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;

  const body = await readJson(request) || {};
  const result = await saveScopedSettingsService(env, a, body, KEYS);
  if(result?.error) return json(result.status || 500, result.status === 403 ? "forbidden" : "server_error", result);

  return json(200, "ok", result);
}
