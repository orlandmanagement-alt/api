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
  const userId = String(body.user_id || "").trim();
  if(!userId) return jsonError("user_id_required", 400);

  try {
    const r = await env.DB.prepare("UPDATE users SET locked_until = NULL, fail_count = 0 WHERE id = ?").bind(userId).run();
    await auditEvent(env, request, { actor_user_id: auth.uid, action: "admin_unlock_user", target_id: userId, meta: { affected: r?.meta?.changes || 0 } });
    return jsonOk({ user_id: userId, affected: r?.meta?.changes || 0 });
  } catch(err) { return jsonError("failed_to_unlock_user", 500); }
}
