import { jsonOk, jsonError, jsonForbidden } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { nowSec } from "../../_lib/time.js";
import { readJson } from "../../_lib/request.js";

function canAccess(roles) { return (roles || []).some(r => ["super_admin"].includes(r)); }

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccess(auth.roles)) return jsonForbidden({ message: "super_admin_only" });

  const body = await readJson(request) || {};
  const action = String(body.action||"");
  const now = nowSec();

  if(action === "clear_audit"){
    if(!env.DB_DASHBOARD) return jsonError("dashboard_db_missing", 500);
    const r = await env.DB_DASHBOARD.prepare("DELETE FROM audit_logs").run();
    return jsonOk({ action, deleted: r?.meta?.changes || 0 });
  }

  if(action === "purge_sessions"){
    // Menghapus sesi yang sudah melewati expires_at (kadaluarsa)
    const r2 = await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();
    return jsonOk({ action, deleted_expired: r2?.meta?.changes||0 });
  }

  if(action === "clear_tasks" || action === "clear_dlq" || action === "purge_ipblocks"){
    // Fitur bypass: Tabel ini tidak lagi digunakan di ekosistem baru (ditangani oleh Cloudflare Native / WAF)
    return jsonOk({ action, status: "bypassed_in_v2_architecture" });
  }

  return jsonError("unknown_action", 400);
}
