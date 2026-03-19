import { jsonOk, jsonError, jsonForbidden } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";
import { nowSec } from "../../_lib/time.js";
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
    // Pada skema baru, kita langsung ubah statusnya menjadi 'suspended'
    const r = await env.DB.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").bind(userId).run();
    // Cabut semua sesi agar user langsung ter-logout
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();

    await auditEvent(env, request, { actor_user_id: auth.uid, action: "admin_disable_user", target_id: userId, meta: { affected: r?.meta?.changes || 0 } });
    return jsonOk({ user_id: userId, affected: r?.meta?.changes || 0, status: "suspended" });
  } catch(err) { return jsonError("failed_to_disable_user", 500); }
}
