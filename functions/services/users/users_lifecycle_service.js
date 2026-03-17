import { hasRole, nowSec, revokeAllSessionsForUser } from "../../_lib.js";
import {
  getLifecycleUsers,
  getUserById,
  setLifecycleStatus,
  forcePasswordResetFlag,
  clearUserLock,
  archiveUser
} from "../../repos/users_repo.js";

const ALLOWED = new Set(["invited", "active", "suspended", "locked", "archived"]);

export async function listLifecycleUsersService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) {
    return { error: "forbidden", status: 403 };
  }

  const items = await getLifecycleUsers(env);

  return {
    items: items.map(x => ({
      id: String(x.id || ""),
      email_norm: String(x.email_norm || ""),
      display_name: String(x.display_name || ""),
      status: String(x.status || ""),
      created_at: Number(x.created_at || 0),
      updated_at: Number(x.updated_at || 0),
      disabled_at: x.disabled_at == null ? null : Number(x.disabled_at),
      disabled_reason: x.disabled_reason || null,
      locked_until: x.locked_until == null ? null : Number(x.locked_until),
      lock_reason: x.lock_reason || null,
      must_change_password: Number(x.must_change_password || 0) === 1,
      mfa_enabled: Number(x.mfa_enabled || 0) === 1
    }))
  };
}

export async function postLifecycleActionService(env, auth, body){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) {
    return { error: "forbidden", status: 403 };
  }

  const user_id = String(body.user_id || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const reason = String(body.reason || "").trim() || null;
  const now = nowSec();

  if(!user_id){
    return { error: "user_id_required", status: 400 };
  }

  const user = await getUserById(env, user_id);
  if(!user){
    return { error: "user_not_found", status: 404 };
  }

  if(action === "set_status"){
    const status = String(body.status || "").trim().toLowerCase();

    if(!ALLOWED.has(status)){
      return { error: "invalid_status", status: 400 };
    }

    await setLifecycleStatus(env, user_id, status, now, reason);

    if(status !== "active"){
      await revokeAllSessionsForUser(env, user_id, "user_lifecycle_status_change");
    }

    return {
      updated: true,
      user_id,
      status
    };
  }

  if(action === "force_password_reset"){
    await forcePasswordResetFlag(env, user_id, now);
    await revokeAllSessionsForUser(env, user_id, "force_password_reset");

    return {
      updated: true,
      user_id,
      must_change_password: true
    };
  }

  if(action === "clear_lock"){
    await clearUserLock(env, user_id, now);

    return {
      cleared: true,
      user_id
    };
  }

  if(action === "archive"){
    await archiveUser(env, user_id, now, reason || "archived_by_admin");
    await revokeAllSessionsForUser(env, user_id, "user_archived");

    return {
      archived: true,
      user_id
    };
  }

  return { error: "invalid_action", status: 400 };
}
