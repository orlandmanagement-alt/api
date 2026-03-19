import { requireAuth, nowSec } from "../../_lib.js";
function canAccessAdmin(roles){ return (roles || []).some(r => ["super_admin", "admin", "security_admin"].includes(r)); }
export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccessAdmin(auth.roles)) return new Response("forbidden", { status: 403 });
  
  // Karena Auth Risk & IP Block diurus Cloudflare Native, kita kembalikan laporan sederhana dari SSO Database
  const now = nowSec();
  const lockedUsers = await env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE locked_until > ?").bind(now).first();
  const failedLogins = await env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE fail_count > 0").first();

  const csv = "failed_logins_recent,locked_users\n" + `${failedLogins?.c || 0},${lockedUsers?.c || 0}`;
  return new Response(csv, { status: 200, headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="auth-risk.csv"` } });
}
