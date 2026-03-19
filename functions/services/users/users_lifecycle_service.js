import { hasRole, nowSec, revokeAllSessionsForUser } from "../../_lib.js";
import { getLifecycleUsers, getUserById, setLifecycleStatus, clearUserLock } from "../../repos/users_repo.js";

const ALLOWED = new Set(["invited", "active", "pending", "suspended", "locked", "archived"]);

export async function listLifecycleUsersService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) return { error: "forbidden", status: 403 };
  const items = await getLifecycleUsers(env);
  return {
    items: items.map(x => ({
      id: String(x.id || ""), email_norm: String(x.email_norm || ""), display_name: String(x.display_name || ""),
      status: String(x.status || ""), created_at: Number(x.created_at || 0), updated_at: Number(x.created_at || 0),
      locked_until: x.locked_until == null ? null : Number(x.locked_until),
      disabled_at: null, disabled_reason: null, lock_reason: null, must_change_password: false, mfa_enabled: false // Shim untuk UI
    }))
  };
}

export async function postLifecycleActionService(env, auth, body){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) return { error: "forbidden", status: 403 };
  const user_id = String(body.user_id || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const now = nowSec();

  if(!user_id) return { error: "user_id_required", status: 400 };
  const user = await getUserById(env, user_id);
  if(!user) return { error: "user_not_found", status: 404 };

  if(action === "set_status"){
    const status = String(body.status || "").trim().toLowerCase();
    if(!ALLOWED.has(status)) return { error: "invalid_status", status: 400 };
    await setLifecycleStatus(env, user_id, status, now, "");
    if(status !== "active") await revokeAllSessionsForUser(env, user_id);
    return { updated: true, user_id, status };
  }

  if(action === "clear_lock"){
    await clearUserLock(env, user_id, now);
    return { cleared: true, user_id };
  }

  if(action === "archive"){
    await setLifecycleStatus(env, user_id, "archived", now, "");
    await revokeAllSessionsForUser(env, user_id);
    return { archived: true, user_id };
  }

  return { error: "invalid_action", status: 400 };
}
