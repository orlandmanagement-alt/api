import { requireAuth } from "../../_lib.js";
function canAccessAdmin(roles){ return (roles || []).some(r => ["super_admin", "admin", "audit_admin", "security_admin", "staff"].includes(r)); }
function csvEscape(v){ const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccessAdmin(auth.roles)) return new Response("forbidden", { status: 403 });
  if(!env.DB_DASHBOARD) return new Response("db_dashboard_missing", { status: 500 });

  const q = String(new URL(request.url).searchParams.get("q") || "").trim();
  let sql = "SELECT id, actor_user_id, action, target_type, target_id, route, http_status, created_at FROM audit_logs";
  const binds = [];
  if(q){ sql += " WHERE action LIKE ? OR route LIKE ? OR target_id LIKE ?"; binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += " ORDER BY created_at DESC LIMIT 1000";

  const r = await env.DB_DASHBOARD.prepare(sql).bind(...binds).all();
  
  const head = ["id","actor_user_id","action","target_type","target_id","route","http_status","created_at"].join(",");
  const body = (r.results || []).map(row => [row.id, row.actor_user_id, row.action, row.target_type, row.target_id, row.route, row.http_status, row.created_at].map(csvEscape).join(","));

  return new Response([head, ...body].join("\n"), { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="audit-logs.csv"` } });
}
