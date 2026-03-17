import { json, requireAuth, hasRole, readJson } from "../../_lib.js";
import { getSettingsByKeys, saveScopedSettings } from "./_helper/config_service.js";

const KEYS = [
  "analytics.enabled",
  "analytics.retention_days",
  "analytics.track_logged_in_only",
  "analytics.exclude_admin"
];

function canManage(roles){
  return hasRole(roles, ["super_admin", "admin"]);
}

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;
  if(!canManage(a.roles)) return json(403, "forbidden", null);
  return json(200, "ok", await getSettingsByKeys(env, KEYS));
}

export async function onRequestPost({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;
  if(!canManage(a.roles)) return json(403, "forbidden", null);
  const body = await readJson(request) || {};
  return json(200, "ok", await saveScopedSettings(env, body, a.uid || null, KEYS));
}
