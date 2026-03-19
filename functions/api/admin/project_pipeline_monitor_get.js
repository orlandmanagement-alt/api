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
  // Di skema baru, projects sangat sederhana: id, owner_user_id, title, status, created_at
  let sql = `SELECT p.id, p.title, p.status, p.owner_user_id, p.created_at FROM projects p`;
  const binds = [];
  if(q){ sql += ` WHERE p.title LIKE ? OR p.id LIKE ? `; binds.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY p.created_at DESC LIMIT 1000 `;

  const r = await env.DB_CLIENT.prepare(sql).bind(...binds).all();
  const results = r.results || [];
  const namesMap = await getDisplayNamesForAdmin(env, results.map(row => row.owner_user_id));

  const head = ["id","title","status","owner_name","created_at"].join(",");
  const body = results.map(row => [row.id, row.title, row.status, namesMap[row.owner_user_id] || "Unknown", row.created_at].map(csvEscape).join(","));

  return new Response([head, ...body].join("\n"), { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="project-pipeline.csv"` } });
}
