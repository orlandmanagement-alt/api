import { jsonOk, jsonError, jsonForbidden } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { auditEvent } from "../../_lib/audit.js";
import { readJson } from "../../_lib/request.js";

function canAccess(roles) { return (roles || []).some(r => ["super_admin", "admin", "security_admin"].includes(r)); }

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccess(auth.roles)) return jsonForbidden({ message: "role_not_allowed" });

  const body = await readJson(request) || {};
  const sessionIds = Array.isArray(body.session_ids) ? body.session_ids.map(String).filter(Boolean) : [];
  if(!sessionIds.length) return jsonError("session_ids_required", 400);

  try {
    let affected = 0;
    const placeholders = sessionIds.map(() => '?').join(',');
    // Skema baru: Hapus baris secara permanen
    const r = await env.DB.prepare(`DELETE FROM sessions WHERE id IN (${placeholders})`).bind(...sessionIds).run();
    affected = Number(r?.meta?.changes || 0);

    await auditEvent(env, request, { actor_user_id: auth.uid, action: "admin_bulk_revoke_sessions", meta: { count: sessionIds.length, affected } });
    return jsonOk({ requested: sessionIds.length, affected });
  } catch(err) { return jsonError("failed_to_revoke_sessions", 500); }
}
