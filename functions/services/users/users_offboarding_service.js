import { hasRole, nowSec, revokeAllSessionsForUser } from "../../_lib.js";
import { getOffboardingUsers, getUserById, offboardUser, deleteAllUserRoles, getUserRoleRows } from "../../repos/users_repo.js";

export async function listOffboardingUsersService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) return { error: "forbidden", status: 403 };
  const rows = await getOffboardingUsers(env);
  const items = [];
  for(const row of rows){
    const roles = await getUserRoleRows(env, row.id);
    items.push({
      id: String(row.id || ""), email_norm: String(row.email_norm || ""), display_name: String(row.display_name || ""), status: String(row.status || ""),
      updated_at: Number(row.created_at || 0), created_at: Number(row.created_at || 0),
      disabled_at: null, disabled_reason: null, must_change_password: false, mfa_enabled: false, roles // Shim
    });
  }
  return { items };
}

export async function postOffboardingService(env, auth, body){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin"])) return { error: "forbidden", status: 403 };
  const user_id = String(body.user_id || "").trim();
  const force_archive = body.force_archive ? 1 : 0;
  const now = nowSec();

  if(!user_id) return { error: "user_id_required", status: 400 };
  const user = await getUserById(env, user_id);
  if(!user) return { error: "user_not_found", status: 404 };

  const status = force_archive ? "archived" : "suspended";
  await offboardUser(env, user_id, now, "offboarded", status);
  await revokeAllSessionsForUser(env, user_id);

  if(body.revoke_roles) await deleteAllUserRoles(env, user_id);
  return { offboarded: true, user_id, status, revoke_roles: !!body.revoke_roles };
}
