import { jsonOk, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";

export async function onRequestGet({ request, env }){
  const a = await requireAuth(env, request);
  if(!a.ok) return a.res;
  
  if(!a.roles.includes('admin') && !a.roles.includes('super_admin')) return jsonError("forbidden", 403);
  
  // Shim Data dari DB CLIENT
  if(!env.DB_CLIENT) return jsonOk({ items: [] });
  const rows = await env.DB_CLIENT.prepare("SELECT id, title, status, created_at FROM projects ORDER BY created_at DESC LIMIT 50").all();
  return jsonOk({ items: rows.results || [] });
}
