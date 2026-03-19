import { requireAuth } from "../../_lib.js";
import { getDisplayNamesForAdmin } from "../../repos/admin_repo.js";
function canAccessAdmin(roles){ return (roles || []).some(r => ["super_admin", "admin", "staff", "ops_admin", "audit_admin"].includes(r)); }
function csvEscape(v){ const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccessAdmin(auth.roles)) return new Response("forbidden", { status: 403 });
  if(!env.DB_CLIENT) return new Response("db_client_missing", { status: 500 });

  const q = String(new URL(request.url).searchParams.get("q") || "").trim();
  let sql = `
    SELECT i.id, i.project_role_id, i.talent_user_id, i.status, i.message, i.response_message, i.created_at, i.responded_at,
           pr.title AS role_name, p.id AS project_id, p.title AS project_title
    FROM project_invites i
    LEFT JOIN project_roles pr ON pr.id = i.project_role_id
    LEFT JOIN projects p ON p.id = pr.project_id
  `;
  const binds = [];
  if(q){ sql += ` WHERE p.title LIKE ? OR i.id LIKE ? `; binds.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY i.created_at DESC LIMIT 1000 `;

  const r = await env.DB_CLIENT.prepare(sql).bind(...binds).all();
  const results = r.results || [];
  
  const namesMap = await getDisplayNamesForAdmin(env, results.map(row => row.talent_user_id));

  const head = ["id","project_id","project_title","project_role_id","role_name","talent_user_id","talent_name","status","message","response_message","created_at","responded_at"].join(",");
  const body = results.map(row => [
    row.id, row.project_id, row.project_title, row.project_role_id, row.role_name, row.talent_user_id, namesMap[row.talent_user_id] || "Unknown", row.status, row.message, row.response_message, row.created_at, row.responded_at
  ].map(csvEscape).join(","));

  return new Response([head, ...body].join("\n"), { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="invites-monitor.csv"` } });
}
