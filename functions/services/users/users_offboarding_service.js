import { hasRole, nowSec, revokeAllSessionsForUser } from "../../_lib.js";
import {
  getOffboardingUsers,
  getUserRoleRows,
  getUserById,
  offboardUser,
  deleteAllUserRoles
} from "../../repos/users_repo.js";

export async function listOffboardingUsersService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) {
    return { error: "forbidden", status: 403 };
  }

  const rows = await getOffboardingUsers(env);
  const items = [];

  for(const row of rows){
    const roles = await getUserRoleRows(env, row.id);

    items.push({
      id: String(row.id || ""),
      email_norm: String(row.email_norm || ""),
      display_name: String(row.display_name || ""),
      status: String(row.status || ""),
      disabled_at: row.disabled_at == null ? null : Number(row.disabled_at),
      disabled_reason: row.disabled_reason || null,
      must_change_password: Number(row.must_change_password || 0) === 1,
      mfa_enabled: Number(row.mfa_enabled || 0) === 1,
      updated_at: Number(row.updated_at || 0),
      created_at: Number(row.created_at || 0),
      roles: roles.map(x => ({
        role_id: String(x.role_id || ""),
        role_name: String(x.name || "")
      }))
    });
  }

  return { items };
}

export async function postOffboardingService(env, auth, body){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) {
    return { error: "forbidden", status: 403 };
  }

  const user_id = String(body.user_id || "").trim();
  const reason = String(body.reason || "").trim() || "offboarded_by_admin";
  const revoke_roles = body.revoke_roles ? 1 : 0;
  const force_archive = body.force_archive ? 1 : 0;
  const now = nowSec();

  if(!user_id){
    return { error: "user_id_required", status: 400 };
  }

  const user = await getUserById(env, user_id);
  if(!user){
    return { error: "user_not_found", status: 404 };
  }

  const status = force_archive ? "archived" : "suspended";

  await offboardUser(env, user_id, now, reason, status);
  await revokeAllSessionsForUser(env, user_id, "user_offboarding");

  if(revoke_roles){
    await deleteAllUserRoles(env, user_id);
  }

  return {
    offboarded: true,
    user_id,
    status,
    revoke_roles: !!revoke_roles
  };
}
