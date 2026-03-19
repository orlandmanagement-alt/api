import { jsonOk, jsonError, jsonForbidden } from "../../_lib/response.js";
import { requireAuth, revokeAllSessionsForUser } from "../../_lib/session.js";
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
    await revokeAllSessionsForUser(env, userId);
    await auditEvent(env, request, { actor_user_id: auth.uid, action: "admin_revoke_all_sessions_for_user", target_id: userId });
    return jsonOk({ user_id: userId, revoked: true });
  } catch(err) { return jsonError("failed_to_revoke_all_sessions", 500); }
}
