import { json, requireAuth } from "../../_lib.js";
function canAccessAdmin(roles){ return (roles || []).some(r => ["super_admin", "admin", "audit_admin", "security_admin", "staff"].includes(r)); }

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccessAdmin(auth.roles)) return json(403, "forbidden", { message: "role_not_allowed" });
  if(!env.DB_DASHBOARD) return json(500, "server_error", { message: "db_dashboard_missing" });

  const id = String(new URL(request.url).searchParams.get("id") || "").trim();
  if(!id) return json(400, "invalid_input", { message: "id_required" });

  const row = await env.DB_DASHBOARD.prepare("SELECT * FROM audit_logs WHERE id = ? LIMIT 1").bind(id).first();
  if(!row) return json(404, "not_found", { message: "audit_log_not_found" });

  let meta = null;
  try{ meta = row.meta_json ? JSON.parse(row.meta_json) : null; }catch{ meta = row.meta_json || null; }
  return json(200, "ok", { ...row, meta });
}
