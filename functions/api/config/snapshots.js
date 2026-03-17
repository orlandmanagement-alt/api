import { json, requireAuth, hasRole, readJson } from "../../_lib.js";
import { createConfigSnapshot, listConfigSnapshots, restoreConfigSnapshot } from "./_helper/config_service.js";

function canManage(roles){
  return hasRole(roles, ["super_admin", "admin"]);
}

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;
  if(!canManage(a.roles)) return json(403, "forbidden", null);

  const url = new URL(request.url);
  const restoreId = String(url.searchParams.get("restore_id") || "").trim();

  if(restoreId){
    const restored = await restoreConfigSnapshot(env, restoreId, a.uid || null);
    return json(200, "ok", restored);
  }

  const items = await listConfigSnapshots(env, 50);
  return json(200, "ok", { items });
}

export async function onRequestPost({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;
  if(!canManage(a.roles)) return json(403, "forbidden", null);

  const body = await readJson(request) || {};
  const snapshotName = String(body.snapshot_name || "").trim();
  const row = await createConfigSnapshot(env, snapshotName, a.uid || null);
  return json(200, "ok", row);
}
